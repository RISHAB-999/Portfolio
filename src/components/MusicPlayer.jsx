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

  const toggleMusic = () => {
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
      <motion.button
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMusic}
        title={isPlaying ? 'Pause Music' : 'Play Music'}
        className={`relative flex items-center gap-3 h-14 cursor-pointer transition-all duration-300 backdrop-blur-[3px] backdrop-saturate-200 overflow-hidden ${
          isPlaying
            ? 'px-4 rounded-full bg-[#0b1f33]/40 border-t border-l border-cyan-300/80 border-b border-r border-[#5ce1e6]/40 shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_20px_rgba(92,225,230,0.45),inset_0_2px_4px_rgba(255,255,255,0.7)]'
            : 'w-14 justify-center rounded-[24px] bg-gradient-to-br from-white/30 via-cyan-400/10 to-transparent border-t border-l border-white/80 border-b border-r border-white/20 hover:border-cyan-300/80 hover:bg-gradient-to-br hover:from-[#5ce1e6]/25 hover:via-sky-400/10 hover:to-transparent shadow-[0_10px_25px_rgba(0,0,0,0.35),0_0_15px_rgba(92,225,230,0.25),inset_0_2px_4px_rgba(255,255,255,0.65)]'
        }`}
      >
        {/* Real Liquid Water Simulation Container */}
        {isPlaying && (
          <div className="absolute inset-x-0 bottom-0 top-[25%] pointer-events-none overflow-hidden rounded-b-full z-0">
            {/* Primary Liquid Wave Surface Layer */}
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute -top-3 left-0 w-[200%] h-6"
            >
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-cyan-400/40">
                <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,-20 1200,20 L1200,120 L0,120 Z" />
              </svg>
            </motion.div>

            {/* Secondary Opposite Sloshing Wave Layer */}
            <motion.div
              animate={{ x: ['-50%', '0%'] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
              className="absolute -top-4 left-0 w-[200%] h-7 opacity-60"
            >
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-[#5ce1e6]/35">
                <path d="M0,30 C200,-30 400,80 600,10 C800,-40 1000,70 1200,30 L1200,120 L0,120 Z" />
              </svg>
            </motion.div>

            {/* Liquid Water Fill Body */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/50 via-[#5ce1e6]/35 to-cyan-400/25 backdrop-blur-[1px]" />
          </div>
        )}

        {/* Rising Animated Water Bubbles */}
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[
              { left: '15%', size: 4, delay: 0, dur: 2.2 },
              { left: '35%', size: 3, delay: 0.8, dur: 1.7 },
              { left: '60%', size: 5, delay: 1.4, dur: 2.5 },
              { left: '80%', size: 3.5, delay: 0.4, dur: 2.0 },
              { left: '92%', size: 4.5, delay: 1.1, dur: 2.3 },
            ].map((b, i) => (
              <motion.span
                key={i}
                animate={{
                  y: ['120%', '-20%'],
                  opacity: [0, 0.85, 0],
                  x: [0, (i % 2 === 0 ? 5 : -5), 0],
                }}
                transition={{ repeat: Infinity, duration: b.dur, delay: b.delay, ease: 'easeOut' }}
                className="absolute bottom-1 bg-white/80 rounded-full border border-cyan-200/90 shadow-[0_0_6px_#5ce1e6]"
                style={{ left: b.left, width: b.size, height: b.size }}
              />
            ))}
          </div>
        )}

        {/* Music icon */}
        <img
          src={isPlaying ? musicOnIcon : musicOffIcon}
          alt={isPlaying ? 'Music On' : 'Music Off'}
          className="relative z-20 h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(92,225,230,0.8)]"
        />

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
                className="relative z-20 w-[1.5px] h-6 bg-gradient-to-b from-transparent via-[#5ce1e6]/80 to-transparent rounded-full shrink-0 shadow-[0_0_6px_#5ce1e6]"
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
                    className="w-1.5 bg-[#b9f3fc] rounded-full shadow-[0_0_8px_rgba(92,225,230,0.9)]"
                    style={{ height: `${(bar.min + bar.max) / 2}px` }}
                  />
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default MusicPlayer;
