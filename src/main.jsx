import React, { startTransition } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { startBootLoader, isHomeRoute } from './features/boot/bootLoader';
import { swarmStore, motionWasOn } from './features/swarm/swarmStore';

// Clickjacking defence. GitHub Pages can't send X-Frame-Options or a CSP
// frame-ancestors header (and frame-ancestors is ignored in <meta> CSP), so if
// another site frames this page we try to break out, and otherwise never
// render the UI inside the frame.
const framed = (() => {
  try {
    return window.top !== window.self;
  } catch {
    return true; // cross-origin parent: definitely framed
  }
})();

if (framed) {
  try {
    window.top.location.replace(window.location.href);
  } catch {
    /* sandboxed frame without top-navigation: just stay blank */
  }
} else {
  // Pixel fonts, attached without blocking first paint (replaces the old inline
  // onload="" trick in index.html, which the build's CSP would block).
  // media="print" keeps it from ever holding up the first paint; switch to
  // "all" once it has loaded (same trick as before, now CSP-compatible).
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.media = 'print';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=VT323&display=swap';
  fonts.addEventListener('load', () => {
    fonts.media = 'all';
  }, { once: true });
  document.head.appendChild(fonts);

  // First-visit loading screen — only when the site opens on the home page,
  // and not on a reload while Motion was on (Motion comes back instead, with
  // its own loading screen).
  const resumeMotion = motionWasOn();
  if (isHomeRoute() && !resumeMotion) startBootLoader();

  // Mounting the whole site is the biggest single job at startup. As a
  // transition, React renders it in small slices, so the loading screen keeps
  // animating smoothly (on phones especially) instead of freezing for it.
  const root = ReactDOM.createRoot(document.getElementById('root'));
  startTransition(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });

  if (resumeMotion) setTimeout(() => swarmStore.setActive(true), 0);
}
