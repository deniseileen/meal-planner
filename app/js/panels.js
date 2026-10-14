// Recipe cards, the shopping list (tote bag) and settings.
import { DAY_COLORS, AISLE_EMOJI } from './data.js';
import { openExport, ensureRecipes, groupShopping, shoppingText } from './export.js';
import { state, save, replaceState, resetState } from './state.js';
import { h, openModal, toast } from './modal.js';
import { fetchRecipe, swapMeal, buildPlanPrompt, servings, mealSource, getAI, setAI, testAI, modelList, DEFAULT_MODEL } from './planner.js';

const loading = (emoji, text, sub) => h('div', { class: 'loading' },
  h('span', { class: 'pot-anim' }, emoji), h('p', {}, text, h('span', { class: 'dots' })), sub ? h('small', {}, sub) : '');

export function aiErrorBox(err, retry) {
  const box = h('div', { class: 'error-box' }, h('b', {}, '🛸 Houston, we have a problem. '), err.message);
  const needsSettings = ['no_key', 'bad_key', 'limit'].includes(err.code);
  return h('div', {}, box, h('div', { class: 'quick-row' },
    needsSettings ? h('button', { class: 'btn btn-primary', onclick: () => openSettings() }, '⚙️ Open settings') : '',
    retry && !needsSettings ? h('button', { class: 'btn btn-primary', onclick: retry }, '🔁 Try again') : ''));
}

/** Only http(s) links are ever opened. */
export const safeUrl = url => { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };

export function sourceChip(meal) {
  const src = mealSource(meal);
  if (!src) return '';
  return h('span', {}, src.kind === 'family' ? `📜 Family recipe: ${src.title}` : `✨ Inspired by ${src.label}`);
}

// ---- recipe ------------------------------------------------------------------------
export function openRecipe(day, { onChange } = {}) {
  const meal = () => state.plan.meals.find(m => m.day === day);
  const color = DAY_COLORS[day];
  const m = openModal({ theme: color, icon: meal().emoji || '🍽️', title: `${day}’s dinner`, subtitle: meal().name, wide: true });
  const swapBtn = h('button', { class: 'btn' }, '🔄 Swap this meal');
  const printBtn = h('button', { class: 'btn' }, '🖨️ Print');
  const origBtn = h('a', { class: 'btn', target: '_blank', rel: 'noopener noreferrer', hidden: true }, '🔗 View original');
  const updateOrig = () => { const url = safeUrl(mealSource(meal())?.url || ''); origBtn.hidden = !url; if (url) origBtn.href = url; };
  updateOrig();
  m.foot.append(swapBtn, printBtn, origBtn, h('div', { class: 'spacer' }), h('button', { class: 'btn btn-primary', onclick: () => m.close() }, 'Yum, thanks!'));
  printBtn.onclick = () => window.print();

  const show = async () => {
    const ml = meal();
    m.avatar.textContent = ml.emoji || '🍽️';
    m.subEl.textContent = ml.name;
    updateOrig();
    if (!ml.recipe) m.body.replaceChildren(loading('🥄', 'Chef Zorp is writing the recipe', `${ml.name} — this can take a little while`));
    swapBtn.disabled = printBtn.disabled = true;
    try {
      const r = await fetchRecipe(ml);
      if (meal() !== ml) return;
      renderRecipe(ml, r);
      printBtn.disabled = false;
    } catch (err) {
      m.body.replaceChildren(aiErrorBox(err, show));
    }
    swapBtn.disabled = false;
  };

  const renderRecipe = (ml, r) => {
    const ing = h('div', {}, r.ingredients.map((it, i) => {
      const box = h('input', { type: 'checkbox', checked: !!r.checked?.[i] });
      const row = h('label', { class: `ing${r.checked?.[i] ? ' checked' : ''}` }, box, h('span', {}, it.amount ? h('span', { class: 'amt' }, it.amount, ' ') : '', it.item));
      box.onchange = () => { r.checked = { ...r.checked, [i]: box.checked }; row.classList.toggle('checked', box.checked); save(); };
      return row;
    }));
    m.body.replaceChildren(
      h('div', { class: 'recipe-hero' },
        h('span', { class: 'r-emoji', 'aria-hidden': 'true' }, ml.emoji || '🍽️'),
        h('h3', {}, r.title || ml.name),
        h('div', { class: 'meta' },
          r.minutes ? h('span', {}, `⏱️ ${r.minutes} min`) : '',
          h('span', {}, `👥 Serves ${r.servings || servings()}`),
          ml.cuisine ? h('span', {}, `🌍 ${ml.cuisine}`) : '',
          sourceChip(ml)),
        ml.why ? h('p', { class: 'why' }, `“${ml.why}”`) : ''),
      ...(r.kind === 'family'
        ? [h('div', { class: 'r-box' }, h('h4', {}, '📜 Your recipe, exactly as written'), h('div', { class: 'original-recipe' }, r.original)),
          h('div', { class: 'r-box tweaks' }, h('h4', {}, '🛸 Chef Zorp’s tweaks for this week'),
            r.tweaks.length ? h('ul', {}, r.tweaks.map(t => h('li', {}, t))) : h('p', { style: { margin: 0 } }, 'No changes needed — make it just the way you always do! 💛')),
          r.ingredients.length ? h('details', { class: 'r-box' }, h('summary', {}, `🧺 Ingredients for the shopping list (${r.ingredients.length})`), ing) : '']
        : [h('div', { class: 'recipe-cols' },
          h('div', { class: 'r-box' }, h('h4', {}, '🧺 Ingredients'), ing),
          h('div', { class: 'r-box' }, h('h4', {}, '👩‍🍳 Steps'), h('ol', { class: 'steps-list' }, r.steps.map(s => h('li', {}, s)))))]),
      r.family_notes.length ? h('div', { class: 'r-box notes' }, h('h4', {}, '👽 For each martian'), h('ul', {}, r.family_notes.map(n => h('li', {}, n)))) : '',
      r.tips.length ? h('div', { class: 'r-box notes', style: { background: '#fff8e1', borderColor: '#ffe39a' } }, h('h4', {}, '💡 Tips'), h('ul', {}, r.tips.map(n => h('li', {}, n)))) : '',
    );
  };

  swapBtn.onclick = async () => {
    swapBtn.disabled = printBtn.disabled = true;
    m.body.replaceChildren(loading('🔄', 'Swapping in something new', 'Chef Zorp is rethinking this night'));
    try {
      await swapMeal(day);
      onChange?.();
      show();
    } catch (err) {
      m.body.replaceChildren(aiErrorBox(err, () => swapBtn.click()));
      swapBtn.disabled = false;
    }
  };
  show();
  return m;
}

