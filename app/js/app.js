// Wires the scene, the progress chips, the guide bubble and the AI planning together.
import {
  state, loadState, save, onChange, newMartian, isMartianDone, isCookingDone, isCuisinesDone,
  isCookbookDone, isFamilyDone, isAllDone, cookDays, weekStart,
} from './state.js';
import { renderScene, sceneInfo } from './scene.js';
import { openMartian, openCooking, openCuisines, openCookbook } from './questions.js';
import { openRecipe, openShopping, openSettings, openExportWeek, aiErrorBox } from './panels.js';
import { planWeek } from './planner.js';
import { h, toast, confetti, modalOpen, openModal } from './modal.js';

const svg = document.getElementById('scene');
const wrap = document.getElementById('scene-wrap');
const progress = document.getElementById('progress');
const planBtn = document.getElementById('btn-plan');
const weekLabel = document.getElementById('week-label');

const fmtWeek = iso => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const planDaysMatch = () => state.plan && state.plan.meals.map(m => m.day).join() === cookDays().join();
const planIsStale = () => state.plan && state.plan.weekOf !== weekStart();

// ---- drawing --------------------------------------------------------------------
function draw() {
  renderScene(svg);
  drawProgress();
  drawGuide();
  drawPlanButton();
  weekLabel.textContent = state.plan ? `Dinner for the week of ${fmtWeek(state.plan.weekOf)}` : 'Plan this week’s dinners';
}
onChange(() => { if (!drawing) { drawing = true; requestAnimationFrame(() => { drawing = false; draw(); }); } });
let drawing = false;

function drawProgress() {
  const fam = state.family;
  const famDone = fam.filter(isMartianDone).length;
  const chip = (done, icon, text, onclick) => h('button', { class: `chip${done ? ' done' : ''}`, onclick }, icon, ' ', text, done ? ' ✓' : '');
  progress.replaceChildren(
    chip(isFamilyDone(), '👽', `Family ${famDone}/${fam.length}`, () => {
      const next = fam.find(m => !isMartianDone(m)) || fam[0];
      next ? editMartian(next) : addMartian();
    }),
    chip(isCookingDone(), '🍲', 'Cooking', () => openCooking({ onClose: afterEdit })),
    chip(isCuisinesDone(), '🗺️', 'Cuisines', () => openCuisines({ onClose: afterEdit })),
    chip(isCookbookDone(), '📖', 'Cookbook', () => openCookbook({ onClose: afterEdit })),
  );
}

function remainingText() {
  const left = [];
  const famLeft = state.family.filter(m => !isMartianDone(m));
  if (!state.family.length) left.push('add your family');
  famLeft.forEach(m => left.push(m.name.trim() || 'a martian'));
  if (!isCookingDone()) left.push('the pot');
  if (!isCuisinesDone()) left.push('the map');
  if (!isCookbookDone()) left.push('the cookbook');
  return left;
}

function drawGuide() {
  wrap.querySelector('.guide')?.remove();
  const plan = state.plan;
  let icon = '👽'; let text; let action = null;
  const left = remainingText();
  const total = state.family.length + 3;
  if (left.length && !plan) {
    const fresh = left.length === total;
    text = fresh
      ? 'Hi! Tap anything glowing yellow ✨ to tell us about your family. When it all glows blue, dinner appears!'
      : `${total - left.length} of ${total} glowing blue! Still to go: ${left.slice(0, 3).join(', ')}${left.length > 3 ? '…' : ''}`;
  } else if (left.length && plan) {
    text = `Finish ${left.slice(0, 2).join(' & ')} to plan a new week.`;
  } else if (!plan) {
    text = 'Everything’s blue! Ready to cook up your week?';
    action = ['🍳 Plan our dinners', startPlanning];
  } else if (plan.status === 'cooking') {
    icon = '🥄'; text = 'Chef Zorp is cooking up your week…';
  } else if (plan.status === 'error') {
    icon = '🛸'; text = plan.errorCode === 'no_key' ? 'The AI chef needs an API key — see ⚙️ settings.' : 'The kitchen hit a snag.';
    action = ['🔁 Try again', startPlanning];
  } else if (planIsStale()) {
    icon = '🗓️'; text = 'A new week has landed! Same family, fresh dinners?';
    action = ['✨ Plan this week', startPlanning];
  } else if (!planDaysMatch()) {
    icon = '🔁'; text = 'Your cooking nights changed.';
    action = ['🍳 Re-plan', startPlanning];
  } else {
    icon = '🍽️'; text = 'Tap a plate for its recipe — or the tote bag for your shopping list!';
  }
  const g = h('div', { class: 'guide', role: 'status' }, h('span', { class: 'g-icon', 'aria-hidden': 'true' }, icon), h('span', {}, text),
    action ? h('button', { class: 'btn btn-yellow btn-small', onclick: action[1] }, action[0]) : '');
  wrap.append(g);
}

