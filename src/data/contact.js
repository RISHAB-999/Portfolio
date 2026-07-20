// Contact page content + EmailJS configuration.
//
// The Contact page is two columns: a message form (left) and an identity card
// (right) listing the direct ways to reach me. Copy + the channel list live
// here so the page can be re-worded without touching the component. Email and
// resume pull from the single source of truth in siteConfig.

import { contactInfo } from './siteConfig';
import avatar from '../assets/Rishab.jpeg';

export const contactPage = {
  eyebrow: 'Say Hello',
  heading: 'Contact Me',
  intro:
    "Questions, project ideas, or just to say hello — drop a line and I'll get back as soon as I can.",

  // Form fields. `name` must match the EmailJS template variables.
  fields: [
    { label: 'Name', name: 'name', type: 'text', placeholder: 'Your name', multiline: false },
    { label: 'Email', name: 'reply_to', type: 'email', placeholder: 'you@email.com', multiline: false },
    { label: 'Message', name: 'message', type: 'text', placeholder: "What's on your mind?", multiline: true },
  ],
  submitLabel: 'Send',

  // Right-hand identity card.
  card: {
    avatar,
    name: 'Rishab Negi',
    location: 'Delhi, India',
    status: 'Open to internships & new-grad roles',
    channelsHeading: 'Reach me directly',
    // `type` selects the glyph in Contact.jsx; `value` is the display text.
    channels: [
      { type: 'email', label: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}` },
      { type: 'github', label: 'GitHub', value: 'github.com/RISHAB-999', href: 'https://github.com/RISHAB-999' },
      { type: 'linkedin', label: 'LinkedIn', value: '/in/rishabnegi30', href: 'https://www.linkedin.com/in/rishabnegi30/' },
      { type: 'resume', label: 'Resume', value: 'Download PDF', href: contactInfo.resumeUrl },
    ],
  },

  success: {
    title: 'Thank you!',
    body: 'Your message has been sent successfully.',
    close: 'Close',
  },
  failure: {
    title: 'Failed to Send',
    body: 'There was an issue sending your message. Please try again later.',
    close: 'Close',
  },
};

export const emailConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};
