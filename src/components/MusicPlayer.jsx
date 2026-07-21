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
        className={`relative flex items-center justify-center h-14 w-14 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-300 ${
          isPlaying
            ? 'border-[#5ce1e6]/70 bg-[#5ce1e6]/20 shadow-[0_0_20px_rgba(92,225,230,0.45),inset_0_0_12px_rgba(92,225,230,0.3)]'
            : 'border-[#5ce1e6]/35 bg-[#0b0f1f]/50 hover:bg-[#5ce1e6]/15 hover:border-[#5ce1e6]/60 shadow-[0_0_12px_rgba(92,225,230,0.2)]'
        }`}
      >
        {/* Animated Soundwaves inside the transparent button */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center gap-[3px] pointer-events-none"
            >
              <motion.span
                animate={{ height: ['25%', '85%', '35%', '75%', '25%'] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="w-1 bg-[#5ce1e6]/70 rounded-full h-8 shadow-[0_0_8px_#5ce1e6]"
              />
              <motion.span
                animate={{ height: ['65%', '25%', '95%', '45%', '65%'] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
                className="w-1 bg-[#7de7eb]/80 rounded-full h-8 shadow-[0_0_8px_#7de7eb]"
              />
              <motion.span
                animate={{ height: ['35%', '75%', '45%', '90%', '35%'] }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut', delay: 0.2 }}
                className="w-1 bg-[#5ce1e6]/70 rounded-full h-8 shadow-[0_0_8px_#5ce1e6]"
              />
              <motion.span
                animate={{ height: ['85%', '45%', '65%', '25%', '85%'] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.15 }}
                className="w-1 bg-[#7de7eb]/80 rounded-full h-8 shadow-[0_0_8px_#7de7eb]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music icon */}
        <img
          src={isPlaying ? musicOnIcon : musicOffIcon}
          alt={isPlaying ? 'Music On' : 'Music Off'}
          className="relative z-10 h-9 w-9 object-contain drop-shadow-[0_0_8px_rgba(92,225,230,0.8)]"
        />
      </motion.button>
    </div>
  );
};

export default MusicPlayer;
