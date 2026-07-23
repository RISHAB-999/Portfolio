// All home-page content: the hero, the post-footer intro, the "What I Do"
// cards, and the tech-stack carousel.

import fullStackWeb from '../assets/Full-Stack_Web.png';
import mobileApp from '../assets/Mobile_app.png';
import cloudDevOps from '../assets/Cloud.png';
import softwareEngineering from '../assets/Software_Engineering.png';


import c from '../assets/TechLogos/c.png';
import cpp from '../assets/TechLogos/cpp.png';
import css from '../assets/TechLogos/css.png';
import git from '../assets/TechLogos/git.png';
import html from '../assets/TechLogos/html.png';
import java from '../assets/TechLogos/java.png';
import js from '../assets/TechLogos/js.png';
import linux from '../assets/TechLogos/linux.png';
import python from '../assets/TechLogos/python.png';
import react from '../assets/TechLogos/react.png';
import tailwind from '../assets/TechLogos/tailwind.png';
import aws from '../assets/TechLogos/aws.png';
import sql from '../assets/TechLogos/Sql.webp';
import nodejs from '../assets/TechLogos/nodejs.png';
import express from '../assets/TechLogos/ExpressJS.png';
import mongodb from '../assets/TechLogos/MongoDB.png';
import supabase from '../assets/TechLogos/supabase.webp';
import flutter from '../assets/TechLogos/flutter.png';
import dart from '../assets/TechLogos/dart.png';
import firebase from '../assets/TechLogos/firebase.webp';
import androidStudio from '../assets/TechLogos/Android_Studio.webp';
import github from '../assets/TechLogos/github.png';
import docker from '../assets/TechLogos/docker.png';

// Hero (CentreBlock). `titles` rotate in the typing animation; `name.nick` is
// the highlighted nickname shown in quotes. The component renders `prefix + title`,
// so the article (a/an) lives inside each title to read correctly before
// vowel-initial words ("an Audio…", "an Embedded…").
export const hero = {
  eyebrow: "Hello, I'm",
  name: { first: 'Rishab', last: 'Negi',nick: 'Rishu' },
  prefix: 'I am ',
  location: 'based in India',
  titles: [
    'a Software Engineer.',
    'a Full-Stack Developer.',
    'a Flutter Developer.',
    'a Java Developer.',
    'an AWS Cloud Enthusiast.',
    'a Problem Solver.',
  ],
};

// Label on the "View more" button under the home highlights.
export const featuredCta = 'View more';

// "View full experience" button below the selected-projects list — bridges the
// home highlights to the full Experience page (timeline + project bands).
export const projectsCta = { label: 'View full experience', to: '/experience' };

// Post-footer intro band (AboutHomePage).
export const aboutIntro = {
  title: 'Building scalable solutions for real-world problems',
  body: 'I design full-stack web applications and cross-platform mobile apps — from responsive React frontends to robust Node.js/Express backends and scalable cloud infrastructure on AWS.',
  ctaLabel: 'Learn more',
  ctaTo: '/about',
};

// "What I Do" numbered capability index on the home page.
export const whatIDo = {
  heading: 'What I Do',
  subtitle: 'Full-Stack, Mobile & Cloud Engineering',
  cards: [
    { title: 'Full-Stack Web', description: 'Building responsive web applications using React.js, Node.js, Express, and MongoDB.', logo: fullStackWeb },
    { title: 'Mobile Apps', description: 'Creating cross-platform mobile apps for Android and iOS using Flutter and Dart.', logo: mobileApp },
    { title: 'Cloud & DevOps', description: 'Deploying and managing scalable applications on AWS, using Docker, Terraform, and CI/CD pipelines.', logo: cloudDevOps },
    { title: 'Software Engineering', description: 'Strong foundation in Data Structures, Algorithms, and Object-Oriented Programming in Java and Python.', logo: softwareEngineering },
  ],
};

