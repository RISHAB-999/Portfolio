// The loading scene shared by the two loading screens — the Motion intro (in
// swarmEngine.js) and the first-visit boot screen (features/boot): the pixel
// coffee cup sliding along its dashed line, a loading line underneath with the
// site logo riding its tip, and the LOADING label. Each screen paints its own
// backdrop (stars / piano lines) and calls draw() on top.

import logoUrl from '../../assets/Rishablogo_pixel_art.png';
import { createCoffeeArt, ART_W, ART_H, ART_LINE_X, ART_LINE_W, ART_LINE_Y } from './coffeeLoader';

export const COFFEE_CYCLE = 7000; // one full loop of the coffee cup (the original is 8s)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createLoaderScene() {
  let coffee = null;
  // the site's own pixel-art logo; the navbar shows the same file, so it is
  // usually already cached
  let logo = null;
  let logoSized = null;

  function loadLogo() {
    if (logo || typeof Image === 'undefined') return;
    logo = new Image();
    logo.decoding = 'async';
    logo.src = logoUrl;
  }

  // the 1024px logo, scaled once to the size it is shown at (not every frame)
  function logoSprite(size) {
    if (!logo || !logo.complete || !logo.naturalWidth || size < 1) return null;
    if (!logoSized || logoSized.width !== size) {
      logoSized = document.createElement('canvas');
      logoSized.width = logoSized.height = size;
      const g = logoSized.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(logo, 0, 0, size, size);
    }
    return logoSized;
  }

  function layout(vw, vh) {
    const k = clamp(Math.min(vw, vh) / 760, 0.7, 1.15);
    // size of one art pixel on screen; never wider than the screen allows
    const px = Math.max(2, Math.min(Math.round(4 * k), Math.floor((vw - 32) / ART_W)));
    const cx = vw / 2;
    // stack, top to bottom: cup on its dashed line, loading line (with the
    // site logo riding its tip), label
    const logoS = Math.round(30 * k);
    const artH = ART_H * px;
    const gapBar = Math.round(26 * k);
    const below = Math.round(80 * k);
    const top = Math.round(vh / 2 - (artH + gapBar + below) / 2);
    const artX = Math.round(cx - (ART_W * px) / 2);
    const artY = top;
    const lineW = ART_LINE_W * px;
    const lineX = artX + ART_LINE_X * px;
    const lineY = artY + ART_LINE_Y * px;
    const barY = artY + artH + gapBar;
    const cy = artY + artH / 2;
    return { k, px, cx, cy, artX, artY, cupCx: cx, cupCy: cy, lineW, lineX, lineY, barY, logoS };
  }

  // where the logo sits for a given progress (centre + size)
  function logoAt(L, progress) {
    const lit = Math.round((progress * L.lineW) / L.px) * L.px;
    return { x: L.lineX + lit, y: L.barY + L.px / 2, size: L.logoS };
  }

  /**
   * @param ctx      2d context (already scaled to CSS pixels)
   * @param L        layout()
   * @param o.time   ms since the screen opened (drives the cup)
   * @param o.progress 0..1
   * @param o.labelAlpha  opacity of LOADING / %
   * @param o.logo   false to leave the logo out (e.g. while it flies away)
   */
  function draw(ctx, L, { time, progress, dpr = 1, reduced = false, labelAlpha = 1, logo: withLogo = true }) {
    const { k, px } = L;
    // the cup's dashed line, then the cup in front of it
    ctx.fillStyle = '#eaf2ff';
    for (let x = 0; x < L.lineW; x += px * 4) ctx.fillRect(L.lineX + x, L.lineY, px * 2, px);
    if (!coffee) coffee = createCoffeeArt();
    const t = reduced ? 0 : (time / COFFEE_CYCLE) % 1;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(coffee.draw(t), L.artX, L.artY, ART_W * px, ART_H * px);
    ctx.imageSmoothingEnabled = true;

    // the loading line underneath: a straight pixel line filling left → right
    const tip = logoAt(L, progress);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(L.lineX, L.barY, L.lineW, px);
    ctx.fillStyle = '#eaf2ff';
    ctx.fillRect(L.lineX, L.barY, tip.x - L.lineX, px);
    if (withLogo) drawLogo(ctx, tip.x, tip.y, tip.size, dpr);

    // label + percentage
    if (labelAlpha > 0) {
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * labelAlpha;
      ctx.textAlign = 'center';
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(5 * k)}px`;
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = `500 ${Math.round(12 * k)}px "Pixelify Sans", ui-monospace, monospace`;
      ctx.fillText('LOADING', L.cx + 2 * k, L.barY + 52 * k);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
      ctx.fillStyle = 'rgba(92,225,230,0.75)';
      ctx.font = `500 ${Math.round(10 * k)}px ui-monospace, "Source Code Pro", monospace`;
      ctx.fillText(`${Math.round(progress * 100)}%`, L.cx, L.barY + 70 * k);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.globalAlpha = a0;
    }
  }

  function drawLogo(ctx, x, y, size, dpr = 1) {
    // one cached sprite (big enough for the navbar size) scaled per frame, so a
    // logo that grows as it flies doesn't re-scale the 1024px source each frame
    const img = logoSprite(Math.round((size <= 64 ? 64 : 320) * Math.min(dpr, 2)));
    if (img) ctx.drawImage(img, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  }

  return { layout, draw, drawLogo, logoAt, loadLogo };
}
