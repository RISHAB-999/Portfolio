import { useState, useEffect, useRef } from 'react';
import styles from '../style';
import { hero } from '../data/home';

const titles = hero.titles;

// a word of the name, for the first-load "comes out of the screen" reveal (index.css)
const BootWord = ({ i, className = '', children }) => (
  <span className="boot-word" style={{ '--i': i }}>
    <span className={`boot-word-in ${className}`}>{children}</span>
  </span>
);

const CentreBlock = () => {
  const [titleText, setTitleText] = useState('');

  const [titleIndex, setTitleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const typingRef = useRef();

  useEffect(() => {
    const pauseBeforeDelete = 2000;
    const pauseBeforeNext = 2000;

    const typeTitle = () => {
      if (!deleting) {
        if (charIndex < titles[titleIndex].length) {
          setTitleText(titles[titleIndex].substring(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
          typingRef.current = setTimeout(typeTitle, 50);
        } else {
          typingRef.current = setTimeout(() => {
            setDeleting(true);
            typeTitle();
          }, pauseBeforeDelete);
        }
      } else {
        if (charIndex > 0) {
          setTitleText(titles[titleIndex].substring(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
          typingRef.current = setTimeout(typeTitle, 50);
        } else {
          setDeleting(false);
          setTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
          setCharIndex(0);
          typingRef.current = setTimeout(typeTitle, pauseBeforeNext);
        }
      }
    };

    typingRef.current = setTimeout(typeTitle, 25);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [charIndex, titleIndex, deleting]);



  return (
    <section id="home" className={`relative flex items-start ${styles.paddingY}`}>
      <div className={`${styles.flexStart} flex-col px-6 sm:px-16 xl:px-0`}>
        <div>
          <p className="boot-after text-left font-source-code-pro font-semibold uppercase tracking-[0.25em] text-white text-sm sm:text-base mb-2 pixel-shadow" style={{ '--i': 0 }}>
            {hero.eyebrow}
          </p>
          <h1 className="text-left font-source-code-pro font-bold text-white md:mr-10 md:text-[80px] text-[28px] xs:text-[36px] sm:text-[50px] leading-[1.05] mb-3 sm:mb-5 pixel-shadow text-wrap">
            {/* each word comes out of the screen on first load (index.css) */}
            <BootWord i={0}>{hero.name.first}</BootWord>{' '}
            <BootWord i={1}>{hero.name.last}</BootWord>{' '}
            {hero.name.nick && (
              <BootWord i={2} className="text-[#5ce1e6]">&ldquo;{hero.name.nick}&rdquo;</BootWord>
            )}
          </h1>
          <p className="boot-after font-source-code-pro font-normal text-white md:mr-10 md:text-[30px] text-[18px] sm:text-[25px] mb-2 sm:mb-3 pixel-shadow" style={{ '--i': 1 }}>
            {hero.prefix}{titleText}
            <span className="cursor-blink">|</span>
          </p>
          <p className="boot-after font-source-code-pro font-normal text-white md:mr-10 md:text-[22px] text-[14px] sm:text-[18px] pixel-shadow" style={{ '--i': 2 }}>
            {hero.location}
          </p>
        </div>
      </div>

    </section>
  );
};

export default CentreBlock;
