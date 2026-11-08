// First-visit loading screen (shown when the site is opened or reloaded on the
// home page; never by the Motion button, which has its own intro).
//
//   loading  the oil-refinery pixel scene (oil.gif, shrunk to a light copy),
//            dimmed, with a soft glow under the cursor and "piano strings" the
//            cursor catches, drags into a soft bend and lets slip, behind the
//            same pixel coffee cup + loading line as the Motion intro.
//   100%     music may start; the logo leaves the tip of the loading line and
//            comes out of the screen towards you, then settles into the header;
//            the screen is cut along the strings and the strips fall away like
//            paper, revealing the page; the header slides open to the right
//            from the logo; the name comes out of the screen, then the rest of
//            the hero fades in.
//
// All the drawing happens in bootRenderer.js — inside a Web Worker with an
// OffscreenCanvas when the browser allows it, so the animation stays smooth
// while the page is busy loading (the main reason it used to stutter on
// phones), otherwise right here on the page. This file does the page side:
// the backdrop picture, the LOADING label, forwarding pointer moves and page
// readiness, and the page-side steps of the reveal, which are plain CSS keyed
// off <html data-boot="…"> (see index.css).

import { createLoaderScene } from '../swarm/loaderScene';
import { createBootRenderer } from './bootRenderer';
import oilUrl from '../../assets/oil-boot.gif';

export function isHomeRoute() {
  const h = window.location.hash;
  return h === '' || h === '#' || h === '#/' || h === '#/home' || h.startsWith('#/?') || h.startsWith('#/home?');
}

const offscreenWorks = () => {
  try {
    return (
      typeof Worker === 'function'
      && typeof OffscreenCanvas === 'function'
      && 'transferControlToOffscreen' in HTMLCanvasElement.prototype
      && !!new OffscreenCanvas(1, 1).getContext('2d')
    );
  } catch {
    return false;
  }
};

