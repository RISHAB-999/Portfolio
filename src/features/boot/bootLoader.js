// First-visit loading screen (shown when the site is opened or reloaded on the
// home page; never by the Motion button, which has its own intro).
//
//   loading  the oil-refinery pixel scene (oil.gif, shrunk to a light copy),
//            with "piano strings" over it — vertical lines the pointer catches,
//            drags into a soft bend and lets slip so they wobble back —
//            behind the same pixel coffee cup + loading line as the Motion
//            intro (no cursors here).
//   100%     music may start; the logo leaves the tip of the loading line and
//            comes out of the screen towards you, then settles into the header;
//            the screen is sliced along the strings like a paper shredder and
//            the strips flutter down like paper, revealing the page; the header
//            slides open to the right from the logo; the name comes out of the
//            screen, then the rest of the hero fades in.
//
// The page-side steps are plain CSS keyed off <html data-boot="…"> (see
// index.css), so React components only need a few class names. One canvas,
// one rAF loop, everything removed when done.

import { createLoaderScene, COFFEE_CYCLE } from '../swarm/loaderScene';
import oilUrl from '../../assets/oil-boot.gif';

const MIN_SHOW = COFFEE_CYCLE / 2; // the cup makes one trip along the line
const MAX_WAIT = 9000; // never hold the page longer than this for slow assets
const FLY = 1100; // logo: out of the screen, then into the header
const CUT_AT = 120; // the blades start down the strings
const CUT = 260;
const DROP = 1900; // strips flutter away
const HEADER_AT = FLY; // header starts sliding open as the logo lands
const HERO_AT = FLY + 400; // then the name comes out
const DONE_AT = HERO_AT + 1800;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function isHomeRoute() {
  const h = window.location.hash;
  return h === '' || h === '#' || h === '#/' || h === '#/home' || h.startsWith('#/?') || h.startsWith('#/home?');
}

