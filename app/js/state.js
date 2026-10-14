// App state, the "is this question answered?" rules, and saving.
import { DAYS, WEEKEND, SWEATERS, PATTERNS } from './data.js';

const LOCAL_KEY = 'martian-meal-planner';
const listeners = new Set();

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())).slice(0, 8);

export function newMartian(index = 0) {
  return {
    id: uid(),
    name: '',
    age: null,
    look: { color: SWEATERS[index % SWEATERS.length], pattern: PATTERNS[index % 3].id, extra: 'none', face: 'happy', eyes: '#2fae4e' },
    foods: {},
    eatsEverything: false,
    diet: [],
    allergies: [],
    spice: null,
    adventure: null,
    notes: '',
  };
}

export function freshState() {
  return {
    version: 1,
    family: [newMartian(0)],
    cooking: { days: [], weeknightTime: null, weekendTime: null, skill: null, gadgets: [], leftovers: null, budget: null },
    cuisines: { picks: {}, surprise: false, explore: null },
    cookbook: { sites: [], customSites: [], noSites: false, recipes: [], noRecipes: false, useRecipes: null },
    plan: null,
    history: [],
  };
}

export const state = freshState();

// ---- answered-question rules (drive the yellow → blue outlines) -----------
export function martianChecks(m) {
  return [
    !!(m.name.trim() && m.age),
    m.eatsEverything || Object.keys(m.foods).length > 0,
    m.diet.length > 0,
    m.allergies.length > 0,
    m.spice !== null,
    !!m.adventure,
  ];
}
export function cookingChecks(c) {
  const weekday = c.days.some(d => !WEEKEND.includes(d));
  const weekend = c.days.some(d => WEEKEND.includes(d));
  return [
    c.days.length > 0,
    c.days.length > 0 && (!weekday || c.weeknightTime !== null) && (!weekend || c.weekendTime !== null),
    !!c.skill,
    c.gadgets.length > 0,
    !!c.leftovers,
    !!c.budget,
  ];
}
export function cuisineChecks(cu) {
  return [cu.surprise || Object.keys(cu.picks).length > 0, !!cu.explore];
}
export function cookbookChecks(cb) {
  return [
    cb.noSites || cb.sites.length + cb.customSites.length > 0,
    cb.noRecipes || (cb.recipes.length > 0 && !!cb.useRecipes),
  ];
}
const all = arr => arr.every(Boolean);
export const isMartianDone = m => all(martianChecks(m));
export const isCookingDone = () => all(cookingChecks(state.cooking));
export const isCuisinesDone = () => all(cuisineChecks(state.cuisines));
export const isCookbookDone = () => all(cookbookChecks(state.cookbook));
export const isFamilyDone = () => state.family.length > 0 && state.family.every(isMartianDone);
export const isAllDone = () => isFamilyDone() && isCookingDone() && isCuisinesDone() && isCookbookDone();

export const cookDays = () => DAYS.filter(d => state.cooking.days.includes(d));

// Monday of the current week, as YYYY-MM-DD in local time
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- persistence ------------------------------------------------------------
function applyLoaded(data) {
  if (!data || !data.version) return false;
  const base = freshState();
  Object.assign(state, base, data, {
    cooking: { ...base.cooking, ...data.cooking },
    cuisines: { ...base.cuisines, ...data.cuisines },
    cookbook: { ...base.cookbook, ...data.cookbook },
    family: (data.family || []).map((m, i) => ({ ...newMartian(i), ...m, look: { ...newMartian(i).look, ...m.look } })),
  });
  if (state.plan && state.plan.status === 'cooking') state.plan.status = 'error';
  return true;
}

export async function loadState() {
  try {
    if (applyLoaded(JSON.parse(localStorage.getItem(LOCAL_KEY)))) return 'local';
  } catch { /* storage blocked or empty */ }
  // One-time move from the old local server version, if it is what served this page
  try {
    const res = await fetch('api/state');
    if (res.ok && (res.headers.get('content-type') || '').includes('json') && applyLoaded(await res.json())) { save(); return 'migrated'; }
  } catch { /* no old server: nothing to move */ }
  return 'fresh';
}

let saveTimer = null;
export function save() {
  listeners.forEach(fn => fn());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  }, 300);
}

export function replaceState(data) {
  const ok = applyLoaded(data);
  if (ok) save();
  return ok;
}

export function resetState() {
  Object.assign(state, freshState());
  save();
}

export const onChange = fn => listeners.add(fn);
