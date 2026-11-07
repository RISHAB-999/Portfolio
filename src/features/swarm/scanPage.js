// Reads the rendered page into "units" the swarm can build: boxes (anything that
// paints a background, border, shadow or glass), images (media + background
// images) and text (real line boxes). Read-only: it never writes to the DOM, so
// scanning can't change the layout.
//
// The page is usually already "blank" when this runs (stage.js hides content
// with visibility:hidden, which keeps every box exactly where it is), so
// computed visibility is ignored here; only the page's *own* hiding counts.
//
// Elements marked data-swarm-bg are scenery: never built, always visible.
// Coordinates are document-space for normal content and viewport-space for
// anything inside position:fixed (navbar, HUD), flagged with `fixed`.

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'BR', 'WBR', 'OPTION', 'SOURCE', 'TRACK',
]);
const MEDIA_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME']);
const MIN_BOX_AREA = 64;

const alphaOf = (color) => {
  if (!color || color === 'transparent') return 0;
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length >= 4 ? parseFloat(parts[3]) : 1;
};

const paintsBox = (s) =>
  alphaOf(s.backgroundColor) > 0.04 ||
  (s.backgroundImage !== 'none' && s.backgroundImage.includes('gradient')) ||
  (parseFloat(s.borderTopWidth) > 0 && alphaOf(s.borderTopColor) > 0.1) ||
  (parseFloat(s.borderBottomWidth) > 0 && alphaOf(s.borderBottomColor) > 0.1) ||
  (parseFloat(s.borderLeftWidth) > 0 && alphaOf(s.borderLeftColor) > 0.1) ||
  (s.boxShadow !== 'none' && s.boxShadow !== '') ||
  (s.borderImageSource && s.borderImageSource !== 'none') ||
  ((s.backdropFilter || s.webkitBackdropFilter || 'none') !== 'none');

const hasUrlBackground = (s) => s.backgroundImage !== 'none' && s.backgroundImage.includes('url(');

/**
 * Time-sliceable scan: call step(budgetMs) repeatedly (e.g. one call per task)
 * until it returns true, then read result().
 *
 * @param {Element} root
 * @param {{ maxUnits?: number }} [options]
 */
