import { useState } from 'react';
import { motion } from 'framer-motion';
import { careerTimeline } from '../../data/homeShowcase';
import Bullet from '../Bullet';

const CareerTimeline = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  return (
  // The 02 SectionDivider in PostFooterHome carries the big "Experience" title;
  // this block adds a quieter eyebrow and the timeline of roles, each role body
  // sitting in its own card.
  <section className="mb-10 text-left">
    <p className="mb-5 font-source-code-pro text-sm font-bold uppercase tracking-[0.3em] text-[#5ce1e6] sm:text-base pixel-shadow">
      My career so far
    </p>
    <div className="career-spotlight mx-auto max-w-5xl space-y-5">
      {careerTimeline.map((job, i) => (
        <div
          key={job.id}
          className="career-row flex gap-4 sm:gap-5"
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Logo */}
          <div className="relative flex flex-none flex-col items-center">
            <div
              className={`timeline-logo-box relative z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border bg-[#0b0f1f] sm:h-16 sm:w-16 ${
                job.current
                  ? 'border-[#5ce1e6]/50 shadow-[0_0_16px_rgba(92,225,230,0.5)]'
                  : 'border-white/10'
              }`}
            >
              {job.logo ? (
                <img src={job.logo} alt={`${job.company} logo`} loading="lazy" decoding="async" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#5ce1e6]/10 text-xl font-bold uppercase tracking-wider text-[#5ce1e6] font-source-code-pro">
                  {job.company.charAt(0)}
                </div>
              )}
            </div>
            {i < careerTimeline.length - 1 && (
              <div className="absolute top-14 bottom-[-20px] w-[1px] bg-white/10 sm:top-16">
                {/* Neon Glow Blur Layer */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={hoveredIndex !== null ? { height: (hoveredIndex >= i + 1) ? '100%' : 0 } : undefined}
                  whileInView={hoveredIndex === null ? { height: '100%' } : undefined}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-x-0 top-0 w-3 left-1/2 -translate-x-1/2 bg-[#5ce1e6]/30 blur-[3px]"
                />
                {/* Sharp Center Line */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={hoveredIndex !== null ? { height: (hoveredIndex >= i + 1) ? '100%' : 0 } : undefined}
                  whileInView={hoveredIndex === null ? { height: '100%' } : undefined}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="relative z-10 w-full h-full bg-[#5ce1e6] shadow-[0_0_8px_#5ce1e6]"
                />
              </div>
            )}
          </div>

          {/* Role card */}
          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b0f1f]/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl pixel-shadow">{job.company}</h3>
              {(job.current || job.period) && (
                <span
                  className={`flex-none whitespace-nowrap rounded-full border px-3 py-1 text-center font-source-code-pro text-sm ${
                    job.current
                      ? 'border-[#5ce1e6]/40 bg-gradient-to-r from-[#2d6cdf] to-[#33bbcf] text-white shadow-[0_0_12px_rgba(92,225,230,0.5)]'
                      : 'border-white/20 text-white/70'
                  }`}
                >
                  {job.current ? (
                    <span className="inline-flex items-center justify-center gap-1.5 leading-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5ce1e6] shadow-[0_0_6px_#5ce1e6]" />
                      {job.period || 'Current'}
                    </span>
                  ) : (
                    job.period
                  )}
                </span>
              )}
            </div>

            <p className="mt-1 mb-3 font-source-code-pro text-base text-white/70 sm:text-lg pixel-shadow">{job.subtitle}</p>

            <ul className="space-y-1.5 font-source-code-pro text-base text-white/85 sm:text-[17px] pixel-shadow">
              {job.bullets.map((b, bi) => (
                <li key={bi} className="flex gap-2">
                  <span className="flex-none text-[#5ce1e6]">▸</span>
                  <span><Bullet text={b} /></span>
                </li>
              ))}
            </ul>

            {job.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 px-2.5 py-0.5 font-source-code-pro text-sm text-white/75"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
  );
};

export default CareerTimeline;