// Tech stack, grouped by discipline (mirrors the "What I Do" areas).
// To add a tool: import its logo at the top of this file, then drop a
// { name, logo, where } object into the right group's `items` array.
// `where` is the text shown in the hover tooltip (where the skill was used).
export const techStack = {
  heading: 'Tech Stack',
  groups: [
    {
      title: 'Programming & Development',
      tagline: 'Languages & Core Systems',
      items: [
        { name: 'Java', logo: java, where: 'Core programming and backend services' },
        { name: 'C', logo: c, where: 'Systems-level programming' },
        { name: 'C++', logo: cpp, where: 'Data structures & algorithms' },
        { name: 'Python', logo: python, where: 'Automation, scripting, and data pipelines' },
        { name: 'JavaScript', logo: js, where: 'Dynamic web functionality and interactive UI' },
        { name: 'SQL', logo: sql, where: 'Relational database querying and management' },
      ],
    },
    {
      title: 'Web Development',
      tagline: 'Frontend & Backend frameworks',
      items: [
        { name: 'HTML', logo: html, where: 'Semantic web layout & structure' },
        { name: 'CSS', logo: css, where: 'Custom visual styling and layouts' },
        { name: 'React.js', logo: react, where: 'Single-page applications & dynamic UI components' },
        { name: 'Tailwind CSS', logo: tailwind, where: 'Rapid responsive layouts and utility-first styling' },
        { name: 'Node.js', logo: nodejs, where: 'Server-side runtime environment' },
        { name: 'Express.js', logo: express, where: 'REST API design & backend routing' },
      ],
    },
    {
      title: 'Database',
      tagline: 'Structured & Unstructured storage',
      items: [
        { name: 'MongoDB', logo: mongodb, where: 'NoSQL document storage & database management' },
        { name: 'Supabase', logo: supabase, where: 'Real-time database, backend-as-a-service, and auth' },
      ],
    },
    {
      title: 'Mobile App Development',
      tagline: 'Cross-platform app creation',
      items: [
        { name: 'Flutter', logo: flutter, where: 'Cross-platform mobile application development' },
        { name: 'Dart', logo: dart, where: 'Client-optimized programming language for Flutter apps' },
        { name: 'Firebase', logo: firebase, where: 'Backend services, cloud storage, and push notifications' },
        { name: 'Android Studio', logo: androidStudio, where: 'Native Android application builds & emulation' },
      ],
    },
    {
      title: 'Cloud & DevOps',
      tagline: 'Infrastructure, deployment, & pipelines',
      items: [
        { name: 'AWS', logo: aws, where: 'Cloud infrastructure deployment and resource management' },
        { name: 'Git', logo: git, where: 'Distributed version control and codebase tracking' },
        { name: 'GitHub', logo: github, where: 'Remote collaboration, code review, and CI/CD pipelines' },
        { name: 'Linux', logo: linux, where: 'Command-line system administration and server environments' },
        { name: 'Docker', logo: docker, where: 'Application containerization and environment consistency' },
      ],
    },
  ],
};

// Game-HUD banners that split the home post-footer into three "levels", in the
// natural first-visit reading order (who I am → what I've done → reach out).
// `level`/`total` drive the LEVEL 0N label, the N / TOTAL counter, and how far
// the segmented meter fills. Rendered by SectionDivider.jsx, laid out in
// PostFooterHome.jsx.
export const sectionDividers = {
  about: { level: 1, total: 3, eyebrow: 'Who I Am', title: 'About' },
  experience: { level: 2, total: 3, eyebrow: 'The Work', title: 'Experience' },
  contact: { level: 3, total: 3, eyebrow: "Let's Connect", title: 'Contact' },
};

// Closing contact band that opens the 03 section — a centered call to reach out,
// sitting above the "Keep exploring" navigation cards.
export const contactBand = {
  heading: 'Reach out, or keep exploring',
  body: 'Open to internships & new-grad roles. Drop me a line.',
  ctaLabel: 'Get in touch',
  ctaTo: '/contact',
};

// The last band on the home page, sending visitors to the three main
// destinations (who I am → what I've done → reach out). Rendered as compact
// navigation cards beneath the contact band.
export const keepExploring = {
  eyebrow: 'Keep exploring',
  heading: 'Where to next?',
  cards: [
    {
      icon: 'about',
      title: 'About',
      description: 'Who I am, what I build, and the disciplines I work across.',
      ctaLabel: 'Read more',
      to: '/about',
    },
    {
      icon: 'experience',
      title: 'Experience',
      description: 'My career timeline — CodeSquadz, Brain Mentors — and the projects.',
      ctaLabel: 'See the work',
      to: '/experience',
    },
  ],
};