function drawPlanButton() {
  const plan = state.plan;
  document.getElementById('btn-export').hidden = !(plan && plan.status === 'ready');
  planBtn.hidden = !plan || !isAllDone();
  if (planBtn.hidden) return;
  planBtn.disabled = plan.status === 'cooking';
  planBtn.textContent = plan.status === 'cooking' ? '🥄 Cooking…' : plan.status === 'error' ? '🔁 Try again' : planIsStale() ? '🗓️ Plan this week' : '🎲 New menu';
}

// ---- actions ---------------------------------------------------------------------
let wasAllDone = false;
function afterEdit() {
  draw();
  const done = isAllDone();
  if (done && !wasAllDone && !state.plan) {
    confetti();
    toast('✨ Everything is blue! Setting the table…');
    setTimeout(startPlanning, 700);
  }
  wasAllDone = done;
}

async function startPlanning() {
  if (!isAllDone()) { toast('Make every glowing thing blue first ✨'); return; }
  if (state.plan?.status === 'cooking') return;
  try {
    await planWeek(draw);
    toast('🍽️ Dinner is served! Tap a plate for the recipe.');
  } catch (err) {
    if (!modalOpen()) {
      const m = openModal({ theme: '#ef476f', icon: '🛸', title: 'The kitchen hit a snag', subtitle: 'Your answers are saved' });
      m.body.append(aiErrorBox(err, () => { m.close(); startPlanning(); }));
      m.foot.append(h('div', { class: 'spacer' }), h('button', { class: 'btn', onclick: () => m.close() }, 'Close'));
    }
  }
}

function editMartian(m) {
  openMartian(m, { onClose: afterEdit });
}

function addMartian() {
  if (state.family.length >= sceneInfo.MAX_FAMILY) { toast('The table is full! 8 martians max.'); return; }
  const m = newMartian(state.family.length);
  state.family.push(m);
  save();
  draw();
  editMartian(m);
}

function handle(target) {
  const el = target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'martian') {
    const m = state.family.find(x => x.id === el.dataset.id);
    if (m) editMartian(m);
  } else if (action === 'add-martian') addMartian();
  else if (action === 'pot') openCooking({ onClose: afterEdit });
  else if (action === 'map') openCuisines({ onClose: afterEdit });
  else if (action === 'cookbook') openCookbook({ onClose: afterEdit });
  else if (action === 'tote') openShopping();
  else if (action === 'plate') {
    const plan = state.plan;
    if (plan.status === 'cooking') toast('🥄 Still cooking — hang on!');
    else if (plan.status === 'error') startPlanning();
    else openRecipe(el.dataset.day, { onChange: draw });
  }
}

svg.addEventListener('click', e => handle(e.target));
svg.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(e.target); }
});
planBtn.addEventListener('click', () => {
  if (state.plan?.status === 'ready' && !planIsStale() && planDaysMatch() && !confirm('Cook up a brand-new menu for this week? The current one moves to your history.')) return;
  startPlanning();
});
document.getElementById('btn-export').addEventListener('click', () => openExportWeek());
document.getElementById('btn-settings').addEventListener('click', () => openSettings({ onReset: () => { wasAllDone = isAllDone(); draw(); } }));

// ---- start ------------------------------------------------------------------------
(async () => {
  const from = await loadState();
  wasAllDone = isAllDone();
  draw();
  if (from === 'migrated') toast('Moved your family over from the old version 👽');
})();
