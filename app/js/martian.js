// Draws a martian as SVG markup. Local coordinates: (0,0) is the bottom-centre
// of the sweater, the head sits around y=-160 and the antenna tip near y=-320.
import { AGES, byId } from './data.js';

const OUTLINE = '#3b1660';

function hash(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export const martianScale = m => (byId(AGES, m.age) || { scale: 0.92 }).scale;

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * amt));
  return `rgb(${c.join(',')})`;
}

function patternDef(id, look) {
  const c = look.color;
  const light = lighten(c, 0.55);
  switch (look.pattern) {
    case 'stripes':
      return `<pattern id="${id}" width="24" height="22" patternUnits="userSpaceOnUse">
        <rect width="24" height="22" fill="${c}"/><rect y="12" width="24" height="10" fill="${light}"/></pattern>`;
    case 'dots':
      return `<pattern id="${id}" width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill="${c}"/><circle cx="7" cy="7" r="5" fill="${light}"/><circle cx="21" cy="21" r="5" fill="${light}"/></pattern>`;
    case 'stars':
      return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">
        <rect width="34" height="34" fill="${c}"/>
        <path d="M9 3l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L1.8 8.2l5-.6z" fill="#fff3a8"/>
        <path d="M26 19l1.6 3.2 3.5.4-2.6 2.4.7 3.5-3.2-1.8-3.2 1.8.7-3.5-2.6-2.4 3.5-.4z" fill="#fff3a8"/></pattern>`;
    default:
      return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="${c}"/><path d="M0 8h16" stroke="${lighten(c, 0.18)}" stroke-width="3"/></pattern>`;
  }
}

export function skinDefs(prefix) {
  return `<radialGradient id="${prefix}-skin" cx="35%" cy="28%" r="80%">
      <stop offset="0" stop-color="#b57ff5"/><stop offset=".55" stop-color="#8d47dc"/><stop offset="1" stop-color="#6a2db6"/></radialGradient>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - amt))).join(',')})`;
}

const STAR = (x, y, r) => `M${x} ${y - r} L${x + r * 0.29} ${y - r * 0.4} L${x + r * 0.95} ${y - r * 0.31} L${x + r * 0.47} ${y + r * 0.15}
  L${x + r * 0.59} ${y + r * 0.81} L${x} ${y + r * 0.5} L${x - r * 0.59} ${y + r * 0.81} L${x - r * 0.47} ${y + r * 0.15}
  L${x - r * 0.95} ${y - r * 0.31} L${x - r * 0.29} ${y - r * 0.4} Z`;

