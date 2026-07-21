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
    <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-2 select-none">
      {/* Animated Soundwaves / Equalizer bars when music is ON */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-end gap-1 h-7 px-2.5 py-1 rounded-lg border border-[#5ce1e6]/40 bg-[#0b0f1f]/90 backdrop-blur-md shadow-[0_0_12px_rgba(92,225,230,0.3)]"
          >
            <motion.span
              animate={{ height: ['20%', '100%', '30%', '80%', '20%'] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
              className="w-1 bg-[#5ce1e6] rounded-full"
            />
            <motion.span
              animate={{ height: ['60%', '20%', '90%', '40%', '60%'] }}
              transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
              className="w-1 bg-[#7de7eb] rounded-full"
            />
            <motion.span
              animate={{ height: ['30%', '80%', '40%', '100%', '30%'] }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut', delay: 0.2 }}
              className="w-1 bg-[#5ce1e6] rounded-full"
            />
            <motion.span
              animate={{ height: ['90%', '40%', '70%', '20%', '90%'] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.15 }}
              className="w-1 bg-[#7de7eb] rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Music Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMusic}
        title={isPlaying ? 'Pause Music' : 'Play Music'}
        className={`relative flex items-center justify-center h-12 w-12 rounded-xl border transition-all duration-300 backdrop-blur-md shadow-lg ${
          isPlaying
            ? 'border-[#5ce1e6] bg-[#5ce1e6]/20 shadow-[0_0_15px_rgba(92,225,230,0.5)]'
            : 'border-white/20 bg-[#0b0f1f]/80 hover:border-[#5ce1e6]/50'
        }`}
      >
        <img
          src={isPlaying ? musicOnIcon : musicOffIcon}
          alt={isPlaying ? 'Music On' : 'Music Off'}
          className="h-7 w-7 object-contain drop-shadow-[0_0_4px_rgba(92,225,230,0.6)]"
        />
      </motion.button>
    </div>
  );
};

export default MusicPlayer;
