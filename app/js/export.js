// Exports the week: every recipe plus the shopping list, as a printable page (or PDF) or a text file.
import { AISLES, AISLE_EMOJI } from './data.js';
import { state } from './state.js';
import { h, openModal, toast } from './modal.js';
import { fetchRecipe, mealSource } from './planner.js';

const sourceText = m => { const s = mealSource(m); return !s ? '' : s.kind === 'family' ? `Family recipe: ${s.title}` : `Inspired by ${s.label}`; };
const sourceUrl = m => { const u = mealSource(m)?.url || ''; return /^https?:\/\//i.test(u) ? u : ''; };

const fmtWeek = iso => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

/** Fetches any recipes not loaded yet. Returns the errors, if any. */
export async function ensureRecipes(meals) {
  const missing = meals.filter(m => !m.recipe);
  const results = await Promise.allSettled(missing.map(fetchRecipe));
  return results.filter(r => r.status === 'rejected').map(r => r.reason);
}

// ---- combining ingredients ------------------------------------------------------------------
const FRACTIONS = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
// Words that describe prep, not the thing you buy
const PREP = /\b(fresh(ly)?|chopped|diced|minced|sliced|thinly|thickly|finely|roughly|coarsely|crushed|grated|shredded|peeled|trimmed|halved|quartered|cubed|melted|softened|beaten|rinsed|drained|divided|optional|large|small|medium|to taste|for serving|for garnish|plus more|about|packed|heaping|level|extra[- ]virgin|boneless|skinless|whole|ripe)\b/g;
// Container words that can trail an ingredient name ("garlic cloves" is just garlic)
const CONTAINERS = /\s+(cloves?|cans?|jars?|bunch(es)?|heads?|sprigs?|stalks?|packages?|bags?|boxes?|bottles?)$/;

function singular(word) {
  if (/(ss|us|is)$/.test(word)) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(oes|ches|shes|xes|ses)$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

/** "Tomatoes, diced (about 2)" and "1 large tomato" → "tomato" */
export function ingredientKey(item) {
  const base = String(item).toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[,;]/)[0]
    .replace(PREP, ' ').replace(/\bof\b/g, ' ').replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(CONTAINERS, '').replace(/^(cans?|jars?|bunch(es)?|heads?|packages?|bags?|boxes?|bottles?)\s+/, '');
  const words = base.split(' ').filter(Boolean);
  if (!words.length) return String(item).toLowerCase().trim();
  words[words.length - 1] = singular(words[words.length - 1]);
  return words.join(' ').replace(/^(.+) cheese$/, '$1'); // "ricotta cheese" = "ricotta"
}

// Units grouped into families that can be added together (base: tsp for volume, oz for weight)
const UNITS = {
  tsp: ['vol', 1], teaspoon: ['vol', 1], t: ['vol', 1],
  tbsp: ['vol', 3], tablespoon: ['vol', 3], tbs: ['vol', 3], tbl: ['vol', 3],
  cup: ['vol', 48], c: ['vol', 48],
  'fl oz': ['vol', 6], pint: ['vol', 96], pt: ['vol', 96], quart: ['vol', 192], qt: ['vol', 192], gallon: ['vol', 768],
  ml: ['vol', 0.2029], milliliter: ['vol', 0.2029], l: ['vol', 202.9], liter: ['vol', 202.9], litre: ['vol', 202.9],
  oz: ['wt', 1], ounce: ['wt', 1], lb: ['wt', 16], pound: ['wt', 16], g: ['wt', 0.03527], gram: ['wt', 0.03527], kg: ['wt', 35.27], kilogram: ['wt', 35.27],
};

function toNumber(txt) {
  txt = txt.trim();
  let m = txt.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return +m[1] + m[2] / m[3];
  m = txt.match(/^(\d+)\/(\d+)$/);
  if (m) return m[1] / m[2];
  return parseFloat(txt);
}

/** "1 1/2 cups" → { qty: 1.5, family: 'vol', base: 72 }; "3 cloves" → { qty: 3, family: 'count:clove' } */
export function parseAmount(amount) {
  let s = String(amount || '').toLowerCase();
  for (const [k, v] of Object.entries(FRACTIONS)) s = s.replace(new RegExp(`(\\d)\\s*${k}`, 'g'), `$1 ${v}`).replaceAll(k, v);
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const NUM = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)`;
  const m = s.match(new RegExp(`^${NUM}(?:\\s*(?:-|–|to)\\s*${NUM})?\\s*(.*)$`));
  if (!m) return null;
  const qty = toNumber(m[2] || m[1]); // ranges use the larger number, so you buy enough
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const rest = m[3].replace(/\.$/, '').replace(/\b(large|small|medium|whole|heaping|level|ripe)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const unitWord = rest.startsWith('fl oz') ? 'fl oz' : singular(rest.split(' ')[0] || '');
  const unit = UNITS[unitWord];
  if (unit) return { qty, family: unit[0], base: qty * unit[1] };
  return { qty, family: `count:${unitWord}`, unitLabel: rest.split(' ')[0] || '' };
}

function fraction(n) {
  const whole = Math.floor(n + 1e-9);
  const parts = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
  const rem = n - whole;
  const [val, sym] = parts.reduce((best, p) => (Math.abs(p[0] - rem) < Math.abs(best[0] - rem) ? p : best));
  const w = val === 1 ? whole + 1 : whole;
  return `${w || ''}${sym}` || '0';
}

function formatTotal(family, total, label) {
  if (family === 'vol') {
    if (total >= 12) { const c = total / 48; return `${fraction(c)} cup${c > 1.01 ? 's' : ''}`; }
    if (total >= 3) return `${fraction(total / 3)} tbsp`;
    return `${fraction(total)} tsp`;
  }
  if (family === 'wt') return total >= 16 ? `${fraction(total / 16)} lb` : `${fraction(total)} oz`;
  const unit = label ? (total > 1 && !label.endsWith('s') ? `${label}s` : total <= 1 ? singular(label) : label) : '';
  return `${Number.isInteger(total) ? total : fraction(total)}${unit ? ` ${unit}` : ''}`;
}

/** Shopping-list wording: "Fresh garlic cloves, minced" → "garlic"; "can of tomatoes" → "tomatoes" */
function displayName(item) {
  const PREP_I = new RegExp(PREP.source, 'gi');
  const name = String(item).replace(/\([^)]*\)/g, ' ').split(/[,;]/)[0].replace(PREP_I, ' ')
    .replace(/^[\d\s./-]+/, '').replace(/^(cans?|jars?|packages?|bags?|boxes?|bottles?)\s+(of\s+)?/i, '')
    .replace(/\s+/g, ' ').trim().replace(CONTAINERS, '');
  return (name || String(item).trim()).toLowerCase();
}

/** Adds up a list of amounts: ["1 tbsp", "2 tsp"] → "1⅔ tbsp"; incompatible units stay side by side. */
export function combineAmounts(amounts) {
  const totals = new Map();
  const loose = [];
  for (const a of amounts.filter(x => String(x || '').trim())) {
    const p = parseAmount(a);
    if (!p) { if (!loose.includes(a.trim())) loose.push(a.trim()); continue; }
    const t = totals.get(p.family) || { total: 0, label: p.unitLabel };
    t.total += p.base ?? p.qty;
    totals.set(p.family, t);
  }
  return [...[...totals].map(([fam, t]) => formatTotal(fam, t.total, t.label)), ...loose].join(' + ');
}

/** Combines all ingredients by aisle: [{ aisle, items: [{ id, item, amount, days }] }] */
export function groupShopping(meals) {
  const byKey = new Map();
  for (const meal of meals) {
    for (const it of meal.recipe?.ingredients || []) {
      if (!it.item.trim()) continue;
      // Same aisle + same base name = same thing to buy (keeps canned and fresh tomatoes apart)
      const key = `${it.aisle}|${ingredientKey(it.item)}`;
      const tag = meal.day.slice(0, 3);
      const name = displayName(it.item);
      const found = byKey.get(key);
      if (found) {
        found.amounts.push(it.amount);
        if (!found.days.includes(tag)) found.days.push(tag);
        if (name.length > found.item.length) found.item = name; // "tomatoes" over "tomato"
      } else {
        byKey.set(key, { key, id: key, aisle: it.aisle, item: name, amounts: [it.amount], days: [tag] });
      }
    }
  }
  return AISLES.map(aisle => ({
    aisle,
    items: [...byKey.values()].filter(x => x.aisle === aisle)
      .map(x => ({ ...x, amount: combineAmounts(x.amounts) }))
      .sort((a, b) => a.item.localeCompare(b.item)),
  })).filter(g => g.items.length);
}

export function shoppingText(plan, groups) {
  return [`Shopping list — week of ${fmtWeek(plan.weekOf)}`, ...groups.flatMap(g => ['', g.aisle.toUpperCase(),
    ...g.items.map(x => `[ ] ${x.amount ? `${x.amount} ` : ''}${x.item} (${x.days.join(', ')})`)])].join('\n');
}

// ---- text (Markdown) version ------------------------------------------------------------------
function weekMarkdown(plan, meals, groups, { recipes, shopping }) {
  const out = [`# 👽 Dinner plan — week of ${fmtWeek(plan.weekOf)}`, ''];
  out.push('| Night | Dinner |', '|---|---|', ...meals.map(m => `| ${m.day} | ${m.emoji || ''} ${m.name} |`), '');
  if (recipes) {
    for (const m of meals) {
      const r = m.recipe;
      out.push('---', '', `## ${m.day}: ${m.emoji || ''} ${r?.title || m.name}`);
      out.push([r?.minutes || m.minutes ? `⏱ ${r?.minutes || m.minutes} min` : '', r?.servings ? `Serves ${r.servings}` : '', m.cuisine, sourceText(m)].filter(Boolean).join(' · '));
      if (sourceUrl(m)) out.push('', `Original: ${sourceUrl(m)}`);
      if (m.why) out.push('', `_${m.why}_`);
      if (!r) { out.push('', '(Recipe not loaded yet.)', ''); continue; }
      if (r.kind === 'family') {
        out.push('', '### Your recipe, exactly as written', '', ...r.original.split('\n').map(l => `> ${l}`));
        out.push('', '### Chef Zorp’s tweaks for this week', ...(r.tweaks.length ? r.tweaks.map(t => `- ${t}`) : ['- No changes needed.']));
      } else {
        out.push('', '### Ingredients', ...r.ingredients.map(i => `- ${i.amount ? `**${i.amount}** ` : ''}${i.item}`));
        out.push('', '### Steps', ...r.steps.map((s, i) => `${i + 1}. ${s}`));
      }
      if (r.family_notes.length) out.push('', '### For each martian', ...r.family_notes.map(n => `- ${n}`));
      if (r.tips.length) out.push('', '### Tips', ...r.tips.map(n => `- ${n}`));
      out.push('');
    }
  }
  if (shopping) {
    out.push('---', '', '# 🛍️ Shopping list');
    for (const g of groups) out.push('', `## ${AISLE_EMOJI[g.aisle]} ${g.aisle}`, ...g.items.map(x => `- [ ] ${x.amount ? `${x.amount} ` : ''}${x.item} _(${x.days.join(', ')})_`));
  }
  return out.join('\n') + '\n';
}

