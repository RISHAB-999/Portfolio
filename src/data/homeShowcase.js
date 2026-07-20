// Curated content for the showcase sections shared by the home post-footer
// (compact career timeline + featured-work grid) and the Experience page
// (full "Work Experience" timeline + "Projects" bands). Kept separate from the
// canonical career/projects lists so this hand-tuned copy can evolve without
// touching the long-form data used elsewhere.
//
// In a bullet, wrap a stat in {curly braces} to render it as a highlighted chip,
// e.g. "Trained ML models on {20K+ samples} via Bash pipelines".
//
// featuredWork fields: the home grid reads {summary, tags, cta, thumb}; the
// Experience bands additionally read {blurb, badge, actions} for the wider,
// more detail-forward layout.

import codesuadz from '../assets/codesuadz.png';
import brainMentors from '../assets/brain_mentors.png';
import moonlitApp from '../assets/moonlit_app.jpg';
import therapiqueApp from '../assets/therapique.png';
import moonlitAppDemo from '../assets/moonlit_app_demo.mp4';

// Experience — "My career so far" timeline.
export const careerTimeline = [
  {
    id: 'codesquadz',
    company: 'CodeSquadz, Noida',
    subtitle: 'AWS & DevOps Intern',
    logo: codesuadz,
    bullets: [
      'Worked with core AWS services including EC2, S3, RDS, DynamoDB, CloudWatch, and IAM.',
      'Practiced DevOps processes with Docker, Terraform, CI/CD pipelines (GitHub Actions), and Linux shell scripting.',
      'Built and deployed scalable applications on AWS with automated monitoring.',
      'Improved version control and team collaboration using Git and GitHub.',
    ],
    tags: ['AWS', 'Docker', 'Terraform', 'Linux', 'Git'],
    period: 'July 2025 – August 2025',
    current: false,
  },
  {
    id: 'brainmentors',
    company: 'Brain Mentors',
    subtitle: 'Flutter Development trainee',
    logo: brainMentors,
    bullets: [
      'Gained hands-on experience in cross-platform mobile app development using Flutter and Dart.',
      'Implemented features including user authentication, REST APIs, state management, and responsive UI design.',
      'Built and tested functional mobile applications for Android platforms.',
      'Strengthened skills in problem-solving, debugging, and application deployment.',
    ],
    tags: ['Flutter', 'Dart', 'Firebase', 'Android'],
    period: 'July 2024 – August 2024',
    current: false,
  },
];

// Featured work — selected projects list.
export const featuredWork = [
  {
    id: 'moonlit',
    title: 'MoonLit – E-commerce Shopping App',
    kind: 'CAPSTONE PROJECT · FLUTTER',
    summary: 'Developed a fully functional e-commerce mobile app using Flutter.',
    blurb:
      'Developed a fully functional e-commerce mobile app using Flutter and Dart from concept to deployment. Features include product listings, shopping cart, secure checkout, and user authentication with responsive UI/UX design across multiple devices.',
    tags: ['Flutter', 'Dart', 'Firebase', 'Mobile App'],
    period: 'Capstone Project',
    badge: 'MOBILE',
    thumb: moonlitApp,
    hasPlay: false,
    actions: [
      {
        label: 'Code',
        href: 'https://github.com/RISHAB-999/E-commerce-APP',
        primary: false,
      },
      {
        label: 'Demo',
        href: moonlitAppDemo,
        primary: true,
      },
    ],
  },
  {
    id: 'therapique',
    title: 'Therapique – Mental Wellness Platform',
    kind: 'FULL-STACK WEB',
    summary: 'Developed a platform for mental health management with journaling and community features.',
    blurb:
      'Developed a platform for mental health management using journaling and community features. Built frontend with React.js + TailwindCSS and backend with Node.js/Express, integrated with MongoDB, and deployed on Vercel.',
    tags: ['React.js', 'Node.js', 'Express', 'MongoDB', 'TailwindCSS'],
    period: 'Personal Project',
    badge: 'LIVE',
    thumb: therapiqueApp,
    hasPlay: false,
    cta: null,
    actions: [
      {
        label: 'Code',
        href: 'https://github.com/RISHAB-999/Therapique',
        primary: false,
      },
      {
        label: 'Live',
        href: 'https://therapique.vercel.app/',
        primary: true,
      },
    ],
  },
];
