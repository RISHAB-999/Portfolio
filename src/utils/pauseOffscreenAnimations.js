// Pauses small looping CSS animations (the header's twinkling stars, blinking
// text cursors, pulse/ping dots) while they're off screen, and resumes them the
// moment they scroll back into view. Chrome runs these on the main thread, so
// left running they cost a style recalculation on every frame — measured at
// roughly half of all style work while scrolling — even when nobody can see them.
// Nothing changes visually: a paused animation is only ever paused off screen.

const SELECTOR = '[data-twinkle-field], .cursor-blink, .animate-pulse, .animate-ping';
const PAUSED = 'anim-offscreen'; // index.css: animation-play-state: paused

export function pauseOffscreenAnimations(root = document.body) {
  if (typeof IntersectionObserver !== 'function') return () => {};

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle(PAUSED, !e.isIntersecting);
  }, { rootMargin: '64px' });

  const watched = new WeakSet();
  const watch = (el) => {
    if (watched.has(el)) return;
    watched.add(el);
    io.observe(el);
  };
  const scan = (node) => {
    if (node.nodeType !== 1) return;
    if (node.matches(SELECTOR)) watch(node);
    node.querySelectorAll?.(SELECTOR).forEach(watch);
  };
  scan(root);

  // pages mount and unmount on navigation: pick up new ones (only added
  // element subtrees are inspected, so frequent text updates cost nothing)
  const mo = new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) scan(n);
  });
  mo.observe(root, { childList: true, subtree: true });

  return () => {
    mo.disconnect();
    io.disconnect();
  };
}
