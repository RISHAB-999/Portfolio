import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

import musicOnIcon from '../assets/music on.png';
import musicOffIcon from '../assets/music_off.png';
import MusicCard from './MusicCard';
import LiquidGlassFilter from './LiquidGlassFilter';
import { musicStore, initAutoplay, toggle, setTrack, setVolume, seek } from '../utils/musicAudio';

const waveformBars = [
  { min: 3, max: 10, speed: 0.6, delay: 0 },
  { min: 5, max: 16, speed: 0.45, delay: 0.1 },
  { min: 8, max: 20, speed: 0.7, delay: 0.2 },
  { min: 10, max: 22, speed: 0.5, delay: 0.15 },
  { min: 7, max: 18, speed: 0.65, delay: 0.05 },
  { min: 5, max: 14, speed: 0.5, delay: 0.25 },
  { min: 8, max: 20, speed: 0.8, delay: 0.3 },
  { min: 6, max: 15, speed: 0.55, delay: 0.1 },
  { min: 4, max: 12, speed: 0.65, delay: 0.2 },
  { min: 3, max: 9, speed: 0.45, delay: 0.05 },
];

// Per-bar CSS custom properties, built once (not per render).
const barStyles = waveformBars.map((bar) => ({
  '--bar-max': `${bar.max}px`,
  '--bar-min-ratio': bar.min / bar.max,
  '--bar-speed': `${bar.speed}s`,
  '--bar-delay': `${bar.delay}s`,
}));

const springConfig = { stiffness: 400, damping: 30 };

/**
 * MusicPlayer
 *
 * Props:
 *  embedded — when true, renders inline (no fixed/portal) inside the HUD container in App.jsx (desktop).
 *             when false/undefined, only renders on mobile when the hamburger menu is open (via portal).
 *
 * Audio lives in utils/musicAudio.js (one shared element). Hover effects (tilt,
 * glow, waveform repulsion) are written straight to motion values / styles so
 * moving the mouse over the capsule never re-renders this component.
 */
