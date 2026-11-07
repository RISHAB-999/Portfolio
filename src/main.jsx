import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { startBootLoader, isHomeRoute } from './features/boot/bootLoader';

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

  // First-visit loading screen — only when the site opens on the home page.
  if (isHomeRoute()) startBootLoader();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
