// The four question modals: a martian, the bubbling pot, the world map, the cookbook.
import {
  AGES, SWEATERS, PATTERNS, EXTRAS, FACES, EYE_COLORS, FOOD_GROUPS, DIETS, ALLERGIES, SPICE, ADVENTURE,
  DAYS, WEEKEND, DAY_COLORS, TIMES, SKILLS, GADGETS, LEFTOVERS, BUDGETS,
  CUISINES, EXPLORE, SITES, USE_RECIPES,
} from './data.js';
import {
  state, save, martianChecks, cookingChecks, cuisineChecks, cookbookChecks, uid,
} from './state.js';
import { h, openWizard, choiceTiles, multiTiles, triTiles, toast } from './modal.js';
import { martianAvatar } from './martian.js';

/** Step renderer whose content redraws in place after each answer. */
const live = build => (container, refresh, modal) => {
  const redraw = () => container.replaceChildren(build(change, modal));
  const change = fn => { fn(); save(); redraw(); refresh(); };
  redraw();
};

// ---- a martian -------------------------------------------------------------------
export function openMartian(m, { onClose, start = 0 } = {}) {
  const checks = () => martianChecks(m);
  const who = () => m.name.trim() || 'this martian';
  let modal;
  const updateHeader = () => {
    modal.avatar.innerHTML = martianAvatar(m);
    modal.titleEl.textContent = m.name.trim() || 'New martian';
  };

  const steps = [
    {
      label: 'Who', title: 'Who is this martian?', hint: 'Give them a name, an age and a look.',
      done: () => checks()[0],
      render: (c, refresh) => {
        const preview = h('div', { class: 'preview-martian', html: martianAvatar(m) });
        const repaint = () => { preview.innerHTML = martianAvatar(m); updateHeader(); };
        const name = h('input', {
          class: 'name-input', placeholder: 'Name…', value: m.name, maxlength: 24, 'aria-label': 'Name',
          oninput: e => { m.name = e.target.value; save(); updateHeader(); refresh(); },
        });
        const ages = h('div');
        const looks = h('div');
        const drawAges = () => ages.replaceChildren(choiceTiles(AGES, m.age, id => { m.age = id; save(); repaint(); drawAges(); refresh(); }, { size: 'small' }));
        const drawLooks = () => looks.replaceChildren(
          h('p', { class: 'sub-q' }, 'Their expression'),
          choiceTiles(FACES, m.look.face || 'happy', id => { m.look.face = id; save(); repaint(); drawLooks(); }, { size: 'small' }),
          h('p', { class: 'sub-q' }, 'Eye color'),
          h('div', { class: 'swatches' }, EYE_COLORS.map(col => h('button', {
            class: `swatch eye-swatch${(m.look.eyes || '#2fae4e') === col ? ' sel' : ''}`, style: { '--iris': col }, 'aria-label': `Eye color ${col}`,
            onclick: () => { m.look.eyes = col; save(); repaint(); drawLooks(); },
          }))),
          h('p', { class: 'sub-q' }, 'Sweater color'),
          h('div', { class: 'swatches' }, SWEATERS.map(col => h('button', {
            class: `swatch${m.look.color === col ? ' sel' : ''}`, style: { background: col }, 'aria-label': `Sweater color ${col}`,
            onclick: () => { m.look.color = col; save(); repaint(); drawLooks(); },
          }))),
          h('p', { class: 'sub-q' }, 'Sweater pattern'),
          choiceTiles(PATTERNS.map(p => ({ ...p, emoji: { stripes: '〰️', dots: '⚪', stars: '⭐', plain: '🟪' }[p.id] })), m.look.pattern,
            id => { m.look.pattern = id; save(); repaint(); drawLooks(); }, { size: 'small' }),
          h('p', { class: 'sub-q' }, 'Something special?'),
          choiceTiles(EXTRAS, m.look.extra, id => { m.look.extra = id; save(); repaint(); drawLooks(); }, { size: 'small' }),
        );
        drawAges(); drawLooks();
        c.append(h('div', { class: 'name-row' }, preview, h('div', { style: { flex: '1', minWidth: '220px', textAlign: 'center' } }, name)),
          h('p', { class: 'sub-q' }, 'How old?'), ages, looks);
      },
    },
    {
      label: 'Foods', title: 'Tap the foods!', hint: 'Tap once if they love it ❤️ — tap twice if they won’t eat it 🚫',
      done: () => checks()[1],
      render: live(change => h('div', {},
        h('div', { class: 'everything' }, h('button', {
          class: `toggle-pill${m.eatsEverything ? ' sel' : ''}`,
          onclick: () => change(() => { m.eatsEverything = !m.eatsEverything; }),
        }, '🍽️ ', `${who()} eats pretty much everything!`)),
        FOOD_GROUPS.map(g => [h('div', { class: 'group-title' }, g.title),
          triTiles(g.items, m.foods, next => change(() => { m.foods = next; }))]),
      )),
    },
    {
      label: 'Diet', title: 'Any special diet?', hint: 'Pick all that apply.',
      done: () => checks()[2],
      render: live(change => multiTiles(DIETS, m.diet, next => change(() => { m.diet = next; }))),
    },
    {
      label: 'Allergies', title: 'Any allergies?', hint: 'We’ll keep these completely out of the meals.',
      done: () => checks()[3],
      render: live(change => multiTiles(ALLERGIES, m.allergies, next => change(() => { m.allergies = next; }))),
    },
    {
      label: 'Spice', title: 'How spicy?', hint: 'Heat level that keeps this martian smiling.',
      done: () => checks()[4],
      render: live(change => choiceTiles(SPICE, m.spice, id => change(() => { m.spice = id; }), { size: 'big' })),
    },
    {
      label: 'Adventure', title: 'How adventurous?', hint: 'New foods: yay or nay?',
      done: () => checks()[5],
      render: live(change => h('div', {},
        choiceTiles(ADVENTURE, m.adventure, id => change(() => { m.adventure = id; }), { size: 'big' }),
        h('p', { class: 'sub-q' }, 'Anything else we should know? (optional)'),
        h('textarea', {
          class: 'textarea', placeholder: 'e.g. hates mushy textures, loves anything with a crunch…', maxlength: 400,
          oninput: e => { m.notes = e.target.value; save(); },
        }, m.notes),
      )),
    },
  ];

  modal = openWizard({
    theme: '#8d47dc', icon: martianAvatar(m), title: m.name.trim() || 'New martian',
    subtitle: 'Food likes, dislikes and must-avoids', steps, start, onClose,
    footerLeft: (el, mm) => {
      if (state.family.length > 1) {
        el.append(h('button', {
          class: 'btn btn-danger btn-small',
          onclick: () => {
            if (!confirm(`Remove ${m.name.trim() || 'this martian'} from the family?`)) return;
            state.family = state.family.filter(x => x.id !== m.id);
            save(); mm.close();
          },
        }, '🗑️ Remove'));
      }
    },
  });
  return modal;
}

