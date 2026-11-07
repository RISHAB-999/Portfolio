// Security regression checks — no dependencies, runs in plain Node.
//   npm run build && npm run test:security
//
// 1. Contact-form guard (src/utils/contactGuard.js) unit tests
// 2. Source checks: no HTML-injection sinks, safe new-tab links, field limits
// 3. Build output checks (dist/): CSP present and strict, no inline scripts or
//    handlers, no source maps, nothing that looks like a secret

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('..', import.meta.url));
const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push(['PASS', name]);
  } catch (err) {
    results.push(['FAIL', `${name} — ${err.message}`]);
  }
};
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const rel = (p) => relative(root, p).replaceAll('\\', '/');

// ─── 1. contact guard ────────────────────────────────────────────────────────
const guard = await import(new URL('../src/utils/contactGuard.js', import.meta.url));
const { checkSubmission, cleanLine, cleanText, FIELD_LIMITS, MIN_FILL_MS } = guard;
const valid = { name: 'Ada', reply_to: 'ada@example.com', message: 'Hello!', startedAt: 1, now: 1 + MIN_FILL_MS };

check('guard: accepts a normal message', () => {
  const r = checkSubmission(valid);
  assert.equal(r.ok, true);
  assert.equal(r.values.title, 'New message from Ada');
});
check('guard: honeypot filled → treated as bot', () => {
  assert.deepEqual(checkSubmission({ ...valid, honeypot: 'http://spam' }), { ok: false, reason: 'bot' });
});
check('guard: submitted too fast → treated as bot', () => {
  assert.equal(checkSubmission({ ...valid, now: valid.startedAt + 500 }).reason, 'bot');
});
check('guard: CR/LF header-injection removed from name and subject', () => {
  const r = checkSubmission({ ...valid, name: 'Eve\r\nBcc: victim@example.com' });
  assert.equal(r.ok, true);
  assert.ok(!/[\r\n]/.test(r.values.name) && !/[\r\n]/.test(r.values.title));
});
check('guard: lengths are capped', () => {
  const r = checkSubmission({ ...valid, name: 'A'.repeat(20000), message: 'B'.repeat(50000) });
  assert.equal(r.values.name.length, FIELD_LIMITS.name);
  assert.equal(r.values.message.length, FIELD_LIMITS.message);
});
check('guard: invalid / multi-address email rejected', () => {
  for (const reply_to of ['nope', 'a@b', 'a@b.com, c@d.com', 'a@b.com\nbcc:x@y.z', '<a@b.com>']) {
    assert.equal(checkSubmission({ ...valid, reply_to }).reason, 'invalid', reply_to);
  }
});
check('guard: empty name/message rejected', () => {
  assert.equal(checkSubmission({ ...valid, name: '   ' }).reason, 'invalid');
  assert.equal(checkSubmission({ ...valid, message: '\u0000\u0001' }).reason, 'invalid');
});
check('guard: message keeps newlines, drops control chars', () => {
  assert.equal(cleanText('hi\r\nthere\u0007', 100), 'hi\nthere');
  assert.equal(cleanLine('a\tb\u0000c', 100), 'a b c');
});

// ─── 2. source checks ────────────────────────────────────────────────────────
const srcFiles = walk(join(root, 'src')).filter((f) => ['.js', '.jsx'].includes(extname(f)));
const src = srcFiles.map((f) => [rel(f), readFileSync(f, 'utf8')]);

check('src: no dangerouslySetInnerHTML / innerHTML / eval / new Function', () => {
  const bad = src.filter(([, s]) => /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|new Function\(/.test(s));
  assert.deepEqual(bad.map(([f]) => f), []);
});
check('src: every target="_blank" link has rel noopener/noreferrer', () => {
  const bad = [];
  for (const [f, s] of src) {
    for (const m of s.matchAll(/<a\b[^>]*target=(?:"_blank"|\{[^}]*'_blank'[^}]*\})[^>]*>/gs)) {
      if (!/rel=(?:"[^"]*noopener|"[^"]*noreferrer|\{[^}]*noopener)/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 60)}`);
    }
  }
  assert.deepEqual(bad, []);
});
check('src: every window.open(..., "_blank") passes noopener', () => {
  const bad = [];
  for (const [f, s] of src) for (const m of s.matchAll(/window\.open\(([^)]*)\)/g)) if (!m[1].includes('noopener')) bad.push(`${f}: ${m[0]}`);
  assert.deepEqual(bad, []);
});
check('src: contact form fields declare maxLength', () => {
  const s = readFileSync(join(root, 'src/data/contact.js'), 'utf8');
  for (const name of ['name', 'reply_to', 'message']) {
    assert.match(s, new RegExp(`name: '${name}'[^}]*maxLength: \\d+`), name);
  }
});
check('repo: .env is git-ignored', () => {
  assert.match(readFileSync(join(root, '.gitignore'), 'utf8'), /^\.env$/m);
});

// ─── 3. build output checks ──────────────────────────────────────────────────
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  results.push(['SKIP', 'dist/ checks — run `npm run build` first']);
} else {
  // Ignore comments; decode the entities the build uses inside attribute values.
  const html = readFileSync(join(dist, 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  const distFiles = walk(dist);
  const csp = (html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/) || [])[1] || '';

  check('dist: CSP meta present', () => assert.ok(csp, 'missing'));
  check('dist: CSP script-src is self-only (no unsafe-inline / unsafe-eval)', () => {
    const scriptSrc = (csp.match(/script-src ([^;]+)/) || [])[1] || '';
    assert.equal(scriptSrc.trim(), "'self'");
  });
  check("dist: CSP has object-src 'none', base-uri, form-action, frame-src", () => {
    for (const d of ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-src 'none'"]) assert.ok(csp.includes(d), d);
  });
  check('dist: CSP meta comes before any script/stylesheet', () => {
    const at = html.indexOf('Content-Security-Policy');
    const firstRes = Math.min(...['<script', '<link rel="stylesheet"'].map((t) => (html.indexOf(t) + 1 || Infinity) - 1));
    assert.ok(at > -1 && at < firstRes);
  });
  check('dist: no inline <script> or inline event handlers in index.html', () => {
    assert.ok(![...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/g)].length, 'inline script');
    assert.ok(!/\son[a-z]+=["']/i.test(html), 'inline handler');
  });
  check('dist: no source maps published', () => {
    assert.deepEqual(distFiles.filter((f) => f.endsWith('.map')).map(rel), []);
  });
  check('dist: no .env files published', () => {
    assert.deepEqual(distFiles.filter((f) => /(^|[\\/])\.env/.test(f)).map(rel), []);
  });
  check('dist: no secret-looking strings in JS/HTML/CSS', () => {
    const secret = /(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk_live_[A-Za-z0-9]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abp]-[A-Za-z0-9-]{10,})/;
    const hits = distFiles.filter((f) => /\.(js|html|css|json)$/.test(f) && secret.test(readFileSync(f, 'utf8')));
    assert.deepEqual(hits.map(rel), []);
  });
}

// ─── report ──────────────────────────────────────────────────────────────────
for (const [status, name] of results) console.log(`${status}  ${name}`);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