export function startBootLoader() {
  const root = document.documentElement;
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // phones: fewer pixels, at most 60fps, a smaller budget for the paper strips
  const coarse = !!window.matchMedia?.('(pointer: coarse)').matches;
  root.dataset.boot = 'loading';
  // The page doesn't paint at all while it's fully covered (index.css); it's
  // uncovered shortly before 100% so the site can warm up behind the loader.
  root.dataset.bootCover = '';

  // backdrop: black until the (small, pixel-art) gif is ready, then the scene
  const back = document.createElement('div');
  back.setAttribute('aria-hidden', 'true');
  back.style.cssText = 'position:fixed;inset:0;z-index:2147483599;background:#000;';
  const oil = new Image();
  oil.decoding = 'async';
  oil.alt = '';
  oil.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:0;transition:opacity .5s ease;';
  back.appendChild(oil);
  document.body.appendChild(back);

  // two layers: the dimmed strings (redrawn only while something on them moves)
  // and, above them, the cup + loading line
  const makeLayer = (z) => {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:fixed;inset:0;width:100vw;height:100vh;z-index:${z};pointer-events:none;touch-action:none;`;
    document.body.appendChild(c);
    return c;
  };
  let linesCanvas = makeLayer(2147483600);
  let canvas = makeLayer(2147483601);
  canvas.dataset.bootLayer = '';
  canvas.style.pointerEvents = 'auto';

  // the LOADING label and percentage, as text so they use the site's pixel font
  const label = document.createElement('div');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:0;top:0;width:100vw;z-index:2147483602;pointer-events:none;text-align:center;transition:opacity .2s ease;opacity:0;';
  const word = document.createElement('div');
  word.textContent = 'LOADING';
  word.style.cssText = 'position:absolute;left:0;right:0;color:rgba(255,255,255,0.86);font-family:"Pixelify Sans",ui-monospace,monospace;font-weight:500;line-height:1;white-space:nowrap;';
  const pctEl = document.createElement('div');
  pctEl.textContent = '0%';
  pctEl.style.cssText = 'position:absolute;left:0;right:0;color:rgba(92,225,230,0.75);font-family:ui-monospace,"Source Code Pro",monospace;font-weight:500;line-height:1;letter-spacing:1px;';
  label.append(word, pctEl);
  document.body.appendChild(label);
  const layoutOnly = createLoaderScene();
  const placeLabel = () => {
    const L = layoutOnly.layout(window.innerWidth, window.innerHeight);
    const f1 = Math.round(12 * L.k);
    const f2 = Math.round(10 * L.k);
    word.style.fontSize = `${f1}px`;
    word.style.letterSpacing = `${Math.round(5 * L.k)}px`;
    word.style.textIndent = `${Math.round(5 * L.k) + Math.round(4 * L.k)}px`; // re-centre past the trailing spacing
    word.style.top = `${Math.round(L.barY + 52 * L.k - f1 * 0.85)}px`;
    pctEl.style.fontSize = `${f2}px`;
    pctEl.style.top = `${Math.round(L.barY + 70 * L.k - f2 * 0.85)}px`;
  };
  placeLabel();
  requestAnimationFrame(() => { label.style.opacity = '1'; });

  // an accessible status while it loads
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
  status.textContent = 'Loading…';
  document.body.appendChild(status);

  const size = () => ({
    vw: window.innerWidth,
    vh: window.innerHeight,
    // at most ~4M canvas pixels (a 4K-class backing store is too heavy here)
    dpr: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2, Math.sqrt(4e6 / Math.max(1, window.innerWidth * window.innerHeight))),
  });

  // ── the renderer: in a worker if possible, otherwise on the page ───────────
  let worker = null;
  let renderer = null;
  let finished = false;
  let revealFired = false;
  const fireReveal = () => {
    if (revealFired) return;
    revealFired = true;
    window.dispatchEvent(new Event('bootreveal')); // music may start now
  };
  const send = (m, transfer) => {
    if (worker) worker.postMessage(m, transfer || []);
    else renderer?.handle(m);
  };

  function runInline() {
    renderer = createBootRenderer({ canvas, linesCanvas, reduced, coarse, post: onMessage });
    const s = size();
    renderer.handle({ type: 'resize', ...s });
    renderer.start();
  }

  if (offscreenWorks()) {
    try {
      worker = new Worker(new URL('./bootWorker.js', import.meta.url), { type: 'module' });
      const s = size();
      const off = canvas.transferControlToOffscreen();
      const offLines = linesCanvas.transferControlToOffscreen();
      worker.onmessage = (e) => onMessage(e.data);
      worker.onerror = () => {
        // the worker couldn't run: start over on the page with fresh canvases
        worker?.terminate();
        worker = null;
        canvas.remove();
        linesCanvas.remove();
        linesCanvas = makeLayer(2147483600);
        canvas = makeLayer(2147483601);
        canvas.dataset.bootLayer = '';
        canvas.style.pointerEvents = 'auto';
        if (!finished) runInline();
      };
      worker.postMessage({ type: 'init', canvas: off, linesCanvas: offLines, reduced, coarse, ...s }, [off, offLines]);
    } catch {
      worker = null;
      runInline();
    }
  } else {
    runInline();
  }

  // ── page → renderer ────────────────────────────────────────────────────────
  const onResize = () => {
    send({ type: 'resize', ...size() });
    placeLabel();
  };
  const onMove = (e) => send({ type: 'pointer', x: e.clientX, y: e.clientY });
  const onLeave = () => send({ type: 'leave' });
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  const markReady = (key) => send({ type: 'ready', key });
  const onLoad = () => markReady('load');
  if (document.readyState === 'complete') markReady('load');
  else window.addEventListener('load', onLoad, { once: true });
  if (document.fonts) document.fonts.ready.then(() => markReady('fonts'));
  else markReady('fonts');
  const onOil = () => {
    oil.style.opacity = '1';
    markReady('oil');
  };
  oil.addEventListener('load', onOil, { once: true });
  oil.addEventListener('error', () => markReady('oil'), { once: true });
  oil.src = oilUrl;

  // ── renderer → page ────────────────────────────────────────────────────────
  function logoTarget() {
    const el = document.querySelector('[data-brand-logo]');
    const r = el?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: Math.min(r.width, r.height) };
  }

  async function answerReveal() {
    let bmp = null;
    try {
      if (oil.complete && oil.naturalWidth) bmp = await createImageBitmap(oil);
    } catch {
      bmp = null;
    }
    if (finished) return;
    send({ type: 'reveal', target: logoTarget(), oil: bmp }, bmp && worker ? [bmp] : []);
  }

  function onMessage(m) {
    switch (m.type) {
      case 'progress':
        pctEl.textContent = `${m.pct}%`;
        break;
      case 'cover-off':
        delete root.dataset.bootCover;
        break;
      case 'want-reveal':
        delete root.dataset.bootCover;
        answerReveal();
        break;
      case 'revealed':
        // the renderer's snapshot is on screen: drop the backdrop and label
        status.textContent = 'Loaded';
        canvas.style.pointerEvents = 'none';
        back.remove();
        label.style.opacity = '0';
        fireReveal();
        break;
      case 'phase':
        if (root.dataset.boot !== m.name) root.dataset.boot = m.name;
        break;
      case 'done':
        finish();
        break;
      default:
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    send({ type: 'stop' });
    worker?.terminate();
    worker = null;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    window.removeEventListener('load', onLoad);
    back.remove();
    canvas.remove();
    linesCanvas.remove();
    label.remove();
    status.remove();
    delete root.dataset.boot;
    delete root.dataset.bootCover;
    fireReveal();
    window.dispatchEvent(new Event('bootdone'));
  }

  return finish;
}