// ---- the bubbling pot: cooking habits -----------------------------------------
const DAY_FOOD = { Monday: '🍝', Tuesday: '🌮', Wednesday: '🍲', Thursday: '🍛', Friday: '🍕', Saturday: '🍔', Sunday: '🍗' };

export function openCooking({ onClose, start = 0 } = {}) {
  const c = state.cooking;
  const checks = () => cookingChecks(c);
  const steps = [
    {
      label: 'Days', title: 'Which nights do you cook dinner?', hint: 'Tap a plate to fill it. Empty plates = takeout, leftovers or a night out!',
      done: () => checks()[0],
      render: live(change => {
        const setDays = days => change(() => { c.days = DAYS.filter(d => days.includes(d)); });
        return h('div', {},
          h('div', { class: 'day-plates' }, DAYS.map(d => {
            const on = c.days.includes(d);
            return h('button', {
              class: `day-plate${on ? ' sel' : ''}`, style: { '--day': DAY_COLORS[d] }, 'aria-pressed': on ? 'true' : 'false',
              onclick: () => setDays(on ? c.days.filter(x => x !== d) : [...c.days, d]),
            }, h('span', { class: 'dp-food', 'aria-hidden': 'true' }, DAY_FOOD[d]), h('span', { class: 'dp-day' }, d.slice(0, 3)),
            on ? '' : h('span', { class: 'dp-empty' }, 'tap'));
          })),
          h('div', { class: 'quick-row' },
            h('button', { class: 'btn btn-small', onclick: () => setDays(DAYS.filter(d => !WEEKEND.includes(d))) }, '🏫 Weeknights'),
            h('button', { class: 'btn btn-small', onclick: () => setDays(DAYS) }, '🗓️ Every night'),
            h('button', { class: 'btn btn-small btn-ghost', onclick: () => setDays([]) }, 'Clear')),
        );
      }),
    },
    {
      label: 'Time', title: 'How much time to cook?', hint: 'From chopping to dinner on the table.',
      done: () => checks()[1],
      render: live(change => {
        const weekday = c.days.some(d => !WEEKEND.includes(d));
        const weekend = c.days.some(d => WEEKEND.includes(d));
        if (!c.days.length) return h('div', { class: 'info-box' }, '👈 Pick your cooking nights first.');
        return h('div', {},
          weekday ? [h('p', { class: 'sub-q' }, '🏫 On weeknights'), choiceTiles(TIMES, c.weeknightTime, id => change(() => { c.weeknightTime = id; }))] : '',
          weekend ? [h('p', { class: 'sub-q' }, '🛋️ On weekends'), choiceTiles(TIMES, c.weekendTime, id => change(() => { c.weekendTime = id; }))] : '');
      }),
    },
    {
      label: 'Skill', title: 'What kind of cook are you?', hint: '',
      done: () => checks()[2],
      render: live(change => choiceTiles(SKILLS, c.skill, id => change(() => { c.skill = id; }), { size: 'big' })),
    },
    {
      label: 'Gadgets', title: 'What’s in your kitchen?', hint: 'Tap every gadget you like using.',
      done: () => checks()[3],
      render: live(change => multiTiles(GADGETS, c.gadgets, next => change(() => { c.gadgets = next; }), { exclusive: null })),
    },
    {
      label: 'Leftovers', title: 'How do you feel about leftovers?', hint: '',
      done: () => checks()[4],
      render: live(change => choiceTiles(LEFTOVERS, c.leftovers, id => change(() => { c.leftovers = id; }), { size: 'big' })),
    },
    {
      label: 'Budget', title: 'Grocery budget vibe?', hint: '',
      done: () => checks()[5],
      render: live(change => choiceTiles(BUDGETS, c.budget, id => change(() => { c.budget = id; }), { size: 'big' })),
    },
  ];
  return openWizard({ theme: '#e8833a', icon: '🍲', title: 'Cooking habits', subtitle: 'When and how dinner happens at your place', steps, start, onClose });
}

