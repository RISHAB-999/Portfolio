// Pixel-art port of the "coffee cup spinning and stretching from side to side"
// CSS loader (CodePen, MIT — public pens on CodePen are MIT licensed; credited
// in ./NOTICE.md). The geometry, keyframes and easing follow the original CSS
// exactly; instead of animating DOM boxes it draws each frame with vector
// shapes into a tiny canvas, snaps every pixel fully on or off, and the caller
// scales that up without smoothing — so it reads as pixel art at any size, and
// costs no layout work (the original animates width/left/box-shadow).
//
// Units are the original's `em`. The animation cycle is 0..1 (8s in the CSS).

const EM = 4; // art pixels per em
const W_EM = 21.5; // .coffee width (and the dashed line)
const PAD_X = 6.2; // room for the cup hanging past either end
const PAD_Y = 0.4;
export const ART_W = Math.ceil((W_EM + PAD_X * 2) * EM);
export const ART_H = Math.ceil((9 + PAD_Y * 2) * EM);
export const ART_EM = EM;
export const ART_LINE_X = PAD_X * EM; // where the line starts, in art pixels
export const ART_LINE_W = W_EM * EM;
export const ART_LINE_Y = (PAD_Y + 7.5) * EM;

// ── easing ──────────────────────────────────────────────────────────────────
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-5 || !d) break;
      t -= e / d;
    }
    t = Math.min(1, Math.max(0, t));
    return sy(t);
  };
}
// the cup's timing, as in the original: it holds still at each pose (fully
// stretched / gathered up) and then glides quickly to the next one
const snap = bezier(0.9, 0, 0.1, 1);
const easeIn = bezier(0.42, 0, 1, 1);
const easeOut = bezier(0, 0, 0.58, 1);
const ease = bezier(0.25, 0.1, 0.25, 1);

// value at cycle time t from [[time, value], ...] keyframes, eased per segment
function track(keys, t, easing) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, e0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
      const f = (e0 || easing)(Math.min(1, Math.max(0, k)));
      return v0 + (v1 - v0) * f;
    }
  }
  return keys[keys.length - 1][1];
}

// ── keyframes (straight from the CSS) ────────────────────────────────────────
const stretchKeys = (base) => [[0, base], [0.25, base + 21.5], [0.5, base], [0.75, base + 21.5], [1, base]];
const CUP_LEFT = [[0, 0], [0.25, 0], [0.5, 21.5], [0.75, 0], [1, 0]];
const HANDLE_LEFT = [[0, 5.925], [0.25, 14.275], [0.5, 0.525], [0.75, 14.275], [1, 5.925]];
const RIM_SHADOW = [[0, 1], [0.25, 1.5], [0.5, 1], [0.75, 1.5], [1, 1]];

// handle path: M + three cubic segments, made absolute so they can be morphed
const H_RIGHT = [64, 4.413, 64, 4.413, 70.64, 1.5, 75, 1.5, 86.739, 1.5, 94.5, 12.259, 94.5, 23.997, 94.5, 47.472, 49.5, 46.494, 49.5, 46.494];
const H_FLAT = [48.036, 4.415, 48.036, 4.415, 48.006, 1.502, 47.987, 1.502, 47.935, 1.502, 47.9, 12.261, 47.9, 23.999, 47.9, 47.474, 48.1, 46.496, 48.1, 46.496];
const H_LEFT = [32, 4.413, 32, 4.413, 25.36, 1.5, 21, 1.5, 9.261, 1.5, 1.5, 12.259, 1.5, 23.997, 1.5, 47.472, 46.5, 46.494, 46.5, 46.494];
// [time, shape, translateY, easing of the segment that starts here]
const HANDLE_KEYS = [[0, H_RIGHT, 0, easeIn], [0.1, H_FLAT, 15, easeOut], [0.4, H_FLAT, 15, easeOut], [0.5, H_LEFT, 0, easeIn], [0.6, H_FLAT, 15, easeOut], [0.9, H_FLAT, 15, easeOut], [1, H_RIGHT, 0]];

