import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScrollLink = ({ to, className, children, ...props }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    const startY = window.scrollY;

    document.body.classList.add('cursor-loading');

    if (startY === 0) {
      navigate(to);
      return;
    }

    const duration = 800; // Smooth 800ms scroll to top
    const startTime = performance.now();

    const animateScroll = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      window.scrollTo(0, startY * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        navigate(to);
      }
    };
    requestAnimationFrame(animateScroll);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
};

export default ScrollLink;
