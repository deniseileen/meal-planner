// Renders the whole kitchen scene into one 1254×1254 SVG on top of the painted kitchen.
import { CUISINES, DAY_COLORS } from './data.js';
import {
  state, isMartianDone, isCookingDone, isCuisinesDone, isCookbookDone, cookDays,
} from './state.js';
import { martianBody, martianHands, martianLegs, martianScale, skinDefs } from './martian.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Layout (scene units)
const MAP = { x: 462, y: 53, w: 328, h: 202 };           // painted map inside its frame
const TABLE = { top: 730, front: 900, topL: 70, topR: 1184, frontL: 20, frontR: 1234, apron: 44 };
const ROW = { left: 80, right: 1174, base: 742 };
const PLATE_Y = 832;
const MAX_FAMILY = 8;
const CHAIRS = ['#d6453d', '#2a9d8f', '#e9b949', '#5b8c3a', '#c2577a', '#3d7dd8', '#e8833a', '#8a4fd0'];

const glow = done => `filter="url(#${done ? 'glow-b' : 'glow-y'})"`;
const hsAttrs = (action, label, done, extra = '') =>
  `class="hs ${done ? 'hs-done' : 'hs-todo'}" data-action="${action}" ${extra} role="button" tabindex="0" aria-label="${esc(label)}${done ? ' (done)' : ''}"`;