// steam (viewBox 56 → 3.5em), dash arrays and offsets from the CSS
const STEAM_LEFT = [
  ['M13.845,54s-5.62-10.115-4.496-16.859,6.83-11.497,8.992-17.983c1.037-3.11,.161-6.937-1.083-10.158', [24, 142]],
  ['M27.844,54s-5.652-10.174-4.522-16.957,6.869-11.564,9.043-18.087c2.261-6.783-4.522-16.957-4.522-16.957', [30, 8, 10, 130]],
  ['M40.434,50.999c-1.577-3.486-3.818-9.462-3.071-13.944,1.121-6.723,6.809-11.462,8.964-17.928,1.033-3.1,.161-6.916-1.08-10.127', [15, 6, 1, 134]],
];
const STEAM_RIGHT = [
  ['M19.845,54s-5.62-10.115-4.496-16.859,6.83-11.497,8.992-17.983c1.037-3.11,.161-6.937-1.083-10.158', [18, 6, 1, 90]],
  ['M34.434,44c-1.577-3.486-3.818-9.462-3.071-13.944,1.121-6.723,6.809-11.462,8.964-17.928,1.033-3.1,.161-6.916-1.08-10.127', [25, 6, 4, 76]],
];
const STEAM_LEFT_OFFSET = [[0, 48], [0.25, -66], [1, -66]];
const STEAM_RIGHT_OFFSET = [[0, 35], [0.5, 35], [0.75, -76], [1, -76]];

// pixel colours
const CUP = [92, 52, 30]; // dark espresso-brown outline
const COFFEE = [176, 112, 62]; // caramel-brown coffee
const STEAM = [240, 244, 250]; // white steam
const BLACK = [246, 239, 228]; // the cup's insides: warm cream porcelain

// ── drawing helpers (em units) ──────────────────────────────────────────────
// rounded rect with elliptical corners: (rxTop/ryTop) top corners, (rxBot/ryBot) bottom
function roundedEllipseRect(g, x, y, w, h, rxT, ryT, rxB, ryB) {
  const sT = Math.min(1, w / (2 * rxT || 1)); // CSS scales radii down to fit
  const sB = Math.min(1, w / (2 * rxB || 1));
  rxT *= sT;
  rxB *= sB;
  g.beginPath();
  g.moveTo(x + rxT, y);
  g.lineTo(x + w - rxT, y);
  g.ellipse(x + w - rxT, y + ryT, rxT, ryT, 0, -Math.PI / 2, 0);
  g.lineTo(x + w, y + h - ryB);
  g.ellipse(x + w - rxB, y + h - ryB, rxB, ryB, 0, 0, Math.PI / 2);
  g.lineTo(x + rxB, y + h);
  g.ellipse(x + rxB, y + h - ryB, rxB, ryB, 0, Math.PI / 2, Math.PI);
  g.lineTo(x, y + ryT);
  g.ellipse(x + rxT, y + ryT, rxT, ryT, 0, Math.PI, Math.PI * 1.5);
  g.closePath();
}

// a cup part: optional background fill, then an inset outline (like the CSS's
// inset box-shadow ring)
function part(g, x, y, w, h, radii, ring, fill) {
  roundedEllipseRect(g, x, y, w, h, ...radii);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  g.save();
  g.clip();
  g.lineWidth = Math.max(ring, 1.2 / EM) * 2;
  g.strokeStyle = '#fff';
  g.stroke();
  g.restore();
}

