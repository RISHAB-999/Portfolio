// Swarm: a crew of cursors rebuilds the page in front of you, the way designers
// work in a design tool. The scenery stays on screen; every box, card, header,
// footer, image and line of text disappears and is built back in place:
// boxes are dragged out with a crosshair (handles, a size badge, guide lines
// and rulers), image frames are dragged out and the picture scans in, and text
// is typed letter by letter beside an I-beam. Whatever you scroll to gets built
// when it comes on screen; a new page you navigate to is built the same way.
// It opens with a loading screen: black with stars, the site logo, and a
// pixel-art coffee cup sliding along its dashed line for three loops, with a
// loading line underneath that fills as the page is scanned. The crew flies in
// from every side and circles the cup, then hangs under the loading line as it
// fills; then the black fades away and the build begins.
// Cursors with nothing to do flock after your pointer: they trail behind it
// while it moves, roam around it (keeping a gap) when it stops, and scatter
// when you sweep the pointer into them.
//
// Inspired by Swarmline (github.com/imperfec-t/swarmline, MIT) and the Swarm
// projects it credits (Swarm Rebuild by Dhvanil Patel, Swarm by Joel Califa).
// This is an independent implementation written for this portfolio; no code was
// copied from those projects. See ./NOTICE.md.
//
// Cost model: one requestAnimationFrame loop (capped at 60fps, 30 on low-end),
// frame-rate independent, paused while the tab is hidden, fully torn down on
// stop. The page is hidden with one stylesheet (visibility only, so layout never
// moves) and revealed by toggling one attribute per element; the cursors and
// marks are drawn on a single pointer-events:none canvas.

import { createPageScan } from './scanPage';
import { createStage } from './stage';
import { getDeviceProfile } from './deviceProfile';
import { createLoaderScene, COFFEE_CYCLE } from './loaderScene';

const INK = '#3d8bff'; // design-tool selection blue (selections, badges, guides)
const COLORS = ['#ff5a8a', '#ffc24b', '#5ce1e6', '#7cf29c', '#b18cff', '#ff9f5a', '#6ea8ff', '#ff7ad9', '#4de0c0', '#f5f06b', '#ff8f8f', '#9be7ff'];
const FONT = '600 10px ui-monospace, "Source Code Pro", monospace';
const TAU = Math.PI * 2;
// The arrow sprite's tip is at (0,0) and it points up-and-left; this is the
// angle of that direction, used to turn the arrow to face where it's flying.
const ARROW_HEADING = Math.atan2(-1, -0.45);

// Flock tuning (px, px/s, px/s²)
const FLOCK = {
  behind: 120, // how far behind a moving pointer the crew trails
  gapMin: 66, // never closer than this to a resting pointer
  scatterRadius: 46, // pointer this close to a cursor makes the crew scatter
  scatterMs: 700,
  maxSpeed: 640,
  scatterSpeed: 1250,
  maxForce: 2600,
  minSpeed: 70, // birds don't hover: keep drifting
};

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a, b) => a + Math.random() * (b - a);

let arrowPath = null;
const getArrow = () => arrowPath || (arrowPath = new Path2D('M0 0 L0 15 L4 11.4 L6.6 17.4 L9 16.3 L6.5 10.5 L11.6 10.5 Z'));

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
};

/**
 * @param {{ onRequestStop?: () => void }} [options]
 */