export function createPageScan(root, { maxUnits = 700 } = {}) {
  // Refreshed at the start of every step: the visitor may scroll between slices.
  let scrollX = window.scrollX;
  let scrollY = window.scrollY;
  const vw = document.documentElement.clientWidth;
  const units = [];

  const add = (el, kind, rect, s, parent, fixed, extra) => {
    const ox = fixed ? 0 : scrollX;
    const oy = fixed ? 0 : scrollY;
    const unit = {
      el,
      kind,
      x: rect.left + ox,
      y: rect.top + oy,
      w: rect.width,
      h: rect.height,
      fixed,
      parent,
      state: 0, // 0 waiting · 1 claimed · 2 building · 3 built
      p: 0, // reveal progress 0..1
      ...extra,
    };
    units.push(unit);
    return unit;
  };

  // Text: one unit per element with its own (direct) text, split into line
  // rects (stored relative to the element so typing can clip it).
  const range = document.createRange();
  const textLines = (el, rect, fixed) => {
    const lines = [];
    let chars = 0;
    for (let n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 3) continue;
      const text = n.textContent;
      if (!text.trim()) continue;
      chars += text.trim().length;
      range.selectNodeContents(n);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width < 1 || r.height < 1) continue;
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.top - r.top) < r.height * 0.5) {
          const right = Math.max(last.left + last.width, r.left + r.width);
          last.left = Math.min(last.left, r.left);
          last.width = right - last.left;
          last.height = Math.max(last.height, r.height);
        } else {
          lines.push({ left: r.left, top: r.top, width: r.width, height: r.height });
        }
      }
    }
    if (!lines.length) return null;
    const ox = fixed ? 0 : scrollX;
    const oy = fixed ? 0 : scrollY;
    let total = 0;
    const out = lines.map((l) => {
      total += l.width;
      return {
        x: l.left + ox, y: l.top + oy, w: l.width, h: l.height,
        rx: l.left - rect.left, ry: l.top - rect.top, // relative to the element (for clip-path)
      };
    });
    return { lines: out, chars: Math.max(1, chars), totalWidth: total };
  };

  const visit = (el, parentUnit, fixed) => {
    if (SKIP_TAGS.has(el.tagName) || el.hasAttribute('data-swarm-layer')) return;
    // Opt-outs: things that move on their own (the floating mascot) or must stay
    // usable (the Motion button) — and their insides.
    if (el.getAttribute('data-swarm') === 'skip' || el.hasAttribute('data-swarm-keep') || el.hasAttribute('data-swarm-live')) return;
    const bg = el.getAttribute('data-swarm-bg');
    if (bg === 'deep') return; // scenery including everything inside it

    const s = getComputedStyle(el);
    if (s.display === 'none' || parseFloat(s.opacity) === 0) return;
    // The page's own hiding (e.g. an inactive background crossfade) still counts.
    if (el.style.visibility === 'hidden') return;

    const isFixed = fixed || s.position === 'fixed';
    let unit = null;

    if (bg === null) {
      const rect = el.getBoundingClientRect();
      const visible = rect.width >= 2 && rect.height >= 2 && rect.right > 0 && rect.left < vw + 1;
      if (visible) {
        if (MEDIA_TAGS.has(el.tagName.toUpperCase())) {
          add(el, 'image', rect, s, parentUnit, isFixed);
          return; // never descend into media (SVG internals etc.)
        }
        const text = textLines(el, rect, isFixed);
        if (hasUrlBackground(s)) unit = add(el, 'image', rect, s, parentUnit, isFixed);
        else if (paintsBox(s) && rect.width * rect.height >= MIN_BOX_AREA) {
          // A painted element with its own text (buttons, chips) is built as one box.
          unit = add(el, 'box', rect, s, parentUnit, isFixed);
        } else if (text) {
          add(el, 'text', rect, s, parentUnit, isFixed, text);
        }
      }
    }

    const nextParent = unit || parentUnit;
    for (let c = el.lastElementChild; c; c = c.previousElementSibling) stack.push([c, nextParent, isFixed]);
  };

  // Explicit stack instead of recursion so the walk can pause between steps.
  const stack = [];
  for (let c = root.lastElementChild; c; c = c.previousElementSibling) stack.push([c, null, false]);
  let finished = null;

  function step(budgetMs = 6) {
    if (finished) return true;
    const deadline = performance.now() + budgetMs;
    scrollX = window.scrollX;
    scrollY = window.scrollY;
    let n = 0;
    while (stack.length) {
      const [el, parentUnit, fixed] = stack.pop();
      visit(el, parentUnit, fixed);
      if ((++n & 15) === 0 && performance.now() > deadline) return false;
    }
    finished = finish();
    return true;
  }

  return { step, result: () => finished };

  function finish() {
    range.detach?.();
    // Reading order: fixed chrome first, then top band to bottom, left to right,
    // bigger before smaller so containers come before what sits in them.
    units.sort((a, b) => {
      if (a.fixed !== b.fixed) return a.fixed ? -1 : 1;
      const band = Math.round(a.y / 24) - Math.round(b.y / 24);
      if (band) return band;
      if (Math.abs(a.x - b.x) > 4) return a.x - b.x;
      return b.w * b.h - a.w * a.h;
    });

    // Very large pages: drop the smallest boxes first. Anything dropped still
    // appears in the settle sweep once its stretch of page is built.
    if (units.length > maxUnits) {
      const boxes = units.filter((u) => u.kind === 'box').sort((a, b) => a.w * a.h - b.w * b.h);
      const drop = new Set(boxes.slice(0, units.length - maxUnits));
      for (const u of units) while (u.parent && drop.has(u.parent)) u.parent = u.parent.parent;
      for (let i = units.length - 1; i >= 0; i--) if (drop.has(units[i])) units.splice(i, 1);
    }
    return { units };
  }
}