// ---- the world map: cuisines -----------------------------------------------------
const pinSVG = often => `<svg viewBox="-9 -24 18 26" aria-hidden="true"><path d="M0 0 C-2 -6 -8 -9 -8 -15 A8 8 0 1 1 8 -15 C8 -9 2 -6 0 0Z"
  fill="${often ? '#ffb703' : '#e63946'}" stroke="#3a1020" stroke-width="1.5"/>${often
  ? '<path d="M0 -20l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.7-3 1.7.6-3.3-2.4-2.3 3.3-.4z" fill="#fff"/>'
  : '<circle cx="0" cy="-15" r="3" fill="#fff"/>'}</svg>`;

export function openCuisines({ onClose, start = 0 } = {}) {
  const cu = state.cuisines;
  const checks = () => cuisineChecks(cu);
  const cycle = id => {
    const v = cu.picks[id];
    if (!v) cu.picks[id] = 'sometimes'; else if (v === 'sometimes') cu.picks[id] = 'often'; else delete cu.picks[id];
  };
  const steps = [
    {
      label: 'Cuisines', title: 'Where does your food come from?', hint: 'Tap a spot once for “sometimes” 📍, twice for “all the time” ⭐, three times to remove.',
      done: () => checks()[0],
      render: live(change => h('div', {},
        h('div', { class: 'map-pick' },
          h('img', { src: 'assets/map-large.webp', alt: 'World map', draggable: 'false' }),
          CUISINES.map(cn => {
            const v = cu.picks[cn.id];
            const b = h('button', {
              class: `map-spot${v ? ' picked' : ''}`, style: { left: `${cn.x}%`, top: `${cn.y}%` },
              'aria-label': `${cn.label}${v ? ` (${v})` : ''}`,
              onclick: () => change(() => cycle(cn.id)),
            });
            if (v) b.innerHTML = pinSVG(v === 'often'); else b.textContent = cn.flag;
            b.append(h('span', { class: 'spot-label' }, `${cn.flag} ${cn.label}`));
            return b;
          })),
        h('div', { class: 'cuisine-chips' }, CUISINES.map(cn => h('button', {
          class: `cuisine-chip ${cu.picks[cn.id] || ''}`, onclick: () => change(() => cycle(cn.id)),
        }, cn.flag, ' ', cn.label, cu.picks[cn.id] === 'often' ? ' ⭐' : cu.picks[cn.id] ? ' 📍' : ''))),
        h('div', { class: 'everything', style: { marginTop: '14px' } }, h('button', {
          class: `toggle-pill${cu.surprise ? ' sel' : ''}`, onclick: () => change(() => { cu.surprise = !cu.surprise; }),
        }, '🎲 No favorites — surprise us!')),
      )),
    },
    {
      label: 'Explore', title: 'How far should we travel?', hint: 'Should the menu stick to your pins or wander a bit?',
      done: () => checks()[1],
      render: live(change => choiceTiles(EXPLORE, cu.explore, id => change(() => { cu.explore = id; }), { size: 'big' })),
    },
  ];
  return openWizard({ theme: '#2a9d8f', icon: '🗺️', title: 'World cuisines', subtitle: 'Pin the places your dinners travel to', steps, start, onClose, wide: true });
}

