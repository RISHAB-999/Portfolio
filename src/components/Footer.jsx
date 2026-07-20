import styles from "../style";
import { socialMedia, contactInfo } from "../data/siteConfig";
import { motion } from 'framer-motion';
import { email } from '../assets';
import ScrollLink from './ScrollLink';

const hoverVariants = {
  hover: {
    scale: 1.1,
    transition: { duration: 0.3, ease: 'easeInOut' },
  },
};

const Footer = () => (
  <section className={`${styles.flexCenter} py-4  px-8 flex-col mt-auto`}>
    <div className="w-full flex flex-col sm:grid sm:grid-cols-3 items-center">
      {/* Resume Button with Motion — hidden < 768px (lives in the mobile pause menu). */}
      <motion.div
        whileHover="hover"
        variants={hoverVariants}
        className="hidden sm:block mb-6 sm:mb-0 z-10 sm:justify-self-start"
      >
        <ScrollLink
          to="/resume"
          className="text-white rock-surface text-xs py-2 px-4 pixel-shadow"
        >
          Resume
        </ScrollLink>
      </motion.div>

      {/* Social Media Icons — hidden < 768px (live in the mobile pause menu). */}
      <div className="hidden sm:flex flex-wrap justify-center gap-3 mb-4 sm:mb-0 sm:justify-self-center">
        {socialMedia.map((social) => (
          <motion.div
            key={social.id}
            whileHover="hover"
            variants={hoverVariants}
            className="flex items-center rock-surface text-xs py-2 px-2"
          >
            <a href={social.link} target="_blank" rel="noopener noreferrer">
              <img
                src={social.icon}
                alt={social.link}
                loading="lazy"
                decoding="async"
                className="w-[25px] h-[25px] object-contain cursor-pointer"
              />
            </a>
          </motion.div>
        ))}
      </div>

      {/* Email Button with Motion */}
      <motion.div
        whileHover="hover"
        variants={hoverVariants}
        className="sm:mb-0 sm:justify-self-end"
      >
        <a
          href={`mailto:${contactInfo.email}`}
          className="flex items-center text-white rock-surface text-xs py-2 px-4 pixel-shadow"
        >
          <img src={email} alt="Email Icon" loading="lazy" decoding="async" className="w-[25px] h-[15px] mr-2" />
          {contactInfo.email}
        </a>
      </motion.div>
    </div>
  </section>
);

export default Footer;