const MusicPlayer = ({ embedded = false }) => {
  const { isPlaying, needsClickToPlay, trackIndex, volume } = useSyncExternalStore(
    musicStore.subscribe,
    musicStore.getSnapshot
  );
  const [showCard, setShowCard] = useState(false);
  // The card is mounted ahead of time (on hover/focus of the capsule, or when the
  // browser is idle) and then only shown/hidden, so opening it never pays for
  // mounting ~10 animated components and building its glass filter.
  const [cardMounted, setCardMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch] = useState(
    () => typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
  );

  const capsuleRef = useRef(null);
  const glowRef = useRef(null);
  const barRefs = useRef([]);
  const mouseRafRef = useRef(null);
  const cachedBoundsRef = useRef(null);

  const scale = useSpring(1, springConfig);
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  useEffect(() => {
    initAutoplay();
  }, []);

  useEffect(() => {
    if (cardMounted) return undefined;
    const mount = () => setCardMounted(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(mount, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(mount, 2500);
    return () => clearTimeout(t);
  }, [cardMounted]);
  const premountCard = useCallback(() => setCardMounted(true), []);

  // Monitor document.body for pause-menu-open class (mobile hamburger menu)
  useEffect(() => {
    const checkMenu = () => {
      setIsMobileMenuOpen(document.body.classList.contains('pause-menu-open'));
    };
    checkMenu();
    const observer = new MutationObserver(checkMenu);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (mouseRafRef.current) cancelAnimationFrame(mouseRafRef.current);
  }, []);

  const enableRepulsion = !isTouch && !isMobileMenuOpen;

  const resetHover = useCallback(() => {
    if (mouseRafRef.current) {
      cancelAnimationFrame(mouseRafRef.current);
      mouseRafRef.current = null;
    }
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    barRefs.current.forEach((el) => {
      if (el) el.style.transform = '';
    });
    setIsHovered(false);
  }, [scale, rotateX, rotateY]);

  const closeCard = useCallback(() => setShowCard(false), []);
  const openCard = useCallback((e) => {
    e.stopPropagation();
    resetHover();
    setCardMounted(true);
    setShowCard(true);
  }, [resetHover]);

  const toggleMusic = useCallback((e) => {
    e?.stopPropagation();
    toggle();
  }, []);
  const handleVolumeChange = useCallback((e) => setVolume(parseFloat(e.target.value)), []);
  const handleSeek = useCallback((e) => seek(parseFloat(e.target.value)), []);

  const handleMouseMove = (e) => {
    if (!enableRepulsion) return;
    const { clientX, clientY } = e;
    const target = e.currentTarget;
    if (mouseRafRef.current) return; // one update per frame
    mouseRafRef.current = requestAnimationFrame(() => {
      mouseRafRef.current = null;
      if (!cachedBoundsRef.current) cachedBoundsRef.current = target.getBoundingClientRect();
      const rect = cachedBoundsRef.current;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      // Set on the glow element itself (a leaf): custom properties inherit, so
      // setting them on the capsule would restyle its whole subtree per move.
      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty('--mx', `${x}px`);
        glow.style.setProperty('--my', `${y}px`);
      }
      rotateX.set(((y - rect.height / 2) / (rect.height / 2)) * -18);
      rotateY.set(((x - rect.width / 2) / (rect.width / 2)) * 18);
      // Waveform bars push away from the cursor (same maths as before).
      for (let i = 0; i < barRefs.current.length; i++) {
        const el = barRefs.current[i];
        if (!el) continue;
        const dx = 72 + i * 12 - x;
        const dy = 28 - y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 45) {
          const force = 1 - dist / 45;
          el.style.transform =
            `translate(${(dx / dist) * force * 22}px, ${(dy / dist) * force * 16}px) rotate(${(dx / dist) * force * 25}deg)`;
        } else if (el.style.transform) {
          el.style.transform = '';
        }
      }
    });
  };

  // ─── Shared capsule + card JSX ───────────────────────────────────────────────
  const isMobileNav = !embedded; // when not embedded → inside mobile menu
  const cardOrigin = embedded ? 'top left' : 'bottom center';

  const capsuleAndCard = (
    <div className="relative flex items-center">
      {cardMounted && (
        // Overlays the capsule's spot (same top-left / bottom-centre origin as
        // before) without taking layout space while closed. data-swarm-live:
        // stays usable while the Motion swarm is running.
        <div
          data-swarm-live=""
          className={embedded ? 'absolute top-0 left-0 z-40' : 'absolute bottom-0 left-1/2 -translate-x-1/2 z-40'}
          style={{ pointerEvents: showCard ? 'auto' : 'none' }}
        >
          <MusicCard
            open={showCard}
            isPlaying={isPlaying}
            volume={volume}
            currentTrackIndex={trackIndex}
            toggleMusic={toggleMusic}
            handleVolumeChange={handleVolumeChange}
            handleSeek={handleSeek}
            changeTrack={setTrack}
            onClose={closeCard}
            isMobileNav={isMobileNav}
          />
        </div>
      )}
          <>
            <LiquidGlassFilter id="music-player-glass" targetRef={capsuleRef} />
            <motion.div
              ref={capsuleRef}
              key="music-capsule"
              layout="size"
              // only re-measure when the capsule's size can actually change (play/pause);
              // otherwise every re-render (e.g. opening the card) forces a layout read
              layoutDependency={isPlaying}
              transition={{ layout: { type: 'spring', stiffness: 400, damping: 35 } }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => {
                cachedBoundsRef.current = null;
                if (enableRepulsion) {
                  scale.set(1.06);
                  setIsHovered(true);
                }
              }}
              onMouseLeave={resetHover}
              onPointerEnter={premountCard}
              onFocus={premountCard}
              aria-hidden={showCard || undefined}
              style={{ scale, rotateX, rotateY, transformOrigin: cardOrigin, '--svg-glass-url': 'url(#music-player-glass)', visibility: showCard ? 'hidden' : undefined, opacity: showCard ? 0 : 1 }}
              className={`relative flex items-center gap-1.5 h-10 use-svg-glass liquid-glass overflow-hidden pointer-events-auto ${showCard ? 'music-loops-paused ' : ''}${
                isPlaying
                  ? 'pl-2.5 pr-3.5 !rounded-full'
                  : 'w-10 justify-center !rounded-full'
              }`}
            >
            {isHovered && enableRepulsion && (
              <div
                ref={glowRef}
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'radial-gradient(45px circle at var(--mx, -999px) var(--my, -999px), rgba(92,225,230,0.45), transparent 85%)',
                }}
              />
            )}
            {isPlaying && (
              <div className="music-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-[#5ce1e6]/30 to-transparent pointer-events-none blur-[1px] z-0" />
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMusic}
              title={isPlaying ? 'Pause Music' : 'Play Music'}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
              className="relative z-20 shrink-0 flex items-center justify-center p-1.5 rounded-full cursor-pointer bg-transparent border-0 outline-none drop-shadow-[0_4px_12px_rgba(92,225,230,0.95)]"
            >
              <img
                src={isPlaying ? musicOnIcon : musicOffIcon}
                alt={isPlaying ? 'Pause Music' : 'Play Music'}
                className="h-6 w-6 object-contain pointer-events-none"
              />
            </motion.button>

          <AnimatePresence>
            {isPlaying && (
              <>
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-20 w-px h-4 bg-gradient-to-b from-transparent via-[#5ce1e6] to-transparent rounded-full shrink-0 shadow-[0_0_8px_#5ce1e6]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  onClick={openCard}
                  title="Click to open Music Controls"
                  role="button"
                  tabIndex={0}
                  aria-label="Open music controls"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openCard(e);
                    }
                  }}
                  className="relative z-20 flex items-center gap-1 h-10 px-1.5 overflow-hidden rounded-full cursor-pointer"
                >
                  {waveformBars.map((bar, i) => (
                    <span
                      key={i}
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className="wave-slot shrink-0"
                    >
                      <span
                        className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-[#5ce1e6] via-[#7de7eb] to-white shadow-[0_0_6px_#5ce1e6]"
                        style={barStyles[i]}
                      />
                    </span>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
          </>

      {/* Floating Popup tooltip when autoplay is blocked by browser */}
      <AnimatePresence>
        {needsClickToPlay && !isPlaying && !showCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: [0, -3, 0] }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            transition={{ duration: 0.3, y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
            className={
              embedded
                ? 'absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#060812]/90 backdrop-blur-md border border-[#5ce1e6]/60 text-[#5ce1e6] font-source-code-pro text-xs shadow-[0_0_20px_rgba(92,225,230,0.4)] pointer-events-none whitespace-nowrap left-full ml-3 top-[50%] -translate-y-[50%]'
                : 'absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#060812]/90 backdrop-blur-md border border-[#5ce1e6]/60 text-[#5ce1e6] font-source-code-pro text-xs shadow-[0_0_20px_rgba(92,225,230,0.4)] pointer-events-none whitespace-nowrap bottom-full mb-3 left-[50%] -translate-x-[50%]'
            }
          >
            <span
              className={
                embedded
                  ? 'absolute w-2 h-2 bg-[#060812] border-l border-b border-[#5ce1e6]/60 transform rotate-45 -left-1 top-[50%] -translate-y-[50%]'
                  : 'absolute w-2 h-2 bg-[#060812] border-l border-b border-[#5ce1e6]/60 transform rotate-45 -bottom-1 left-[50%] -translate-x-[50%]'
              }
            />
            <span>🎵 Click anywhere to play music</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── DESKTOP: embedded inside HUD div in App.jsx — no fixed/portal needed ───
  if (embedded) {
    return capsuleAndCard;
  }

  // ─── MOBILE: only visible when hamburger menu is open, via portal ─────────────
  if (!isMobileMenuOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '6px',
        left: '50%',
        transform: 'translateX(-50%) scale(0.88)',
        transformOrigin: 'bottom center',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      className="select-none pointer-events-none"
    >
      {capsuleAndCard}
    </div>,
    document.body
  );
};

export default MusicPlayer;
