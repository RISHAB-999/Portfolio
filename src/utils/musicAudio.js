// One shared audio element for the whole site.
//
// The music player renders in two places (desktop HUD, mobile menu) and either
// can unmount when the viewport crosses 768px. Keeping the <audio> and its
// listeners here, outside React, guarantees a single audio instance, a single
// set of listeners, and playback that survives those remounts. Components read
// coarse state (playing / track / volume) via useSyncExternalStore and only the
// open music card subscribes to time updates.

import { playlist } from '../components/playlistData';

const VOLUME_KEY = 'portfolio_music_volume';

const readVolume = () => {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    const v = raw === null ? 0.5 : parseFloat(raw);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
  } catch {
    return 0.5;
  }
};

let audio = null;
let snapshot = {
  isPlaying: false,
  needsClickToPlay: false,
  trackIndex: 0,
  volume: readVolume(),
};
const subscribers = new Set();
let autoplayTried = false;
let gestureArmed = false;
let errorSkips = 0;

function set(patch) {
  let changed = false;
  for (const k in patch) if (snapshot[k] !== patch[k]) changed = true;
  if (!changed) return;
  snapshot = { ...snapshot, ...patch };
  subscribers.forEach((fn) => fn());
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'none'; // nothing is downloaded until playback is requested
  audio.src = playlist[snapshot.trackIndex].src;
  audio.volume = snapshot.volume;
  audio.addEventListener('play', () => set({ isPlaying: true, needsClickToPlay: false }));
  audio.addEventListener('pause', () => set({ isPlaying: false }));
  audio.addEventListener('playing', () => {
    errorSkips = 0;
  });
  audio.addEventListener('ended', () => setTrack(snapshot.trackIndex + 1));
  audio.addEventListener('error', () => {
    // A track failed to load/decode: skip to the next one, but never loop forever.
    console.warn('Music track failed to load:', playlist[snapshot.trackIndex]?.title);
    set({ isPlaying: false });
    if (errorSkips < playlist.length - 1) {
      errorSkips++;
      setTrack(snapshot.trackIndex + 1);
    }
  });
  return audio;
}

// Browsers block autoplay until the visitor interacts. Arm a one-shot unlock on
// the first click/tap/key anywhere (buttons handle themselves).
function armGestureUnlock() {
  if (gestureArmed) return;
  gestureArmed = true;
  // pointerup/click count as user activation on touch screens; pointerdown/keydown on desktop.
  const events = ['pointerdown', 'pointerup', 'click', 'keydown'];
  const onGesture = (e) => {
    if (e?.target?.closest?.('button')) return;
    if (document.documentElement.dataset.boot === 'loading') return; // not before 100%
    play().then((ok) => {
      if (!ok) return;
      events.forEach((t) => window.removeEventListener(t, onGesture, true));
      gestureArmed = false;
    });
  };
  events.forEach((t) => window.addEventListener(t, onGesture, true));
}

export function play() {
  const a = ensureAudio();
  return a.play().then(
    () => true,
    (err) => {
      if (err && err.name === 'NotAllowedError') {
        set({ isPlaying: false, needsClickToPlay: true });
        armGestureUnlock();
      } else if (err && err.name !== 'AbortError') {
        console.warn('Music playback failed:', err);
        set({ isPlaying: false });
      }
      return false;
    }
  );
}

export function pause() {
  audio?.pause();
}

export function toggle() {
  if (snapshot.isPlaying) pause();
  else play();
}

export function setTrack(index) {
  const total = playlist.length;
  const next = ((index % total) + total) % total;
  const a = ensureAudio();
  set({ trackIndex: next });
  a.src = playlist[next].src;
  play();
}

export function setVolume(value) {
  const v = Math.min(1, Math.max(0, value));
  set({ volume: v });
  if (audio) audio.volume = v;
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    /* storage unavailable (private mode) — volume still applies this session */
  }
}

export function seek(seconds) {
  if (audio && Number.isFinite(seconds)) audio.currentTime = seconds;
}

/**
 * Try to autoplay once per page load (falls back to "click anywhere"). While
 * the first-visit loading screen is up, wait until it reaches 100%.
 */
export function initAutoplay() {
  if (autoplayTried) return;
  autoplayTried = true;
  if (document.documentElement.hasAttribute('data-boot')) {
    window.addEventListener('bootreveal', () => play(), { once: true });
    return;
  }
  play();
}

/** Subscribe to playback position; used only while the music card is open. */
export function subscribeTime(fn) {
  const a = ensureAudio();
  const onTime = () => fn(a.currentTime, a.duration || 0);
  a.addEventListener('timeupdate', onTime);
  a.addEventListener('loadedmetadata', onTime);
  a.addEventListener('durationchange', onTime);
  onTime();
  return () => {
    a.removeEventListener('timeupdate', onTime);
    a.removeEventListener('loadedmetadata', onTime);
    a.removeEventListener('durationchange', onTime);
  };
}

export const musicStore = {
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
  getSnapshot: () => snapshot,
};
