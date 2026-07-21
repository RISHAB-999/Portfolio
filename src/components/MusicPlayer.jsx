import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import musicOnIcon from '../assets/music on.png';
import musicOffIcon from '../assets/music_off.png';
import lofiTrack from '../assets/lofi.mp3';

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
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Audio playback error:', err);
        });
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex items-center justify-center select-none">
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleMusic}
        title={isPlaying ? 'Pause Music' : 'Play Music'}
        className={`relative flex items-center justify-center h-14 w-14 rounded-[24px] cursor-pointer transition-all duration-300 backdrop-blur-[4px] backdrop-saturate-200 overflow-hidden ${
          isPlaying
            ? 'bg-gradient-to-br from-[#5ce1e6]/30 via-sky-400/15 to-transparent border-t border-l border-cyan-300/80 border-b border-r border-[#5ce1e6]/30 shadow-[0_10px_25px_rgba(0,0,0,0.35),0_0_20px_rgba(92,225,230,0.45),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(92,225,230,0.3)]'
            : 'bg-gradient-to-br from-white/30 via-cyan-400/10 to-transparent border-t border-l border-white/80 border-b border-r border-white/20 hover:border-cyan-300/80 hover:bg-gradient-to-br hover:from-[#5ce1e6]/25 hover:via-sky-400/10 hover:to-transparent shadow-[0_10px_25px_rgba(0,0,0,0.35),0_0_15px_rgba(92,225,230,0.25),inset_0_2px_4px_rgba(255,255,255,0.65),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
        }`}
      >
        {/* Liquid Water Wave shimmer inside the glass droplet */}
        <motion.div
          animate={{
            borderRadius: ['40% 60% 70% 30%/40% 50% 60% 50%', '60% 40% 30% 70%/50% 60% 40% 60%', '40% 60% 70% 30%/40% 50% 60% 50%'],
            transform: ['translateY(0px) rotate(0deg)', 'translateY(1px) rotate(180deg)', 'translateY(0px) rotate(360deg)']
          }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute -bottom-3 -left-3 -right-3 h-10 bg-cyan-400/15 pointer-events-none blur-[1px]"
        />

        {/* Animated Soundwaves inside the liquid glass button */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center gap-[3px] pointer-events-none z-10"
            >
              <motion.span
                animate={{ height: ['25%', '85%', '35%', '75%', '25%'] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="w-1 bg-[#5ce1e6]/75 rounded-full h-8 shadow-[0_0_8px_#5ce1e6]"
              />
              <motion.span
                animate={{ height: ['65%', '25%', '95%', '45%', '65%'] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
                className="w-1 bg-[#7de7eb]/85 rounded-full h-8 shadow-[0_0_8px_#7de7eb]"
              />
              <motion.span
                animate={{ height: ['35%', '75%', '45%', '90%', '35%'] }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut', delay: 0.2 }}
                className="w-1 bg-[#5ce1e6]/75 rounded-full h-8 shadow-[0_0_8px_#5ce1e6]"
              />
              <motion.span
                animate={{ height: ['85%', '45%', '65%', '25%', '85%'] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.15 }}
                className="w-1 bg-[#7de7eb]/85 rounded-full h-8 shadow-[0_0_8px_#7de7eb]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music icon */}
        <img
          src={isPlaying ? musicOnIcon : musicOffIcon}
          alt={isPlaying ? 'Music On' : 'Music Off'}
          className="relative z-20 h-9 w-9 object-contain drop-shadow-[0_2px_8px_rgba(92,225,230,0.8)]"
        />
      </motion.button>
    </div>
  );
};

export default MusicPlayer;