export function createCoffeeArt() {
  const canvas = document.createElement('canvas');
  canvas.width = ART_W;
  canvas.height = ART_H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const steamLeft = STEAM_LEFT.map(([d, dash]) => [new Path2D(d), dash]);
  const steamRight = STEAM_RIGHT.map(([d, dash]) => [new Path2D(d), dash]);
  const handle = new Array(20);

  function drawHandle(t, hx) {
    let i = 0;
    while (i < HANDLE_KEYS.length - 2 && t > HANDLE_KEYS[i + 1][0]) i++;
    const [t0, a, ya, e] = HANDLE_KEYS[i];
    const [t1, b, yb] = HANDLE_KEYS[i + 1];
    const k = e(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    for (let j = 0; j < 20; j++) handle[j] = a[j] + (b[j] - a[j]) * k;
    const ty = ya + (yb - ya) * k;
    g.save();
    // svg box at (hx, 4.1em), 4.8em wide for a 96-unit viewBox
    g.translate(hx, 4.1);
    g.scale(0.05, 0.05);
    g.translate(0, ty);
    g.beginPath();
    g.moveTo(handle[0], handle[1]);
    for (let s = 2; s < 20; s += 6) g.bezierCurveTo(handle[s], handle[s + 1], handle[s + 2], handle[s + 3], handle[s + 4], handle[s + 5]);
    g.lineWidth = 1.25 / EM / 0.05;
    g.lineCap = 'round';
    g.strokeStyle = '#fff';
    g.stroke();
    g.restore();
  }

  function drawSteam(paths, cx, offset) {
    g.save();
    g.translate(cx - 1.75, 0); // 3.5em box centred on cx
    g.scale(0.0625, 0.0625);
    g.lineWidth = 1.2 / EM / 0.0625;
    g.lineCap = 'round';
    g.strokeStyle = '#f00'; // marker colour: becomes white steam in the pixel snap
    for (const [path, dash] of paths) {
      g.setLineDash(dash);
      g.lineDashOffset = offset;
      g.stroke(path);
    }
    g.restore();
  }

  /**
   * @param {number} t     cup animation time, 0..1 of the 8s cycle
   * @param {number} steamT steam animation time (may run ahead of the cup)
   */
  function draw(t, steamT = t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, ART_W, ART_H);
    g.setTransform(EM, 0, 0, EM, PAD_X * EM, PAD_Y * EM); // origin = .coffee top-left, units = em

    // (the dashed line itself is drawn by the caller, since it shows progress)

    // steam
    drawSteam(steamLeft, 0, track(STEAM_LEFT_OFFSET, steamT, ease));
    drawSteam(steamRight, W_EM, track(STEAM_RIGHT_OFFSET, steamT, ease));

    // the cup box: 11.25em wide, translateX(-50%), positioned by `left`
    const cupX = track(CUP_LEFT, t, snap) - 5.625;
    const bg = '#000';
    const wa = track(stretchKeys(11.25), t, snap);
    const wc = track(stretchKeys(3.4), t, snap);
    const wd = track(stretchKeys(7.2), t, snap);
    const we = track(stretchKeys(7), t, snap);
    const hx = cupX + track(HANDLE_LEFT, t, snap);
    const handleBehind = t <= 0.5; // z-index flips at 50.01%

    g.save();
    g.translate(cupX, 0);
    part(g, 0, 4.3, wa, 4.7, [5.625, 2, 5.625, 2.7], 0.3, bg); // saucer
    part(g, 0, 4.3, wa, 4, [5.625, 2, 5.625, 2], 0.2, null); // saucer rim
    part(g, 3.925, 7.1, wc, 0.9, [1.7, 0.45, 1.7, 0.45], 0.2, bg); // foot
    g.restore();
    if (handleBehind) drawHandle(t, hx);
    g.save();
    g.translate(cupX, 0);
    part(g, 2.025, 2.55, wd, 5.15, [3.6, 1, 3.3, 3.5], 0.2, bg); // bowl
    // rim: light coffee surface with the dark band from the inset shadow on top
    roundedEllipseRect(g, 2.125, 2.65, we, 2, 3.5, 1, 3.5, 1);
    g.save();
    g.clip();
    g.fillStyle = bg;
    g.fill();
    const off = track(RIM_SHADOW, t, snap);
    roundedEllipseRect(g, 2.125, 2.65 + off, we, 2, 3.5, 1, 3.5, 1);
    g.fillStyle = '#00f'; // marker colour: becomes the coffee in the pixel snap
    g.fill();
    g.restore();
    part(g, 2.125, 2.65, we, 2, [3.5, 1, 3.5, 1], 0.2, null);
    g.restore();
    if (!handleBehind) drawHandle(t, hx);

    // snap to hard pixels: each art pixel is either fully lit or empty, and is
    // coloured by what drew it (white lines = the cup, red = steam, blue = coffee)
    const img = g.getImageData(0, 0, ART_W, ART_H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gr = d[i + 1], b = d[i + 2];
      // the cup's insides (drawn black) become cream and hide the line behind
      const col = d[i + 3] <= 100 ? null : r > 120 && gr > 120 ? CUP : r > 120 ? STEAM : b > 120 ? COFFEE : BLACK;
      if (col) {
        d[i] = col[0];
        d[i + 1] = col[1];
        d[i + 2] = col[2];
        d[i + 3] = 255;
      } else d[i + 3] = 0;
    }
    g.putImageData(img, 0, 0);
    return canvas;
  }

  return { draw };
}