function sparkles(points) {
  return points.map(([x, y, d, s = 1]) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="sparkle" style="animation-delay:${d}s"
      d="M0 -14 C2 -4 4 -2 14 0 C4 2 2 4 0 14 C-2 4 -4 2 -14 0 C-4 -2 -2 -4 0 -14Z" fill="#fff6b0"/></g>`).join('');
}

function defs() {
  const glowFilter = (id, core, ring, dur) => `
    <filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d1"/>
      <feFlood flood-color="${core}"/><feComposite in2="d1" operator="in" result="core"/>
      <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d2"/>
      <feFlood flood-color="${ring}"/><feComposite in2="d2" operator="in" result="ring"/>
      <feGaussianBlur in="ring" stdDeviation="7" result="blur">
        <animate attributeName="stdDeviation" values="4;12;4" dur="${dur}s" repeatCount="indefinite"/>
      </feGaussianBlur>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="ring"/><feMergeNode in="core"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  return `<defs>
    ${glowFilter('glow-y', '#fffbe0', '#ffd23f', 1.8)}
    ${glowFilter('glow-b', '#eaf7ff', '#3fa9ff', 3.2)}
    ${skinDefs('sc')}
    <linearGradient id="wood-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47a3c"/><stop offset="1" stop-color="#d99a55"/></linearGradient>
    <linearGradient id="wood-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5612d"/><stop offset="1" stop-color="#7d4520"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b85e33"/><stop offset="1" stop-color="#d9824a"/></linearGradient>
    <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#235f6e"/><stop offset="1" stop-color="#2d7586"/></linearGradient>
    <linearGradient id="pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a2fb4"/><stop offset=".45" stop-color="#9a5ae6"/><stop offset="1" stop-color="#5b2499"/></linearGradient>
    <radialGradient id="oven-glow" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#ffb347"/><stop offset=".6" stop-color="#c2531b"/><stop offset="1" stop-color="#3a1608"/></radialGradient>
    <pattern id="rug" width="80" height="60" patternUnits="userSpaceOnUse">
      <rect width="80" height="60" fill="#b8325a"/><rect y="10" width="80" height="8" fill="#f2b134"/>
      <path d="M0 30 l10 -8 10 8 10 -8 10 8 10 -8 10 8 10 -8 10 8" stroke="#2a9d8f" stroke-width="6" fill="none"/>
      <rect y="44" width="80" height="6" fill="#6b3fa0"/><rect y="52" width="80" height="3" fill="#ffd9a0"/></pattern>
    <pattern id="runner" width="28" height="20" patternUnits="userSpaceOnUse">
      <rect width="28" height="20" fill="#7a2f6e"/><rect width="14" height="10" fill="#d6453d"/><rect x="14" y="10" width="14" height="10" fill="#e8833a"/>
      <rect x="6" y="3" width="3" height="3" fill="#ffd23f"/><rect x="20" y="13" width="3" height="3" fill="#7fd1c7"/></pattern>
  </defs>`;
}

// ---- wall map: pins + hotspot ---------------------------------------------------
function mapLayer() {
  const done = isCuisinesDone();
  const pins = CUISINES.filter(c => state.cuisines.picks[c.id]).map((c, i) => {
    const x = MAP.x + (c.x / 100) * MAP.w;
    const y = MAP.y + (c.y / 100) * MAP.h;
    const often = state.cuisines.picks[c.id] === 'often';
    const s = often ? 1.25 : 1;
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="pin-drop" style="animation-delay:${i * 0.05}s">
      <ellipse cx="0" cy="1" rx="4" ry="1.6" fill="#000" opacity=".3"/>
      <path d="M0 0 C-2 -6 -7 -9 -7 -14 A7 7 0 1 1 7 -14 C7 -9 2 -6 0 0Z" fill="${often ? '#ffb703' : '#e63946'}" stroke="#3a1020" stroke-width="1.6"/>
      ${often ? '<path d="M0 -18.5l1.4 2.9 3.2.4-2.3 2.2.6 3.2-2.9-1.6-2.9 1.6.6-3.2-2.3-2.2 3.2-.4z" fill="#fff"/>' : '<circle cx="0" cy="-14" r="2.6" fill="#fff"/>'}
    </g></g>`;
  }).join('');
  return `<g ${hsAttrs('map', 'World map: which cuisines do you cook?', done)}>
      <rect class="map-frame" x="447" y="40" width="358" height="227" rx="10" fill="rgba(255,255,255,0.001)" stroke="${done ? '#dff2ff' : '#fff8d0'}" stroke-width="${done ? 7 : 4}" ${glow(done)}/>
      ${pins}
      ${done ? '' : sparkles([[805, 42, 0, 1.1], [452, 262, 0.8, 0.8], [620, 36, 1.5, 0.6]])}
    </g>`;
}

// ---- lower cabinets ----------------------------------------------------------
function cabinets() {
  let doors = '';
  const xs = [0, 130, 262, 392, 520, 650, 780, 908];
  xs.forEach((x, i) => {
    const w = (xs[i + 1] ?? 1036) - x;
    doors += `<rect x="${x + 7}" y="420" width="${w - 14}" height="46" rx="6" fill="#2f7c8e" stroke="#174450" stroke-width="3"/>
      <rect x="${x + w / 2 - 18}" y="439" width="36" height="7" rx="3.5" fill="#e0aa45" stroke="#6b4a12" stroke-width="2"/>
      <rect x="${x + 7}" y="476" width="${w - 14}" height="270" rx="8" fill="#2f7c8e" stroke="#174450" stroke-width="3"/>
      <rect x="${x + 20}" y="490" width="${w - 40}" height="240" rx="6" fill="none" stroke="#1d5361" stroke-width="3"/>
      <circle cx="${x + (i % 2 ? 24 : w - 24)}" cy="540" r="7" fill="#e0aa45" stroke="#6b4a12" stroke-width="2"/>`;
  });
  return `<g aria-hidden="true">
    <rect x="0" y="404" width="1040" height="346" fill="url(#cab)"/>
    ${doors}
    <rect x="0" y="404" width="1040" height="22" fill="#000" opacity=".18"/>
    <rect x="0" y="392" width="1040" height="15" rx="3" fill="#8a4a22" stroke="#4a2410" stroke-width="3"/>
    <rect x="2" y="393" width="1036" height="3" fill="#f3c27d" opacity=".9"/>
  </g>`;
}

// ---- stove + bubbling pot -----------------------------------------------------
function stove() {
  const knobs = [1076, 1122, 1168, 1214].map(x => `<circle cx="${x}" cy="446" r="13" fill="#e6b24a" stroke="#6b4a12" stroke-width="3"/><rect x="${x - 2}" y="434" width="4" height="10" rx="2" fill="#6b4a12"/>`).join('');
  return `<g aria-hidden="true">
    <rect x="1036" y="404" width="218" height="18" fill="#26343b" stroke="#111b20" stroke-width="3"/>
    <rect x="1036" y="420" width="218" height="330" fill="#2f7f95" stroke="#173d48" stroke-width="4"/>
    <rect x="1040" y="424" width="210" height="44" rx="6" fill="#286f83"/>
    ${knobs}
    <rect x="1052" y="480" width="188" height="262" rx="12" fill="#2a7085" stroke="#173d48" stroke-width="4"/>
    <rect x="1066" y="494" width="160" height="12" rx="6" fill="#e6b24a" stroke="#6b4a12" stroke-width="2.5"/>
    <rect x="1074" y="528" width="144" height="112" rx="12" fill="url(#oven-glow)" stroke="#173d48" stroke-width="4" class="oven-window"/>
    <path d="M1180 500 h26 v86 q-13 8 -26 0 z" fill="#f6efe0" stroke="#7a6a52" stroke-width="2.5"/>
    <path d="M1180 520 h26 M1180 560 h26" stroke="#3d7dd8" stroke-width="5"/>
  </g>`;
}

function pot() {
  const done = isCookingDone();
  const bubbles = [[1198, 0, 9], [1214, 0.5, 7], [1230, 1.0, 10], [1190, 1.4, 6], [1222, 1.9, 8], [1206, 2.4, 7]]
    .map(([x, d, r]) => `<circle class="bubble" cx="${x}" cy="330" r="${r}" style="animation-delay:${d}s" fill="#ffc96b" stroke="#c96f12" stroke-width="2.5"/>`).join('');
  const steam = [[1150, 0], [1186, 1.1], [1222, 2.2]]
    .map(([x, d]) => `<path class="steam" style="animation-delay:${d}s" d="M${x} 312 c-12 -14 12 -22 0 -38 c-12 -14 10 -22 2 -34" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none"/>`).join('');
  return `<g ${hsAttrs('pot', 'Bubbling pot: your cooking habits', done)}>
      <rect x="1080" y="250" width="174" height="170" fill="transparent"/>
      ${steam}
      <g class="lift" ${glow(done)}>
        <rect x="1084" y="348" width="22" height="13" rx="5" fill="#5b2499" stroke="#2b1050" stroke-width="3"/>
        <rect x="1240" y="348" width="22" height="13" rx="5" fill="#5b2499" stroke="#2b1050" stroke-width="3"/>
        <path d="M1100 338 H1246 L1242 394 Q1240 412 1222 412 H1124 Q1106 412 1104 394 Z" fill="url(#pot)" stroke="#2b1050" stroke-width="4" stroke-linejoin="round"/>
        <path d="M1112 352 q4 30 14 48" stroke="#c9a2ff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".6"/>
        <ellipse cx="1173" cy="338" rx="75" ry="12" fill="#6a2fb4" stroke="#2b1050" stroke-width="4"/>
        <ellipse cx="1175" cy="339" rx="64" ry="7.5" fill="#f4a340"/>
        <g class="pot-lid">
          <ellipse cx="1173" cy="328" rx="78" ry="13" fill="#8a4fd8" stroke="#2b1050" stroke-width="4"/>
          <rect x="1166" y="306" width="14" height="14" rx="3" fill="#5b2499" stroke="#2b1050" stroke-width="3"/>
          <ellipse cx="1173" cy="306" rx="16" ry="7" fill="#e6b24a" stroke="#6b4a12" stroke-width="3"/>
        </g>
      </g>
      ${bubbles}
      ${done ? '' : sparkles([[1108, 300, 0.3], [1240, 270, 1.2, 0.8]])}
    </g>`;
}

// ---- open cookbook --------------------------------------------------------------
function cookbook() {
  const done = isCookbookDone();
  const lines = [314, 326, 338, 350].map(y => `<path d="M910 ${y} H${y === 350 ? 950 : 986}" stroke="#d8c6a6" stroke-width="3.5" stroke-linecap="round"/>`).join('');
  return `<g ${hsAttrs('cookbook', 'Open cookbook: favorite sites and your recipes', done)}>
      <g class="lift" ${glow(done)}>
        <path d="M778 270 Q836 254 894 266 Q952 254 1010 270 L1012 394 Q952 382 894 396 Q836 382 776 394 Z" fill="#c0392b" stroke="#5a1a12" stroke-width="4"/>
        <path d="M788 278 Q840 264 892 278 L892 388 Q840 374 788 386 Z" fill="#fff8e6" stroke="#7a5a3a" stroke-width="2.5"/>
        <path d="M896 278 Q948 264 1000 278 L1000 386 Q948 374 896 388 Z" fill="#fff8e6" stroke="#7a5a3a" stroke-width="2.5"/>
        <rect x="878" y="272" width="32" height="118" fill="#000" opacity=".07"/>
        <text x="840" y="306" text-anchor="middle" class="book-title">Good Food</text>
        <text x="840" y="325" text-anchor="middle" class="book-sub">Cookbook</text>
        <circle cx="818" cy="352" r="11" fill="#e8483b" stroke="#7a1d14" stroke-width="2"/>
        <path d="M816 341 l4 -6" stroke="#3f9b5a" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="842" cy="354" rx="9" ry="14" fill="#5fb35a" stroke="#2b6a2a" stroke-width="2" transform="rotate(30 842 354)"/>
        <path d="M858 344 l18 6 -14 18 z" fill="#f08a3c" stroke="#8a4512" stroke-width="2" stroke-linejoin="round"/>
        <text x="948" y="300" text-anchor="middle" class="book-recipe">Martian Stew</text>
        ${lines}
        <g transform="translate(972 360) rotate(-25)">
          <rect x="-22" y="-10" width="44" height="20" rx="10" fill="#7cb342" stroke="#33691e" stroke-width="2.5"/>
          <circle cx="-8" cy="-2" r="1.8" fill="#33691e"/><circle cx="6" cy="3" r="1.8" fill="#33691e"/><circle cx="12" cy="-4" r="1.8" fill="#33691e"/>
          <path d="M-3 4 q3 3 6 0" stroke="#1b3a10" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>
        <path class="page-flip" d="M896 278 Q948 264 1000 278 L1000 386 Q948 374 896 388 Z" fill="#fffdf6" stroke="#7a5a3a" stroke-width="2"/>
        <path d="M894 268 C900 320 888 372 902 414" stroke="#e63946" stroke-width="6" fill="none" stroke-linecap="round"/>
        <rect x="770" y="388" width="248" height="15" rx="4" fill="#9c5a2b" stroke="#4a2410" stroke-width="3"/>
      </g>
      ${done ? '' : sparkles([[1006, 262, 0.6], [784, 268, 1.6, 0.7]])}
    </g>`;
}

function toteBag() {
  const ready = state.plan && state.plan.status === 'ready';
  return `<g class="hs hs-tote${ready ? ' tote-ready' : ''}" data-action="tote" role="button" tabindex="0" aria-label="Tote bag: shopping list">
    <rect x="958" y="150" width="128" height="200" rx="14" fill="transparent"/>
    ${ready ? '<g transform="translate(1066 176)"><g class="tote-bob"><circle r="16" fill="#2fbf71" stroke="#fff" stroke-width="3"/><text y="6" text-anchor="middle" class="tote-badge">🛒</text></g></g>' : ''}
  </g>`;
}

// ---- floor, rug, table ----------------------------------------------------------
function floor() {
  let lines = '';
  [790, 860, 950, 1060].forEach(y => { lines += `<path d="M0 ${y} H1254" stroke="#8f4422" stroke-width="3" opacity=".45"/>`; });
  for (let i = -6; i <= 6; i++) lines += `<path d="M${627 + i * 70} 750 L${627 + i * 190} 1254" stroke="#8f4422" stroke-width="3" opacity=".35"/>`;
  return `<g aria-hidden="true">
    <rect x="0" y="746" width="1254" height="508" fill="url(#floor)"/>${lines}
    <path d="M70 1030 H1184 L1254 1254 H0 Z" fill="url(#rug)" stroke="#5a1730" stroke-width="4"/>
    <ellipse cx="627" cy="1218" rx="610" ry="34" fill="#000" opacity=".22"/>
  </g>`;
}

function table() {
  const { top, front, topL, topR, frontL, frontR, apron } = TABLE;
  const planks = [0.25, 0.5, 0.75].map(t => {
    const x1 = topL + (topR - topL) * t; const x2 = frontL + (frontR - frontL) * t;
    return `<path d="M${x1} ${top} L${x2} ${front}" stroke="#a8652f" stroke-width="2.5" opacity=".55"/>`;
  }).join('');
  const leg = x => `<path d="M${x} ${front + apron} h48 v20 q-8 10 0 20 v170 q6 12 -4 22 h-40 q-10 -10 -4 -22 v-170 q8 -10 0 -20 z" fill="url(#wood-front)" stroke="#4a2410" stroke-width="4"/>`;
  return `<g aria-hidden="true">
    ${leg(54)}${leg(1152)}
    <path d="M${topL} ${top} H${topR} L${frontR} ${front} H${frontL} Z" fill="url(#wood-top)" stroke="#4a2410" stroke-width="4" stroke-linejoin="round"/>
    ${planks}
    <path d="M${topL + 2} ${top + 3} H${topR - 2}" stroke="#f2bf7d" stroke-width="3" opacity=".8"/>
    <path d="M96 776 H1158 L1182 888 H72 Z" fill="url(#runner)" stroke="#4a1940" stroke-width="3"/>
    <path d="M96 782 H1158 M74 882 H1180" stroke="#ffd23f" stroke-width="3" opacity=".8"/>
    <rect x="${frontL - 6}" y="${front}" width="${frontR - frontL + 12}" height="${apron}" rx="7" fill="url(#wood-front)" stroke="#4a2410" stroke-width="4"/>
    <path d="M${frontL} ${front + 4} H${frontR}" stroke="#d48e4f" stroke-width="3" opacity=".7"/>
  </g>`;
}

// ---- family ----------------------------------------------------------------------
function familyLayout() {
  const canAdd = state.family.length < MAX_FAMILY;
  const slots = state.family.length + (canAdd ? 1 : 0);
  const slotW = (ROW.right - ROW.left) / Math.max(slots, 1);
  const fit = Math.min(1.28, (slotW - 8) / 214);
  const seats = state.family.map((m, i) => ({ m, i, cx: ROW.left + slotW * (i + 0.5), s: fit * martianScale(m) }));
  const add = canAdd ? { cx: ROW.left + slotW * (slots - 0.5), s: fit * 0.8 } : null;
  return { seats, add, slotW, fit };
}

function chair(cx, s, color) {
  const h = 280 * Math.max(s, 0.75);
  const w = 112 * Math.max(s, 0.6);
  const y0 = ROW.base;
  return `<g aria-hidden="true">
    <rect x="${cx - w - 9}" y="${y0 - h}" width="18" height="${h}" rx="8" fill="${color}" stroke="#2a1a1a" stroke-width="3.5"/>
    <rect x="${cx + w - 9}" y="${y0 - h}" width="18" height="${h}" rx="8" fill="${color}" stroke="#2a1a1a" stroke-width="3.5"/>
    <circle cx="${cx - w}" cy="${y0 - h - 6}" r="11" fill="${color}" stroke="#2a1a1a" stroke-width="3.5"/>
    <circle cx="${cx + w}" cy="${y0 - h - 6}" r="11" fill="${color}" stroke="#2a1a1a" stroke-width="3.5"/>
    <rect x="${cx - w}" y="${y0 - h + 12}" width="${w * 2}" height="30" rx="10" fill="${color}" stroke="#2a1a1a" stroke-width="3.5"/>
  </g>`;
}

function familyLayer() {
  const { seats, add, slotW } = familyLayout();
  let legs = ''; let bodies = ''; let hands = ''; let cards = '';
  const cardW = Math.min(slotW * 0.78, 150);
  for (const { m, i, cx, s } of seats) {
    const done = isMartianDone(m);
    legs += martianLegs(m, cx, TABLE.front + TABLE.apron - 6, Math.max(s, 0.6));
    bodies += chair(cx, s, CHAIRS[i % CHAIRS.length]);
    bodies += `<g transform="translate(${cx} ${ROW.base}) scale(${s})">
        <g ${hsAttrs('martian', `Family member ${m.name || i + 1}: food preferences`, done, `data-id="${m.id}"`)}>
          <g class="lift" ${glow(done)}>${martianBody(m, 'sc')}</g>
          ${done ? '' : sparkles([[78, -300, i * 0.4], [-96, -220, 1 + i * 0.3, 0.7]])}
        </g></g>`;
    hands += martianHands(cx, TABLE.top + 12, Math.max(cardW / 2 + 16, 64 * s), Math.max(s, 0.6));
    const label = m.name.trim() || 'Who am I?';
    const fs = Math.min(22, (cardW - 14) / Math.max(label.length, 4) * 1.9);
    cards += `<g class="place-card${done ? ' done' : ''}" data-action="martian" data-id="${m.id}">
        <path d="M${cx - cardW / 2} ${TABLE.top + 34} l8 -26 h${cardW - 16} l8 26 z" fill="#fffaf0" stroke="#5a4636" stroke-width="2.5"/>
        <rect x="${cx - cardW / 2 + 9}" y="${TABLE.top + 9}" width="${cardW - 18}" height="5" fill="${m.look.color}"/>
        <text x="${cx}" y="${TABLE.top + 29}" text-anchor="middle" class="card-text${m.name.trim() ? '' : ' empty'}" style="font-size:${fs}px">${esc(label)}</text>
      </g>`;
  }
  let ghost = '';
  if (add) {
    const { cx, s } = add;
    ghost = `<g class="hs hs-add" data-action="add-martian" role="button" tabindex="0" aria-label="Add a family member">
        <g transform="translate(${cx} ${ROW.base}) scale(${s})"><g class="lift">
          <path d="M0 -236 C-6 -262 8 -282 16 -300" stroke="#fff" stroke-width="7" fill="none" stroke-dasharray="10 9" stroke-linecap="round"/>
          <circle cx="17" cy="-308" r="15" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="5" stroke-dasharray="9 7"/>
          <ellipse class="ghost-head" cx="0" cy="-160" rx="98" ry="86" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="6" stroke-dasharray="16 12"/>
          <circle cx="0" cy="-160" r="40" fill="#ffd23f" stroke="#7a4b00" stroke-width="5"/>
          <path d="M0 -182 V-138 M-22 -160 H22" stroke="#7a4b00" stroke-width="10" stroke-linecap="round"/>
        </g></g>
        <text x="${cx}" y="${TABLE.top + 29}" text-anchor="middle" class="card-text add-text" style="font-size:${Math.min(20, slotW / 7)}px">Add martian</text>
      </g>`;
  }
  return { legs, bodies: bodies + ghost, hands, cards };
}

// ---- plates ------------------------------------------------------------------------
export function wrapText(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!line) line = w;
    else if ((line + ' ' + w).length <= maxChars) line += ' ' + w;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.{0,2}$/, '') + '…';
    return kept;
  }
  return lines;
}

