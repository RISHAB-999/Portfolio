import { useRef, useEffect, useLayoutEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import styles from './style';
import './index.css';

import Home from './pages/Home';
import { Navbar, Footer, PostFooterHome, CaveStalactites, MusicPlayer } from './components';
import { kirbyfloating, rocks, grass, caveBG } from './assets';
import { pageConfig, DEFAULT_PAGE, location as siteLocation } from './data/siteConfig';
import profilePic from './assets/Rishab.jpeg';
import fullStackWeb from './assets/Full-Stack_Web.png';
import mobileApp from './assets/Mobile_app.png';
import cloudDevOps from './assets/Cloud.png';
import softwareEngineering from './assets/Software_Engineering.png';
import cursor1 from './assets/cursor1_small.png';
import cursor2 from './assets/cursor2_small.png';
import cursor3 from './assets/cursor3_small.png';

// Route components are code-split so each page's JS loads only when visited.
// Home stays eager since it's the landing route.
import About from './pages/About';
import Projects from './pages/Projects';
import Experience from './pages/Experience';
import Contact from './pages/Contact';
import Page404 from './pages/Page404';
import Resume from './pages/Resume';

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

  // Kirby (the floating mascot) is positioned imperatively via this ref — on both
  // desktop (cursor-follow) and mobile (rAF drift) — so neither cursor moves nor
  // scrolling ever trigger a React re-render of the whole app.
  const kirbyRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

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
      ...Object.values(pageConfig).map(cfg => cfg.background).filter(Boolean),
      DEFAULT_PAGE.background,
      kirbyfloating,
      rocks,
      grass,
      caveBG,
      profilePic,
      fullStackWeb,
      mobileApp,
      cloudDevOps,
      softwareEngineering,
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

    const duration = 1200;
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

  // Desktop: Kirby trails the cursor. Write straight to the DOM on mousemove /
  // scroll instead of through state — no per-event re-render. `top` is a document
  // coordinate (clientY + scrollY) so he stays under the cursor as the page scrolls.
  // useLayoutEffect places him before first paint (no top-left flash).
  useLayoutEffect(() => {
    if (isMobile) return undefined;
    const el = kirbyRef.current;
    if (!el) return undefined;

    let clientX = 0;
    let clientY = 0;
    const place = () => {
      el.style.left = `${clientX + 9}px`;
      el.style.top = `${clientY + 48}px`;
    };
    el.style.transform = 'translate(-50%, -50%)';
    place();

    const onMove = (e) => {
      clientX = e.clientX;
      clientY = e.clientY;
      place();
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
    };
  }, [isMobile]);

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
  // Pointer events cover both touch and mouse, so a click on a narrow laptop
  // window attracts him too — handy for testing without a touchscreen.
  useLayoutEffect(() => {
    if (!isMobile) return undefined;
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

    // Place him immediately so there's no first-frame flash at the origin.
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.style.transform = 'translate(-50%, -50%)';

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

      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
      el.style.transform =
        `translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

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
  }, [isMobile]);



  return (
    <div className="relative w-full min-h-screen bg-primary overflow-x-hidden">
      {/* Global Mouse Tracker HUD + Music Player — DOM ref for coords avoids re-renders */}
      {!isMobile && (
        <div style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', pointerEvents: 'none' }}>
          <div className="font-source-code-pro text-[10px] text-[#5ce1e6] tracking-widest bg-[#06080e]/60 backdrop-blur-sm px-2 py-1 rounded border border-[#5ce1e6]/30 pixel-shadow">
            <span ref={coordsRef}>X:&nbsp;&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;Y:&nbsp;&nbsp;&nbsp;&nbsp;0</span>
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            <MusicPlayer embedded />
          </div>
        </div>
      )}

      {/* Floating GIF — fixed so it stays visible on all pages including Resume */}
      <div
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
          decoding="async"
          style={{ position: 'absolute', willChange: 'left, top, transform' }}
          className="w-16 h-16"
        />
      </div>

      {/* Conditionally render animations and teal div on home page */}
      { !isResumePage && showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-teal-400 opacity-50" style={{ zIndex: 1 }} />
      )}

      {/* Optional per-route darkening veil (set `darken` in siteConfig). Sits above
          the gradient overlay but below page content so the whole scene reads darker. */}
      { !isResumePage && darken && (
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(6,8,18,${darken})`, zIndex: 2 }} />
      )}

      <div className={`${isResumePage ? 'bg-transparent' : 'bg-primary'} min-h-screen w-full flex flex-col relative`}>
        {/* Main Content Background */}
        { !isResumePage && (
          <div
            className={['absolute inset-x-0 top-0 bottom-[120px] sm:bottom-[88px]', styles.paddingX, 'flex flex-col'].join(' ')}
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              // Anchor the scene to its bottom and stop it around the grass line so the
              // forest at the image's bottom edge sits on the grass instead of being
              // cut by — and buried behind — the dirt strip. The slight overlap into
              // the grass keeps foliage behind the grass blades' transparent gaps.
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              zIndex: 0,
            }}
          />
        )}
        
        {/* Navbar */}
        <div
          className={[styles.flexCenter, 'flex-shrink-0 relative'].join(' ')}
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
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
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

          <div className={[styles.boxWidth, 'mb-3 relative'].join(' ')} style={{ zIndex: 2 }}>
            <Navbar />
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
              className={['bg-primary', styles.flexStart].join(' ')}
              style={{
                backgroundImage: `url(${caveBG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 0px',
                backgroundAttachment: 'fixed',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-teal-400 opacity-50" style={{ zIndex: 0 }} />

              <div className="relative flex flex-col w-full items-center">
                {/* Stalactites hang from the dirt footer into the cave, fading from
                    dirt-brown at the ground to cave-rock at the tips — the transition
                    between the two grounds. Sits in normal flow at the top of the cave
                    so it reserves its own space above the post-footer content. */}
                <CaveStalactites />
                {/* Extra dark veil to fade the cave backdrop a touch more. Scoped to this
                    post-footer wrapper (which is `relative`) so it does NOT leak up and
                    darken the hero / mountain background above. */}
                <div className="absolute inset-0 bg-[#08040c]/35" style={{ zIndex: 0 }} />
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
      {/* Mobile music player — only visible when mobile menu is open */}
      {isMobile && <MusicPlayer />}
    </div>
  );
};

const App = () => (
  <Router basename={import.meta.env.BASE_URL}>
    <AppContent />
  </Router>
);

export default App;