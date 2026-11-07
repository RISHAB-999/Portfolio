// Client-side hardening for the contact form (EmailJS).
//
// Honest scope: the EmailJS public key ships in the bundle by design, so anyone
// can call the EmailJS API directly. These checks stop casual abuse, bots and
// malformed input from *this* form; the real quota/spam controls live in the
// EmailJS dashboard (allowed origins, rate limit, reCAPTCHA) — see README.
// Pure functions only, so scripts/security-check.mjs can test them in Node.

export const FIELD_LIMITS = {
  name: 80,
  reply_to: 254, // RFC 5321 max address length
  message: 4000,
};

// Bots tend to submit instantly; humans need a few seconds to type.
export const MIN_FILL_MS = 3000;

// Name of the hidden honeypot input. Real visitors never see or fill it.
export const HONEYPOT_FIELD = 'website';

// C0/C1 control characters, excluding tab (\x09) and newline (\x0A).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// eslint-disable-next-line no-control-regex
const ALL_CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

/** Single-line value (name, email): no line breaks or control characters. */
export function cleanLine(value, max) {
  return String(value ?? '')
    .replace(ALL_CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Multi-line value (message): keeps newlines/tabs, drops other control chars. */
export function cleanText(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .trim()
    .slice(0, max);
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/**
 * Validate + normalise a submission.
 * @returns {{ ok: true, values: object } | { ok: false, reason: 'bot' | 'invalid' }}
 */
export function checkSubmission({ name, reply_to, message, honeypot, startedAt, now = Date.now() }) {
  if (honeypot) return { ok: false, reason: 'bot' };
  if (startedAt && now - startedAt < MIN_FILL_MS) return { ok: false, reason: 'bot' };

  const values = {
    name: cleanLine(name, FIELD_LIMITS.name),
    reply_to: cleanLine(reply_to, FIELD_LIMITS.reply_to),
    message: cleanText(message, FIELD_LIMITS.message),
  };
  if (!values.name || !values.message || !EMAIL.test(values.reply_to)) {
    return { ok: false, reason: 'invalid' };
  }
  // Subject line for the EmailJS template, built only from the cleaned name.
  values.title = `New message from ${values.name}`;
  return { ok: true, values };
}