const shownPlates = new Set();

function platesLayer() {
  const plan = state.plan;
  if (!plan) return '';
  const days = plan.meals.map(m => m.day);
  const n = days.length;
  if (!n) return '';
  const left = 100; const right = 1154;
  const slot = (right - left) / n;
  const rx = Math.min(98, slot * 0.46);
  const ry = Math.min(52, rx * 0.72);
  return plan.meals.map((meal, i) => {
    const cx = left + slot * (i + 0.5);
    const color = DAY_COLORS[meal.day];
    const key = `${plan.weekOf}-${meal.day}-${meal.name || ''}`;
    const fresh = !shownPlates.has(key);
    shownPlates.add(key);
    const fs = Math.max(12, Math.min(19, rx / 5));
    const maxChars = Math.max(8, Math.floor((rx * 1.5) / (fs * 0.55)));
    let inner;
    if (meal.name) {
      const lines = wrapText(meal.name, maxChars, 3);
      const showEmoji = lines.length < 3 && meal.emoji && ry > 40;
      const total = lines.length * fs * 1.05 + (showEmoji ? fs * 1.5 : 0);
      let y = -total / 2 + fs * 0.85 + 3;
      inner = '';
      if (showEmoji) { inner += `<text y="${y + 2}" text-anchor="middle" style="font-size:${fs * 1.35}px">${esc(meal.emoji)}</text>`; y += fs * 1.5; }
      inner += lines.map((l, j) => `<text y="${y + j * fs * 1.05}" text-anchor="middle" class="plate-meal" style="font-size:${fs}px">${esc(l)}</text>`).join('');
    } else if (plan.status === 'cooking') {
      inner = `<g class="plate-cooking">${[-14, 0, 14].map((x, j) => `<path class="steam small" style="animation-delay:${j * 0.4}s" d="M${x} 6 c-6 -7 6 -11 0 -18 c-6 -7 5 -11 1 -16" stroke="#c9b9a6" stroke-width="5" stroke-linecap="round" fill="none"/>`).join('')}</g>
        <text y="${ry * 0.45}" text-anchor="middle" class="plate-meal" style="font-size:${fs * 0.85}px">cooking…</text>`;
    } else {
      inner = `<text y="-2" text-anchor="middle" style="font-size:${fs * 1.4}px">🛸</text>
        <text y="${fs + 4}" text-anchor="middle" class="plate-meal" style="font-size:${fs * 0.8}px">tap to retry</text>`;
    }
    return `<g transform="translate(${cx} ${PLATE_Y})"><g class="plate${fresh ? ' plate-in' : ''}" style="animation-delay:${i * 0.12}s"
        data-action="plate" data-day="${meal.day}" role="button" tabindex="0" aria-label="${esc(meal.day)} dinner: ${esc(meal.name || 'not ready yet')}">
        <title>${esc(meal.day)}: ${esc(meal.name || 'cooking…')}</title>
        <ellipse cx="0" cy="7" rx="${rx}" ry="${ry}" fill="#000" opacity=".22"/>
        <ellipse rx="${rx}" ry="${ry}" fill="#fffaf0" stroke="#5a4636" stroke-width="3"/>
        <ellipse rx="${rx - 7}" ry="${ry - 6}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="2 7" stroke-linecap="round"/>
        <ellipse rx="${rx * 0.78}" ry="${ry * 0.72}" fill="#fff" stroke="#eadfcb" stroke-width="2"/>
        <rect x="${-22}" y="${-ry - 9}" width="44" height="18" rx="9" fill="${color}" stroke="#fff" stroke-width="2"/>
        <text y="${-ry + 4.5}" text-anchor="middle" class="plate-day">${meal.day.slice(0, 3).toUpperCase()}</text>
        ${inner}
      </g></g>`;
  }).join('');
}

// ---- assemble ------------------------------------------------------------------------
export function renderScene(svg) {
  const fam = familyLayer();
  svg.innerHTML = `${defs()}
    <image href="assets/kitchen.webp" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none"/>
    ${mapLayer()}
    ${cabinets()}
    ${stove()}
    ${toteBag()}
    ${pot()}
    ${cookbook()}
    ${floor()}
    <g aria-hidden="true">${fam.legs}</g>
    ${fam.bodies}
    ${table()}
    <g aria-hidden="true">${fam.hands}</g>
    ${fam.cards}
    ${platesLayer()}`;
}

export const sceneInfo = { MAX_FAMILY, cookDays };
