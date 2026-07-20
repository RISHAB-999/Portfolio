// Single source of truth for ALL projects. Add a project once, here, and toggle
// where it appears with the per-view flags. No other file needs editing.
//
//   media.type:
//     'embed' -> YouTube/iframe (src is an embed URL)        [Experience page]
//     'image' -> static image   (src is an imported asset)   [Experience page]
//     'video' -> local <video> with click-to-play/pause      [Projects page card]
//     'audio' -> one or more audio players (heading + clips)  [Projects page card]
//
//   per-view flags:
//     showOnExperience -> appears in the Experience page project list
//     showOnProjects   -> appears as a media card on the Projects page
//     featured         -> appears in the home-page post-footer highlights

import ubcroomfinder from '../assets/ubc_room_finder.png';
import therapiqueApp from '../assets/therapique.png';

export const projects = [
  {
    id: 'moonlit',
    title: 'MoonLit – E-commerce Shopping App',
    date: 'Capstone Project',
    category: 'Mobile App Development',
    technologies: 'Flutter, Dart, Firebase, Android Studio',
    description:
      'Developed a fully functional e-commerce mobile app using Flutter and Dart from concept to deployment. Features include product listings, shopping cart, secure checkout, and user authentication with responsive UI/UX design across multiple devices.',
    media: { type: 'image', src: ubcroomfinder },
    showOnExperience: true,
    showOnProjects: false,
    featured: true,
  },
  {
    id: 'therapique',
    title: 'Therapique – Mental Wellness Platform',
    date: 'Personal Project',
    category: 'Web Development',
    technologies: 'React.js, Node.js, Express.js, MongoDB, TailwindCSS',
    description:
      'Developed a platform for mental health management using journaling and community features. Built frontend with React.js + TailwindCSS and backend with Node.js/Express, integrated with MongoDB, and deployed on Vercel.',
    media: { type: 'image', src: therapiqueApp },
    showOnExperience: true,
    showOnProjects: false,
    featured: true,
  },
];

// Order-preserving selectors for each view.
export const experienceProjects = projects.filter((p) => p.showOnExperience);
export const cardProjects = projects.filter((p) => p.showOnProjects);
export const featuredProjects = projects.filter((p) => p.featured);
