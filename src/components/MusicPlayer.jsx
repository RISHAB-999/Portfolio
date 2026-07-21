import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import musicOnIcon from '../assets/music on.png';
import musicOffIcon from '../assets/music_off.png';
import lofiTrack from '../assets/lofi.mp3';

// 10-bar waveform configuration matching iOS / Siri Voice Memo wave layout
const waveformBars = [
  { min: 4, max: 10, speed: 0.7, delay: 0 },
  { min: 10, max: 24, speed: 0.55, delay: 0.1 },
  { min: 16, max: 32, speed: 0.8, delay: 0.25 },
  { min: 20, max: 36, speed: 0.65, delay: 0.15 },
  { min: 14, max: 28, speed: 0.75, delay: 0.05 },
  { min: 12, max: 24, speed: 0.55, delay: 0.2 },
  { min: 10, max: 20, speed: 0.85, delay: 0.3 },
  { min: 8, max: 16, speed: 0.6, delay: 0.1 },
  { min: 6, max: 12, speed: 0.7, delay: 0.25 },
  { min: 4, max: 8, speed: 0.5, delay: 0.05 },
];

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(lofiTrack);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = (e) => {
    e?.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioRef.current.play().catch((err) => {
        console.error('Audio playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Interactive 3D Parallax Tilt Angles
    const rotateX = ((y - centerY) / centerY) * -18;
    const rotateY = ((x - centerX) / centerX) * 18;

    setMousePos({ x, y });
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -999, y: -999 });
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex items-center justify-center select-none [perspective:1000px]">
      <motion.div
        layout
        animate={{
          rotateX: isHovered ? tilt.rotateX : 0,
          rotateY: isHovered ? tilt.rotateY : 0,
          scale: isHovered ? 1.08 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative flex items-center gap-3 h-14 cursor-pointer transition-all duration-300 backdrop-blur-[2px] overflow-hidden ${
          isPlaying
            ? 'px-4 rounded-full bg-cyan-400/10 border-t-2 border-l-2 border-[#5ce1e6] border-b border-r border-[#5ce1e6]/30 shadow-[0_15px_35px_rgba(0,0,0,0.45),0_0_20px_rgba(92,225,230,0.45),inset_0_2px_4px_rgba(255,255,255,0.7)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.55),0_0_40px_rgba(92,225,230,0.85),inset_0_0_15px_rgba(92,225,230,0.5)]'
            : 'w-14 justify-center rounded-[24px] bg-cyan-400/10 border-t-2 border-l-2 border-[#5ce1e6] border-b border-r border-[#5ce1e6]/30 hover:border-[#5ce1e6] hover:bg-cyan-400/20 shadow-[0_15px_35px_rgba(0,0,0,0.45),0_0_20px_rgba(92,225,230,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.55),0_0_40px_rgba(92,225,230,0.85),inset_0_0_15px_rgba(92,225,230,0.5)]'
        }`}
      >
        {/* Invisible Cursor Circle Force-Field Highlight */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-10"
            style={{
              background: `radial-gradient(45px circle at ${mousePos.x}px ${mousePos.y}px, rgba(92, 225, 230, 0.45), transparent 85%)`,
            }}
          />
        )}

        {/* Cyan Liquid Light Shimmer Flowing inside Crystal Glass */}
        {isPlaying && (
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5ce1e6]/30 to-transparent pointer-events-none blur-[1px] z-0"
          />
        )}

        {/* 3D Floating Music Icon Button - ONLY clicking this icon toggles music ON/OFF */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMusic}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
          className="relative z-20 shrink-0 p-1 bg-transparent border-0 outline-none cursor-pointer rounded-full [transform:translateZ(22px)] drop-shadow-[0_4px_12px_rgba(92,225,230,0.95)]"
        >
          <img
            src={isPlaying ? musicOnIcon : musicOffIcon}
            alt={isPlaying ? 'Music On' : 'Music Off'}
            className="h-8 w-8 object-contain"
          />
        </motion.button>

        {/* 3D Floating Divider Line & Waveform */}
        <AnimatePresence>
          {isPlaying && (
            <>
              {/* Divider Line */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-20 w-[1.5px] h-6 bg-gradient-to-b from-transparent via-[#5ce1e6] to-transparent rounded-full shrink-0 shadow-[0_0_10px_#5ce1e6] [transform:translateZ(18px)]"
              />

              {/* Solid Waveform Container - Bars push radially around cursor, no middle seam line! */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-20 flex items-center gap-1.5 h-10 px-1 [transform:translateZ(18px)] pointer-events-none"
              >
                {waveformBars.map((bar, i) => {
                  // Compute 2D distance from cursor to this bar's center
                  const barX = 72 + i * 12; // Approx X center of bar inside button
                  const barY = 28; // Center Y of button
                  const dx = barX - mousePos.x;
                  const dy = barY - mousePos.y;
                  const dist = Math.hypot(dx, dy);
                  const forceRadius = 45;

                  const isInsideForceField = isHovered && dist < forceRadius;
                  const force = isInsideForceField ? 1 - dist / forceRadius : 0;
                  
                  // 360° Radial Repulsion (pushes left/right and up/down away from cursor)
                  const repelX = isInsideForceField ? (dx / (dist || 1)) * force * 22 : 0;
                  const repelY = isInsideForceField ? (dy / (dist || 1)) * force * 16 : 0;
                  const tiltAngle = isInsideForceField ? (dx / (dist || 1)) * force * 25 : 0;

                  return (
                    <motion.span
                      key={i}
                      animate={{
                        x: repelX,
                        y: repelY,
                        rotate: tiltAngle,
                        height: [`${bar.min}px`, `${bar.max}px`, `${bar.min}px`],
                      }}
                      transition={{
                        x: { type: 'spring', stiffness: 350, damping: 20 },
                        y: { type: 'spring', stiffness: 350, damping: 20 },
                        rotate: { type: 'spring', stiffness: 350, damping: 20 },
                        height: {
                          repeat: Infinity,
                          duration: bar.speed,
                          ease: 'easeInOut',
                          delay: bar.delay,
                        },
                      }}
                      className="w-1.5 bg-[#5ce1e6] rounded-full shadow-[0_0_10px_rgba(92,225,230,0.95)] shrink-0"
                      style={{ height: `${(bar.min + bar.max) / 2}px` }}
                    />
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MusicPlayer;
