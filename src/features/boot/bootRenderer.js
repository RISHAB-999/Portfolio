// Everything the first-visit loading screen draws and animates: the dimmed
// scene with the cursor's glow, the strings, the coffee cup + loading line,
// and at 100% the paper-shredder exit and the logo's flight into the header.
//
// It runs inside a Web Worker on an OffscreenCanvas wherever the browser
// allows it (see bootWorker.js), so it stays smooth while the page itself is
// busy loading on the main thread — on phones that's most of the loading
// time. Where it can't, bootLoader.js runs this same code on the page.
//
// It talks to the page only through messages:
//   in:  resize {vw, vh, dpr} · pointer {x, y} · leave · ready {key}
//        · reveal {target, oil}
//   out: progress {pct} · cover-off · want-reveal · revealed · phase {name}
//        · done

import { createLoaderScene, COFFEE_CYCLE } from '../swarm/loaderScene';
import { makeCanvas } from '../swarm/coffeeLoader';

export const MIN_SHOW = COFFEE_CYCLE * 0.75; // across the line, back, and stretched out once more
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

const raf = typeof requestAnimationFrame === 'function'
  ? (f) => requestAnimationFrame(f)
  : (f) => setTimeout(() => f(performance.now()), 16);
const unraf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;

export function createBootRenderer({ canvas, linesCanvas, post, reduced, coarse }) {
  const ctx = canvas.getContext('2d');
  const lctx = linesCanvas.getContext('2d');
  const scene = createLoaderScene();
  scene.loadLogo();

  let vw = 0;
  let vh = 0;
  let dpr = 1;
  let strings = [];
  let gap = 20;
  let linesDirty = true;
  let fullClear = true;
  const NODE = 12; // simulation node spacing along each string (px)
  let nodes = 0;

  function resize(w, h, ratio) {
    vw = w;
    vh = h;
    dpr = ratio;
    canvas.width = linesCanvas.width = Math.round(vw * dpr);
    canvas.height = linesCanvas.height = Math.round(vh * dpr);
    linesDirty = true;
    fullClear = true;
    // closely and evenly spaced: a whole-pixel gap, the same between every
    // pair of lines, centred so both edges get the same margin
    gap = coarse ? 12 : Math.max(12, Math.min(18, Math.round(vw / 85)));
    nodes = Math.ceil(vh / NODE) + 1;
    const n = Math.max(2, Math.floor(vw / gap));
    const off = Math.round((vw - (n - 1) * gap) / 2);
    strings = Array.from({ length: n }, (_, i) => ({
      x: off + i * gap,
      d: new Float32Array(nodes), // sideways displacement of each node
      v: new Float32Array(nodes),
      awake: false,
      grab: -1, // node held by the pointer, or -1
      peak: 0,
    }));
  }

  // ── strings ─────────────────────────────────────────────────────────────────
  // Real (if small) string physics: every string is a chain of nodes with
  // tension between neighbours, a spring back to rest and some damping. When
  // the pointer crosses a string it catches it and drags a soft, local bend
  // along with it; pulled far enough, the string slips free and wobbles back.
  let px = -1;
  let py = -1;
  let hover = false;
  const halo = { x: 0, y: 0, a: 0 };
  function pointer(x, y) {
    const ppx = px < 0 ? x : px;
    px = x;
    py = y;
    if (!hover) {
      halo.x = px;
      halo.y = py;
    }
    hover = true;
    linesDirty = true;
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
  function leave() {
    hover = false;
    for (const s of strings) s.grab = -1;
  }

  const H = 1 / 240; // physics step (s)
  const WAVE = (520 / NODE) ** 2; // tension: waves run ~520px/s along a string
  const K = (2 * Math.PI * 5.5) ** 2; // spring to rest: ~5.5Hz wobble
  const DAMP = 4.2; // dies away in about a second
  const SPAN = 4; // nodes either side of the catch point that bend with it

  function stepStrings(dt) {
    let moving = false;
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
      moving = true;
      if (s.grab < 0 && peak < 0.05 && speed < 1) {
        d.fill(0);
        v.fill(0);
        s.awake = false;
        s.peak = 0;
      }
    }
    // the light eases after the pointer and fades in/out
    const f = 1 - Math.exp(-dt * 14);
    const hx = halo.x;
    const hy = halo.y;
    const ha = halo.a;
    halo.x += (px - halo.x) * f;
    halo.y += (py - halo.y) * f;
    halo.a += ((hover && !reduced ? 1 : 0) - halo.a) * (1 - Math.exp(-dt * 6));
    if (halo.a < 0.005) halo.a = 0;
    if (Math.abs(halo.x - hx) > 0.05 || Math.abs(halo.y - hy) > 0.05 || halo.a !== ha) moving = true;
    return moving;
  }

  // the scene is dimmed; around the pointer the dimming lifts like a soft
  // spotlight, with a faint cool glow on top
  const haloR = () => Math.max(70, Math.min(120, Math.min(vw, vh) * 0.12));
  function drawDim(g) {
    const grad = g.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.hypot(vw, vh) / 2);
    grad.addColorStop(0.2, 'rgba(3,6,16,0.64)');
    grad.addColorStop(1, 'rgba(3,6,16,0.8)');
    g.fillStyle = grad;
    g.fillRect(0, 0, vw, vh);
    if (halo.a < 0.01) return;
    const r = haloR();
    // lift the dimming: cut a soft hole out of it
    g.save();
    g.globalCompositeOperation = 'destination-out';
    const hole = g.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, r * 1.5);
    hole.addColorStop(0, `rgba(0,0,0,${0.92 * halo.a})`);
    hole.addColorStop(0.37, `rgba(0,0,0,${0.7 * halo.a})`);
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hole;
    g.fillRect(halo.x - r * 1.5, halo.y - r * 1.5, r * 3, r * 3);
    g.restore();
    const glow = g.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, r);
    glow.addColorStop(0, `rgba(190,238,255,${0.16 * halo.a})`);
    glow.addColorStop(0.5, `rgba(150,225,245,${0.07 * halo.a})`);
    glow.addColorStop(1, 'rgba(150,225,245,0)');
    g.fillStyle = glow;
    g.fillRect(halo.x - r, halo.y - r, r * 2, r * 2);
  }

  function drawStrings(g) {
    g.lineWidth = 1;
    // strings at rest (most of them) go into a single path
    g.beginPath();
    for (const s of strings) {
      if (s.awake) continue;
      const x0 = s.x + 0.5;
      g.moveTo(x0, 0);
      g.lineTo(x0, vh);
    }
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    g.stroke();
    for (const s of strings) {
      if (!s.awake) continue;
      // a moving string reads a touch brighter; drawn as a smooth curve
      g.strokeStyle = `rgba(255,255,255,${0.14 + Math.min(0.36, s.peak / 50)})`;
      const { d } = s;
      const bx = s.x + 0.5;
      g.beginPath();
      g.moveTo(bx, 0);
      for (let i = 1; i < nodes - 1; i++) {
        const x1 = bx + d[i];
        const y1 = i * NODE;
        const x2 = bx + (d[i] + d[i + 1]) / 2;
        const y2 = Math.min(vh, (i + 0.5) * NODE);
        g.quadraticCurveTo(x1, y1, x2, y2);
      }
      g.lineTo(bx, vh);
      g.stroke();
    }
  }

  // ── progress: real page readiness, paced so the cup makes its trip ─────────
  const ready = { load: false, fonts: false, oil: false };
  let t0 = -1;
  let shown = 0;
  let lastPct = -1;
  let coverOff = false;
  let wantReveal = false;
  let revealAt = -1;
  let revealedSent = false;
  let snapshot = null;
  let fly = null;
  let strips = null;
  let slices = 24;
  let phaseSent = '';
  let handle = 0;
  let last = 0;
  let lastDraw = 0;
  let stopped = false;

  function drawCover(g, img) {
    if (!img || !img.width) return;
    const k = Math.max(vw / img.width, vh / img.height);
    const w = img.width * k;
    const h = img.height * k;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, (vw - w) / 2, (vh - h) / 2, w, h);
    g.imageSmoothingEnabled = true;
  }

  function beginReveal(now, target, oil) {
    revealAt = now;
    const L = scene.layout(vw, vh);
    const from = scene.logoAt(L, 1);
    fly = target ? { x0: from.x, y0: from.y, s0: from.size, x1: target.x, y1: target.y, s1: target.s } : null;
    // the frame that gets shredded: the scene as it stands, minus the logo
    snapshot = makeCanvas(canvas.width, canvas.height);
    const g = snapshot.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, vw, vh);
    drawCover(g, oil);
    if (oil?.close) oil.close();
    halo.a = 0;
    drawDim(g);
    drawStrings(g);
    scene.draw(g, L, { time: now - t0, progress: 1, dpr, reduced, labelAlpha: 0, logo: false });
    // paint it now, so the page can drop the backdrop behind it right away
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot, 0, 0);
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.clearRect(0, 0, linesCanvas.width, linesCanvas.height);
    // cut exactly along every line (plus the screen edges)
    const cuts = [0, ...strings.map((s) => s.x + 0.5).filter((x) => x > 0 && x < vw), vw];
    strips = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < cuts.length - 1; i++) {
      // every strip moves its own way: its own start, speed, ripple, drift and tilt
      strips.push({
        x: cuts[i],
        w: cuts[i + 1] - cuts[i],
        delay: rnd(0, 260),
        vmax: vh * rnd(0.85, 1.5), // terminal speed (px/s)
        tau: rnd(0.35, 0.7),
        ph: rnd(0, Math.PI * 2),
        amp: rnd(4, 11),
        k: (Math.PI * 2) / (vh * rnd(0.35, 0.9)), // ripple length
        w8: rnd(3.5, 8) * (Math.random() < 0.5 ? -1 : 1), // ripple speed / direction
        drift: rnd(-36, 36), // sideways drift (px/s)
        tilt: rnd(-0.07, 0.07), // slow lean (rad/s)
      });
    }
    // fine slices for a smooth curve, within a fixed draw budget
    slices = Math.max(24, Math.min(Math.ceil(vh / 9), Math.round((coarse ? 1000 : 2600) / strips.length)));
  }

  // one strip of paper falling: a drag-limited fall while a soft wave runs
  // down it, so it reads as a ribbon rather than a flat block
  function drawStrip(s, r) {
    const tf = Math.max(0, r - CUT_AT - CUT - s.delay) / 1000;
    if (tf <= 0) {
      ctx.drawImage(snapshot, s.x * dpr, 0, s.w * dpr, vh * dpr, s.x, 0, s.w, vh);
      return;
    }
    // v = vmax * (1 - e^(-t/τ))  →  y = vmax * (t - τ(1 - e^(-t/τ)))
    const y0 = s.vmax * (tf - s.tau * (1 - Math.exp(-tf / s.tau)));
    if (y0 > vh + 60) return;
    const curl = Math.min(1, tf * 1.8); // starts flat, ripples as it goes
    const hSeg = vh / slices;
    const amp = s.amp * curl;
    const phase = s.ph - tf * s.w8;
    const sh = Math.ceil(hSeg * dpr) + 1;
    ctx.save();
    // lean about the strip's top, drifting sideways as it falls
    ctx.translate(s.x + s.w / 2 + s.drift * tf, y0);
    ctx.rotate(s.tilt * tf);
    for (let j = 0; j < slices; j++) {
      const yl = j * hSeg;
      if (y0 + yl > vh + 40) break;
      const x = Math.sin((yl + hSeg / 2) * s.k + phase) * amp - s.w / 2;
      ctx.drawImage(snapshot, s.x * dpr, yl * dpr, s.w * dpr, sh, x, yl, s.w, hSeg + 0.75);
    }
    ctx.restore();
  }

  function phase(name) {
    if (phaseSent === name) return;
    phaseSent = name;
    post({ type: 'phase', name });
  }

  function frame(now) {
    handle = 0;
    if (stopped) return;
    if (t0 < 0) {
      t0 = now;
      last = now;
    }
    if (coarse && now - lastDraw < 15) {
      handle = raf(frame); // 120Hz phones: draw every other frame
      return;
    }
    lastDraw = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const elapsed = now - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (revealAt < 0) {
      const min = reduced ? 600 : MIN_SHOW;
      const allReady = (ready.load && ready.fonts && ready.oil) || elapsed > MAX_WAIT;
      const timed = Math.min(1, elapsed / (min - 150));
      const goal = allReady ? timed : Math.min(0.9, timed);
      shown += (goal - shown) * Math.min(1, dt * 7);
      if (goal === 1 && shown > 0.995) shown = 1;
      const pct = Math.round(shown * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        post({ type: 'progress', pct });
      }
      if (!coverOff && shown > 0.8) {
        coverOff = true;
        post({ type: 'cover-off' });
      }
      if (stepStrings(dt) || linesDirty) {
        lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lctx.clearRect(0, 0, vw, vh);
        drawDim(lctx);
        drawStrings(lctx);
        linesDirty = false;
      }
      const L = scene.layout(vw, vh);
      if (fullClear) {
        ctx.clearRect(0, 0, vw, vh);
        fullClear = false;
      } else {
        // only the band the cup and lines live in
        const top = L.artY - 4;
        ctx.clearRect(0, top, vw, L.barY + L.logoS - top);
      }
      scene.draw(ctx, L, { time: elapsed, progress: shown, dpr, reduced, labelAlpha: 0 });
      if (shown === 1 && elapsed >= min && !wantReveal) {
        wantReveal = true;
        post({ type: 'want-reveal' }); // the page answers with the logo's target
      }
    } else {
      const r = now - revealAt;
      if (!revealedSent) {
        revealedSent = true;
        post({ type: 'revealed' }); // the snapshot is on screen: drop the backdrop
      }
      ctx.clearRect(0, 0, vw, vh);
      if (reduced) {
        // no flight or shredding: a quick fade, then everything in place
        ctx.globalAlpha = 1 - clamp01(r / 300);
        ctx.drawImage(snapshot, 0, 0, vw, vh);
        ctx.globalAlpha = 1;
        if (r >= 300) return done();
      } else {
        for (const s of strips) drawStrip(s, r);
        // the blades running down the strings
        const cutP = clamp01((r - CUT_AT) / CUT);
        if (cutP > 0 && cutP < 1) {
          ctx.fillStyle = '#5ce1e6';
          const yb = easeInOut(cutP) * vh;
          for (let i = 1; i < strips.length; i++) ctx.fillRect(Math.round(strips[i].x) - 1, 0, 2, yb);
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
        if (r >= HERO_AT) phase('hero');
        else if (r >= HEADER_AT) phase('header');
        if (r >= Math.max(DONE_AT, CUT_AT + CUT + DROP + 300)) return done();
      }
    }
    handle = raf(frame);
  }

  function done() {
    stop();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    post({ type: 'done' });
  }

  function stop() {
    stopped = true;
    if (handle) unraf(handle);
    snapshot = null;
  }

  function handleMessage(m) {
    switch (m.type) {
      case 'resize':
        resize(m.vw, m.vh, m.dpr);
        break;
      case 'pointer':
        pointer(m.x, m.y);
        break;
      case 'leave':
        leave();
        break;
      case 'ready':
        ready[m.key] = true;
        break;
      case 'reveal':
        if (revealAt < 0) beginReveal(performance.now(), m.target, m.oil);
        break;
      case 'stop':
        stop();
        break;
      default:
    }
  }

  return {
    handle: handleMessage,
    start() {
      handle = raf(frame);
    },
  };
}