export function createSwarm({ onRequestStop } = {}) {
  const profile = getDeviceProfile();
  const quality = { dpr: profile.maxDpr, guides: profile.guides, fpsCap: profile.fpsCap, level: 0 };
  const stage = createStage();
  const root = () => document.getElementById('root') || document.body;

  let canvas = null;
  let ctx = null;
  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let raf = 0;
  let lastTick = 0;
  let lastStep = 0;
  let clock = 0; // engine time in ms; doesn't advance while hidden
  let phase = 'off'; // 'build' | 'leaving' | 'off'
  let leaveAt = 0;
  let buildFrom = 0;
  let sleeping = false;
  let lastInput = 0;

  let units = [];
  let fixedUnits = [];
  const revealing = []; // images scanning in
  let inViewUnbuilt = 0; // anything on screen not built yet (ready or waiting on its container)
  let pending = 0;
  let builtByCrew = 0;
  let allShown = false;
  let scanPending = true; // new content may exist that the last scan didn't see
  let fixedDirty = false;
  let scrollX = 0;
  let scrollY = 0;
  let route = '';
  let lastSweepAt = -1e9;
  let rulerA = 0;
  let scannedOnce = false;
  // the opening loading screen: { t0, shown (bar 0..1), fadeAt (-1 until it fades), spin }
  let intro = null;
  // three trips along the line (across, back, across again), ending with the
  // cup gathered up at the far end
  const INTRO_MIN = COFFEE_CYCLE * 1.5;
  const INTRO_FADE = 650;

  const cursors = [];
  const readyBuffer = [];
  const pointer = { x: 0, y: 0, known: false, vx: 0, vy: 0, lx: 0, ly: 0 };
  let slowFrames = 0;
  let frameEma = 16;

  let listeners = null;
  let resizeObserver = null;
  let mutationObserver = null;
  let rescanTimer = 0;
  let resizeTimer = 0;
  let scanTimer = 0;
  let activeScan = null;
  let lastDocHeight = 0;

  // ─── setup / teardown ──────────────────────────────────────────────────────

  function mountCanvas() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('data-swarm-layer', '');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      pointerEvents: 'none',
      zIndex: '2147483000',
      contain: 'strict',
    });
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    sizeCanvas();
  }

  function sizeCanvas() {
    if (!canvas) return;
    vw = document.documentElement.clientWidth || window.innerWidth;
    vh = window.innerHeight;
    // Pixel budget: a 1920×1080 screen at 2× would be an 8MP canvas composited
    // every frame. Cap the backing store instead (cursors stay crisp enough).
    const budget = Math.sqrt(profile.maxPixels / Math.max(1, vw * vh));
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, quality.dpr, budget));
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
  }

  function bind() {
    listeners = new AbortController();
    const opt = { signal: listeners.signal, passive: true };

    const onPointer = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.known) {
        pointer.lx = pointer.x;
        pointer.ly = pointer.y;
      }
      pointer.known = true;
      lastInput = clock;
      wake();
    };
    window.addEventListener('pointermove', onPointer, opt);
    window.addEventListener('pointerdown', onPointer, opt);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && phase === 'build' && onRequestStop) onRequestStop();
    }, opt);
    // Clicks don't fast-forward anything: content is only ever built once it's
    // on screen, so what you haven't scrolled to yet stays unbuilt.
    window.addEventListener('scroll', () => {
      fixedDirty = true;
      lastInput = clock;
      wake();
    }, opt);
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeCanvas();
        scheduleRescan(0);
        wake();
      }, 120);
    }, opt);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        wake(true);
      }
    }, opt);

    if (typeof ResizeObserver !== 'undefined') {
      // Seed first: ResizeObserver fires once on observe(), which must not rescan.
      lastDocHeight = document.documentElement.scrollHeight;
      resizeObserver = new ResizeObserver(() => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - lastDocHeight) > 40) scheduleRescan(250);
      });
      resizeObserver.observe(document.body);
    }

    // New elements are already hidden by the stage stylesheet the moment they
    // mount, and get scanned and built by the crew. Live zones (the music card)
    // are exempt from hiding altogether, so changes there are left alone.
    mutationObserver = new MutationObserver((records) => {
      if (location.hash !== route) {
        route = location.hash; // a new page: build it
        scheduleRescan(150);
        return;
      }
      let rebuild = false;
      for (let i = 0; i < records.length; i++) {
        const added = records[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const n = added[j];
          if (n.nodeType !== 1 || n.hasAttribute('data-swarm-layer')) continue;
          if (!n.closest('[data-swarm-live]')) rebuild = true;
        }
      }
      if (rebuild) scheduleRescan(200);
    });
    mutationObserver.observe(root(), { childList: true, subtree: true });
  }

  function teardown() {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimeout(rescanTimer);
    clearTimeout(resizeTimer);
    clearTimeout(scanTimer);
    activeScan = null;
    if (listeners) listeners.abort();
    listeners = null;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (mutationObserver) mutationObserver.disconnect();
    mutationObserver = null;
    stage.restore();
    if (canvas) canvas.remove();
    canvas = null;
    ctx = null;
    units = [];
    fixedUnits = [];
    revealing.length = 0;
    cursors.length = 0;
    intro = null;
    phase = 'off';
    sleeping = false;
  }

  // ─── scanning ──────────────────────────────────────────────────────────────

  function scheduleRescan(delay) {
    scanPending = true;
    clearTimeout(rescanTimer);
    rescanTimer = setTimeout(() => {
      rescanTimer = 0;
      if (phase === 'build') rescan();
    }, delay);
    wake();
  }

  // Time-sliced (≤6ms per task) so it never blocks a frame, even on slow phones.
  function rescan() {
    scanPending = true;
    const scan = createPageScan(root(), { maxUnits: profile.tier === 'low' ? 400 : 700 });
    activeScan = scan;
    const t0 = performance.now();
    let slices = 0;
    const pump = () => {
      scanTimer = 0;
      if (phase !== 'build' || activeScan !== scan) return;
      slices++;
      if (!scan.step(6)) {
        scanTimer = setTimeout(pump, 0);
        return;
      }
      activeScan = null;
      performance.measure?.('swarm:scan', { start: t0, end: performance.now(), detail: { slices } });
      applyScan(scan.result());
    };
    pump();
  }

  function applyScan(result) {
    // Anything mid-build is finished off cleanly before switching to fresh units.
    for (let i = 0; i < units.length; i++) if (units[i].state === 2) completeUnit(units[i]);
    for (let i = 0; i < cursors.length; i++) {
      cursors[i].task = null;
      cursors[i].shape = 'arrow';
    }
    revealing.length = 0;
    units = result.units;
    fixedUnits = units.filter((u) => u.fixed);
    let left = 0;
    for (let i = 0; i < units.length; i++) {
      if (stage.isShown(units[i].el)) {
        units[i].state = 3;
        units[i].p = 1;
      } else left++;
    }
    pending = left;
    scannedOnce = true;
    if (left) allShown = false;
    // a newer change may have arrived while this scan was running
    scanPending = !!rescanTimer;
    lastDocHeight = document.documentElement.scrollHeight;
    wake();
  }

  function completeUnit(u) {
    if (u.state === 3) return;
    builtByCrew++;
    stage.show(u.el);
    if (u.kind !== 'box') stage.clip(u.el, null);
    u.state = 3;
    u.p = 1;
  }

  // ─── geometry helpers ──────────────────────────────────────────────────────

  const ux = (u) => (u.fixed ? u.x : u.x - scrollX);
  const uy = (u) => (u.fixed ? u.y : u.y - scrollY);
  const inView = (u, margin = 0) => {
    const y = uy(u);
    const x = ux(u);
    return y < vh + margin && y + u.h > -margin && x < vw && x + u.w > 0;
  };

  function refreshFixed() {
    fixedDirty = false;
    for (let i = 0; i < fixedUnits.length; i++) {
      const u = fixedUnits[i];
      if (!u.el.isConnected) {
        u.state = 3;
        continue;
      }
      const r = u.el.getBoundingClientRect();
      const dx = r.left - u.x;
      const dy = r.top - u.y;
      if (dx || dy) {
        u.x += dx;
        u.y += dy;
        if (u.lines) for (let j = 0; j < u.lines.length; j++) {
          u.lines[j].x += dx;
          u.lines[j].y += dy;
        }
      }
    }
  }

  // ─── crew ──────────────────────────────────────────────────────────────────

  function spawnCrew(count) {
    cursors.length = 0;
    for (let i = 0; i < count; i++) {
      // fly in from all around the screen edge
      const a = (i / count) * TAU + rand(-0.2, 0.2);
      const x = vw / 2 + Math.cos(a) * vw * 0.7;
      const y = vh / 2 + Math.sin(a) * vh * 0.7;
      cursors.push({
        x, y, vx: 0, vy: 0,
        angle: 0,
        color: COLORS[i % COLORS.length],
        shape: 'arrow',
        task: null,
        press: 0,
        // flock personality: everyone circles the same way round a resting pointer,
        // at slightly different gaps, each with its own wandering heading
        dir: 1,
        gap: FLOCK.gapMin + 18 + (i % 4) * 18 + rand(0, 12),
        // each cursor's distance "breathes" on its own slow rhythm: it drifts in
        // a little closer, then straight back out — a cloud, not a ring
        bp: rand(0, TAU),
        bf: rand(0.00035, 0.0007),
        tf: rand(0.6, 1.15),
        wa: rand(0, TAU),
        wv: 0,
        scatterUntil: 0,
        // reduced motion: a fixed parking spot around the pointer
        parkA: (i / count) * TAU,
        exitX: x,
        exitY: y,
      });
    }
  }

  function tempo(backlog) {
    return clamp(0.85 + backlog / 30, 1, 2.4) * profile.speed;
  }

  // Hand ready units (on screen, container already built) to idle cursors,
  // preferring reading order and then whichever ready unit is closest.
  function schedule() {
    let idle = 0;
    for (let i = 0; i < cursors.length; i++) if (!cursors[i].task) idle++;
    const want = idle * 3;
    const ready = readyBuffer;
    ready.length = 0;
    let backlog = 0;
    let left = 0;
    let unbuilt = 0;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.state === 3) continue;
      if (!u.el.isConnected) {
        u.state = 3;
        continue;
      }
      left++;
      if (!inView(u, -4)) continue;
      unbuilt++;
      if (u.state !== 0) continue;
      // wait for the container to be built first — unless it's off screen,
      // where nobody would build it
      const p = u.parent;
      if (p && !(p.state === 3 || (p.state === 2 && p.kind !== 'text')) && inView(p, -4)) continue;
      backlog++;
      if (ready.length < want) ready.push(u);
    }
    pending = left;
    inViewUnbuilt = unbuilt;
    if (!idle || !ready.length) return;
    const speed = tempo(backlog);
    for (let i = 0; i < cursors.length && ready.length; i++) {
      const c = cursors[i];
      if (c.task) continue;
      let best = 0;
      let bestD = Infinity;
      const n = Math.min(3, ready.length);
      for (let j = 0; j < n; j++) {
        const u = ready[j];
        const d = Math.abs(ux(u) - c.x) + Math.abs(uy(u) - c.y);
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      const u = ready.splice(best, 1)[0];
      u.state = 1;
      c.task = { unit: u, step: 'go', k: 0, dur: clamp(220 + bestD * 0.5, 240, 850) / speed, ax: c.x, ay: c.y, bend: Math.random() < 0.5 ? -1 : 1, speed };
      c.shape = 'arrow';
    }
  }

  // Once nothing on screen is left to build, show the small leftovers there
  // (decorations too tiny to be worth a gesture); once the whole page is built,
  // show everything. Never while new content is still waiting to be scanned —
  // that would reveal it unbuilt.
  function settle() {
    if (scanPending || activeScan) return;
    let busy = revealing.length > 0 || inViewUnbuilt > 0;
    for (let i = 0; i < cursors.length && !busy; i++) if (cursors[i].task) busy = true;
    if (busy) return;
    if (pending === 0) {
      if (!allShown) {
        performance.measure?.('swarm:built', { start: 0, end: performance.now(), detail: { byCrew: builtByCrew, units: units.length } });
        stage.sweep(root(), -Infinity, Infinity);
        allShown = true;
      }
      return;
    }
    if (clock - lastSweepAt > 500) {
      lastSweepAt = clock;
      stage.sweep(root(), 0, vh);
    }
  }

  // Where a unit's build starts (top-left of the box / first text line), in viewport space.
  function startPoint(u, out) {
    if (u.kind === 'text') {
      const l = u.lines[0];
      out.x = l.x - (u.fixed ? 0 : scrollX);
      out.y = l.y - (u.fixed ? 0 : scrollY);
    } else {
      out.x = clamp(ux(u), 4, vw - 12);
      out.y = clamp(uy(u), 4, vh - 12);
    }
    return out;
  }
  // Where the drag ends (bottom-right; big boxes stop at the screen edge).
  function endPoint(u, sx, sy, out) {
    if (u.kind === 'text') {
      const l = u.lines[0];
      let w = 0;
      for (let i = 0; i < u.lines.length; i++) w = Math.max(w, u.lines[i].x + u.lines[i].w - l.x);
      const last = u.lines[u.lines.length - 1];
      out.x = clamp(sx + w, sx + 6, vw - 4);
      out.y = clamp(last.y - (u.fixed ? 0 : scrollY) + last.h, sy + 6, vh - 4);
    } else {
      out.x = clamp(ux(u) + u.w, sx + 6, vw - 4);
      out.y = clamp(uy(u) + u.h, sy + 6, vh - 4);
    }
    return out;
  }
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };

  // clip-path that shows the text typed so far: whole lines, then part of one.
  function typingClip(u, width) {
    let d = '';
    let acc = 0;
    for (let i = 0; i < u.lines.length; i++) {
      const l = u.lines[i];
      const w = clamp(width - acc, 0, l.w);
      acc += l.w;
      if (w <= 0) break;
      d += `M${(l.rx - 1).toFixed(1)} ${(l.ry - 3).toFixed(1)}h${(w + 1).toFixed(1)}v${(l.h + 6).toFixed(1)}h${(-w - 1).toFixed(1)}Z`;
    }
    return d ? `path('${d}')` : 'inset(0 100% 100% 0)';
  }

  function updateTask(c, t, dt) {
    const u = t.unit;
    if (u.state === 3) {
      c.task = null;
      c.shape = 'arrow';
      return;
    }
    t.k += dt / t.dur;
    const k = t.k < 1 ? t.k : 1;

    if (t.step === 'go') {
      startPoint(u, P0);
      const dx = P0.x - t.ax;
      const dy = P0.y - t.ay;
      const len = Math.hypot(dx, dy) || 1;
      const e = easeInOut(k);
      // a gentle sideways arc, like a hand moving a mouse
      const bend = t.bend * Math.sin(Math.PI * k) * Math.min(len * 0.18, 60);
      c.x = t.ax + dx * e + (-dy / len) * bend;
      c.y = t.ay + dy * e + (dx / len) * bend;
      if (k >= 1) {
        u.state = 2;
        c.press = 1;
        t.k = 0;
        t.step = 'drag';
        c.shape = 'cross';
        const w = Math.min(u.w, vw);
        const h = Math.min(u.h, vh);
        t.dur = (u.kind === 'text' ? clamp(140 + Math.sqrt(w * h) * 0.5, 160, 420) : clamp(260 + Math.sqrt(w * h), 320, 1000)) / t.speed;
      }
      return;
    }

    if (t.step === 'drag') {
      startPoint(u, P0);
      endPoint(u, P0.x, P0.y, P1);
      const e = easeInOut(k);
      c.x = P0.x + (P1.x - P0.x) * e;
      c.y = P0.y + (P1.y - P0.y) * e;
      if (k < 1) return;
      c.press = 1;
      if (u.kind === 'box') {
        completeUnit(u); // the real box fills in
        c.task = null;
        c.shape = 'arrow';
      } else if (u.kind === 'image') {
        stage.clip(u.el, 'inset(0 0 100% 0)');
        stage.show(u.el);
        u.t0 = clock;
        u.dur = 480 / t.speed;
        revealing.push(u);
        c.task = null;
        c.shape = 'arrow';
      } else {
        // the text box is drawn: park the I-beam and type
        stage.clip(u.el, typingClip(u, 0));
        stage.show(u.el);
        t.step = 'type';
        t.k = 0;
        t.typed = -1;
        c.shape = 'ibeam';
        t.dur = clamp((u.chars * 1000) / (26 * t.speed), 360 / t.speed, 1700);
      }
      return;
    }

    // typing: reveal across the lines in reading order; the I-beam rides the caret
    u.p = k;
    // step the clip in whole-letter jumps so it reads as typing, not a wipe
    const letters = Math.floor(k * u.chars);
    const target = (letters / u.chars) * u.totalWidth;
    if (letters !== t.typed) {
      t.typed = letters;
      stage.clip(u.el, typingClip(u, target));
    }
    let acc = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < u.lines.length; i++) {
      const l = u.lines[i];
      if (acc + l.w >= target || i === u.lines.length - 1) {
        cx = l.x + clamp(target - acc, 0, l.w);
        cy = l.y + l.h * 0.5;
        break;
      }
      acc += l.w;
    }
    cx -= u.fixed ? 0 : scrollX;
    cy -= u.fixed ? 0 : scrollY;
    c.x += (cx + 6 - c.x) * 0.4;
    c.y += (cy - c.y) * 0.4;
    if (k >= 1) {
      completeUnit(u);
      c.task = null;
      c.shape = 'arrow';
    }
  }

  function steer(c, tx, ty, dt, stiffness, damping) {
    const s = dt / 1000;
    const damp = 2 * Math.sqrt(stiffness) * damping;
    c.vx += ((tx - c.x) * stiffness - c.vx * damp) * s;
    c.vy += ((ty - c.y) * stiffness - c.vy * damp) * s;
    c.x += c.vx * s;
    c.y += c.vy * s;
    if (Math.abs(tx - c.x) + Math.abs(ty - c.y) < 0.6 && Math.abs(c.vx) + Math.abs(c.vy) < 20) {
      c.x = tx;
      c.y = ty;
      c.vx = 0;
      c.vy = 0;
    }
  }

  // The flock (cursors with no job). Classic boids — separation, alignment,
  // cohesion — plus a leader: while the pointer moves the crew chases a point
  // trailing behind it; while it rests the crew roams around it, never closer
  // than a gap, in loose loops that wander (no fixed circle). Sweeping the
  // pointer into the crew scatters it; it regroups a moment later.
  function flock(dt) {
    const s = dt / 1000;
    const lx = pointer.known ? pointer.x : vw / 2;
    const ly = pointer.known ? pointer.y : vh * 0.45;
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const moving = pointer.known && speed > 90;
    const nx = moving ? pointer.vx / speed : 0;
    const ny = moving ? pointer.vy / speed : 0;
    const tx = lx - nx * FLOCK.behind;
    const ty = ly - ny * FLOCK.behind;

    for (let i = 0; i < cursors.length; i++) {
      const c = cursors[i];
      if (c.task) continue;

      if (profile.reduced) {
        // no flocking: glide to a parking spot around the pointer and stay
        steer(c, lx + Math.cos(c.parkA) * c.gap, ly + Math.sin(c.parkA) * c.gap * 0.75, dt, 60, 1);
        continue;
      }

      const dx = lx - c.x;
      const dy = ly - c.y;
      const d = Math.hypot(dx, dy) || 1;

      // sweeping the pointer into the crew scatters everyone nearby
      if (pointer.known && d < FLOCK.scatterRadius && clock - lastInput < 400 && c.scatterUntil < clock) {
        for (let j = 0; j < cursors.length; j++) {
          const o = cursors[j];
          if (!o.task && Math.hypot(lx - o.x, ly - o.y) < FLOCK.scatterRadius * 2.4) {
            o.scatterUntil = clock + FLOCK.scatterMs * rand(0.8, 1.2);
            const od = Math.hypot(o.x - lx, o.y - ly) || 1;
            const kick = rand(500, 900);
            o.vx += ((o.x - lx) / od) * kick + rand(-150, 150);
            o.vy += ((o.y - ly) / od) * kick + rand(-150, 150);
          }
        }
      }
      const scattering = clock < c.scatterUntil;

      // neighbours
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      for (let j = 0; j < cursors.length; j++) {
        if (j === i) continue;
        const o = cursors[j];
        if (o.task) continue;
        const ox = o.x - c.x;
        const oy = o.y - c.y;
        const d2 = ox * ox + oy * oy;
        if (d2 > 12100) continue; // ~110px: big enough to keep streams together
        n++;
        ax += o.vx;
        ay += o.vy;
        cx += o.x;
        cy += o.y;
        if (d2 < 144 && d2 > 0.01) {
          // only a small personal space: the crew packs into dense clumps
          const od = Math.sqrt(d2);
          sx -= (ox / od) * (12.2 - od);
          sy -= (oy / od) * (12.2 - od);
        }
      }
      let fx = sx * 120;
      let fy = sy * 120;
      if (n && !scattering) {
        fx += (ax / n - c.vx) * 2.0 + (cx / n - c.x) * 3.2;
        fy += (ay / n - c.vy) * 2.0 + (cy / n - c.y) * 3.2;
      }

      if (scattering) {
        fx -= (dx / d) * 900;
        fy -= (dy / d) * 900;
      } else if (moving) {
        // chase the point trailing behind the pointer
        const gx = tx - c.x;
        const gy = ty - c.y;
        fx += gx * 7 - c.vx * 1.5;
        fy += gy * 7 - c.vy * 1.5;
      } else {
        // drift like a cloud around the resting pointer: each cursor's preferred
        // distance breathes (closer, then away again) while the crew slowly goes
        // round one way; never closer than the gap
        const breath = 0.5 + 0.5 * Math.sin(clock * c.bf + c.bp) * Math.sin(clock * c.bf * 0.37 + c.bp * 1.7);
        const want = Math.max(FLOCK.gapMin + 6, c.gap * (0.72 + 0.7 * breath));
        fx += (dx / d) * (d - want) * 11;
        fy += (dy / d) * (d - want) * 11;
        if (d < FLOCK.gapMin) {
          fx -= (dx / d) * (FLOCK.gapMin - d) * 30;
          fy -= (dy / d) * (FLOCK.gapMin - d) * 30;
        }
        const sideways = 140 * c.tf * (0.7 + 0.3 * Math.sin(clock * 0.0006 + c.bp));
        fx += (-dy / d) * c.dir * sideways;
        fy += (dx / d) * c.dir * sideways;
        c.wv += rand(-6, 6) * s;
        c.wv = clamp(c.wv * 0.98, -2.2, 2.2);
        c.wa += c.wv * s;
        fx += Math.cos(c.wa) * 120;
        fy += Math.sin(c.wa) * 120;
      }

      const f = Math.hypot(fx, fy);
      if (f > FLOCK.maxForce * (scattering ? 1.6 : 1)) {
        const k = (FLOCK.maxForce * (scattering ? 1.6 : 1)) / f;
        fx *= k;
        fy *= k;
      }
      c.vx += fx * s;
      c.vy += fy * s;
      const v = Math.hypot(c.vx, c.vy);
      // roaming around a resting pointer is calmer than chasing a moving one
      const maxV = scattering ? FLOCK.scatterSpeed : moving ? FLOCK.maxSpeed : FLOCK.maxSpeed * 0.6;
      if (v > maxV) {
        c.vx *= maxV / v;
        c.vy *= maxV / v;
      } else if (v < FLOCK.minSpeed && v > 0.01) {
        c.vx *= FLOCK.minSpeed / v;
        c.vy *= FLOCK.minSpeed / v;
      }
      c.x += c.vx * s;
      c.y += c.vy * s;
    }
  }

  function updateCrew(dt) {
    // pointer velocity (smoothed), for "trail behind" and the scatter check
    if (pointer.known) {
      const k = 1000 / Math.max(dt, 1);
      pointer.vx += ((pointer.x - pointer.lx) * k - pointer.vx) * 0.25;
      pointer.vy += ((pointer.y - pointer.ly) * k - pointer.vy) * 0.25;
      pointer.lx = pointer.x;
      pointer.ly = pointer.y;
    }

    if (phase === 'leaving') {
      for (let i = 0; i < cursors.length; i++) steer(cursors[i], cursors[i].exitX, cursors[i].exitY, dt, 30, 0.75);
    } else {
      for (let i = 0; i < cursors.length; i++) {
        const c = cursors[i];
        if (!c.task) continue;
        const px = c.x;
        const py = c.y;
        updateTask(c, c.task, dt);
        const k = 1000 / Math.max(dt, 1);
        c.vx = (c.x - px) * k;
        c.vy = (c.y - py) * k;
      }
      if (introBlocking()) orbitLoader(dt);
      else flock(dt);
    }

    for (let i = 0; i < cursors.length; i++) {
      const c = cursors[i];
      if (c.press > 0) c.press = Math.max(0, c.press - dt / 260);
      // at work: an upright pointer with a slight lean; flocking: face the flight path
      let target;
      if (!c.task && !profile.reduced && phase === 'build' && Math.hypot(c.vx, c.vy) > 40) {
        target = Math.atan2(c.vy, c.vx) - ARROW_HEADING;
      } else {
        target = clamp(c.vx * 0.0005, -0.4, 0.4);
      }
      let d = target - c.angle;
      d = (((d + Math.PI) % TAU) + TAU) % TAU - Math.PI;
      c.angle += d * Math.min(1, dt / 70);
    }
  }

  function updateReveals() {
    for (let i = revealing.length - 1; i >= 0; i--) {
      const u = revealing[i];
      if (u.state === 3) {
        revealing.splice(i, 1);
        continue;
      }
      u.p = clamp((clock - u.t0) / u.dur, 0, 1);
      stage.clip(u.el, `inset(0 0 ${((1 - u.p) * 100).toFixed(1)}% 0)`);
      if (u.p >= 1) {
        completeUnit(u);
        revealing.splice(i, 1);
      }
    }
  }

  // ─── opening loading screen ────────────────────────────────────────────────

  // The bar follows the real scan: it creeps towards 88% while scanning, fills
  // once the scan is done, and the black fades away after a minimum show time.
  function updateIntro() {
    const elapsed = clock - intro.t0;
    const min = profile.reduced ? 500 : INTRO_MIN;
    // fill evenly over the show time; never past 88% until the scan has finished
    const timed = Math.min(1, elapsed / (min - 150));
    const target = scannedOnce ? timed : Math.min(0.88, timed);
    intro.shown += (target - intro.shown) * 0.12;
    if (target === 1 && intro.shown > 0.995) intro.shown = 1;
    if (!profile.reduced) intro.spin += 0.028;
    if (intro.fadeAt < 0 && intro.shown === 1 && elapsed >= min) {
      intro.fadeAt = clock;
      buildFrom = clock + INTRO_FADE * 0.45; // the crew starts as the black clears
    }
    if (intro.fadeAt >= 0 && clock - intro.fadeAt >= (profile.reduced ? 200 : INTRO_FADE)) intro = null;
  }

  const introBlocking = () => !!intro && intro.fadeAt < 0;

  function makeStars() {
    const tones = ['#eaf2ff', '#bfe9ff', '#cdebff', '#5ce1e6'];
    const n = profile.tier === 'low' ? 36 : profile.coarse ? 55 : 80;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: Math.random(), y: Math.random(), s: Math.random() < 0.2 ? 3 : 2, ph: rand(0, TAU), sp: rand(0.0015, 0.004), c: tones[i % tones.length] });
    }
    return out;
  }
  const introAlpha = () => {
    if (!intro) return 0;
    const fadeIn = Math.min(1, (clock - intro.t0) / 160);
    if (intro.fadeAt < 0) return fadeIn;
    return Math.max(0, 1 - (clock - intro.fadeAt) / (profile.reduced ? 200 : INTRO_FADE));
  };

  // ── The loading screen (shared with the first-visit boot screen, see
  // ./loaderScene.js): the pixel coffee cup sliding along its dashed line, and
  // a loading line under it with the site logo riding its tip, filling with the
  // real scan progress. The crew circles the cup, then hangs under the line.
  const scene = createLoaderScene();
  const loaderLayout = () => scene.layout(vw, vh);

  // Cursors circle the cup (all the same way); as the line fills past each
  // one's spot, it flies down and hangs underneath the line.
  function orbitLoader(dt) {
    const L = loaderLayout();
    const R = clamp(Math.min(vw, vh) * 0.3, 150, 250);
    const n = cursors.length;
    for (let i = 0; i < n; i++) {
      const c = cursors[i];
      if (c.task) continue;
      const spot = (i + 0.5) / n;
      // land behind the logo at the tip, not underneath it
      if (intro.shown - (L.logoS * 0.6) / L.lineW >= spot) {
        // hang under the line: arrow tip just below it
        steer(c, L.lineX + spot * L.lineW - 2, L.barY + L.px * 2 + 3, dt, 70, 0.95);
      } else {
        const a = intro.spin + (i / n) * TAU;
        const r = R * (1 + (i % 3) * 0.09);
        steer(c, L.cupCx + Math.cos(a) * r, L.cupCy + Math.sin(a) * r * 0.78, dt, 16, 0.72);
      }
    }
  }

  function drawLoader(alpha) {
    const L = loaderLayout();
    const p = intro.shown;
    const out = intro.fadeAt >= 0 ? 1 - alpha : 0; // 0 → 1 while fading away
    ctx.save();

    // stars
    for (let i = 0; i < intro.stars.length; i++) {
      const st = intro.stars[i];
      const tw = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(clock * st.sp + st.ph));
      ctx.globalAlpha = alpha * tw * 0.85;
      ctx.fillStyle = st.c;
      ctx.fillRect(Math.round(st.x * vw), Math.round(st.y * vh), st.s, st.s);
    }

    // gentle zoom-through on the way out
    ctx.globalAlpha = alpha;
    const z = 1 + out * 0.12;
    ctx.translate(L.cx, L.cy);
    ctx.scale(z, z);
    ctx.translate(-L.cx, -L.cy);

    scene.draw(ctx, L, { time: clock - intro.t0, progress: p, dpr, reduced: profile.reduced, labelAlpha: 1 - out });
    ctx.restore();
  }

  // ─── drawing ───────────────────────────────────────────────────────────────

  function drawRulers() {
    if (rulerA < 0.01) return;
    ctx.globalAlpha = rulerA;
    ctx.fillStyle = 'rgba(14,18,30,0.86)';
    ctx.fillRect(0, 0, vw, 16);
    ctx.fillRect(0, 16, 16, vh - 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    for (let x = 20; x < vw; x += 10) {
      const big = x % 100 === 0;
      ctx.moveTo(x + 0.5, big ? 4 : 11);
      ctx.lineTo(x + 0.5, 16);
    }
    for (let y = 20; y < vh; y += 10) {
      const big = y % 100 === 0;
      ctx.moveTo(big ? 4 : 11, y + 0.5);
      ctx.lineTo(16, y + 0.5);
    }
    ctx.stroke();
    for (let x = 100; x < vw; x += 100) ctx.fillText(String(x), x + 2, 10);
    // left ruler numbers, written vertically like a design tool
    for (let y = 100; y < vh; y += 100) {
      ctx.setTransform(0, -dpr, dpr, 0, 10 * dpr, (y - 2) * dpr);
      ctx.fillText(String(y), 0, 0);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  function badge(text, cx, y) {
    const w = text.length * 6.1 + 10;
    const x = clamp(cx - w / 2, 2, vw - w - 2);
    const by = clamp(y, 2, vh - 16);
    ctx.fillStyle = INK;
    roundRect(ctx, x, by, w, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x + 5, by + 10.5);
  }

  function drawWork() {
    ctx.lineWidth = 1;
    let dragging = false;
    for (let i = 0; i < cursors.length; i++) {
      const c = cursors[i];
      const t = c.task;
      if (!t || (t.step !== 'drag' && t.step !== 'type')) continue;
      const u = t.unit;
      startPoint(u, P0);
      const x0 = P0.x;
      const y0 = P0.y;
      if (t.step === 'type') {
        // the text box being typed into
        endPoint(u, x0, y0, P1);
        ctx.strokeStyle = 'rgba(61,139,255,0.55)';
        ctx.strokeRect(x0 - 2.5, y0 - 2.5, P1.x - x0 + 5, P1.y - y0 + 5);
        continue;
      }
      if (u.kind !== 'text') dragging = true;
      const w = c.x - x0;
      const h = c.y - y0;
      if (w < 1 || h < 1) continue;
      if (quality.guides && u.kind !== 'text') {
        ctx.strokeStyle = 'rgba(61,139,255,0.28)';
        ctx.beginPath();
        ctx.moveTo(0, y0 + 0.5);
        ctx.lineTo(vw, y0 + 0.5);
        ctx.moveTo(x0 + 0.5, 0);
        ctx.lineTo(x0 + 0.5, vh);
        ctx.stroke();
      }
      if (u.kind === 'image') {
        ctx.fillStyle = 'rgba(61,139,255,0.10)';
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = 'rgba(61,139,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(c.x, c.y);
        ctx.moveTo(c.x, y0);
        ctx.lineTo(x0, c.y);
        ctx.stroke();
      }
      ctx.strokeStyle = INK;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, w, h);
      if (u.kind !== 'text') {
        ctx.fillStyle = '#fff';
        for (let k = 0; k < 4; k++) {
          const hx = k & 1 ? c.x : x0;
          const hy = k & 2 ? c.y : y0;
          ctx.fillRect(hx - 3, hy - 3, 6, 6);
          ctx.strokeRect(hx - 2.5, hy - 2.5, 6, 6);
        }
      }
      if (w > 14) badge(`${Math.round(Math.min(u.w, w))} × ${Math.round(Math.min(u.h, h))}`, x0 + w / 2, c.y + 7);
    }
    // scan lines on images that are filling in
    ctx.strokeStyle = INK;
    for (let i = 0; i < revealing.length; i++) {
      const u = revealing[i];
      if (!inView(u)) continue;
      const y = uy(u) + u.h * u.p;
      ctx.beginPath();
      ctx.moveTo(ux(u), y + 0.5);
      ctx.lineTo(ux(u) + u.w, y + 0.5);
      ctx.stroke();
    }
    return dragging;
  }

  function drawCrew() {
    const arrow = getArrow();
    for (let i = 0; i < cursors.length; i++) {
      const c = cursors[i];
      if (c.x < -30 || c.y < -30 || c.x > vw + 30 || c.y > vh + 30) continue;
      if (c.press > 0) {
        ctx.strokeStyle = c.color;
        ctx.globalAlpha = c.press;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3 + (1 - c.press) * 9, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.setTransform(dpr, 0, 0, dpr, c.x * dpr, c.y * dpr);
      if (c.shape === 'cross' || c.shape === 'ibeam') {
        ctx.beginPath();
        if (c.shape === 'cross') {
          ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.moveTo(0, -7); ctx.lineTo(0, 7);
        } else {
          ctx.moveTo(-3, -8); ctx.lineTo(3, -8); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(-3, 8); ctx.lineTo(3, 8);
        }
        ctx.strokeStyle = 'rgba(6,8,14,0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else {
        ctx.rotate(c.angle);
        ctx.fillStyle = c.color;
        ctx.fill(arrow);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 1.1;
        ctx.stroke(arrow);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.lineWidth = 1;
  }

  function draw(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    ctx.font = FONT;
    if (intro) {
      const a = introAlpha();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = 1;
      drawLoader(a);
      ctx.font = FONT;
    }
    const dragging = drawWork();
    const want = dragging && quality.guides ? 1 : 0;
    rulerA += (want - rulerA) * Math.min(1, dt / 220);
    drawRulers();
    drawCrew();
  }

  // ─── loop ──────────────────────────────────────────────────────────────────

  function adaptQuality(interval) {
    frameEma = frameEma * 0.92 + interval * 0.08;
    if (frameEma > 26) slowFrames++;
    else if (slowFrames > 0) slowFrames--;
    if (slowFrames < 90 || quality.level >= 2) return;
    slowFrames = 0;
    quality.level++;
    if (quality.level === 1) {
      quality.dpr = 1;
      quality.guides = false;
      sizeCanvas();
    } else {
      quality.fpsCap = 30;
      cursors.length = Math.max(6, Math.ceil(cursors.length * 0.6));
    }
  }

  function frame(ts) {
    raf = 0;
    if (!canvas) return;
    const interval = lastTick ? ts - lastTick : 16;
    lastTick = ts;
    adaptQuality(interval);

    // Cap the draw rate (high-refresh screens don't need 120 redraws of this);
    // drop to 30fps once everything's built and the visitor has been idle a while.
    const idleLong = allShown && clock - lastInput > 6000;
    const cap = idleLong ? Math.min(30, quality.fpsCap) : quality.fpsCap;
    if (lastStep && ts - lastStep < 1000 / cap - 2) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = lastStep ? Math.min(ts - lastStep, 50) : 16;
    lastStep = ts;
    clock += dt;

    scrollX = window.scrollX;
    scrollY = window.scrollY;
    if (fixedDirty) refreshFixed();

    if (intro) updateIntro();
    if (phase === 'build' && clock >= buildFrom && !introBlocking()) {
      if (units.length) schedule();
      settle();
    }
    updateReveals();
    updateCrew(dt);
    draw(dt);

    if (phase === 'leaving' && clock - leaveAt > 460) {
      teardown();
      return;
    }

    // Reduced motion: once everything on screen is built and nothing moves,
    // stop the loop until input (pointer, scroll, new content) arrives.
    if (profile.reduced && phase === 'build' && !intro && !scanPending && inViewUnbuilt === 0 && revealing.length === 0) {
      let still = true;
      for (let i = 0; i < cursors.length && still; i++) {
        const c = cursors[i];
        if (c.task || Math.abs(c.vx) + Math.abs(c.vy) > 6) still = false;
      }
      if (still) {
        sleeping = true;
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function wake(resetTiming) {
    if (!canvas || document.hidden) return;
    if (resetTiming || sleeping) {
      lastTick = 0;
      lastStep = 0;
    }
    sleeping = false;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // ─── public API ────────────────────────────────────────────────────────────

  function start() {
    if (phase === 'leaving') teardown();
    if (phase !== 'off') return;
    phase = 'build';
    clock = 0;
    lastTick = 0;
    lastStep = 0;
    lastInput = 0;
    lastSweepAt = -1e9;
    inViewUnbuilt = 0;
    builtByCrew = 0;
    pending = 0;
    allShown = false;
    scanPending = true;
    units = [];
    fixedUnits = [];
    rulerA = 0;
    scannedOnce = false;
    intro = { t0: 0, shown: 0, fadeAt: -1, spin: 0, stars: makeStars() };
    scene.loadLogo();
    route = location.hash;
    buildFrom = 1e9; // set when the loading screen starts to fade
    quality.dpr = profile.maxDpr;
    quality.guides = profile.guides;
    quality.fpsCap = profile.fpsCap;
    quality.level = 0;
    stage.hideAll(); // the page goes blank instantly; the scenery stays
    mountCanvas();
    spawnCrew(profile.cursors);
    bind();
    wake(true);
    // Scan after the next paint so the click that started us responds instantly.
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (phase === 'build') rescan();
      }, 0);
    });
  }

  function stop() {
    if (phase !== 'build') return;
    stage.restore(); // the page is back immediately
    if (mutationObserver) mutationObserver.disconnect();
    mutationObserver = null;
    if (profile.reduced) {
      teardown();
      return;
    }
    phase = 'leaving';
    leaveAt = clock;
    for (let i = 0; i < cursors.length; i++) {
      const c = cursors[i];
      c.task = null;
      c.shape = 'arrow';
      const dx = c.x - vw / 2;
      const dy = c.y - vh / 2;
      const len = Math.hypot(dx, dy) || 1;
      c.exitX = c.x + (dx / len) * (vw + vh);
      c.exitY = c.y + (dy / len) * (vw + vh);
    }
    wake();
  }

  return {
    start,
    stop,
    destroy: teardown,
    get running() {
      return phase !== 'off';
    },
  };
}
