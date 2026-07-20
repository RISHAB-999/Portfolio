// About page content.
//
// The About page is a single "narrative scroll" you read top to bottom:
//   hero intro → my story + at-a-glance stats → the four disciplines → CTA.
// Every piece of copy lives here so the page can be re-worded or re-ordered
// without touching the component. The visual style mirrors the home
// post-footer (cyan accent, dark cards, tool chips).

import rishab from '../assets/Rishab.jpeg';
import fullStackWeb from '../assets/Full-Stack_Web.png';
import mobileApp from '../assets/Mobile_app.png';
import cloudDevOps from '../assets/Cloud.png';
import softwareEngineering from '../assets/Software_Engineering.png';


export const aboutPage = {
  // ---- Hero intro panel -------------------------------------------------
  eyebrow: 'About',
  photo: rishab,
  // Heading renders as `lead` + accent word (cyan) + `tail`, e.g.
  // "Engineering the sounds of tomorrow" (mirrors the home About panel).
  title: { lead: 'Building scalable ', accent: 'solutions', tail: ' for real-world problems' },
  intro:
    'I am a Computer Science student specializing in Full-Stack Web Development, Mobile App Development, and Cloud Computing. Passionate about software engineering and cloud technologies.',
  // Status pills under the intro. `dot: true` adds a glowing LED.
  chips: [
    { label: 'Delhi/NCR, India', dot: true },
    { label: 'Open to work' },
    { label: 'VIPS-TC Computer Science' },
    { label: 'Graduated Sep 2026' },
  ],

  // ---- My story (narrative beside the stat card) ------------------------
  story: {
    eyebrow: 'My Story',
    paragraphs: [
      'I am a Computer Science & Engineering graduate from Vivekananda Institute of Professional Studies – Technical Campus (VIPS-TC). I build full-stack web applications and cross-platform mobile apps, owning the process from concept to deployment. I enjoy working with modern web technologies like React, Node.js, Flutter, and cloud platforms like AWS.',
      'During my academic journey, I undertook internships and trainings where I worked with AWS cloud services, DevOps tools (Docker, Terraform), and Flutter mobile development. I love problem-solving, implementing responsive layouts, and applying software engineering principles to design robust, user-friendly solutions.',
    ],
  },

  // ---- "At a glance" stat card + the places I've worked -----------------
  glance: {
    heading: 'At a glance',
    stats: [
      { value: 'B.Tech', label: 'CSE Graduate' },
      { value: '2', label: 'Internships/Trainings' },
      { value: '2', label: 'Featured Projects' },
      { value: '10+', label: 'Technologies' },
    ],
    workedWithHeading: 'Trained at',
    logos: [],
    cta: { label: 'See experiences', to: '/experience' },
  },

  // ---- What I do (one row per discipline, with tool chips) --------------
  disciplines: {
    eyebrow: 'What I Do',
    heading: 'Full-Stack, Mobile & Cloud Engineering',
    items: [
      {
        title: 'Full-Stack Web',
        description:
          'Building responsive web applications using React.js, Node.js, Express, and MongoDB.',
        logo: fullStackWeb,
        tools: ['React.js', 'Node.js', 'Express', 'MongoDB'],
      },
      {
        title: 'Mobile Apps',
        description:
          'Creating cross-platform mobile apps for Android and iOS using Flutter and Dart.',
        logo: mobileApp,
        tools: ['Flutter', 'Dart', 'Firebase'],
      },
      {
        title: 'Cloud & DevOps',
        description:
          'Deploying and managing scalable applications on AWS, using Docker, Terraform, and CI/CD pipelines.',
        logo: cloudDevOps,
        tools: ['AWS', 'Docker', 'Terraform', 'GitHub Actions'],
      },
      {
        title: 'Software Engineering',
        description:
          'Strong foundation in Data Structures, Algorithms, and Object-Oriented Programming in Java and Python.',
        logo: softwareEngineering,
        tools: ['Java', 'C/C++', 'Python', 'SQL'],
      },
    ],
  },

  // ---- Closing call to action -------------------------------------------
  cta: {
    title: "Let's build something.",
    body: "Got a project in mind or looking for a developer? I'm listening.",
    label: 'Get in touch',
    to: '/contact',
  },
};
