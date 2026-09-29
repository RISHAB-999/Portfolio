import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-[#5ce1e6]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 stroke-[2.5]"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

// Action Button Component with smooth upward hover dropdown
const ProjectAction = ({ action, size = 'md' }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const hasDropdown = Array.isArray(action.dropdown) && action.dropdown.length > 0;

  // Handle outside clicks to close dropdown on mobile/touch
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleMouseEnter = () => {
    if (!hasDropdown) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hasDropdown) return;
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 180);
  };

  const handleButtonClick = (e) => {
    if (hasDropdown) {
      e.preventDefault();
      setDropdownOpen((prev) => !prev);
    }
  };

  // Base styling matching original design
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  const buttonClasses = action.primary
    ? `inline-flex items-center gap-1.5 rounded-lg bg-blue-gradient ${sizeClasses} font-source-code-pro font-semibold text-black transition-transform duration-200 hover:scale-[1.03] cursor-pointer`
    : `inline-flex items-center gap-1.5 rounded-lg border border-[#5ce1e6]/40 ${sizeClasses} font-source-code-pro font-semibold text-[#5ce1e6] transition-colors duration-200 hover:border-[#5ce1e6] hover:bg-[#5ce1e6]/10 cursor-pointer`;

  if (!hasDropdown) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
      >
        {action.label} <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        className={buttonClasses}
      >
        <span>{action.label}</span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5">
          <AnimatePresence mode="wait" initial={false}>
            {dropdownOpen ? (
              <motion.span
                key="up"
                initial={{ opacity: 0, y: 2, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 2, scale: 0.8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="inline-flex items-center justify-center"
                aria-hidden="true"
              >
                <ChevronUpIcon />
              </motion.span>
            ) : (
              <motion.span
                key="diagonal"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="inline-block leading-none select-none"
                aria-hidden="true"
              >
                ↗
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>

      {/* Dropdown Menu (Opens upward above the button) */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 bottom-full mb-2 z-50 min-w-[210px] overflow-visible rounded-xl border border-[#5ce1e6]/40 bg-[#0b0f1f] p-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-3 after:content-['']"
          >
            <div className="space-y-1">
              {action.dropdown.map((item, idx) => {
                const isVideo = item.isVideo || item.label.toLowerCase().includes('demo');
                return (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDropdownOpen(false)}
                    className="group flex w-full items-center justify-between rounded-lg px-3 py-2 font-source-code-pro text-xs font-semibold text-white/90 transition-colors hover:bg-[#5ce1e6]/15 hover:text-[#5ce1e6] cursor-pointer"
                  >
                    <span>{item.label}</span>
                    {isVideo ? (
                      <VideoIcon />
                    ) : (
                      <span aria-hidden="true" className="text-white/40 group-hover:text-[#5ce1e6]">
                        ↗
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectAction;