// ---- the cookbook: sites & recipes -------------------------------------------------
/** Accept only http(s) links. */
const cleanUrl = raw => {
  const v = String(raw || '').trim();
  if (!v) return '';
  try { const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : ''; } catch { return ''; }
};

const initials = label => label.replace(/^The /, '').split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();

async function readRecipeFile(file) {
  const text = await file.text();
  let clean = text;
  if (/\.html?$/i.test(file.name) || /<\/?(html|body|div|p)\b/i.test(text.slice(0, 2000))) {
    clean = new DOMParser().parseFromString(text, 'text/html').body.innerText;
  }
  clean = clean.replace(/\n{3,}/g, '\n\n').trim().slice(0, 20000);
  const firstLine = clean.split('\n').find(l => l.trim())?.trim().replace(/^#+\s*/, '') || '';
  const title = (firstLine.length > 3 && firstLine.length < 70 ? firstLine : file.name.replace(/\.[^.]+$/, '')).slice(0, 70);
  return { id: uid(), title, text: clean, source: file.name };
}

export function openCookbook({ onClose, start = 0 } = {}) {
  const cb = state.cookbook;
  const checks = () => cookbookChecks(cb);
  const steps = [
    {
      label: 'Sites', title: 'Favorite cooking sites?', hint: 'Tap the ones you like — we’ll cook in their style.',
      done: () => checks()[0],
      render: live(change => {
        const input = h('input', { class: 'text-input', placeholder: 'Another site or chef you love…', maxlength: 60 });
        const add = () => {
          const v = input.value.trim();
          if (!v) return;
          change(() => { if (!cb.customSites.includes(v)) cb.customSites.push(v); cb.noSites = false; });
        };
        input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        return h('div', {},
          h('div', { class: 'chip-wrap' },
            SITES.map(s => h('button', {
              class: `site-chip${cb.sites.includes(s.id) ? ' sel' : ''}`,
              onclick: () => change(() => {
                cb.sites = cb.sites.includes(s.id) ? cb.sites.filter(x => x !== s.id) : [...cb.sites, s.id];
                if (cb.sites.length) cb.noSites = false;
              }),
            }, h('span', { class: 'logo', style: { background: s.color } }, initials(s.label)), s.label)),
            cb.customSites.map(s => h('button', {
              class: 'site-chip sel', title: 'Tap to remove',
              onclick: () => change(() => { cb.customSites = cb.customSites.filter(x => x !== s); }),
            }, h('span', { class: 'logo', style: { background: '#8d47dc' } }, initials(s)), s, ' ✕'))),
          h('div', { class: 'add-row' }, input, h('button', { class: 'btn btn-primary btn-small', onclick: add }, '+ Add')),
          h('div', { class: 'everything', style: { marginTop: '16px' } }, h('button', {
            class: `toggle-pill${cb.noSites ? ' sel' : ''}`,
            onclick: () => change(() => { cb.noSites = !cb.noSites; if (cb.noSites) { cb.sites = []; cb.customSites = []; } }),
          }, '🤷 No favorite sites')));
      }),
    },
    {
      label: 'Recipes', title: 'Any family recipes to add?', hint: 'Drop in recipe files or paste one in — we’ll work them into your weeks.',
      done: () => checks()[1],
      render: live(change => {
        const fileInput = h('input', { type: 'file', accept: '.txt,.md,.markdown,.html,.htm,.json,.csv,text/*', multiple: true, hidden: true });
        const addFiles = async files => {
          const added = [];
          for (const f of files) {
            if (f.size > 2_000_000) { toast(`${f.name} is too big (2 MB max)`); continue; }
            try { added.push(await readRecipeFile(f)); } catch { toast(`Couldn't read ${f.name}`); }
          }
          if (added.length) { change(() => { cb.recipes.push(...added); cb.noRecipes = false; }); toast(`📖 Added ${added.length} recipe${added.length > 1 ? 's' : ''}!`); }
        };
        fileInput.onchange = () => addFiles([...fileInput.files]);
        const zone = h('div', {
          class: 'dropzone', role: 'button', tabindex: '0',
          onclick: () => fileInput.click(),
          onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } },
          ondragover: e => { e.preventDefault(); zone.classList.add('over'); },
          ondragleave: () => zone.classList.remove('over'),
          ondrop: e => { e.preventDefault(); zone.classList.remove('over'); addFiles([...e.dataTransfer.files]); },
        }, h('span', { class: 'dz-emoji' }, '📥'), h('b', {}, 'Drop recipe files here'), h('br'), h('small', {}, 'or tap to choose — text, Markdown or saved web pages'), fileInput);

        const titleIn = h('input', { class: 'text-input', placeholder: 'Recipe name (e.g. Grandma’s lasagna)', maxlength: 70 });
        const urlIn = h('input', { class: 'text-input', type: 'url', placeholder: '🔗 Link to the original (optional) — https://…', maxlength: 500 });
        const textIn = h('textarea', { class: 'textarea', placeholder: 'Paste the ingredients and steps here (or just add a name + link)…' });
        const addPasted = () => {
          const text = textIn.value.trim();
          const url = cleanUrl(urlIn.value);
          if (urlIn.value.trim() && !url) { toast('That link doesn’t look right — it should start with https://'); return; }
          if (text.length < 20 && !url) { toast('Paste the recipe, or add a link to it'); return; }
          const title = titleIn.value.trim() || (text ? text.split('\n')[0].slice(0, 60) : new URL(url).hostname.replace(/^www\./, ''));
          change(() => { cb.recipes.push({ id: uid(), title, text: text.slice(0, 20000), url, source: text ? 'pasted' : 'link' }); cb.noRecipes = false; });
          toast(text ? '📖 Recipe added!' : '🔗 Link saved! Paste the recipe too if you want it used exactly.');
        };

        return h('div', {},
          zone,
          h('p', { class: 'or' }, '— or paste one / add a link —'),
          h('div', { style: { display: 'grid', gap: '8px' } }, titleIn, urlIn, textIn,
            h('div', { style: { textAlign: 'right' } }, h('button', { class: 'btn btn-primary btn-small', onclick: addPasted }, '+ Add recipe'))),
          cb.recipes.length ? h('div', { class: 'recipe-list' }, cb.recipes.map((r, i) => {
            const link = h('input', {
              class: 'text-input ri-link', type: 'url', value: r.url || '', placeholder: '🔗 Add a link to the original (optional)', maxlength: 500,
              'aria-label': `Link for ${r.title}`,
              onchange: e => {
                const url = cleanUrl(e.target.value);
                if (e.target.value.trim() && !url) { toast('That link doesn’t look right — it should start with https://'); return; }
                r.url = url; save(); toast(url ? '🔗 Link saved' : 'Link removed');
              },
            });
            return h('div', { class: 'recipe-item', style: { flexWrap: 'wrap' } },
              h('span', {}, r.text ? '📄' : '🔗'), h('span', { class: 'ri-title', title: r.title }, `#${i + 1} ${r.title}`),
              r.text ? '' : h('small', { class: 'ri-note' }, 'link only — Chef Zorp writes a version'),
              h('button', { class: 'btn btn-ghost btn-small', 'aria-label': `Remove ${r.title}`, onclick: () => change(() => { cb.recipes = cb.recipes.filter(x => x.id !== r.id); }) }, '✕'),
              link);
          })) : '',
          cb.recipes.length ? [h('p', { class: 'sub-q' }, 'How often should your recipes show up?'),
            choiceTiles(USE_RECIPES, cb.useRecipes, id => change(() => { cb.useRecipes = id; }))]
            : h('div', { class: 'everything', style: { marginTop: '16px' } }, h('button', {
              class: `toggle-pill${cb.noRecipes ? ' sel' : ''}`, onclick: () => change(() => { cb.noRecipes = !cb.noRecipes; }),
            }, '🙅 No recipes to add right now')),
        );
      }),
    },
  ];
  return openWizard({ theme: '#c0392b', icon: '📖', title: 'The cookbook', subtitle: 'Where your recipes come from', steps, start, onClose });
}
