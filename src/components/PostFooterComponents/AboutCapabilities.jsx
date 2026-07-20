import ScrollLink from '../ScrollLink';
import { motion } from 'framer-motion';
import { aboutIntro, whatIDo } from '../../data/home';
import rishab from '../../assets/Rishab.jpeg';

// Two stacked sections: a boxed "About" intro panel (the one faded box kept on
// the home post-footer), and a flat "What I Do" capability list — one row per
// discipline: icon tile + title + description.
const AboutCapabilities = () => (
  <>
    {/* About — faded intro panel */}
    <section className="mb-10">
      <ScrollLink
        to={aboutIntro.ctaTo}
        className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#222a47]/55 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#5ce1e6] hover:bg-[#5ce1e6] hover:shadow-[0_0_36px_rgba(92,225,230,0.5)] sm:p-9"
      >
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-12">
          <div className="relative h-44 w-44 sm:h-56 sm:w-56 flex-none overflow-hidden rounded-[32px] border-2 border-[#5ce1e6]/60 bg-[#0b0f1f] shadow-[0_0_16px_rgba(92,225,230,0.35)] transition-transform duration-300 ease-out hover:scale-110 cursor-pointer">
            <img
              src={rishab}
              alt="Rishab Negi"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-110"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1 font-source-code-pro text-sm font-bold uppercase tracking-[0.3em] text-[#5ce1e6] transition-colors duration-200 group-hover:text-black">
              About
            </p>
            <h2 className="text-3xl font-bold leading-tight text-white transition-colors duration-200 group-hover:text-black sm:text-4xl">{aboutIntro.title}</h2>
            <p className="mt-2 font-source-code-pro text-base text-white/70 transition-colors duration-200 group-hover:text-black/80 sm:text-lg">{aboutIntro.body}</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-none">
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-gradient px-5 py-3 font-source-code-pro text-base font-semibold text-black transition-colors duration-200 group-hover:bg-none group-hover:bg-[#0b0f1f] group-hover:text-[#5ce1e6]">
              {aboutIntro.ctaLabel} <span aria-hidden="true">→</span>
            </span>
          </motion.div>
        </div>
      </ScrollLink>
    </section>

    {/* What I Do — 4-up capability cards */}
    <section className="mb-10">
      <p className="mb-2 font-source-code-pro text-sm font-bold uppercase tracking-[0.3em] text-[#5ce1e6] sm:text-base pixel-shadow">
        {whatIDo.heading}
      </p>
      <h2 className="mb-6 text-3xl font-bold text-white sm:mb-8 sm:text-4xl pixel-shadow">{whatIDo.subtitle}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whatIDo.cards.map((item) => (
          <div
            key={item.title}
            className="group cursor-pointer rounded-2xl border border-white/10 bg-[#0b0f1f]/40 p-5 transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#5ce1e6] hover:shadow-[0_0_28px_rgba(92,225,230,0.55)]"
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[#5ce1e6]/30 bg-[#0b0f1f]/60">
              <img src={item.logo} alt="" loading="lazy" decoding="async" className="h-7 w-7 object-contain" />
            </div>
            <h3 className="font-bold leading-tight text-white text-lg sm:text-xl">{item.title}</h3>
            <p className="mt-2 font-source-code-pro text-base text-white/70">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  </>
);

export default AboutCapabilities;
