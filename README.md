# 🕹️ Rishab Negi – Interactive Pixel-Art Portfolio

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-5ce1e6?style=for-the-badge&logo=github&logoColor=black)](https://RISHAB-999.github.io/Portfolio/)

Welcome to my personal developer portfolio website! Built with a retro 8-bit / 16-bit pixel-art aesthetic, this interactive web application showcases my projects, work experience, technical skills, and background.

---

## ✨ Features

- **🎮 Pixel-Art & Retro Aesthetic:** Immersive 8-bit & 16-bit background scenes with smooth page transition overlays and scanline effects.
- **🌂 Interactive Companion Cursor:** Custom pixel cursor paired with a cursor-following Kirby umbrella tracking system.
- **⌨️ Dynamic Typewriter Effect:** Real-time role cycling (*Software Developer, Full-Stack Developer, Flutter App Developer, Web Developer*).
- **🚀 Featured Work & Demos:** Showcase of full-stack web and cross-platform mobile applications with direct GitHub code repositories, live sites, and `.mp4` video demo previews.
- **🎵 Retro Audio & Level Ambience:** Integrated background music player with pixel-art play/pause audio controls.
- **📄 Interactive Terminal Resume:** Cyberpunk-styled competence analysis report with downloadable PDF resume.
- **📬 Contact Integration:** Functional contact form powered by EmailJS.

---

## 🛠️ Built With

- **Framework:** [React 18](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Contact Service:** [EmailJS](https://www.emailjs.com/)

---

## 🚀 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/RISHAB-999/Rishab-portfolio.git

# 2. Navigate into project directory
cd Rishab-portfolio

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

For additional build and preview commands, check out [documentation/run.md](documentation/run.md).

---

## 📂 Project Architecture

```
src/
├── assets/                  # Images, pixel art gifs, audio tracks, & video demos
├── components/              # Reusable UI components (Navbar, Footer, Kirby cursor, etc.)
│   └── PostFooterComponents # Home page highlight sections & capability cards
├── data/                    # Central data source (projects.js, homeShowcase.js, siteConfig.js)
├── pages/                   # Main route pages (Home, About, Experience, Resume, Contact, 404)
├── utils/                   # Animation variants & motion utilities
├── App.jsx                  # Main router & page layout frame
└── index.css                # Global styling, pixel shadows, & custom cursor definitions
```

---

## ⚙️ How to Add Content

### Adding a Project
Add a project entry to `featuredWork` in `src/data/homeShowcase.js` or `projects` in `src/data/projects.js` with your links, tags, and thumbnails.

### Adding a Page
1. Create your page component under `src/pages/`.
2. Add a `<Route>` entry in `src/App.jsx`.
3. Configure route appearance in `pageConfig` inside `src/data/siteConfig.js`.

---

## 🚀 Deployment

Automated build and deployment is configured via GitHub Actions when pushing to `main`.
Detailed deployment instructions can be found in [documentation/deployment.md](documentation/deployment.md).