// ---- printable version ---------------------------------------------------------------------------
function printWeek(plan, meals, groups, { recipes, shopping }) {
  const root = document.getElementById('print-root');
  const page = h('div', { class: 'pw' },
    h('h1', {}, `👽 Dinner plan — week of ${fmtWeek(plan.weekOf)}`),
    h('table', { class: 'pw-week' }, meals.map(m => h('tr', {}, h('th', {}, m.day), h('td', {}, `${m.emoji || ''} ${m.name}`)))),
    recipes ? meals.map(m => {
      const r = m.recipe;
      return h('section', { class: 'pw-recipe' },
        h('h2', {}, `${m.day}: ${m.emoji || ''} ${r?.title || m.name}`),
        h('p', { class: 'pw-meta' }, [r?.minutes || m.minutes ? `⏱ ${r?.minutes || m.minutes} min` : '', r?.servings ? `Serves ${r.servings}` : '', m.cuisine, sourceText(m)].filter(Boolean).join(' · ')),
        sourceUrl(m) ? h('p', { class: 'pw-meta' }, `Original: ${sourceUrl(m)}`) : '',
        m.why ? h('p', { class: 'pw-why' }, m.why) : '',
        r?.kind === 'family' ? [
          h('h3', {}, 'Your recipe, exactly as written'), h('div', { class: 'pw-original' }, r.original),
          h('h3', {}, 'Chef Zorp’s tweaks for this week'), h('ul', {}, (r.tweaks.length ? r.tweaks : ['No changes needed.']).map(t => h('li', {}, t)))]
        : r ? h('div', { class: 'pw-cols' },
          h('div', {}, h('h3', {}, 'Ingredients'), h('ul', {}, r.ingredients.map(i => h('li', {}, i.amount ? h('b', {}, i.amount, ' ') : '', i.item)))),
          h('div', {}, h('h3', {}, 'Steps'), h('ol', {}, r.steps.map(s => h('li', {}, s))))) : h('p', {}, '(Recipe not loaded yet.)'),
        r?.family_notes.length ? [h('h3', {}, 'For each martian'), h('ul', {}, r.family_notes.map(n => h('li', {}, n)))] : '',
        r?.tips.length ? [h('h3', {}, 'Tips'), h('ul', {}, r.tips.map(n => h('li', {}, n)))] : '');
    }) : '',
    shopping ? h('section', { class: 'pw-shop' }, h('h2', {}, '🛍️ Shopping list'),
      h('div', { class: 'pw-aisles' }, groups.map(g => h('div', { class: 'pw-aisle' }, h('h3', {}, `${AISLE_EMOJI[g.aisle]} ${g.aisle}`),
        h('ul', { class: 'pw-checks' }, g.items.map(x => h('li', {}, x.amount ? h('b', {}, x.amount, ' ') : '', x.item, h('small', {}, ` (${x.days.join(', ')})`)))))))) : '');
  root.replaceChildren(page);
  document.body.classList.add('printing-week');
  const done = () => { document.body.classList.remove('printing-week'); root.replaceChildren(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}

function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---- the export modal --------------------------------------------------------------------------------
export function openExport({ errorBox } = {}) {
  const m = openModal({ theme: '#3d7dd8', icon: '📤', title: 'Export this week', subtitle: 'Recipes and shopping list to print, save or share' });
  m.foot.append(h('div', { class: 'spacer' }), h('button', { class: 'btn btn-primary', onclick: () => m.close() }, 'Done'));
  const plan = state.plan;
  if (!plan || plan.status !== 'ready') {
    m.body.replaceChildren(h('div', { class: 'info-box', style: { textAlign: 'center' } }, '🛸 Plan the week first, then come back to export it.'));
    return m;
  }
  const meals = plan.meals.filter(x => x.name);
  const opts = { recipes: true, shopping: true };

  const build = async () => {
    if (meals.some(x => !x.recipe)) {
      m.body.replaceChildren(h('div', { class: 'loading' }, h('span', { class: 'pot-anim' }, '📚'),
        h('p', {}, 'Gathering all the recipes', h('span', { class: 'dots' })), h('small', {}, 'Each one comes from Chef Zorp, so this can take a minute')));
      const errors = await ensureRecipes(meals);
      if (errors.length === meals.filter(x => !x.recipe).length && errors.length && errorBox) { m.body.replaceChildren(errorBox(errors[0], build)); return; }
    }
    const groups = groupShopping(meals);
    const slug = `martian-dinners-${plan.weekOf}`;
    const toggle = (key, label) => h('button', {
      class: `toggle-pill${opts[key] ? ' sel' : ''}`,
      onclick: e => { opts[key] = !opts[key]; e.currentTarget.classList.toggle('sel', opts[key]); },
    }, label);
    const need = () => { if (!opts.recipes && !opts.shopping) { toast('Pick recipes, the shopping list, or both'); return false; } return true; };
    m.body.replaceChildren(
      h('h3', { class: 'q-title' }, 'What should we include?'),
      h('div', { class: 'quick-row' }, toggle('recipes', `📖 All ${meals.length} recipes`), toggle('shopping', '🛍️ Shopping list')),
      meals.some(x => !x.recipe) ? h('div', { class: 'error-box' }, 'Some recipes couldn’t be fetched and will be listed without details. Close this and try again later to fill them in.') : '',
      h('div', { class: 'tiles big', style: { marginTop: '18px' } },
        h('button', { class: 'tile', onclick: () => { if (need()) printWeek(plan, meals, groups, opts); } },
          h('span', { class: 't-emoji' }, '🖨️'), h('span', { class: 't-label' }, 'Print or save as PDF'), h('span', { class: 't-sub' }, 'Choose “Save as PDF” in the print window')),
        h('button', { class: 'tile', onclick: () => { if (need()) { download(`${slug}.md`, weekMarkdown(plan, meals, groups, opts), 'text/markdown'); toast('⬇️ Downloaded!'); } } },
          h('span', { class: 't-emoji' }, '📝'), h('span', { class: 't-label' }, 'Download as text'), h('span', { class: 't-sub' }, 'Opens in Notes, Docs or any text app')),
        h('button', { class: 'tile', onclick: async () => {
          try { await navigator.clipboard.writeText(shoppingText(plan, groups)); toast('📋 Shopping list copied!'); } catch { toast('Couldn’t copy — try the text download'); }
        } }, h('span', { class: 't-emoji' }, '📋'), h('span', { class: 't-label' }, 'Copy shopping list'), h('span', { class: 't-sub' }, 'Paste into a text or reminders app'))),
    );
  };
  build();
  return m;
}