export function startBootLoader() {
  const root = document.documentElement;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  root.dataset.boot = 'loading';
  // The page doesn't paint at all while it's fully covered (index.css), so the
  // loader gets the whole frame budget; it's uncovered shortly before 100% so
  // the site can warm up behind the loader before the reveal.
  root.dataset.bootCover = '';

  // backdrop: black until the (small, pixel-art) gif is ready, then the scene
  const back = document.createElement('div');
  back.setAttribute('aria-hidden', 'true');
  back.style.cssText = 'position:fixed;inset:0;z-index:2147483599;background:#000;';
  const oil = new Image();
  oil.decoding = 'async';
  oil.alt = '';
  oil.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:0;transition:opacity .5s ease;';
  let oilReady = false;
  const onOil = () => {
    oilReady = true;
    oil.style.opacity = '1';
  };
  oil.addEventListener('load', onOil, { once: true });
  oil.addEventListener('error', () => { oilReady = true; }, { once: true });
  oil.src = oilUrl;
  back.appendChild(oil);
  const wash = document.createElement('div');
  wash.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center, rgba(4,8,20,0.42) 15%, rgba(4,8,20,0.18) 75%);';
  back.appendChild(wash);
  document.body.appendChild(back);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.bootLayer = '';
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483600;touch-action:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // an accessible status while it loads
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
  status.textContent = 'Loading…';
  document.body.appendChild(status);

  const scene = createLoaderScene();
  scene.loadLogo();

  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let strings = [];
  let gap = 20;
  const NODE = 12; // simulation node spacing along each string (px)
  let nodes = 0;
  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    // at most ~4M canvas pixels (a 4K-class backing store is too heavy here)
    dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4e6 / Math.max(1, window.innerWidth * window.innerHeight)));
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    gap = Math.max(14, Math.min(26, Math.round(vw / 60)));
    nodes = Math.ceil(vh / NODE) + 1;
    const n = Math.ceil(vw / gap) + 1;
    const off = (vw - (n - 1) * gap) / 2;
    strings = Array.from({ length: n }, (_, i) => ({
      x: off + i * gap,
      d: new Float32Array(nodes), // sideways displacement of each node
      v: new Float32Array(nodes),
      awake: false,
      grab: -1, // node held by the pointer, or -1
      peak: 0,
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  // ── strings ─────────────────────────────────────────────────────────────────
  // Real (if small) string physics: every string is a chain of nodes with
  // tension between neighbours, a spring back to rest and some damping. When
  // the pointer crosses a string it catches it and drags a soft, local bend
  // along with it; pulled far enough, the string slips free and wobbles back.
  // A soft round light follows the pointer.
  let px = -1;
  let py = -1;
  let ppx = -1;
  let hover = false;
  const halo = { x: 0, y: 0, a: 0 };
  function onMove(e) {
    ppx = px < 0 ? e.clientX : px;
    px = e.clientX;
    py = e.clientY;
    if (!hover) {
      halo.x = px;
      halo.y = py;
    }
    hover = true;
    if (reduced) return;
    const lo = Math.min(ppx, px);
    const hi = Math.max(ppx, px);
    const j = Math.max(1, Math.min(nodes - 2, Math.round(py / NODE)));
    for (const s of strings) {
      // caught when the pointer crosses it (or arrives right on it)
      if (s.grab < 0 && ((s.x >= lo && s.x <= hi && lo !== hi) || Math.abs(px - s.x) < 1.5)) {
        s.grab = j;
        s.awake = true;
      }
    }
  }
  const onLeave = () => {
    hover = false;
    for (const s of strings) s.grab = -1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  const H = 1 / 240; // physics step (s)
  const WAVE = (520 / NODE) ** 2; // tension: waves run ~520px/s along a string
  const K = (2 * Math.PI * 5.5) ** 2; // spring to rest: ~5.5Hz wobble
  const DAMP = 4.2; // dies away in about a second
  const SPAN = 4; // nodes either side of the catch point that bend with it

  function stepStrings(dt) {
    const release = Math.min(32, gap * 1.4); // how far a string stretches before it slips
    const steps = Math.min(6, Math.max(1, Math.round(dt / H)));
    for (const s of strings) {
      if (!s.awake) continue;
      const { d, v } = s;
      if (s.grab >= 0) {
        const pull = px - s.x;
        if (!hover || Math.abs(pull) > release) {
          s.grab = -1; // slips free and rings
        } else {
          s.grab = Math.max(1, Math.min(nodes - 2, Math.round(py / NODE)));
        }
      }
      for (let k = 0; k < steps; k++) {
        if (s.grab >= 0) {
          // the caught stretch eases towards the pointer in a soft bump
          const pull = px - s.x;
          for (let o = -SPAN; o <= SPAN; o++) {
            const i = s.grab + o;
            if (i <= 0 || i >= nodes - 1) continue;
            const w = Math.exp(-((o / (SPAN * 0.5)) ** 2));
            d[i] += (pull * w - d[i]) * 0.35;
            v[i] *= 0.6;
          }
        }
        for (let i = 1; i < nodes - 1; i++) {
          const acc = WAVE * (d[i - 1] - 2 * d[i] + d[i + 1]) - K * d[i] - DAMP * v[i];
          v[i] += acc * H;
        }
        for (let i = 1; i < nodes - 1; i++) d[i] += v[i] * H;
      }
      let peak = 0;
      let speed = 0;
      for (let i = 1; i < nodes - 1; i++) {
        const a = Math.abs(d[i]);
        if (a > peak) peak = a;
        const b = Math.abs(v[i]);
        if (b > speed) speed = b;
      }
      s.peak = peak;
      if (s.grab < 0 && peak < 0.05 && speed < 1) {
        d.fill(0);
        v.fill(0);
        s.awake = false;
        s.peak = 0;
      }
    }
    // the light eases after the pointer and fades in/out
    const f = 1 - Math.exp(-dt * 14);
    halo.x += (px - halo.x) * f;
    halo.y += (py - halo.y) * f;
    halo.a += ((hover && !reduced ? 1 : 0) - halo.a) * (1 - Math.exp(-dt * 6));
  }

  function drawHalo(g) {
    if (halo.a < 0.01) return;
    const r = Math.max(46, Math.min(70, Math.min(vw, vh) * 0.07));
    const grad = g.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.1 * halo.a})`);
    grad.addColorStop(0.82, `rgba(255,255,255,${0.07 * halo.a})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(halo.x, halo.y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${0.1 * halo.a})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(halo.x, halo.y, r - 3, 0, Math.PI * 2);
    g.stroke();
  }

  function drawStrings(g) {
    g.lineWidth = 1;
    // strings at rest (most of them) go into a single path
    g.beginPath();
    for (const s of strings) {
      if (s.awake) continue;
      const x0 = Math.round(s.x) + 0.5;
      g.moveTo(x0, 0);
      g.lineTo(x0, vh);
    }
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.stroke();
    for (const s of strings) {
      if (!s.awake) continue;
      // a moving string reads a touch brighter; drawn as a smooth curve
      g.strokeStyle = `rgba(255,255,255,${0.18 + Math.min(0.32, s.peak / 60)})`;
      const { d } = s;
      g.beginPath();
      g.moveTo(s.x, 0);
      for (let i = 1; i < nodes - 1; i++) {
        const x1 = s.x + d[i];
        const y1 = i * NODE;
        const x2 = s.x + (d[i] + d[i + 1]) / 2;
        const y2 = Math.min(vh, (i + 0.5) * NODE);
        g.quadraticCurveTo(x1, y1, x2, y2);
      }
      g.lineTo(s.x, vh);
      g.stroke();
    }
  }

  // a soft dark wash so the cup and lines read on the scene
  function drawWash(g) {
    const grad = g.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.15, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
    grad.addColorStop(0, 'rgba(4,8,20,0.42)');
    grad.addColorStop(1, 'rgba(4,8,20,0.18)');
    g.fillStyle = grad;
    g.fillRect(0, 0, vw, vh);
  }

  // ── progress: real page readiness, paced so the cup makes its trip ─────────
  const t0 = performance.now();
  let loaded = document.readyState === 'complete';
  let fontsReady = !document.fonts;
  const onLoad = () => {
    loaded = true;
  };
  if (!loaded) window.addEventListener('load', onLoad, { once: true });
  document.fonts?.ready.then(() => {
    fontsReady = true;
  });

  let shown = 0;
  let revealAt = -1;
  let snapshot = null;
  let fly = null;
  let strips = null;
  let raf = 0;
  let last = t0;
  let finished = false;

  function target() {
    const el = document.querySelector('[data-brand-logo]');
    const r = el?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.min(r.width, r.height) };
  }

  function drawCover(g, img) {
    if (!img.naturalWidth) return;
    const k = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
    const w = img.naturalWidth * k;
    const h = img.naturalHeight * k;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, (vw - w) / 2, (vh - h) / 2, w, h);
    g.imageSmoothingEnabled = true;
  }

  function beginReveal(now) {
    revealAt = now;
    status.textContent = 'Loaded';
    canvas.style.pointerEvents = 'none';
    delete root.dataset.bootCover;
    const L = scene.layout(vw, vh);
    const from = scene.logoAt(L, 1);
    const to = target();
    fly = to ? { x0: from.x, y0: from.y, s0: from.size, x1: to.x, y1: to.y, s1: to.s } : null;
    // the frame that gets shredded: the scene as it stands, minus the logo
    snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const g = snapshot.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, vw, vh);
    if (oil.style.opacity === '1') drawCover(g, oil);
    drawWash(g);
    drawStrings(g);
    scene.draw(g, L, { time: now - t0, progress: 1, dpr, reduced, labelAlpha: 1, logo: false });
    // paint the full frame onto the visible canvas *before* dropping the
    // backdrop, so the page never shows through for a frame
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(snapshot, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    back.remove(); // the strips carry the picture from here on
    // cut along the strings (plus the screen edges)
    const cuts = [0, ...strings.map((s) => s.x).filter((x) => x > 0 && x < vw), vw];
    strips = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const mid = Math.abs((cuts[i] + cuts[i + 1]) / 2 / vw - 0.5) * 2;
      strips.push({
        x: cuts[i],
        w: cuts[i + 1] - cuts[i],
        delay: mid * 110 + Math.random() * 60,
        vmax: vh * (0.95 + Math.random() * 0.5), // terminal speed (px/s)
        wave: 0.006 + Math.random() * 0.006, // curl along the strip
        ph: Math.random() * Math.PI * 2,
        twist: 1.4 + Math.random() * 1.8, // turns as it falls
        sway: (Math.random() - 0.5) * 2,
      });
    }
    window.dispatchEvent(new Event('bootreveal')); // music may start now
  }

  // one strip of paper falling: drag-limited fall, sideways sway, a wave
  // running along it and a twist that narrows/darkens parts of it
  const SEGS = 9;
  function drawStrip(s, r) {
    const tf = Math.max(0, r - CUT_AT - CUT - s.delay) / 1000;
    if (tf <= 0) {
      ctx.drawImage(snapshot, s.x * dpr, 0, s.w * dpr, vh * dpr, s.x, 0, s.w, vh);
      return;
    }
    // v = vmax * (1 - e^(-t/τ))  →  y = vmax * (t - τ(1 - e^(-t/τ)))
    const tau = 0.45;
    const y0 = s.vmax * (tf - tau * (1 - Math.exp(-tf / tau)));
    if (y0 > vh + 20) return;
    const curl = Math.min(1, tf * 1.6); // starts flat, curls as it goes
    const sx = s.sway * 30 * Math.sin(tf * 2.4 + s.ph) * curl;
    const hSeg = vh / SEGS;
    for (let j = 0; j < SEGS; j++) {
      const yl = j * hSeg;
      const yc = yl + hSeg / 2;
      const wave = Math.sin(yc * s.wave + tf * 5 + s.ph) * 14 * curl;
      const th = (yc / vh) * s.twist * curl + tf * 2.2 * curl + s.ph * curl;
      const c = Math.cos(th);
      const w = Math.max(0.6, s.w * Math.abs(c));
      const cx = s.x + s.w / 2 + sx + wave;
      const yd = y0 + yl;
      if (yd > vh) break;
      ctx.drawImage(snapshot, s.x * dpr, yl * dpr, s.w * dpr, Math.ceil(hSeg * dpr) + 1, cx - w / 2, yd, w, hSeg + 1);
      const shade = (1 - Math.abs(c)) * 0.55 * curl;
      if (shade > 0.03) {
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(cx - w / 2, yd, w, hSeg + 1);
      }
    }
  }

  function phase(name) {
    if (root.dataset.boot !== name) root.dataset.boot = name;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const elapsed = now - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    if (revealAt < 0) {
      const min = reduced ? 600 : MIN_SHOW;
      const ready = (loaded && fontsReady && oilReady) || elapsed > MAX_WAIT;
      const timed = Math.min(1, elapsed / (min - 150));
      const goal = ready ? timed : Math.min(0.9, timed);
      shown += (goal - shown) * Math.min(1, dt * 7);
      if (goal === 1 && shown > 0.995) shown = 1;
      if (shown > 0.8 && 'bootCover' in root.dataset) delete root.dataset.bootCover;
      stepStrings(dt);
      drawHalo(ctx);
      drawStrings(ctx);
      const L = scene.layout(vw, vh);
      scene.draw(ctx, L, { time: elapsed, progress: shown, dpr, reduced, labelAlpha: Math.min(1, elapsed / 200) });
      if (shown === 1 && elapsed >= min) beginReveal(now);
    } else {
      const r = now - revealAt;
      if (reduced) {
        // no flight or shredding: a quick fade, then everything in place
        ctx.globalAlpha = 1 - clamp01(r / 300);
        ctx.drawImage(snapshot, 0, 0, vw, vh);
        ctx.globalAlpha = 1;
        if (r >= 300) return finish();
      } else {
        for (const s of strips) drawStrip(s, r);
        // the blades running down the strings
        const cutP = clamp01((r - CUT_AT) / CUT);
        if (cutP > 0 && cutP < 1) {
          ctx.fillStyle = '#5ce1e6';
          const yb = easeInOut(cutP) * vh;
          for (const s of strips) ctx.fillRect(Math.round(s.x) - 1, 0, 2, yb);
        }
        // the logo comes out of the screen towards you, then settles into the header
        if (fly && r < FLY) {
          const p = easeInOut(clamp01(r / FLY));
          const pop = Math.sin(Math.min(1, p * 1.15) * Math.PI); // peaks a little before halfway
          const big = Math.min(vw, vh) * 0.32;
          const size = fly.s0 + (fly.s1 - fly.s0) * p + big * pop;
          const cx = vw / 2;
          const cy = vh * 0.42;
          // path: tip → centre of the screen (coming at you) → header
          const q = 1 - p;
          const x = q * q * fly.x0 + 2 * q * p * cx + p * p * fly.x1;
          const y = q * q * fly.y0 + 2 * q * p * cy + p * p * fly.y1;
          ctx.save();
          ctx.shadowColor = 'rgba(92,225,230,0.7)';
          ctx.shadowBlur = 30 * pop;
          scene.drawLogo(ctx, x, y, size, dpr);
          ctx.restore();
        }
        // set once per change (not twice a frame — every write restyles the page)
        if (r >= HERO_AT) phase('hero');
        else if (r >= HEADER_AT) phase('header');
        if (r >= Math.max(DONE_AT, CUT_AT + CUT + DROP + 300)) return finish();
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    window.removeEventListener('load', onLoad);
    back.remove();
    canvas.remove();
    status.remove();
    snapshot = null;
    delete root.dataset.boot;
    delete root.dataset.bootCover;
    if (revealAt < 0) window.dispatchEvent(new Event('bootreveal'));
    window.dispatchEvent(new Event('bootdone'));
  }

  raf = requestAnimationFrame(frame);
  return finish;
}
