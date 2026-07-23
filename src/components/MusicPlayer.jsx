import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import musicOnIcon from '../assets/music on.png';
import musicOffIcon from '../assets/music_off.png';
import MusicCard from './MusicCard';
import LiquidGlassFilter from './LiquidGlassFilter';
import { playlist } from './playlistData';

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

/**
 * MusicPlayer
 *
 * Props:
 *  embedded — when true, renders inline (no fixed/portal) inside the HUD container in App.jsx (desktop).
 *             when false/undefined, only renders on mobile when the hamburger menu is open (via portal).
 */
const MusicPlayer = ({ embedded = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsClickToPlay, setNeedsClickToPlay] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTouch] = useState(
    () => typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
  );

  // Persistent Volume Memory via localStorage (default 50% / 0.5)
  const [volume, setVolume] = useState(() => {
    const savedVol = localStorage.getItem('portfolio_music_volume');
    return savedVol !== null ? parseFloat(savedVol) : 0.5;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef(null);
  const capsuleRef = useRef(null);

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

  // Reset repulsion and mouse tracking when card state changes to prevent wave bar distortion
  useEffect(() => {
    setIsHovered(false);
    setMousePos({ x: -999, y: -999 });
    setTilt({ rotateX: 0, rotateY: 0 });
  }, [showCard]);

  const currentTrackIndexRef = useRef(currentTrackIndex);
  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  const changeTrack = useCallback((index) => {
    const total = playlist.length;
    const newIndex = (index + total) % total;
    setCurrentTrackIndex(newIndex);
    currentTrackIndexRef.current = newIndex;
    setCurrentTime(0);

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = playlist[newIndex].src;
      audio.currentTime = 0;
      audio.load();

      setTimeout(() => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn('Track play error, waiting for canplaythrough:', err);
              const onCanPlay = () => {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
              };
              audio.addEventListener('canplaythrough', onCanPlay);
            });
        }
      }, 50);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio(playlist[0].src);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      const total = playlist.length;
      const nextIndex = (currentTrackIndexRef.current + 1) % total;
      setTimeout(() => {
        changeTrack(nextIndex);
      }, 100);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    audio.load();

    let hasActivated = false;

    const removeInteractionListeners = () => {
      window.removeEventListener('click', handleUserGesture, true);
      window.removeEventListener('pointerdown', handleUserGesture, true);
      window.removeEventListener('mousedown', handleUserGesture, true);
      window.removeEventListener('touchstart', handleUserGesture, true);
      window.removeEventListener('keydown', handleUserGesture, true);
    };

    function handleUserGesture(e) {
      if (e?.target?.closest?.('button')) return;
      if (!audioRef.current || hasActivated) return;

      audioRef.current.muted = false;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasActivated = true;
            setIsPlaying(true);
            setNeedsClickToPlay(false);
            removeInteractionListeners();
          })
          .catch(() => {});
      }
    }

    const tryAutoplay = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            hasActivated = true;
            setIsPlaying(true);
            setNeedsClickToPlay(false);
          })
          .catch(() => {
            // Autoplay blocked by browser security policy — prompt user to click anywhere
            setNeedsClickToPlay(true);
            window.addEventListener('click', handleUserGesture, true);
            window.addEventListener('pointerdown', handleUserGesture, true);
            window.addEventListener('mousedown', handleUserGesture, true);
            window.addEventListener('touchstart', handleUserGesture, true);
            window.addEventListener('keydown', handleUserGesture, true);
          });
      }
    };

    tryAutoplay();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      removeInteractionListeners();
      audio.pause();
    };
  }, [changeTrack, volume]);

  const toggleMusic = (e) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    localStorage.setItem('portfolio_music_volume', newVol.toString());
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleMouseMove = (e) => {
    if (isTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    setTilt({
      rotateX: ((y - rect.height / 2) / (rect.height / 2)) * -18,
      rotateY: ((x - rect.width / 2) / (rect.width / 2)) * 18,
    });
  };

  const enableRepulsion = !isTouch && !isMobileMenuOpen;

  // ─── Shared capsule + card JSX ───────────────────────────────────────────────
  const isMobileNav = !embedded; // when not embedded → inside mobile menu
  const cardOrigin = embedded ? 'top left' : 'bottom center';

  const capsuleAndCard = (
    <div className="relative flex items-center">
      <AnimatePresence initial={false} mode="wait">
        {showCard ? (
          <MusicCard
            key="music-card"
            isPlaying={isPlaying}
            volume={volume}
            currentTrackIndex={currentTrackIndex}
            currentTime={currentTime}
            duration={duration}
            toggleMusic={toggleMusic}
            handleVolumeChange={handleVolumeChange}
            handleSeek={handleSeek}
            changeTrack={changeTrack}
            onClose={() => setShowCard(false)}
            isMobileNav={isMobileNav}
          />
        ) : (
          <>
          <LiquidGlassFilter id="capsule-glass" targetRef={capsuleRef} options={{ blur: 0.5, refractionScale: 1.5, radius: 20 }} />
          <motion.div
            ref={capsuleRef}
            key="music-capsule"
            layout="size"
            animate={{
              scale: isHovered && enableRepulsion ? 1.06 : 1,
              rotateX: isHovered && enableRepulsion ? tilt.rotateX : 0,
              rotateY: isHovered && enableRepulsion ? tilt.rotateY : 0,
            }}
            transition={{ layout: { type: 'spring', stiffness: 400, damping: 35 }, duration: 0.2, ease: 'easeOut' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => { if (enableRepulsion) setIsHovered(true); }}
            onMouseLeave={() => {
              setIsHovered(false);
              setMousePos({ x: -999, y: -999 });
              setTilt({ rotateX: 0, rotateY: 0 });
            }}
            style={{ transformOrigin: cardOrigin, '--svg-glass-url': 'url(#capsule-glass)' }}
            className={`relative flex items-center gap-1.5 h-10 liquid-glass use-svg-glass overflow-hidden pointer-events-auto ${
              isPlaying
                ? 'pl-2.5 pr-3.5 !rounded-full'
                : 'w-10 justify-center !rounded-full'
            }`}
          >
            {isHovered && enableRepulsion && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(45px circle at ${mousePos.x}px ${mousePos.y}px, rgba(92,225,230,0.45), transparent 85%)`,
                }}
              />
            )}
            {isPlaying && (
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5ce1e6]/30 to-transparent pointer-events-none blur-[1px] z-0"
              />
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMusic}
              title={isPlaying ? 'Pause Music' : 'Play Music'}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                    setMousePos({ x: -999, y: -999 });
                    setTilt({ rotateX: 0, rotateY: 0 });
                    setShowCard(true);
                  }}
                  title="Click to open Music Controls"
                  className="relative z-20 flex items-center gap-1 h-10 px-1.5 overflow-hidden rounded-full cursor-pointer"
                >
                  {waveformBars.map((bar, i) => {
                    const dx = 72 + i * 12 - mousePos.x;
                    const dy = 28 - mousePos.y;
                    const dist = Math.hypot(dx, dy);
                    const isInside = enableRepulsion && isHovered && dist < 45;
                    const force = isInside ? 1 - dist / 45 : 0;
                    return (
                      <motion.span
                        key={i}
                        animate={{
                          x: isInside ? (dx / (dist || 1)) * force * 22 : 0,
                          y: isInside ? (dy / (dist || 1)) * force * 16 : 0,
                          rotate: isInside ? (dx / (dist || 1)) * force * 25 : 0,
                          height: [`${bar.min}px`, `${bar.max}px`, `${bar.min}px`],
                        }}
                        transition={{
                          x: { type: 'spring', stiffness: 350, damping: 20 },
                          y: { type: 'spring', stiffness: 350, damping: 20 },
                          rotate: { type: 'spring', stiffness: 350, damping: 20 },
                          height: { repeat: Infinity, duration: bar.speed, ease: 'easeInOut', delay: bar.delay },
                        }}
                        className="w-1.5 rounded-full bg-gradient-to-t from-[#5ce1e6] via-[#7de7eb] to-white shadow-[0_0_6px_#5ce1e6] shrink-0"
                        style={{ height: `${(bar.min + bar.max) / 2}px` }}
                      />
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
        </>
      )}
    </AnimatePresence>

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
