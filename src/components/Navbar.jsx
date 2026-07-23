import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { close, menu } from '../assets';
import { brand, navLinks, socialMedia } from '../data/siteConfig';
import LiquidGlassFilter from './LiquidGlassFilter';

const linkVariants = {
  hover: {
    scale: 1.1,
    opacity: 0.8,
  },
  tap: {
    scale: 0.9,
  },
};

// Stagger the pause-menu items in like options dropping onto a Start screen.
const panelVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 24 } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.12 } },
};

const Navbar = () => {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHovered, setIsHovered] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Mark the current route's row with the ▸ cursor. '/' and '/home' both map to "home".
  const currentId = location.pathname === '/' ? 'home' : location.pathname.replace(/^\//, '');

  const handleNavigation = (id) => {
    setToggle(false);
    const to = `/${id}`;
    const startY = window.scrollY;

    document.body.classList.add('cursor-loading');

    if (startY === 0) {
      navigate(to);
      return;
    }

    const duration = 800;
    const startTime = performance.now();

    const animateScroll = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startY * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        navigate(to);
      }
    };
    requestAnimationFrame(animateScroll);
  };

  // While the pause menu is open (narrow screens only): close on Esc, freeze scroll, add pause-menu-open class.
  useEffect(() => {
    if (!toggle) {
      document.body.classList.remove('pause-menu-open');
      return;
    }

    document.body.classList.add('pause-menu-open');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setToggle(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setToggle(false);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    return () => {
      document.body.classList.remove('pause-menu-open');
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [toggle]);

  return (
    <>
      <div className={`fixed top-0 left-0 w-full flex justify-center pt-3 pb-1 px-4 z-50 pointer-events-none transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-[150%]'}`}>
      <LiquidGlassFilter id="navbar-glass" targetRef={navRef} options={{ blur: 0.5, refractionScale: 1.5, radius: 22 }} />
      <nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: -999, y: -999 });
        }}
        style={{ '--svg-glass-url': 'url(#navbar-glass)' }}
        className="glass-card use-svg-glass w-[min(94vw,700px)] h-11 sm:h-13 flex items-center justify-between px-6 sm:px-10 !rounded-full transition-all mx-auto relative pointer-events-auto !overflow-hidden sm:!overflow-visible"
      >
        {/* Dynamic Hover Glow Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-0 overflow-hidden !rounded-full"
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(100px circle at ${mousePos.x}px ${mousePos.y}px, rgba(92,225,230,0.35), transparent 85%)`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Logo directly inside navbar (pops cleanly out over top/bottom of slim card) */}
        <motion.div
          whileHover={{ scale: 1.3, y: -1 }}
          whileTap={{ scale: 1.2 }}
          onClick={() => handleNavigation('home')}
          className="flex items-center cursor-pointer select-none z-30 relative"
          title="Home"
        >
          <img
            src={brand.logo}
            alt={brand.alt}
            className="h-12 sm:h-15 max-w-none object-contain drop-shadow-[0_0_16px_rgba(92,225,230,0.9)] transition-all duration-200"
          />
        </motion.div>

        {/* Desktop Navigation Links */}
        <ul className="list-none sm:flex text-xs hidden items-center gap-8 sm:gap-12 z-10">
          {navLinks.map((nav) => (
            <motion.li
              key={nav.id}
              variants={linkVariants}
              whileHover="hover"
              whileTap="tap"
              className="font-source-code-pro font-semibold cursor-pointer text-base sm:text-lg text-white hover:text-[#5ce1e6] transition-colors"
              onClick={() => handleNavigation(nav.id)}
            >
              <span className="text-white hover:text-[#5ce1e6] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {nav.title}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Mobile Hamburger button */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            className="relative z-10 p-1"
            aria-label={toggle ? 'Close menu' : 'Open menu'}
            aria-expanded={toggle}
            onClick={() => setToggle((v) => !v)}
          >
            <img
              src={toggle ? close : menu}
              alt=""
              className="w-[24px] h-[24px] object-contain"
            />
          </button>
        </div>

        {/* Portal to <body> so the overlay escapes the navbar's z-10 stacking context */}
        {createPortal(
          <AnimatePresence>
            {toggle && (
              <motion.div
                className="pause-menu fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setToggle(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
              >
                {/* CRT flavor over the dimmed scene; non-interactive. */}
                <div className="pause-scanlines" aria-hidden="true" />
                <div className="pause-vignette" aria-hidden="true" />

                {/* The overlay covers the navbar, so the close control lives here. */}
                <button
                  type="button"
                  className="pause-close"
                  aria-label="Close menu"
                  onClick={() => setToggle(false)}
                >
                  <span aria-hidden="true">✕</span>
                </button>

                {/* Taps inside the panel must not close the menu. */}
                <motion.div
                  className="pause-panel"
                  variants={panelVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div className="pause-title" variants={itemVariants}>
                    <span className="pause-led" aria-hidden="true" />
                    <span>❚❚ PAUSED</span>
                  </motion.div>

                  {navLinks.map((nav) => {
                    const isActive = currentId === nav.id;
                    return (
                      <motion.button
                        key={nav.id}
                        type="button"
                        variants={itemVariants}
                        className={`pause-row ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleNavigation(nav.id)}
                      >
                        <span className="pause-row-cursor" aria-hidden="true">
                          {isActive ? '▸' : ''}
                        </span>
                        <span className="pause-row-label">{nav.title}</span>
                        <span className="pause-row-chevron" aria-hidden="true">
                          {'>'}
                        </span>
                      </motion.button>
                    );
                  })}

                  <motion.div className="pause-foot" variants={itemVariants}>
                    <div className="pause-jacks">
                      {socialMedia.map((s) => (
                        <a
                          key={s.id}
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          className="pause-jack"
                        >
                          <img src={s.icon} alt="" />
                        </a>
                      ))}
                      {/* Resume as a circular icon to match the social jacks. */}
                      <button
                        type="button"
                        className="pause-jack"
                        aria-label="Resume"
                        onClick={() => handleNavigation('resume')}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                          <path d="M14 3v5h5" />
                          <line x1="9" y1="13" x2="15" y2="13" />
                          <line x1="9" y1="17" x2="13" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </nav>
      </div>
    </>
  );
};

export default Navbar;
