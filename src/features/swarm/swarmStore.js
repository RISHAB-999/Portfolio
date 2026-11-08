// Tiny external store for the Motion toggle. Keeps the on/off state outside
// React so toggling only re-renders the Motion button(s), and lazy-loads the
// engine the first time it's needed (or when the button is hovered/focused).

let active = false;
let engine = null;
let enginePromise = null;
const subscribers = new Set();

const emit = () => subscribers.forEach((fn) => fn());

// Motion survives a reload in the same tab (sessionStorage), so reloading while
// it's on brings Motion back (with its own intro) instead of the first-visit
// loading screen.
const KEY = 'portfolio_motion_on';
export function motionWasOn() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
function remember(on) {
  try {
    if (on) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: Motion just won't survive a reload */
  }
}

function loadEngine() {
  if (!enginePromise) {
    enginePromise = import('./swarmEngine').catch((err) => {
      enginePromise = null; // allow a retry after a failed chunk load
      throw err;
    });
  }
  return enginePromise;
}

async function setActive(next) {
  if (next === active) return;
  // not while the first-visit loading screen is still up (it has its own intro)
  if (next && document.documentElement.hasAttribute('data-boot')) return;
  active = next;
  remember(next);
  emit();
  if (!next) {
    engine?.stop();
    return;
  }
  try {
    const { createSwarm } = await loadEngine();
    if (!active) return; // switched off while the chunk was loading
    engine = engine || createSwarm({ onRequestStop: () => setActive(false) });
    engine.start();
  } catch (err) {
    console.warn('Motion effect failed to load:', err);
    active = false;
    remember(false);
    emit();
  }
}

export const swarmStore = {
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
  getSnapshot: () => active,
  getServerSnapshot: () => false,
  toggle: () => setActive(!active),
  setActive,
  preload: () => {
    loadEngine().catch(() => {});
  },
};
