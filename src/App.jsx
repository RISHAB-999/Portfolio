import { useRef, useEffect, useLayoutEffect, useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import styles from './style';
import './index.css';

import Home from './pages/Home';
import { Navbar, Footer, PostFooterHome, CaveStalactites, MusicPlayer } from './components';
import { kirbyfloating, rocks, grass, caveBG } from './assets';
import { pageConfig, DEFAULT_PAGE, location as siteLocation } from './data/siteConfig';
import cursor1 from './assets/cursor1_small.png';
import cursor2 from './assets/cursor2_small.png';
import cursor3 from './assets/cursor3_small.png';

// Route components are code-split so each page's JS loads only when visited.
// Home stays eager since it's the landing route.
const About = lazy(() => import('./pages/About'));
const Projects = lazy(() => import('./pages/Projects'));
const Experience = lazy(() => import('./pages/Experience'));
const Contact = lazy(() => import('./pages/Contact'));
const Page404 = lazy(() => import('./pages/Page404'));
const Resume = lazy(() => import('./pages/Resume'));

// Flickering stars scattered across the header. Positions are fixed (so they
// don't reshuffle); each twinkles on its own duration/delay. Module-scoped so
// the array isn't rebuilt on every render.
const headerStars = [
  { left: '5%',  top: '22%', size: 2, dur: '2.6s', delay: '0s',   color: '#eaf2ff' },
  { left: '12%', top: '58%', size: 2, dur: '3.2s', delay: '0.7s', color: '#bfe9ff' },
  { left: '20%', top: '34%', size: 3, dur: '2.2s', delay: '1.1s', color: '#eaf2ff' },
  { left: '29%', top: '64%', size: 2, dur: '3.6s', delay: '0.3s', color: '#cdebff' },
  { left: '37%', top: '26%', size: 2, dur: '2.8s', delay: '1.4s', color: '#eaf2ff' },
  { left: '46%', top: '52%', size: 3, dur: '3.0s', delay: '0.2s', color: '#bfe9ff' },
  { left: '54%', top: '30%', size: 2, dur: '2.4s', delay: '0.9s', color: '#eaf2ff' },
  { left: '62%', top: '60%', size: 2, dur: '3.4s', delay: '1.6s', color: '#cdebff' },
  { left: '70%', top: '36%', size: 2, dur: '2.6s', delay: '0.5s', color: '#eaf2ff' },
  { left: '78%', top: '56%', size: 3, dur: '3.1s', delay: '1.2s', color: '#bfe9ff' },
  { left: '86%', top: '24%', size: 2, dur: '2.9s', delay: '0.1s', color: '#eaf2ff' },
  { left: '94%', top: '50%', size: 2, dur: '3.3s', delay: '0.8s', color: '#cdebff' },
];



const AppContent = () => {

  const location = useLocation();
  // Per-route appearance comes from a single config map (see data/siteConfig.js).
  const { background: backgroundImage, showOverlay, darken, isHome: isHomePage } =
    pageConfig[location.pathname] ?? DEFAULT_PAGE;
  const isResumePage = location.pathname === '/resume';

  const postFooterRef = useRef(null);

  // Only mount the current background + a fading-out previous one (crossfade).
  // This avoids decoding ALL heavy GIF backgrounds (~10MB+) simultaneously.
  const prevBgRef = useRef(backgroundImage);
  const bgTimerRef = useRef(null);
  const [mountedBgs, setMountedBgs] = useState([backgroundImage]);

  useEffect(() => {
    if (backgroundImage === prevBgRef.current) return;
    prevBgRef.current = backgroundImage;
    // Mount both for crossfade
    setMountedBgs((prev) => [...new Set([...prev, backgroundImage])]);
    // After CSS transition (500ms) + buffer, unmount old backgrounds
    if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
    bgTimerRef.current = setTimeout(() => {
      setMountedBgs([backgroundImage]);
    }, 600);
    return () => {
      if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
    };
  }, [backgroundImage]);

  // Kirby (the floating mascot) is positioned imperatively via this ref — on both
  // desktop (cursor-follow) and mobile (rAF drift) — so neither cursor moves nor
  // scrolling ever trigger a React re-render of the whole app.
  const kirbyRef = useRef(null);
  const kirbyLayerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  // Kirby's behaviour follows the input device, not the window width: with a
  // mouse he hangs under the cursor (at any window size, so a narrow or
  // half-screen window doesn't park him in the middle); on touch he drifts.
  const FINE_POINTER = '(hover: hover) and (pointer: fine)';
  const [hasMouse, setHasMouse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const update = () => setHasMouse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Mouse tracking — update HUD via DOM ref to avoid React re-renders on every mousemove
  const coordsRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (coordsRef.current) {
        coordsRef.current.textContent =
          `X:\u00A0${String(e.clientX).padStart(4, '\u00A0')}\u00A0\u00A0Y:\u00A0${String(e.clientY).padStart(4, '\u00A0')}`;
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Handle text selection state to change cursor to cursor2
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        document.body.classList.add('text-selected');
      } else {
        document.body.classList.remove('text-selected');
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Clear loading cursor when the route is fully navigated and mounted
  useEffect(() => {
    document.body.classList.remove('cursor-loading');
  }, [location.pathname]);

  // Preload background images & key assets on first load to prevent flashes/lazy loads
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const imagesToPreload = [
      kirbyfloating,
      rocks,
      grass,
      cursor1,
      cursor2,
      cursor3,
    ];

    // Remove duplicates
    const uniqueImages = [...new Set(imagesToPreload)];

    uniqueImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const scrollToPostFooter = () => {
    if (postFooterRef.current) {
      postFooterRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    const startY = window.scrollY;
    if (startY === 0) return;

    const duration = 400;
    let startTime = null;

    const animateScroll = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startY * (1 - ease));
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // Desktop: Kirby hangs from his parasol under the cursor, with wind physics.
  //   • follow — he springs toward the cursor with a little lag;
  //   • sway   — he pivots from the parasol (top of the GIF) and is blown
  //              against the motion: move right and he swings left, and
  //              when the cursor stops he wobbles back to hanging straight;
  //   • wind   — while moving, short wind streaks trail behind him.
  // When nothing moves, the loop stops and the GIF just plays as normal.
  // Everything is written straight to the DOM, with no React re-renders.
  useLayoutEffect(() => {
    if (!hasMouse) return undefined;
    const el = kirbyRef.current;
    const layer = kirbyLayerRef.current;
    if (!el || !layer) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const OFFSET_X = 9;
    const OFFSET_Y = 48;

    const target = { x: OFFSET_X, y: OFFSET_Y };
    const pos = { x: target.x, y: target.y };
    let angle = 0; // degrees; positive = body swung to the left
    let angVel = 0;
    let windAmt = 0; // 0..1, how hard the wind is blowing (follows speed)
    // The cursor's own (smoothed) velocity. The swing reacts to this rather than
    // to Kirby's lagging position, so he swings back the instant you start.
    let prevTX = target.x;
    let prevTY = target.y;
    let cvx = 0;
    let cvy = 0;
    let bobX = 0; // flutter offsets layered over the follow position
    let bobY = 0;
    let seen = false;
    let raf = 0;
    let last = 0;
    let spawnAcc = 0;

    // Wind gusts: a fixed pool of SVG lines, recycled. Each gust is born ahead of
    // him (the wind he's flying into), sweeps back past him, and fades out
    // behind. Some pass in front of him and some behind, for depth. Each one
    // gets its own random length, gentle bend, curl, speed and fade.
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const BOX_H = 24; // svg box height; the wave is centred in it
    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    const streaks = Array.from({ length: 14 }, () => {
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('data-swarm', 'skip');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('height', String(BOX_H));
      Object.assign(svg.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        overflow: 'visible',
        opacity: '0',
        pointerEvents: 'none',
        transformOrigin: '50% 50%',
        filter: 'drop-shadow(0 0 3px rgba(92,225,230,0.65))',
        willChange: 'transform, opacity',
      });
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255,255,255,0.95)');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
      layer.appendChild(svg);
      return {
        node: svg, path, life: 0, decay: 0.04, x: 0, y: 0, dx: 0, dy: 0,
        len: 0, rot: 0, amp: 0, wave: 0, phase: 0, phaseSpeed: 0, peak: 0.75,
        curl: 0,
      };
    });
    let nextStreak = 0;

    // A long, calm line with one soft bend (not a wiggle). x runs from the
    // tail (0) to the front (len). Some gusts end in a small curl at the tail,
    // like a cartoon wind swoosh.
    const wavePath = (st) => {
      const steps = 12;
      const mid = BOX_H / 2;
      let d = '';
      let tailY = mid;
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const x = t * st.len;
        const env = Math.sin(Math.PI * (0.15 + 0.85 * t)); // tail stays bent for the curl
        const y = mid + st.amp * env * Math.sin((x / st.wave) * Math.PI * 2 + st.phase);
        if (i === 0) tailY = y;
        d += `${i === steps ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      if (st.curl) {
        const r = Math.abs(st.curl);
        const s = Math.sign(st.curl); // curl up (-1) or down (+1)
        const y0 = tailY;
        d += `Q${(-r * 1.6).toFixed(1)} ${y0.toFixed(1)} ${(-r * 1.6).toFixed(1)} ${(y0 + s * r).toFixed(1)}`;
        d += `Q${(-r * 1.6).toFixed(1)} ${(y0 + s * 2 * r).toFixed(1)} ${(-r * 0.5).toFixed(1)} ${(y0 + s * 2 * r).toFixed(1)}`;
        d += `Q${(r * 0.5).toFixed(1)} ${(y0 + s * 2 * r).toFixed(1)} ${(r * 0.4).toFixed(1)} ${(y0 + s * r).toFixed(1)}`;
      }
      return d;
    };

    el.style.left = '0px';
    el.style.top = '0px';
    // He hangs like a pendulum from a point SWING_R above his centre (up by the
    // cursor). Swinging moves his whole body around that point, so when the
    // wind blows him back he really ends up behind the cursor, not just tilted.
    const SWING_R = OFFSET_Y; // pivot sits right at the cursor
    el.style.transformOrigin = '50% 50%';
    const draw = () => {
      const a = (angle * Math.PI) / 180;
      const swingX = -Math.sin(a) * SWING_R; // positive angle = body to the left
      const swingY = (Math.cos(a) - 1) * SWING_R; // and rises a little as it swings
      el.style.transform =
        `translate3d(${(pos.x + bobX + swingX).toFixed(1)}px, ${(pos.y + bobY + swingY).toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(2)}deg)`;
    };
    draw();

    const frame = (now) => {
      const f = last ? clamp((now - last) / 16.67, 0.25, 3) : 1;
      last = now;

      // The parasol is locked to the cursor (no smoothing, so no lag). Trailing
      // behind comes only from his body swinging on the pendulum below.
      pos.x = target.x;
      pos.y = target.y;
      // Cursor velocity this frame, lightly smoothed (mouse events and frames
      // don't line up one-to-one) and capped so a jump into the window from
      // far away doesn't fling him.
      const prevCvx = cvx;
      const ck = 1 - Math.pow(0.45, f);
      cvx += (clamp((target.x - prevTX) / f, -40, 40) - cvx) * ck;
      cvy += (clamp((target.y - prevTY) / f, -40, 40) - cvy) * ck;
      prevTX = target.x;
      prevTY = target.y;
      const vx = cvx;
      const vy = cvy;
      const speed = Math.hypot(vx, vy);

      if (!reduced) {
        // Wind strength eases toward the cursor's speed, so it builds and dies down.
        windAmt += (clamp(speed / 10, 0, 1) - windAmt) * (1 - Math.pow(0.8, f));

        // Turbulence: a few out-of-step sine waves make the push uneven, so he
        // never locks at one angle while flying. Stronger wind = more flutter.
        const flutter = windAmt * (
          Math.sin(now * 0.0105) * 7 +
          Math.sin(now * 0.027 + 1.7) * 3.5 +
          Math.sin(now * 0.0047 + 0.6) * 4
        );

        // Wind drag pushes him against the direction of travel; an
        // underdamped spring lets him swing back and wobble when it stops.
        const windAngle = clamp(vx * 3.2, -58, 58) + flutter;
        angVel += ((windAngle - angle) * 0.14 - angVel * 0.2) * f;
        // Pendulum kick: when the hanging point (the cursor) speeds up, he is
        // flung the other way at once; when it stops, he swings forward.
        angVel += (cvx - prevCvx) * 1.3;
        // Now and then a random gust knocks him a little.
        if (Math.random() < windAmt * 0.05 * f) angVel += rand(-2.4, 2.4);
        angle = clamp(angle + angVel * f, -65, 65);

        // The parasol catches air: he lifts a little and bobs up and down,
        // drifting slightly side to side, while the wind blows.
        bobY = windAmt * (-5 + Math.sin(now * 0.0085) * 4 + Math.sin(now * 0.019 + 0.4) * 1.5);
        bobX = windAmt * Math.sin(now * 0.0063 + 2) * 3;

        // Spawn gusts ahead of him at an irregular rate (more when faster),
        // each placed and shaped at random so no two look alike.
        if (speed > 2.5) {
          spawnAcc += speed * rand(0.01, 0.05) * f;
          while (spawnAcc >= 1) {
            spawnAcc -= 1;
            const st = streaks[nextStreak];
            nextStreak = (nextStreak + 1) % streaks.length;
            const ux = vx / speed;
            const uy = vy / speed;
            // Sum of two randoms clusters gusts near his middle, with strays.
            const side = (Math.random() + Math.random() - 1) * 46;
            const ahead = rand(45, 95);
            st.life = 1;
            st.peak = rand(0.45, 0.85);
            st.len = clamp(speed * rand(1.5, 2.8), 14, 40);
            st.amp = rand(1, 2.5);
            st.wave = st.len * rand(0.9, 1.7); // about one soft bend per line
            st.phase = rand(0, Math.PI * 2);
            st.phaseSpeed = rand(0.02, 0.06) * (Math.random() < 0.5 ? -1 : 1);
            st.curl = Math.random() < 0.35 ? rand(2.5, 4.5) * (Math.random() < 0.5 ? -1 : 1) : 0;
            st.path.setAttribute('stroke-width', rand(1.1, 2).toFixed(2));
            st.node.setAttribute('width', st.len.toFixed(0));
            st.node.setAttribute('viewBox', `0 0 ${st.len.toFixed(0)} ${BOX_H}`);
            // Half the gusts pass behind him, half in front.
            if (Math.random() < 0.5) layer.insertBefore(st.node, el);
            else layer.appendChild(st.node);
            // Centre point of the gust, out in front of him along the motion.
            st.x = pos.x + ux * (ahead + st.len / 2) - uy * side;
            st.y = pos.y - 6 + uy * (ahead + st.len / 2) + ux * side;
            // Blows back toward him and past him, faster than he flies.
            const gust = rand(2.5, 5) + speed * 0.25;
            st.dx = -ux * gust;
            st.dy = -uy * gust;
            // Life covers the trip: from ahead, past him, then a bit behind.
            const trip = ahead + st.len * 1.5 + rand(30, 80);
            st.decay = clamp((speed + gust) / trip, 0.012, 0.07);
            st.rot = Math.atan2(uy, ux) + rand(-0.15, 0.15);
          }
        } else {
          spawnAcc = 0;
        }
      }

      let liveStreaks = false;
      for (const st of streaks) {
        if (st.life <= 0) continue;
        st.life -= st.decay * f;
        st.x += st.dx * f;
        st.y += st.dy * f;
        if (st.life <= 0) {
          st.node.style.opacity = '0';
          continue;
        }
        liveStreaks = true;
        st.phase += st.phaseSpeed * f; // a slow sway, not a wriggle
        st.path.setAttribute('d', wavePath(st));
        // Fade in as it arrives, fade out once it's behind him.
        const fade = Math.min(1, (1 - st.life) * 5, st.life * 2.5);
        st.node.style.opacity = (fade * st.peak).toFixed(3);
        st.node.style.transform =
          `translate3d(${(st.x - st.len / 2).toFixed(1)}px, ${(st.y - BOX_H / 2).toFixed(1)}px, 0) rotate(${st.rot.toFixed(3)}rad)`;
      }

      draw();

      const settled =
        Math.abs(target.x - pos.x) < 0.3 &&
        Math.abs(target.y - pos.y) < 0.3 &&
        Math.abs(angle) < 0.05 &&
        Math.abs(angVel) < 0.05 &&
        windAmt < 0.01 &&
        Math.abs(cvx) < 0.05 &&
        Math.abs(cvy) < 0.05 &&
        !liveStreaks;
      if (settled) {
        pos.x = target.x;
        pos.y = target.y;
        angle = 0;
        angVel = 0;
        windAmt = 0;
        cvx = 0;
        cvy = 0;
        bobX = 0;
        bobY = 0;
        draw();
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      target.x = e.clientX + OFFSET_X;
      target.y = e.clientY + OFFSET_Y;
      if (!seen) {
        // First sighting of the cursor: appear under it, don't fly in from the corner.
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
        prevTX = target.x;
        prevTY = target.y;
      }
      // Move him with the cursor right away, in the same event, instead of
      // waiting for the next animation frame.
      pos.x = target.x;
      pos.y = target.y;
      draw();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      streaks.forEach((st) => st.node.remove());
      el.style.transformOrigin = '';
    };
  }, [hasMouse]);

  // Treat narrow viewports as "mobile" (matches the site's 768px breakpoint).
  // To test on a laptop, shrink the window under 768px or use DevTools device mode.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Mobile "alive" Kirby. A single rAF loop blends three behaviors and writes the
  // result straight to the DOM (no per-frame React re-render):
  //   • idle drift  — slow horizontal sine sweep + a slower vertical bob, with
  //                   tilt/stretch from horizontal velocity so he floats (not slides);
  //   • scroll      — each scroll burst gives an occasional "puff up" pulse;
  //   • tap/drag    — pointer down/move pulls him toward the touch point, then he
  //                   eases back into idle drift ~1s after the last touch.
  // Runs on touch devices (no hovering mouse). To test it on a laptop, use
  // DevTools device mode, which emulates a touch screen.
  useLayoutEffect(() => {
    if (hasMouse) return undefined;
    const el = kirbyRef.current;
    if (!el) return undefined;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const pos = { x: window.innerWidth / 2, y: window.innerHeight * 0.34 };
    const target = { x: pos.x, y: pos.y };
    let prevX = pos.x;
    let puff = 1;
    let lastPuff = 0;
    let attractUntil = 0;
    let pressed = false;
    let start;
    let raf;

    // Moved purely with transform (no left/top writes, so no layout per frame).
    // Place him immediately so there's no first-frame flash at the origin.
    const html = document.documentElement;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;

    const attract = (x, y) => {
      target.x = x;
      target.y = y;
      attractUntil = performance.now() + 1000;
    };
    const onDown = (e) => { pressed = true; attract(e.clientX, e.clientY); };
    const onMove = (e) => { if (pressed) attract(e.clientX, e.clientY); };
    const onUp = () => { pressed = false; };
    const onScroll = () => {
      const now = performance.now();
      if (now - lastPuff > 1400) { puff = 1.28; lastPuff = now; }
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });

    const frame = (now) => {
      // paused while the first-visit loading screen covers the page
      if (html.hasAttribute('data-boot-cover')) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (start === undefined) start = now;
      const t = now - start;
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Idle path: lazy horizontal sweep (~10.7s) + a slower vertical bob (~16s).
      const idleX = W / 2 + W * 0.3 * Math.sin(t / 1700);
      const idleY = H * 0.34 + 28 * Math.sin(t / 2600);

      const attracting = now < attractUntil;
      const tx = attracting ? target.x : idleX;
      const ty = attracting ? target.y : idleY;
      const ease = attracting ? 0.14 : 0.04; // snappy toward a touch, lazy in idle

      pos.x += (tx - pos.x) * ease;
      pos.y += (ty - pos.y) * ease;

      // Horizontal velocity → tilt + squash/stretch (he rounds out at the turns).
      const vx = pos.x - prevX;
      prevX = pos.x;
      const rot = clamp(vx * 1.1, -10, 10);
      const stretch = clamp(Math.abs(vx) * 0.02, 0, 0.12);

      puff += (1 - puff) * 0.05; // puff decays back to 1
      const sx = (1 + stretch) * puff;
      const sy = (1 - stretch) * puff;

      el.style.transform =
        `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hasMouse]);



  // data-swarm-bg marks scenery (base colour, scene GIFs, overlays, sky, cave):
  // the Motion swarm leaves it on screen and builds everything else over it.
  return (
    <div className="relative w-full min-h-screen bg-primary overflow-x-hidden" data-swarm-bg="">
      {/* Global Mouse Tracker HUD + Music Player — DOM ref for coords avoids re-renders */}
      {!isMobile && (
        <div className="hud-dock" style={{ position: 'fixed', left: '1rem', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', pointerEvents: 'none' }}>
          <div className="font-source-code-pro text-[10px] text-[#5ce1e6] tracking-widest bg-[#06080e]/60 backdrop-blur-sm px-2 py-1 rounded border border-[#5ce1e6]/30 pixel-shadow">
            <span ref={coordsRef}>X:&nbsp;&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;Y:&nbsp;&nbsp;&nbsp;&nbsp;0</span>
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            <MusicPlayer embedded />
          </div>
        </div>
      )}

      <Navbar />

      {/* Floating GIF — fixed so it stays visible on all pages including Resume */}
      <div
        ref={kirbyLayerRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        <img
          ref={kirbyRef}
          src={kirbyfloating}
          alt="Kirby Floating"
          data-swarm="skip"
          width="64"
          height="64"
          decoding="async"
          style={{ position: 'absolute', willChange: 'left, top, transform' }}
          className="w-16 h-16"
        />
      </div>

      {/* Conditionally render animations and teal div on home page */}
      { !isResumePage && showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-teal-400 opacity-50" style={{ zIndex: 1 }} data-swarm-bg="" />
      )}

      {/* Optional per-route darkening veil (set `darken` in siteConfig). Sits above
          the gradient overlay but below page content so the whole scene reads darker. */}
      { !isResumePage && darken && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(6,8,18,${darken})`, zIndex: 2 }} data-swarm-bg="" />
      )}

      <div className={`${isResumePage ? 'bg-transparent' : 'bg-primary'} min-h-screen w-full flex flex-col relative`} data-swarm-bg="">
        {/* Main Content Background — only current + fading-out previous are mounted */}
        {mountedBgs.map((bgSrc) => {
          const isResumeBg = bgSrc === pageConfig['/resume']?.background;
          
          return (
            <div
              key={bgSrc}
              data-swarm-bg=""
              className={
                isResumeBg
                  ? 'fixed inset-0 z-0'
                  : `absolute inset-x-0 top-0 bottom-[120px] sm:bottom-[88px] ${styles.paddingX} flex flex-col z-0`
              }
              style={{
                backgroundImage: `url(${bgSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: isResumeBg ? 'center' : 'center bottom',
                backgroundRepeat: 'no-repeat',
                opacity: backgroundImage === bgSrc ? 1 : 0,
                visibility: backgroundImage === bgSrc ? 'visible' : 'hidden',
                transition: 'opacity 500ms ease-in-out, visibility 500ms ease-in-out',
                willChange: 'opacity, visibility',
                pointerEvents: 'none',
              }}
            />
          );
        })}
        
        {/* Sky gradient & stars */}
        <div
          data-swarm-bg=""
          className={[styles.flexCenter, 'flex-shrink-0 relative w-full h-[100px]'].join(' ')}
          style={{
            zIndex: 10,
            // Translucent header block that fades out at the bottom so the nav
            // stays legible while the scene still shows through. Extra bottom
            // padding pushes the fade below the logo so its lower edge is covered.
            paddingBottom: '2rem',
            backgroundImage:
              'linear-gradient(to bottom, rgba(0,4,15,0.8) 0%, rgba(0,4,15,0.7) 70%, rgba(0,4,15,0) 100%)',
          }}
        >
          {/* Flickering star field behind the nav */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }} data-swarm-bg="deep">
            {headerStars.map((s, i) => (
              <span
                key={i}
                className="hdr-star"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  background: s.color,
                  animationDuration: s.dur,
                  animationDelay: s.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col relative">
          <div className={isResumePage ? "flex-grow flex flex-col w-full" : "flex items-center justify-center flex-grow relative"}>
            <div className={isResumePage ? "w-full" : "relative justify-start items-center"} style={isResumePage ? undefined : { zIndex: 5 }}>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" index element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/about" element={
                    <div className=''>
                      <About />
                    </div>
                  } />
                  <Route path="/experience" element={<Experience />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/resume" element={<Resume />} />
                  <Route path="/*" element={<Page404 />} />
                </Routes>
              </Suspense>

              {/* Scroll Down Component */}
              {isHomePage && (
                <button 
                  onClick={scrollToPostFooter} 
                  className="flex hidden sm:flex"
                >
                  <p className="text-white text-base font-semibold pr-2 pixel-shadow">
                    Scroll down
                  </p>
                  <svg
                    className="w-5 h-5 text-white animate-bounce"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        { !isResumePage && (
          <div 
            className={[
              styles.flexStart, 
              'bg-repeat-x bg-center bg-auto h-[160px] sm:h-[120px]'
            ]} 
            style={{
              backgroundImage: `url(${grass})`,
              backgroundSize: 'auto 100%',
              zIndex: 10,
              alignItems: 'flex-end'
            }} 
          >
            <div className={[styles.boxWidth].join(' hidden sm:flex z-10')}>
              <Footer />
            </div>
          </div>
        )}
      </div>

      {/* PostFooterHome for Home Page */}
      {isHomePage && (
        <div className={[styles]}>
          <div ref={postFooterRef} >
            <div
              data-swarm-bg=""
              className={['bg-primary', styles.flexStart].join(' ')}
              style={{
                backgroundImage: `url(${caveBG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 0px',
                backgroundAttachment: 'fixed',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-teal-400 opacity-50" style={{ zIndex: 0 }} data-swarm-bg="" />

              <div className="relative flex flex-col w-full items-center">
                {/* Stalactites hang from the dirt footer into the cave, fading from
                    dirt-brown at the ground to cave-rock at the tips — the transition
                    between the two grounds. Sits in normal flow at the top of the cave
                    so it reserves its own space above the post-footer content. */}
                <CaveStalactites />
                {/* Extra dark veil to fade the cave backdrop a touch more. Scoped to this
                    post-footer wrapper (which is `relative`) so it does NOT leak up and
                    darken the hero / mountain background above. */}
                <div className="absolute inset-0 bg-[#08040c]/35" style={{ zIndex: 0 }} data-swarm-bg="" />
                {/* Match the About page's content width so the home post-footer
                    shares the same horizontal margins (w-[min(92vw,1024px)]). */}
                <div className="relative mx-auto w-[min(92vw,1024px)]" style={{ zIndex: 10 }}>
                  <PostFooterHome />
                </div>

                <div className="flex justify-center py-6 w-full px-4 sm:px-6 lg:px-8"
                style={{
                  backgroundImage: `url(${rocks})`,
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: 'auto 100%',
                  backgroundPosition: 'center',
                  height: 130,
                  alignItems: 'flex-end',
                  // Sit above the cursor-following Kirby layer (zIndex 5) so the
                  // rocks occlude it — Kirby "disappears" behind the ground here.
                  position: 'relative',
                  zIndex: 6,
                }} >
                  <div className={[styles.boxWidth, 'flex flex-col items-center z-10 w-full'].join(' ')}>
                    <div className="w-full flex flex-col sm:flex-row justify-between items-center">
                      <p className="text-white text-sm text-center sm:text-left mb-2 sm:mb-0">
                        
                      </p>

                      <div className="flex justify-center mb-2 sm:mb-0">
                        <button onClick={scrollToTop} className="flex items-center">
                          <svg
                            className="w-5 h-5 text-white animate-bounce"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 15l-7-7-7 7"></path>
                          </svg>
                          <p className="text-white text-base font-semibold ml-2 pixel-shadow">
                            Back to top
                          </p>
                        </button>
                      </div>

                      <p className="text-white text-sm text-center sm:text-right">
                        {siteLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile music player — only visible when mobile menu is open? Actually we want to hide it when the pause menu is open! */}
      {isMobile && (
        <div className="md:hidden mobile-music-player">
          <MusicPlayer />
        </div>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;