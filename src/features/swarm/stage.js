// The "blank page" for the swarm, done in place on the real page.
//
// One stylesheet hides every element under #root with visibility:hidden —
// which keeps every box exactly where it is (no layout change) — except:
//   • scenery marked data-swarm-bg (the scene backgrounds stay on screen),
//   • things marked data-swarm-keep / data-swarm="skip" (Motion button, mascot),
//   • live zones marked data-swarm-live (the music card: usable at any moment),
//   • elements the swarm has built (data-swarm-shown).
// visibility is per element, so a built card shows its own background while
// the text inside it stays hidden until it's typed in.
//
// The stylesheet stays on for as long as Motion is on, so anything that mounts
// later (a new page after navigating) is hidden from its very first paint and
// gets built by the crew — it can never flash up first.
//
// Everything this file changes is tracked and put back exactly by restore().

const SHOWN = 'data-swarm-shown';
const ACTIVE = 'data-swarm-stage';

const CSS = `
html[${ACTIVE}] #root *:not([${SHOWN}], [data-swarm-bg], [data-swarm-keep], [data-swarm-keep] *, [data-swarm-live], [data-swarm-live] *, [data-swarm="skip"], [data-swarm-bg="deep"] *, svg *) {
  visibility: hidden !important;
}
html[${ACTIVE}] #root :is([${SHOWN}], [data-swarm-bg], [data-swarm-bg="deep"] *, [data-swarm-keep], [data-swarm-keep] *, [data-swarm-live], [data-swarm="skip"]) {
  visibility: visible;
}
`;
// ^ visibility inherits, so a built element inside a still-hidden parent needs an
// explicit "visible". Not !important on purpose: the page's own inline
// visibility:hidden (e.g. a background mid-crossfade) still wins.
// A live zone's insides are only exempted from hiding (not forced visible), so
// they keep following their own container — a closed music card stays hidden.

export function createStage() {
  let style = null;
  const shown = new Set();
  const clipped = new Map(); // element -> its original inline clip-path

  const mark = (el) => {
    if (shown.has(el)) return;
    shown.add(el);
    el.setAttribute(SHOWN, '');
  };

  return {
    hideAll() {
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('data-swarm-stage-style', '');
        style.textContent = CSS;
        document.head.appendChild(style);
      }
      document.documentElement.setAttribute(ACTIVE, '');
    },

    /** Built elements stay visible while the stage is active. */
    show: mark,

    isShown: (el) => shown.has(el),

    /** Temporarily clip an element (typing / scanning in). null restores it. */
    clip(el, value) {
      if (!clipped.has(el)) clipped.set(el, el.style.clipPath);
      if (value === null) {
        el.style.clipPath = clipped.get(el);
        clipped.delete(el);
      } else {
        el.style.clipPath = value;
      }
    },

    /** Show every remaining element whose box touches the given viewport band. */
    sweep(root, top, bottom) {
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        if (shown.has(el)) continue;
        // Live zones (the music card) manage their own visibility; marking their
        // insides would force them visible even while the card is closed.
        if (el.closest('[data-swarm-live]')) continue;
        if (top === -Infinity) {
          mark(el);
          continue;
        }
        const r = el.getBoundingClientRect();
        if (r.bottom >= top && r.top <= bottom) mark(el);
      }
    },

    restore() {
      document.documentElement.removeAttribute(ACTIVE);
      clipped.forEach((orig, el) => {
        el.style.clipPath = orig;
      });
      clipped.clear();
      shown.forEach((el) => el.removeAttribute(SHOWN));
      shown.clear();
      if (style) style.remove();
      style = null;
    },
  };
}