// ---- shopping list (tote bag) --------------------------------------------------------
export function openShopping() {
  const m = openModal({ theme: '#2fbf71', icon: '🛍️', title: 'Shopping list', subtitle: 'Everything for this week’s dinners', wide: true });
  const copyBtn = h('button', { class: 'btn' }, '📋 Copy list');
  const exportBtn = h('button', { class: 'btn', onclick: () => openExportWeek() }, '📤 Export week');
  m.foot.append(copyBtn, exportBtn, h('div', { class: 'spacer' }), h('button', { class: 'btn btn-primary', onclick: () => m.close() }, 'Done'));
  const plan = state.plan;
  if (!plan || plan.status !== 'ready') {
    m.body.replaceChildren(h('div', { class: 'info-box', style: { textAlign: 'center' } }, '🛸 Your shopping list fills up once dinner is planned. Make every glowing thing blue first!'));
    copyBtn.disabled = exportBtn.disabled = true;
    return m;
  }
  const meals = plan.meals.filter(x => x.name);
  const build = async () => {
    const missing = meals.filter(x => !x.recipe);
    copyBtn.disabled = true;
    if (missing.length) {
      m.body.replaceChildren(loading('🛒', `Fetching ${missing.length} recipe${missing.length > 1 ? 's' : ''}`, 'We need each recipe to know what to buy'));
      const errors = await ensureRecipes(missing);
      if (errors.length === missing.length) { m.body.replaceChildren(aiErrorBox(errors[0], build)); return; }
    }
    const groups = groupShopping(meals);
    plan.shoppingChecked ||= {};
    m.body.replaceChildren(
      meals.some(x => !x.recipe) ? h('div', { class: 'error-box' }, 'Some recipes couldn’t be fetched, so their ingredients are missing. Open those plates to retry.') : '',
      h('div', { class: 'shop-grid' }, groups.map(g => h('div', { class: 'r-box shop-aisle' }, h('h4', {}, AISLE_EMOJI[g.aisle], ' ', g.aisle), g.items.map(x => {
        const box = h('input', { type: 'checkbox', checked: !!plan.shoppingChecked[x.id] });
        const row = h('label', { class: `ing${plan.shoppingChecked[x.id] ? ' checked' : ''}` }, box,
          h('span', {}, x.amount ? h('span', { class: 'amt' }, x.amount, ' ') : '', x.item, h('span', { class: 'tag-days' }, x.days.join(' · '))));
        box.onchange = () => { plan.shoppingChecked[x.id] = box.checked; row.classList.toggle('checked', box.checked); save(); };
        return row;
      })))));
    copyBtn.disabled = false;
    copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(shoppingText(plan, groups)); toast('📋 Copied!'); } catch { toast('Couldn’t copy — try Export week instead'); }
    };
  };
  build();
  return m;
}

export const openExportWeek = () => openExport({ errorBox: aiErrorBox });