function eyes(m, pre) {
  const h = hash(m.id);
  const face = m.look.face || 'happy';
  const iris = m.look.eyes || '#2fae4e';
  const dx = face === 'surprised' ? 0 : (h % 7) - 3; // where this martian likes to look
  const dy = face === 'surprised' ? 0 : ((h >> 3) % 5) - 2;
  const eye = side => {
    const cx = side * 37;
    if (face === 'wink' && side === -1) {
      return `<path d="M${cx - 25} -176 Q${cx} -204 ${cx + 25} -176" stroke="${OUTLINE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    }
    const px = cx + dx + side * -3;
    const py = -178 + dy;
    const big = face === 'surprised';
    const ir = big ? 15 : 19.5;
    let inner = `<circle cx="${px}" cy="${py}" r="${ir}" fill="${iris}" stroke="${shade(iris, 0.45)}" stroke-width="2"/>`;
    inner += face === 'starry'
      ? `<path d="${STAR(px, py, 14)}" fill="#ffe066" stroke="${shade(iris, 0.5)}" stroke-width="1.5" stroke-linejoin="round"/>`
      : `<circle cx="${px}" cy="${py}" r="${big ? 8 : 12}" fill="#0d0b16"/><circle cx="${px - 5}" cy="${py - 6}" r="4.5" fill="#fff"/>`;
    const lid = face === 'sleepy'
      ? `<path d="M${cx - 31} -180 A31 35 0 0 1 ${cx + 31} -180 Z" fill="url(#${pre}-skin)" stroke="${OUTLINE}" stroke-width="3.5"/>`
      : '';
    return `<ellipse cx="${cx}" cy="-182" rx="31" ry="${big ? 38 : 35}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/>${inner}${lid}`;
  };
  const lashes = m.look.extra === 'lashes'
    ? [-1, 1].map(s => `<path d="M${s * 37 + s * 14} -214 l${s * 9} -9 M${s * 37 + s * 22} -206 l${s * 11} -6 M${s * 37 + s * 4} -217 l${s * 4} -11"
        stroke="${OUTLINE}" stroke-width="3.5" stroke-linecap="round"/>`).join('')
    : '';
  const shades = face === 'cool'
    ? `<path d="M-74 -196 H74 M-70 -196 Q-70 -160 -40 -158 Q-8 -160 -6 -196 Z M70 -196 Q70 -160 40 -158 Q8 -160 6 -196 Z"
        fill="#1d1630" stroke="#1d1630" stroke-width="6" stroke-linejoin="round"/>
       <path d="M-58 -188 l14 0 M18 -188 l14 0" stroke="#7fd1ff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`
    : '';
  const glasses = m.look.extra === 'glasses' && face !== 'cool'
    ? `<g fill="rgba(255,255,255,.12)" stroke="#2b2133" stroke-width="5">
        <circle cx="-37" cy="-182" r="38"/><circle cx="37" cy="-182" r="38"/></g>
       <path d="M-3 -186 q3 -6 6 0" stroke="#2b2133" stroke-width="5" fill="none"/>`
    : '';
  const zzz = face === 'sleepy'
    ? `<g class="m-zzz" fill="#fff" stroke="${OUTLINE}" stroke-width="1.5" font-family="Fredoka, sans-serif" font-weight="700">
        <text x="78" y="-236" font-size="26">z</text><text x="98" y="-262" font-size="20">z</text></g>`
    : '';
  const blink = 3.6 + (h % 40) / 10;
  const blinks = face !== 'cool' && face !== 'sleepy';
  return `<g class="${blinks ? 'm-eyes' : ''}" style="animation-duration:${blink}s;animation-delay:${(h % 23) / 10}s">${eye(-1)}${eye(1)}</g>${lashes}${glasses}${shades}${zzz}`;
}

function mouth(m) {
  const face = m.look.face || 'happy';
  const teeth = `<rect x="-24" y="-136" width="12" height="13" rx="3" fill="#fff"/><rect x="12" y="-136" width="12" height="13" rx="3" fill="#fff"/>`;
  const open = `<path d="M-48 -138 Q0 -128 48 -138 Q42 -88 0 -84 Q-42 -88 -48 -138 Z" fill="#2a0b2e" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-22 -96 Q0 -112 22 -96 Q0 -84 -22 -96 Z" fill="#ef5c78"/>`;
  const cheeks = `<ellipse cx="-66" cy="-126" rx="14" ry="8" fill="#ff8fc1" opacity=".55"/><ellipse cx="66" cy="-126" rx="14" ry="8" fill="#ff8fc1" opacity=".55"/>`;
  switch (face) {
    case 'grin':
      return `${cheeks}<path d="M-46 -132 Q0 -84 46 -132" stroke="${OUTLINE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    case 'silly':
      return `<path d="M-42 -134 Q0 -126 42 -134 Q36 -102 0 -100 Q-36 -102 -42 -134 Z" fill="#2a0b2e" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M-17 -108 Q-19 -72 2 -70 Q21 -72 17 -108 Z" fill="#ef5c78" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M1 -100 V-82" stroke="#c23a55" stroke-width="2.5" stroke-linecap="round"/>${teeth}`;
    case 'surprised':
      return `<ellipse cx="0" cy="-112" rx="16" ry="20" fill="#2a0b2e" stroke="${OUTLINE}" stroke-width="3.5"/>`;
    case 'sleepy':
      return `<path d="M-22 -118 Q0 -102 22 -118" stroke="${OUTLINE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'cool':
      return `<path d="M-34 -120 Q8 -98 42 -130" stroke="${OUTLINE}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    default: // happy, wink, starry
      return open + teeth;
  }
}

function hat(m) {
  if (m.look.extra === 'bow') {
    return `<g transform="translate(58 -226) rotate(18)">
      <path d="M0 0 L-24 -14 L-22 14 Z M0 0 L24 -14 L22 14 Z" fill="#ff6fae" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
      <circle r="7" fill="#ff8fc1" stroke="${OUTLINE}" stroke-width="3"/></g>`;
  }
  if (m.look.extra === 'chef') {
    return `<g transform="translate(0 -232)">
      <rect x="-44" y="-8" width="88" height="22" rx="6" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/>
      <path d="M-42 -6 C-70 -14 -66 -58 -36 -52 C-34 -80 2 -84 6 -62 C18 -86 58 -74 48 -50 C72 -46 66 -10 42 -6 Z"
        fill="#fff" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-18 -8 v-18 M10 -8 v-22" stroke="#e3dcef" stroke-width="3"/></g>`;
  }
  return '';
}

/** The glowing, clickable body: antenna, sweater, head, face. */
export function martianBody(m, pre = 'sc') {
  const patId = `${pre}-pat-${m.id}`;
  const h = hash(m.id);
  const antenna = `    <g class="m-antenna" style="animation-delay:-${(h % 30) / 10}s">
      <path d="M0 -236 C-6 -262 8 -282 16 -300" stroke="${OUTLINE}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M0 -236 C-6 -262 8 -282 16 -300" stroke="#8d47dc" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="17" cy="-308" r="16" fill="url(#${pre}-skin)" stroke="${OUTLINE}" stroke-width="3.5"/>
      <circle cx="11" cy="-314" r="5" fill="#d4b4ff"/>
    </g>`;
  const chef = m.look.extra === 'chef';
  return `<defs>${patternDef(patId, m.look)}</defs>
    ${chef ? '' : antenna}
    <path d="M-96 44 C-100 -40 -80 -102 0 -106 C80 -102 100 -40 96 44 Z" fill="url(#${patId})" stroke="#2a1a3a" stroke-width="4"/>
    <path d="M-60 -96 Q0 -78 60 -96" stroke="#2a1a3a" stroke-width="4" fill="none" opacity=".5"/>
    <ellipse cx="0" cy="-160" rx="98" ry="86" fill="url(#${pre}-skin)" stroke="${OUTLINE}" stroke-width="4"/>
    <ellipse cx="-44" cy="-212" rx="32" ry="13" fill="#fff" opacity=".22" transform="rotate(-22 -44 -212)"/>
    ${eyes(m, pre)}
    ${mouth(m)}
    ${hat(m)}${chef ? antenna : ''}`;
}

/** Little purple hands resting on the table's back edge (absolute scene coords). */
export function martianHands(cx, y, spread, s) {
  return [-1, 1].map(side => `<g transform="translate(${cx + side * spread} ${y}) scale(${s})">
      <ellipse cx="0" cy="2" rx="22" ry="14" fill="url(#sc-skin)" stroke="${OUTLINE}" stroke-width="3.5"/>
      <path d="M${-side * 4} -6 q${side * 8} 4 ${side * 2} 14" stroke="${OUTLINE}" stroke-width="2.5" fill="none" opacity=".55"/>
    </g>`).join('');
}

/** Dangly legs under the table, swinging. */
export function martianLegs(m, cx, y, s) {
  const sock = m.look.color;
  const h = hash(m.id);
  return [-1, 1].map((side, i) => `<g transform="translate(${cx + side * 26 * s} ${y}) scale(${s})">
      <g class="m-leg" style="animation-delay:-${((h >> i) % 20) / 10 + i * 0.6}s">
        <rect x="-11" y="0" width="22" height="58" rx="11" fill="url(#sc-skin)" stroke="${OUTLINE}" stroke-width="3.5"/>
        <rect x="-12" y="40" width="24" height="16" rx="4" fill="${sock}" stroke="${OUTLINE}" stroke-width="3"/>
        <ellipse cx="${side * 7}" cy="64" rx="22" ry="12" fill="#f6f0ff" stroke="${OUTLINE}" stroke-width="3.5"/>
      </g></g>`).join('');
}

/** Standalone avatar for modal headers. */
export function martianAvatar(m) {
  return `<svg viewBox="-125 -335 250 350" class="avatar-svg" aria-hidden="true">
    <defs>${skinDefs('av')}</defs>${martianBody(m, 'av')}</svg>`;
}
