// Runs the first-visit loading screen off the main thread: the page hands over
// its two canvases (OffscreenCanvas), then forwards pointer moves, readiness and
// the reveal; this worker draws every frame on its own clock, so the animation
// stays smooth while the page is busy loading.
import { createBootRenderer } from './bootRenderer';

let renderer = null;

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'init') {
    renderer = createBootRenderer({
      canvas: m.canvas,
      linesCanvas: m.linesCanvas,
      reduced: m.reduced,
      coarse: m.coarse,
      post: (msg) => self.postMessage(msg),
    });
    renderer.handle({ type: 'resize', vw: m.vw, vh: m.vh, dpr: m.dpr });
    renderer.start();
    return;
  }
  renderer?.handle(m);
};