// ---- settings ----------------------------------------------------------------------------
export async function openSettings({ onReset } = {}) {
  const m = openModal({ theme: '#5b2499', icon: '⚙️', title: 'Mission control', subtitle: 'AI key, your saved data and the planning prompt' });
  m.foot.append(h('div', { class: 'spacer' }), h('button', { class: 'btn btn-primary', onclick: () => m.close() }, 'Close'));
  const ai = getAI();
  const keyIn = h('input', { class: 'text-input', type: 'password', placeholder: 'sk-or-…', value: ai.key, autocomplete: 'off', spellcheck: 'false', 'aria-label': 'OpenRouter key' });
  const modelIn = h('input', { class: 'text-input', placeholder: DEFAULT_MODEL, value: ai.model === DEFAULT_MODEL ? '' : ai.model, spellcheck: 'false', 'aria-label': 'Model' });
  const status = h('div', {});
  const showStatus = () => {
    const cur = getAI();
    status.replaceChildren(h('div', { class: cur.key ? 'info-box' : 'error-box' }, cur.key
      ? ['✅ Key saved in this browser. Models: ', h('small', {}, modelList(cur.model).join(' → '))]
      : 'No key yet. Paste your OpenRouter key above — it stays in this browser only.'));
  };
  const saveAI = () => { setAI({ key: keyIn.value.trim(), model: modelIn.value.trim() || DEFAULT_MODEL }); showStatus(); };
  keyIn.addEventListener('change', saveAI);
  modelIn.addEventListener('change', saveAI);
  const testBtn = h('button', { class: 'btn btn-small' }, '🧪 Test');
  testBtn.onclick = async () => {
    saveAI();
    testBtn.disabled = true; testBtn.textContent = '🧪 Testing…';
    try { await testAI(getAI()); toast('✅ Chef Zorp is ready to cook!'); } catch (err) { toast(`🛸 ${err.message}`, 5000); }
    testBtn.disabled = false; testBtn.textContent = '🧪 Test';
  };
  const forgetBtn = h('button', { class: 'btn btn-small btn-ghost', onclick: () => { keyIn.value = ''; saveAI(); toast('Key removed from this browser'); } }, 'Forget key');
  showStatus();
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  fileIn.onchange = async () => {
    try {
      const ok = replaceState(JSON.parse(await fileIn.files[0].text()));
      toast(ok ? '✅ Family data imported!' : 'That file doesn’t look like a planner backup');
      if (ok) { m.close(); onReset?.(); }
    } catch { toast('Couldn’t read that file'); }
  };
  const promptPre = h('pre', { class: 'prompt-view', hidden: true });
  m.body.replaceChildren(
    h('h3', { class: 'q-title', style: { fontSize: '20px' } }, '🤖 AI chef'),
    h('p', { class: 'q-hint' }, 'Chef Zorp cooks with OpenRouter. Get a key at openrouter.ai/keys (a $0 limit keeps it free).'),
    h('div', { style: { display: 'grid', gap: '8px' } },
      h('label', { class: 'sub-q', style: { margin: '0', textAlign: 'left' } }, 'OpenRouter key'), keyIn,
      h('label', { class: 'sub-q', style: { margin: '6px 0 0', textAlign: 'left' } }, 'Model ', h('small', { style: { fontWeight: '400' } }, '(leave blank for the free default)')), modelIn,
      h('div', { class: 'quick-row', style: { marginTop: '4px' } }, testBtn, forgetBtn)),
    status,
    h('h3', { class: 'q-title', style: { fontSize: '20px' } }, '🧾 The planning prompt'),
    h('p', { class: 'q-hint' }, 'Everything you entered, combined into what we send to the AI.'),
    h('div', { style: { textAlign: 'center' } }, h('button', {
      class: 'btn btn-small', onclick: e => { promptPre.textContent = buildPlanPrompt(); promptPre.hidden = !promptPre.hidden; e.target.textContent = promptPre.hidden ? '👀 Show prompt' : '🙈 Hide prompt'; },
    }, '👀 Show prompt')),
    promptPre,
    h('h3', { class: 'q-title', style: { fontSize: '20px' } }, '💾 Your data'),
    h('p', { class: 'q-hint' }, 'Answers save automatically in this browser, so next week you only need to plan. Use a backup to move them to another device (your key is never included).'),
    h('div', { class: 'quick-row' },
      h('button', {
        class: 'btn btn-small', onclick: () => {
          const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })), download: `martian-meal-planner-${new Date().toISOString().slice(0, 10)}.json` });
          a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        },
      }, '⬇️ Export backup'),
      h('button', { class: 'btn btn-small', onclick: () => fileIn.click() }, '⬆️ Import backup'), fileIn,
      h('button', {
        class: 'btn btn-small btn-danger', onclick: () => {
          if (!confirm('Erase the whole family, all answers and meal plans?')) return;
          resetState(); m.close(); onReset?.(); toast('🧹 Fresh start!');
        },
      }, '🧹 Start over')),
    state.history.length ? h('div', {},
      h('h3', { class: 'q-title', style: { fontSize: '20px' } }, '📜 Past weeks'),
      h('div', { class: 'recipe-list' }, [...state.history].reverse().map(w => h('div', { class: 'recipe-item', style: { display: 'block' } },
        h('b', {}, `Week of ${w.weekOf}: `), w.meals.join(' · '))))) : '',
  );
  return m;
}
