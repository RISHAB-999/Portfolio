import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// Content-Security-Policy for the production build. GitHub Pages can't send
// custom response headers, so it ships as a <meta> tag. Build-only on purpose:
// the Vite dev server relies on inline scripts that this policy blocks.
// If you add a new third-party service, add its origin to the right directive.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // 'unsafe-inline' for styles only: React/framer-motion set inline style values.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self' https://api.emailjs.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityMeta = () => ({
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    securityMeta(),
    // Recompress raster images + minify SVGs at build time (sources untouched).
    // GIFs are excluded on purpose — they're animated (page backgrounds + the
    // Kirby mascot) and sharp would flatten them to a single frame.
    ViteImageOptimizer({
      test: /\.(jpe?g|png|svg|webp|avif|tiff)$/i,
      png: { quality: 70 },
      jpeg: { quality: 70 },
      jpg: { quality: 70 },
      webp: { quality: 70 },
    }),
  ],
  // Served from https://RISHAB-999.github.io/Portfolio/.
  // When you move to a custom domain (served at the root), change this single line to "/".
  base: "/Portfolio/",
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing libraries into their own long-cache chunks so
        // app-code deploys don't invalidate them, and the big animation lib
        // downloads in parallel with the app bundle.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
