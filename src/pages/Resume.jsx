// Resume page — styled HTML version matching the portfolio's pixel/terminal theme.
// Layout inspired by the "COMPETENCE_ANALYSIS_REPORT" terminal aesthetic from the reference,
// but using the portfolio's cyan (#5ce1e6) accent, source-code-pro, and pixelify fonts.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScrollLink from '../components/ScrollLink';
import { contactInfo, socialMedia } from '../data/siteConfig';
import { email as emailIcon } from '../assets';
import grassImg from '../assets/grass3.png';
import resumePdf from '../assets/resume.pdf';
import profilePic from '../assets/Rishab.jpeg';

// ─── Resume Data ────────────────────────────────────────────────────────────
const resumeData = {
  name: 'RISHAB NEGI',
  title: 'FULL-STACK_ENGINEER.exe',
  tagline:
    'Computer Science engineer obsessed with the fusion of technical rigor and visual impact. I build scalable full-stack systems, cross-platform mobile apps, and cloud infrastructure — designed to perform and impress.',
  contact: {
    phone: '+91-8130758753',
    email: 'rishabn090@gmail.com',
    github: 'github.com/RISHAB-999',
    linkedin: 'linkedin.com/in/rishabnegi30',
    location: 'Delhi, India',
  },
  education: [
    {
      institution: 'VIVEKANANDA INST. OF PROFESSIONAL STUDIES',
      degree: 'B.Tech in Computer Science & Engineering',
      period: 'Aug 2022 – Sep 2026',
      detail: 'VIPS-TC — Focus: Full-Stack, Flutter, AWS, DSA',
    },
  ],
  experience: [
    {
      role: 'AWS & DEVOPS INTERN',
      company: 'CodeSquadz, Noida',
      period: 'Jul 2025 – Aug 2025',
      points: [
        'Deployed and managed cloud infrastructure on AWS — EC2, S3, RDS, DynamoDB, CloudWatch, IAM.',
        'Practiced DevOps pipelines: Docker, Terraform, CI/CD via GitHub Actions, Linux shell scripting.',
      ],
    },
    {
      role: 'FLUTTER MOBILE DEV TRAINING',
      company: 'Brain Mentors',
      period: 'Jul 2024 – Aug 2024',
      points: [
        'Built cross-platform mobile apps using Flutter & Dart with Firebase backend integration.',
        'Earned certification in Flutter Mobile App Development.',
      ],
    },
  ],
  skills: [
    { label: 'LANGUAGES', value: 'Java · C · C++ · Python · JavaScript · SQL · Dart' },
    { label: 'WEB', value: 'React.js · Node.js · Express.js · HTML · CSS · Tailwind CSS · Vite' },
    { label: 'DATABASE', value: 'MongoDB · Supabase · PostgreSQL · Firebase' },
    { label: 'MOBILE', value: 'Flutter · Android Studio · Firebase · Dart' },
    { label: 'CLOUD & DEVOPS', value: 'AWS (EC2, S3, RDS, DynamoDB) · Docker · Terraform · GitHub Actions · Linux' },
    { label: 'CORE', value: 'Data Structures · Algorithms · OOP · Problem Solving · System Design' },
  ],
  certifications: [
    { name: 'AWS & DEVOPS TRAINING', issuer: 'CodeSquadz', period: 'Jul 2025 – Aug 2025' },
    { name: 'FLUTTER MOBILE APP DEVELOPMENT', issuer: 'Brain Mentors', period: 'Jul 2024 – Aug 2024' },
  ],
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Resume = () => {
  const roles = [
    'Software Developer',
    'Full-Stack Developer',
    'Flutter App Developer',
    'Web Developer'
  ];
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const fullText = roles[currentRoleIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        if (currentText.length === fullText.length) {
          timer = setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
          return;
        }
      }

      const speed = isDeleting ? 50 : 100;
      timer = setTimeout(handleTyping, speed);
    };

    timer = setTimeout(handleTyping, isDeleting ? 50 : 100);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentRoleIndex, roles]);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Dark veil */}
      <div className="fixed inset-0 z-[1] bg-[#06080e]/80" />
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />

      {/* ── Content area ── */}
      <div className="relative z-[5] flex-grow flex flex-col">

        {/* ── Resume body ── */}
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-10 pb-14">

          {/* Top Header Row (matches Subject Profile reference) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-[#5ce1e6]/25 pb-6">
            <div>
              <h1 className="font-pixelify text-5xl text-white pixel-shadow tracking-wide">
                SUBJECT PROFILE
              </h1>
              <p className="font-source-code-pro text-sm text-[#5ce1e6]/60 mt-1.5 uppercase tracking-widest">
                {'// SYSTEM_DATABASE: IDENT_RECORD'}
              </p>
            </div>

            <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="font-source-code-pro text-right text-xs leading-tight">
                <div className="text-white/40 tracking-wider">CASE FILE: RN-999</div>
                <div className="text-[#5ce1e6] font-bold tracking-wider mt-1 flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 bg-[#5ce1e6] rounded-full animate-pulse" />
                  STATUS: GRANTED
                </div>
              </div>

              {/* Download button */}
              <a
                href={resumePdf}
                download="Rishab_Negi_Resume.pdf"
                className="flex items-center gap-2 text-white rock-surface text-sm py-3 px-5 pixel-shadow hover:text-[#5ce1e6] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </a>
            </div>
          </div>

          {/* 3-Column Cyberpunk Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* COLUMN 1: LEFT SIDEBAR (Profile, Ident Metadata, Status) */}
            <motion.div 
              whileHover={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.6)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.3)' 
              }}
              whileTap={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.6)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.3)' 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="lg:col-span-3 border border-[#5ce1e6]/25 bg-[#0b0f1f]/60 p-6 rounded-2xl flex flex-col items-center relative overflow-hidden backdrop-blur-sm"
            >
              
              <h2 className="font-pixelify text-3xl text-white pixel-shadow mb-6 tracking-wide text-center uppercase">
                {resumeData.name}
              </h2>

              {/* Styled Profile Image with the Custom Scale/Hover */}
              <motion.div 
                className="w-full aspect-square max-w-[240px] rounded-2xl border-2 border-[#5ce1e6]/80 pixel-shadow overflow-hidden cursor-pointer flex-shrink-0 relative"
                whileHover="hover"
                whileTap="hover"
                variants={{ hover: { scale: 1.05 } }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Crosshair accents to match screenshot */}
                <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#5ce1e6] z-10 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#5ce1e6] z-10 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#5ce1e6] z-10 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#5ce1e6] z-10 pointer-events-none" />

                <motion.img
                  src={profilePic}
                  alt={resumeData.name}
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300"
                  variants={{ hover: { scale: 1.15 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </motion.div>

              {/* Metadata list */}
              <div className="w-full mt-8 space-y-4 font-source-code-pro text-sm border-t border-[#5ce1e6]/15 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs tracking-wider uppercase">Class:</span>
                  <span className="text-[#5ce1e6] font-bold">
                    {currentText}
                    <span className="animate-pulse ml-0.5 font-normal text-white">|</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs tracking-wider uppercase">Xp_level:</span>
                  <span className="text-white font-bold">ENG_GRADUATE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs tracking-wider uppercase">Lang_1:</span>
                  <span className="text-white">HI (Native)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs tracking-wider uppercase">Lang_2:</span>
                  <span className="text-white">EN (Fluent)</span>
                </div>
              </div>

              {/* Status Indicator */}
              <ScrollLink to="/contact" className="w-full mt-8 block">
                <motion.div
                  whileHover={{ 
                    y: -4, 
                    borderColor: 'rgba(92,225,230,0.8)', 
                    boxShadow: '0 8px 24px rgba(92,225,230,0.25)',
                    backgroundColor: 'rgba(11,15,31,0.95)'
                  }}
                  whileTap={{ 
                    y: -4, 
                    borderColor: 'rgba(92,225,230,0.8)', 
                    boxShadow: '0 8px 24px rgba(92,225,230,0.25)',
                    backgroundColor: 'rgba(11,15,31,0.95)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="border border-[#5ce1e6]/45 bg-[#0b0f1f]/90 p-4 rounded-xl relative overflow-hidden block group"
                >
                  <div className="flex items-center gap-2 font-source-code-pro text-[10px] text-[#5ce1e6]/70 uppercase tracking-widest mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5ce1e6] animate-ping" />
                    System_Alert
                  </div>
                  <div className="font-pixelify text-lg text-white font-bold tracking-widest text-center py-1.5 bg-[#5ce1e6]/10 border border-[#5ce1e6]/20 group-hover:border-[#5ce1e6]/50 group-hover:bg-[#5ce1e6]/25 rounded-md transition-all duration-300">
                    OPEN TO WORK
                  </div>
                  <div className="font-source-code-pro text-[10px] text-white/45 flex justify-between mt-2.5 tracking-wider uppercase border-t border-white/5 pt-2">
                    <span>{'// CONTRACTS: OK'}</span>
                    <span>[REMOTE_READY]</span>
                  </div>
                </motion.div>
              </ScrollLink>
            </motion.div>

            {/* COLUMN 2: CENTER REPORT (Bio, Education, Experience) */}
            <motion.div 
              whileHover={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.4)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.2)' 
              }}
              whileTap={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.4)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.2)' 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="lg:col-span-6 border border-white/10 bg-[#0b0f1f]/35 p-8 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex justify-between items-center font-source-code-pro text-sm tracking-wider mb-6 pb-4 border-b border-white/5">
                <span className="text-[#5ce1e6] font-semibold">{'// COMPETENCE_ANALYSIS_REPORT'}</span>
                <span className="text-white/45">[READ_ONLY]</span>
              </div>

              {/* Bio with custom highlighted keywords in teal badges */}
              <p className="font-source-code-pro text-base text-white/80 leading-relaxed">
                Computer Science engineer obsessed with the fusion of{' '}
                <span className="bg-[#5ce1e6]/10 border border-[#5ce1e6]/30 px-2 py-0.5 text-[#5ce1e6] rounded-sm font-semibold inline-block my-0.5">
                  technical rigor
                </span>{' '}
                and{' '}
                <span className="bg-[#5ce1e6]/10 border border-[#5ce1e6]/30 px-2 py-0.5 text-[#5ce1e6] rounded-sm font-semibold inline-block my-0.5">
                  visual impact
                </span>
                . I build scalable full-stack systems, cross-platform mobile apps, and cloud infrastructure — designed to perform and impress.
              </p>

              {/* Education section */}
              <div className="mb-5 mt-10 font-source-code-pro text-sm text-[#5ce1e6]/70 uppercase tracking-widest font-bold">
                {'// ACADEMIC_LOG [EDUCATION]'}
              </div>
              <div className="space-y-6">
                {resumeData.education.map((e, i) => (
                  <div key={i} className="pl-5 border-l-2 border-[#5ce1e6]/30 hover:border-[#5ce1e6] transition-colors duration-300 py-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-source-code-pro text-base font-bold text-white tracking-wide uppercase">
                        [{e.institution}]
                      </span>
                      <span className="text-xs font-source-code-pro px-2 py-0.5 border border-[#5ce1e6]/20 text-[#5ce1e6] rounded-md tracking-wider">
                        {e.period}
                      </span>
                    </div>
                    <div className="font-source-code-pro text-sm text-white/80 mt-2 font-semibold">
                      {e.degree}
                    </div>
                    <div className="font-source-code-pro text-sm text-white/50 mt-1">
                      {e.detail}
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience section */}
              <div className="mb-5 mt-10 font-source-code-pro text-sm text-[#5ce1e6]/70 uppercase tracking-widest font-bold">
                {'// FIELD_OPERATIONS [EXPERIENCE]'}
              </div>
              <div className="space-y-8">
                {resumeData.experience.map((e, i) => (
                  <div key={i} className="pl-5 border-l-2 border-[#5ce1e6]/30 hover:border-[#5ce1e6] transition-colors duration-300 py-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-source-code-pro text-base font-bold text-white tracking-wide uppercase">
                        [{e.role}]
                      </span>
                      <span className="text-xs font-source-code-pro px-2 py-0.5 border border-[#5ce1e6]/20 text-[#5ce1e6] rounded-md tracking-wider">
                        {e.period}
                      </span>
                    </div>
                    <div className="font-source-code-pro text-sm text-white/70 mt-1.5 font-semibold">
                      {e.company}
                    </div>
                    <ul className="mt-3 space-y-2 font-source-code-pro text-sm text-white/60">
                      {e.points.map((pt, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-[#5ce1e6]/70 flex-shrink-0">▸</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Certifications section */}
              <div className="mb-5 mt-10 font-source-code-pro text-sm text-[#5ce1e6]/70 uppercase tracking-widest font-bold">
                {'// VERIFIED_CREDENTIALS [CERTIFICATIONS]'}
              </div>
              <div className="space-y-6">
                {resumeData.certifications.map((c, i) => (
                  <div key={i} className="pl-5 border-l-2 border-[#5ce1e6]/30 hover:border-[#5ce1e6] transition-colors duration-300 py-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-source-code-pro text-base font-bold text-white tracking-wide uppercase">
                        [{c.name}]
                      </span>
                      <span className="text-xs font-source-code-pro px-2 py-0.5 border border-[#5ce1e6]/20 text-[#5ce1e6] rounded-md tracking-wider">
                        {c.period}
                      </span>
                    </div>
                    <div className="font-source-code-pro text-sm text-white/50 mt-1.5">
                      {c.issuer}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* COLUMN 3: RIGHT PANEL (Skills, Clearance Status) */}
            <motion.div 
              whileHover={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.4)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.2)' 
              }}
              whileTap={{ 
                y: -6, 
                borderColor: 'rgba(92,225,230,0.4)', 
                boxShadow: '0 20px 40px -15px rgba(92,225,230,0.2)' 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="lg:col-span-3 border border-white/10 bg-[#0b0f1f]/35 p-6 rounded-2xl flex flex-col relative backdrop-blur-sm"
            >
              <div className="font-source-code-pro text-sm text-white/40 tracking-widest uppercase mb-6 text-center border-b border-white/5 pb-4">
                EQUIPMENT_INVENTORY
              </div>

              {/* Hard Skills */}
              <div className="font-source-code-pro text-xs text-[#5ce1e6] tracking-[0.2em] uppercase font-bold mb-4">
                {'// HARD_SKILLS'}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {/* Dynamically split skills into tags */}
                {['Java', 'C++', 'Python', 'JavaScript', 'SQL', 'Dart', 'React.js', 'Node.js', 'Express.js', 'HTML/CSS', 'Tailwind', 'MongoDB', 'PostgreSQL', 'Supabase', 'Firebase', 'Flutter', 'AWS', 'Docker', 'Terraform', 'Git', 'Linux'].map((skill) => (
                  <motion.div
                    key={skill}
                    whileHover={{ 
                      y: -3, 
                      borderColor: 'rgba(92,225,230,0.6)', 
                      boxShadow: '0 4px 12px rgba(92,225,230,0.15)',
                      backgroundColor: 'rgba(92,225,230,0.05)'
                    }}
                    whileTap={{ 
                      y: -3, 
                      borderColor: 'rgba(92,225,230,0.6)', 
                      boxShadow: '0 4px 12px rgba(92,225,230,0.15)',
                      backgroundColor: 'rgba(92,225,230,0.05)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="border border-white/10 bg-[#0b0f1f]/40 text-white font-source-code-pro text-xs py-2 px-1.5 rounded-md text-center cursor-default whitespace-nowrap overflow-hidden text-ellipsis"
                    title={skill}
                  >
                    {skill}
                  </motion.div>
                ))}
              </div>

              {/* Soft Skills */}
              <div className="font-source-code-pro text-xs text-[#5ce1e6] tracking-[0.2em] uppercase font-bold mb-4">
                {'// SOFT_SKILLS'}
              </div>
              <div className="grid grid-cols-1 gap-2 mb-8">
                {['Problem Solving', 'Data Structures', 'Algorithms', 'OOP Design', 'System Design'].map((skill) => (
                  <motion.div
                    key={skill}
                    whileHover={{ 
                      y: -3, 
                      borderColor: 'rgba(92,225,230,0.6)', 
                      boxShadow: '0 4px 12px rgba(92,225,230,0.15)',
                      backgroundColor: 'rgba(92,225,230,0.05)'
                    }}
                    whileTap={{ 
                      y: -3, 
                      borderColor: 'rgba(92,225,230,0.6)', 
                      boxShadow: '0 4px 12px rgba(92,225,230,0.15)',
                      backgroundColor: 'rgba(92,225,230,0.05)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="border border-white/10 bg-[#0b0f1f]/40 text-white font-source-code-pro text-xs py-2 px-3 rounded-md text-center cursor-default"
                  >
                    {skill}
                  </motion.div>
                ))}
              </div>

              {/* Clearance Status Warning Box (styled in teal) */}
              <motion.div 
                whileHover={{ 
                  y: -4, 
                  borderColor: 'rgba(92,225,230,0.8)', 
                  boxShadow: '0 8px 24px rgba(92,225,230,0.25)' 
                }}
                whileTap={{ 
                  y: -4, 
                  borderColor: 'rgba(92,225,230,0.8)', 
                  boxShadow: '0 8px 24px rgba(92,225,230,0.25)' 
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-full mt-auto border border-[#5ce1e6]/30 bg-[#0b0f1f]/50 p-5 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden cursor-default"
              >
                <svg className="w-12 h-12 text-[#5ce1e6] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="font-source-code-pro text-xs text-[#5ce1e6] tracking-[0.25em] mt-3.5 uppercase font-bold">
                  CLEARANCE_STATUS
                </div>
                <div className="font-pixelify text-sm text-white font-bold tracking-widest mt-1.5">
                  LEVEL 03 - GRANTED
                </div>
              </motion.div>
            </motion.div>

          </div>

        </div>
      </div>

      {/* Grass footer */}
      <div
        className="relative z-[10] flex-shrink-0"
        style={{
          backgroundImage: `url(${grassImg})`,
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
          height: 120,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div className="w-full px-8 pb-3 hidden sm:grid sm:grid-cols-3 items-center">
          {/* Left: empty */}
          <div />

          {/* Center: social icons */}
          <div className="flex justify-center gap-3">
            {socialMedia.map((social) => (
              <motion.div
                key={social.id}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
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

          {/* Right: email */}
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center text-white rock-surface text-xs py-2 px-4 pixel-shadow"
              >
                <img src={emailIcon} alt="Email" loading="lazy" decoding="async" className="w-[25px] h-[15px] mr-2" />
                {contactInfo.email}
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;
