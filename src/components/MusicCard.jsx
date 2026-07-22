import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import musicOnIcon from '../assets/music on.png';
import musicOffIcon from '../assets/music_off.png';
import kirbyGif from '../assets/kirby.gif';
import { playlist } from './playlistData';

const MusicCard = ({
  isPlaying,
  volume,
  currentTrackIndex,
  currentTime,
  duration,
  toggleMusic,
  handleVolumeChange,
  handleSeek,
  changeTrack,
  onClose,
  isMobileNav = false,
}) => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const currentTrack = playlist[currentTrackIndex] || playlist[0];
  const autoCloseTimerRef = useRef(null);
  const cardRef = useRef(null);

  // Click Outside to Minimize/Close Card
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [onClose]);

  const resetTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      onClose();
    }, 10000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [isPlaying, currentTrackIndex]);

  const handleMouseEnter = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    resetTimer();
  };

  const handleStopAndClose = (e) => {
    toggleMusic(e);
    onClose();
  };

  const formatTime = (timeSec) => {
    if (!timeSec || isNaN(timeSec)) return '0:00';
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transformOrigin: isMobileNav ? 'bottom center' : 'top left' }}
      className={`relative w-[min(92vw,310px)] ${
        isMobileNav ? 'p-2.5 text-xs' : 'p-3.5 sm:p-4'
      } rounded-3xl backdrop-blur-[2px] bg-cyan-400/10 border-t-2 border-l-2 border-[#5ce1e6] border-b border-r border-[#5ce1e6]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(92,225,230,0.35),inset_0_2px_4px_rgba(255,255,255,0.7)] text-white overflow-hidden pointer-events-auto mx-auto`}
    >
      {/* Ambient Shimmer */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#5ce1e6]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={`flex items-center justify-between ${isMobileNav ? 'mb-2 pb-1.5' : 'mb-3 pb-2'} border-b border-[#5ce1e6]/25`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-[#5ce1e6]' : 'bg-gray-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-[#5ce1e6]' : 'bg-gray-400'}`} />
          </span>
          <span className="text-[10px] font-bold tracking-widest text-[#5ce1e6] uppercase">
            {isPlaying ? 'NOW PLAYING' : 'MUSIC PAUSED'}
          </span>
        </div>

        {/* Music Stop & Close Button */}
        <button
          onClick={handleStopAndClose}
          title="Stop Music & Close"
          className="p-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-[#5ce1e6]/40 text-[#5ce1e6] cursor-pointer shadow-[0_0_12px_rgba(92,225,230,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <img src={isPlaying ? musicOnIcon : musicOffIcon} alt="Stop & Close" className="w-4 h-4 object-contain" />
        </button>
      </div>

      {/* Album Art (Clicking picture toggles playlist menu) & Track Info */}
      <div className={`flex items-center gap-2.5 ${isMobileNav ? 'mb-2' : 'mb-3'}`}>
        <button
          onClick={() => setShowPlaylist((prev) => !prev)}
          title="Click to choose another song"
          className="relative shrink-0 cursor-pointer group outline-none border-0 bg-transparent"
        >
          {isPlaying && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
              className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#5ce1e6] to-cyan-400 opacity-60 blur-[2px]"
            />
          )}
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className={`relative ${isMobileNav ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl object-cover border border-[#5ce1e6]/50 shadow-md group-hover:scale-105 transition-transform`}
          />
          <img
            src={kirbyGif}
            alt="Kirby"
            className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          />
          {/* Overlay indication */}
          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-[#5ce1e6] transition-opacity">
            Songs 🎵
          </div>
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-xs font-extrabold text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {currentTrack.title}
          </h4>
          <span className="inline-block mt-0.5 text-[9px] text-gray-300 bg-white/10 px-2 py-0.5 rounded-full w-max border border-white/15">
            {currentTrack.tag}
          </span>
        </div>
      </div>

      {/* Interactive Song Playlist Selector Menu (Opens when clicking Album Art) */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1 max-h-32 overflow-y-auto mb-2 pr-1 bg-black/40 p-1.5 rounded-2xl border border-[#5ce1e6]/30 custom-scrollbar"
          >
            <span className="text-[9px] font-bold text-[#5ce1e6] uppercase tracking-wider mb-0.5 px-1">
              Select Song ({playlist.length})
            </span>
            {playlist.map((track, idx) => {
              const isActive = idx === currentTrackIndex;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    changeTrack(idx);
                    setShowPlaylist(false);
                  }}
                  className={`flex items-center justify-between p-1 rounded-xl text-left transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#5ce1e6]/20 border-[#5ce1e6] text-[#5ce1e6] shadow-[0_0_10px_rgba(92,225,230,0.3)]'
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src={track.cover} alt={track.title} className="w-5 h-5 rounded-md object-cover shrink-0" />
                    <span className="text-[10px] font-semibold truncate">{track.title}</span>
                  </div>
                  {isActive && <span className="text-[8px] font-bold text-[#5ce1e6] shrink-0 ml-1">Playing 🎵</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Music Time Scrubber / Seek Bar (Red & Cyan Progress Bar) */}
      <div className={`flex flex-col gap-0.5 ${isMobileNav ? 'mb-2 p-1.5' : 'mb-2.5 p-2'} bg-white/5 rounded-xl border border-white/10`}>
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-300 font-bold px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-700/80 rounded-lg appearance-none cursor-pointer accent-[#5ce1e6] hover:accent-white transition-all"
        />
      </div>

      {/* Audio Controls Bar (Liquid Glass buttons matching main card aesthetic) */}
      <div className="flex items-center justify-between gap-1.5 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-[#5ce1e6]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
        {/* Prev, Play-Pause, Next Navigation Buttons with Liquid Glass & 3D bevels */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <motion.button
            whileHover={{ y: -2, scale: 1.08 }}
            whileTap={{ y: 2, scale: 0.92 }}
            onClick={() => changeTrack(currentTrackIndex - 1)}
            title="Previous Track"
            className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md bg-cyan-400/15 hover:bg-cyan-400/30 border-t-2 border-l-2 border-[#5ce1e6]/90 border-b border-r border-[#5ce1e6]/30 text-white hover:text-[#5ce1e6] shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(92,225,230,0.35),inset_0_1.5px_3px_rgba(255,255,255,0.7)] cursor-pointer text-xs font-bold transition-all"
          >
            ⏮
          </motion.button>

          <motion.button
            whileHover={{ y: -2, scale: 1.1 }}
            whileTap={{ y: 2, scale: 0.9 }}
            onClick={toggleMusic}
            title={isPlaying ? 'Pause' : 'Play'}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md cursor-pointer text-base font-bold transition-all ${
              isPlaying
                ? 'bg-gradient-to-br from-[#5ce1e6]/90 via-cyan-400/90 to-cyan-500/90 text-black border-t-2 border-l-2 border-white border-b border-r border-cyan-300 shadow-[0_6px_20px_rgba(92,225,230,0.7),0_0_25px_rgba(92,225,230,0.6),inset_0_2px_4px_rgba(255,255,255,0.9)]'
                : 'bg-cyan-400/20 hover:bg-cyan-400/40 text-[#5ce1e6] hover:text-white border-t-2 border-l-2 border-[#5ce1e6] border-b border-r border-[#5ce1e6]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_15px_rgba(92,225,230,0.45),inset_0_1.5px_3px_rgba(255,255,255,0.8)]'
            }`}
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>

          <motion.button
            whileHover={{ y: -2, scale: 1.08 }}
            whileTap={{ y: 2, scale: 0.92 }}
            onClick={() => changeTrack(currentTrackIndex + 1)}
            title="Next Track"
            className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md bg-cyan-400/15 hover:bg-cyan-400/30 border-t-2 border-l-2 border-[#5ce1e6]/90 border-b border-r border-[#5ce1e6]/30 text-white hover:text-[#5ce1e6] shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(92,225,230,0.35),inset_0_1.5px_3px_rgba(255,255,255,0.7)] cursor-pointer text-xs font-bold transition-all"
          >
            ⏭
          </motion.button>
        </div>

        {/* Animated Expandable Volume Control with Liquid Glass Speaker button */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-center gap-1.5 overflow-hidden pr-1"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-20 h-1 bg-gray-700/80 rounded-lg appearance-none cursor-pointer accent-[#5ce1e6]"
                />
                <span className="text-[10px] text-[#5ce1e6] font-source-code-pro font-semibold min-w-[28px] text-right">
                  {Math.round(volume * 100)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ y: -2, scale: 1.12 }}
            whileTap={{ y: 2, scale: 0.9 }}
            onClick={() => setShowVolumeSlider((prev) => !prev)}
            title={showVolumeSlider ? 'Close Volume Slider' : 'Open Volume Slider'}
            className="w-9 h-9 rounded-2xl backdrop-blur-md bg-cyan-400/15 hover:bg-cyan-400/30 border-t-2 border-l-2 border-[#5ce1e6]/90 border-b border-r border-[#5ce1e6]/30 text-[#5ce1e6] hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(92,225,230,0.35),inset_0_1.5px_3px_rgba(255,255,255,0.7)] transition-all cursor-pointer text-xs flex items-center justify-center"
          >
            {volume === 0 ? '🔇' : '🔊'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicCard;
