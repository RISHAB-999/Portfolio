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
    e.stopPropagation();
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

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex items-center justify-center select-none">
      <motion.div
        layout
        className={`relative flex items-center gap-3 h-14 transition-all duration-300 backdrop-blur-xl backdrop-saturate-150 overflow-hidden ${
          isPlaying
            ? 'px-4 rounded-full bg-gradient-to-br from-[#5ce1e6]/35 via-cyan-400/20 to-sky-500/10 border-t border-l border-cyan-200/90 border-b border-r border-[#5ce1e6]/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_0_25px_rgba(92,225,230,0.55),inset_0_1.5px_3px_0_rgba(255,255,255,0.7)]'
            : 'w-14 justify-center rounded-[24px] bg-gradient-to-br from-[#5ce1e6]/25 via-cyan-400/15 to-transparent border-t border-l border-cyan-200/80 border-b border-r border-[#5ce1e6]/30 hover:border-[#5ce1e6] hover:bg-gradient-to-br hover:from-[#5ce1e6]/35 hover:via-cyan-400/20 hover:to-sky-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_0_18px_rgba(92,225,230,0.35),inset_0_1.5px_3px_0_rgba(255,255,255,0.65)]'
        }`}
      >
        {/* Cyan Liquid Light Shimmer Flowing inside Liquid Glass material */}
        {isPlaying && (
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5ce1e6]/40 to-transparent pointer-events-none blur-[2px]"
          />
        )}

        {/* Music Icon Button - Clicking ONLY this icon toggles open/close */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMusic}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
          className="relative z-20 flex items-center justify-center p-1 bg-transparent border-0 outline-none cursor-pointer rounded-full"
        >
          <img
            src={isPlaying ? musicOnIcon : musicOffIcon}
            alt={isPlaying ? 'Music On' : 'Music Off'}
            className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(92,225,230,0.9)]"
          />
        </motion.button>

        {/* Divider Line & Waveform */}
        <AnimatePresence>
          {isPlaying && (
            <>
              {/* Divider Line between Icon and Wave */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-20 w-[1.5px] h-6 bg-gradient-to-b from-transparent via-[#5ce1e6]/90 to-transparent rounded-full shrink-0 shadow-[0_0_8px_#5ce1e6]"
              />

              {/* iOS Voice Memo Style Animated Waveform Capsule */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-20 flex items-center gap-1.5 h-10 px-1"
              >
                {waveformBars.map((bar, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [`${bar.min}px`, `${bar.max}px`, `${bar.min}px`] }}
                    transition={{ repeat: Infinity, duration: bar.speed, ease: 'easeInOut', delay: bar.delay }}
                    className="w-1.5 bg-[#5ce1e6] rounded-full shadow-[0_0_10px_rgba(92,225,230,0.95)]"
                    style={{ height: `${(bar.min + bar.max) / 2}px` }}
                  />
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MusicPlayer;
