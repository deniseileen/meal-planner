// Turns everything the family entered into prompts, and asks OpenRouter straight from the browser.
import {
  AGES, DIETS, ALLERGIES, SPICE, ADVENTURE, TIMES, SKILLS, GADGETS, LEFTOVERS, BUDGETS,
  CUISINES, EXPLORE, SITES, USE_RECIPES, FOOD_LABEL, AISLES, WEEKEND, byId,
} from './data.js';
import { state, save, cookDays, weekStart } from './state.js';

const label = (list, id) => byId(list, id)?.label ?? id;
const list = arr => arr.length ? arr.join(', ') : 'none';

export function servings() {
  const total = state.family.reduce((sum, m) => sum + (byId(AGES, m.age)?.portion ?? 1), 0);
  return Math.max(1, Math.round(total + (state.cooking.leftovers === 'love' ? 2 : 0)));
}

/** Plain-language summary of the family, their kitchen and their tastes. */
export function familyContext() {
  const c = state.cooking;
  const cu = state.cuisines;
  const cb = state.cookbook;
  const out = [];

  out.push(`FAMILY (${state.family.length} eating dinner):`);
  for (const m of state.family) {
    const loves = Object.entries(m.foods).filter(([, v]) => v === 'love').map(([k]) => FOOD_LABEL[k] || k);
    const nos = Object.entries(m.foods).filter(([, v]) => v === 'no').map(([k]) => FOOD_LABEL[k] || k);
    const diet = m.diet.filter(d => d !== 'none').map(d => label(DIETS, d));
    const allergies = m.allergies.filter(a => a !== 'none').map(a => label(ALLERGIES, a));
    const bits = [
      `- ${m.name.trim() || 'Unnamed'} (${label(AGES, m.age)}):`,
      m.eatsEverything ? 'Eats pretty much everything.' : '',
      loves.length ? `Loves: ${list(loves)}.` : '',
      nos.length ? `Won't eat: ${list(nos)}.` : '',
      `Diet: ${diet.length ? list(diet) : 'no restrictions'}.`,
      `ALLERGIES: ${allergies.length ? list(allergies) : 'none'}.`,
      m.spice !== null ? `Spice: ${label(SPICE, m.spice).toLowerCase()}.` : '',
      m.adventure ? `Adventurousness: ${label(ADVENTURE, m.adventure).toLowerCase().replace(/[!.]+$/, '')}.` : '',
      m.notes.trim() ? `Notes: ${m.notes.trim()}` : '',
    ];
    out.push(bits.filter(Boolean).join(' '));
  }

  const days = cookDays();
  const weekday = days.some(d => !WEEKEND.includes(d));
  const weekend = days.some(d => WEEKEND.includes(d));
  out.push('', 'COOKING HABITS:');
  out.push(`- Cooks dinner on: ${list(days)}`);
  const times = [];
  if (weekday && c.weeknightTime) times.push(`weeknights about ${label(TIMES, c.weeknightTime)}`);
  if (weekend && c.weekendTime) times.push(`weekends about ${label(TIMES, c.weekendTime)}`);
  out.push(`- Time available: ${list(times)}`);
  out.push(`- Cooking skill: ${label(SKILLS, c.skill)} (${byId(SKILLS, c.skill)?.sub ?? ''})`);
  out.push(`- Equipment: ${list(c.gadgets.map(g => g === 'basics' ? 'stove and oven' : label(GADGETS, g)))}`);
  out.push(`- Leftovers: ${label(LEFTOVERS, c.leftovers)} (${byId(LEFTOVERS, c.leftovers)?.sub ?? ''})`);
  out.push(`- Budget: ${label(BUDGETS, c.budget)} (${byId(BUDGETS, c.budget)?.sub ?? ''})`);
  out.push(`- Servings to cook: about ${servings()}`);

  const often = CUISINES.filter(x => cu.picks[x.id] === 'often').map(x => x.label);
  const sometimes = CUISINES.filter(x => cu.picks[x.id] === 'sometimes').map(x => x.label);
  out.push('', 'CUISINES:');
  if (cu.surprise && !often.length && !sometimes.length) out.push('- No particular favorites — surprise them.');
  if (often.length) out.push(`- Cooks all the time: ${list(often)}`);
  if (sometimes.length) out.push(`- Cooks sometimes: ${list(sometimes)}`);
  out.push(`- Exploring: ${label(EXPLORE, cu.explore)} (${byId(EXPLORE, cu.explore)?.sub ?? ''})`);

  const sites = [...cb.sites.map(s => label(SITES, s)), ...cb.customSites];
  out.push('', `FAVORITE RECIPE SOURCES: ${sites.length ? list(sites) : 'none in particular'}`);
  if (cb.recipes.length) {
    out.push(`FAMILY RECIPES (use them: ${label(USE_RECIPES, cb.useRecipes).toLowerCase()}):`);
    cb.recipes.forEach((r, i) => out.push(`  #${i + 1}. "${r.title}"${r.text ? ` — ${r.text.replace(/\s+/g, ' ').slice(0, 260)}…` : ' (we only have a link to this one)'}`));
  }
  return out.join('\n');
}

const RULES = `RULES:
- Allergies are absolute: no allergen anywhere in the meal, including sauces and garnishes.
- Respect every diet. If only some members have a diet, make the meal fit them or give an easy swap.
- Avoid foods anyone won't eat, or make them easy to leave off their plate.
- Feature foods they love, and match spice to the most sensitive eater (heat can go on the side).
- Keep cooking time within what they have for that night; match their skill and use their equipment.
- Vary proteins, cuisines and cooking methods across the week.`;

const SOURCE_RULES = `- If a dinner IS one of the family recipes, set "family_recipe" to its number (e.g. 2 for #2); otherwise null.
- If a dinner is in the style of one of their favorite sites, put that site's name in "inspired_by"; otherwise "".`;
const MEAL_SOURCE_JSON = '"family_recipe":null,"inspired_by":"favorite site name or empty"';

/** Where a meal comes from, for labels: a family recipe (exact) or a site it is inspired by. */
export function mealSource(meal) {
  const fam = meal.familyRecipeId && state.cookbook.recipes.find(r => r.id === meal.familyRecipeId);
  if (fam || meal.familyRecipe) return { kind: 'family', title: fam?.title || meal.familyRecipe.title, url: fam?.url || meal.familyRecipe?.url || '' };
  const site = meal.inspiredBy ?? meal.source;
  return site ? { kind: 'site', label: site } : null;
}

export function buildPlanPrompt(days = cookDays()) {
  const recent = state.history.slice(-3).flatMap(w => w.meals);
  return `${familyContext()}

${recent.length ? `RECENT DINNERS (don't repeat these): ${recent.join('; ')}\n` : ''}${RULES}

TASK: Plan one dinner for each of these nights: ${days.join(', ')}.
${SOURCE_RULES}

Return ONLY JSON, no other text:
{"meals":[{"day":"Monday","name":"dish name, max 5 words","emoji":"one food emoji","cuisine":"Italian","minutes":30,"summary":"one appetizing sentence","why":"one short sentence on why it suits this family, naming members",${MEAL_SOURCE_JSON}}]}`;
}

const RECIPE_JSON = `{"title":"...","servings":SERVINGS,"minutes":30,"ingredients":[{"item":"chicken thighs","amount":"1.5 lb","aisle":"Meat & Seafood"}],"steps":["..."],"family_notes":["Name: how to adapt their plate"],"tips":["..."]}`;

function familyRecipeFor(meal) {
  return meal.familyRecipeId ? state.cookbook.recipes.find(r => r.id === meal.familyRecipeId) : null;
}

function buildRecipePrompt(meal) {
  const fam = familyRecipeFor(meal);
  const head = `${familyContext()}\n\n${RULES}\n\n`;
  const aisles = `"aisle" must be one of: ${AISLES.join(', ')}.`;
  if (fam && fam.text) {
    // The family's own recipe is shown exactly as written; the AI only lists ingredients and suggests tweaks.
    return `${head}This ${meal.day} the family is cooking their OWN recipe, "${fam.title}". It is shown to them exactly as written below — do NOT rewrite it.
"""${fam.text.slice(0, 8000)}"""

Your jobs:
1. List its ingredients exactly as the recipe states them (for the shopping list).
2. Suggest small tweaks for THIS family THIS week: scaling to about ${servings()} servings, allergy or diet swaps, things to leave off someone's plate, time savers. Only include tweaks that are really needed — an empty list is fine.

Return ONLY JSON, no other text:
{"servings":${servings()},"minutes":30,"ingredients":[{"item":"...","amount":"as written","aisle":"Pantry"}],"tweaks":["..."],"family_notes":["Name: how to adapt their plate"]}
${aisles}`;
  }
  const style = fam
    ? `This is the family favorite "${fam.title}" — we only have a link to it, so write your best faithful version.\n`
    : meal.inspiredBy ? `Write it in the style of ${meal.inspiredBy}.\n` : '';
  return `${head}Write the full recipe for "${meal.name}" (${meal.cuisine}, about ${meal.minutes} minutes) for ${meal.day} dinner. ${meal.summary || ''}
${style}Make ${servings()} servings. Use US measurements.

Return ONLY JSON, no other text:
${RECIPE_JSON.replace('SERVINGS', servings())}
${aisles}`;
}

// ---- talking to the server ------------------------------------------------------------
export class AIError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

function parseJSON(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ---- AI settings: kept in this browser only, never in the family backup ----------
const AI_KEY = 'martian-meal-planner-ai';
export const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';
// Free models share a busy pool, so free picks get backups OpenRouter tries in order.
const FREE_FALLBACKS = ['nvidia/nemotron-3-super-120b-a12b:free', 'openrouter/free'];

export function getAI() {
  try { return { key: '', model: DEFAULT_MODEL, ...JSON.parse(localStorage.getItem(AI_KEY)) }; } catch { return { key: '', model: DEFAULT_MODEL }; }
}
export function setAI(ai) {
  try { localStorage.setItem(AI_KEY, JSON.stringify(ai)); } catch { /* storage blocked */ }
}
export function modelList(model = getAI().model) {
  const models = String(model || DEFAULT_MODEL).split(',').map(m => m.trim()).filter(Boolean);
  if (models.every(m => m.endsWith(':free') || m === 'openrouter/free')) models.push(...FREE_FALLBACKS.filter(m => !models.includes(m)));
  return models;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** One request to OpenRouter straight from the browser. Returns the reply text. */
async function callOpenRouter(messages, temperature, ai = getAI()) {
  if (!ai.key) throw new AIError('Add your OpenRouter key in ⚙️ settings first.', 'no_key');
  const models = modelList(ai.model);
  const body = JSON.stringify({ model: models[0], ...(models.length > 1 ? { models } : {}), messages, temperature, max_tokens: 4000 });
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ai.key}`, 'Content-Type': 'application/json', 'HTTP-Referer': location.origin, 'X-Title': 'Martian Meal Planner' },
        body,
      });
    } catch {
      throw new AIError('Couldn’t reach OpenRouter. Check your internet connection.', 'offline');
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const content = data.choices?.[0]?.message?.content || '';
      if (!content.trim()) throw new AIError('The AI sent back an empty answer. Try again.', 'empty');
      return content;
    }
    if (res.status === 429 && attempt === 0) { await sleep(4000); continue; }
    if (res.status === 429) throw new AIError('The free AI models are all busy right now. Wait a minute and try again.', 'busy');
    if (res.status === 401) throw new AIError('OpenRouter didn’t accept that key. Check it in ⚙️ settings.', 'bad_key');
    if (res.status === 402) throw new AIError('This key has hit its spending limit. Pick a model ending in “:free” in ⚙️ settings.', 'limit');
    throw new AIError(`OpenRouter said ${res.status}: ${data.error?.message || 'something went wrong'}`, 'provider_error');
  }
  throw new AIError('The free AI models are all busy right now. Wait a minute and try again.', 'busy');
}

/** Quick check used by the settings panel. */
export async function testAI(ai) {
  const text = await callOpenRouter([{ role: 'user', content: 'Reply with only this JSON: {"ok":true}' }], 0, ai);
  return parseJSON(text).ok === true;
}

async function chat(prompt, { temperature = 0.8 } = {}) {
  const messages = [
    { role: 'system', content: 'You are Chef Zorp, a friendly martian meal-planning assistant for busy families. You always answer with valid JSON only.' },
    { role: 'user', content: prompt },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = await callOpenRouter(messages, temperature);
    try {
      return parseJSON(content);
    } catch {
      messages.push({ role: 'assistant', content }, { role: 'user', content: 'That was not valid JSON. Reply again with ONLY the JSON object.' });
    }
  }
  throw new AIError('Chef Zorp’s answer came back scrambled. Try again.', 'bad_json');
}

function cleanMeal(raw, day) {
  const n = parseInt(raw?.family_recipe, 10);
  const fam = Number.isInteger(n) ? state.cookbook.recipes[n - 1] : null;
  return {
    day,
    name: String(fam ? fam.title : raw?.name || 'Mystery dinner').slice(0, 60),
    emoji: String(raw?.emoji || '🍽️').slice(0, 4),
    cuisine: String(raw?.cuisine || ''),
    minutes: Number(raw?.minutes) || null,
    summary: String(raw?.summary || ''),
    why: String(raw?.why || ''),
    familyRecipeId: fam ? fam.id : null,
    familyRecipe: fam ? { title: fam.title, url: fam.url || '' } : null,
    inspiredBy: fam ? '' : String(raw?.inspired_by || '').slice(0, 60),
    recipe: null,
  };
}

/** Plans the whole week. Plates appear immediately in a "cooking" state. */
export async function planWeek(onUpdate) {
  const days = cookDays();
  if (state.plan && state.plan.status === 'ready' && state.plan.meals.some(m => m.name)) {
    archivePlan();
  }
  state.plan = { weekOf: weekStart(), createdAt: new Date().toISOString(), status: 'cooking', error: null, meals: days.map(day => ({ day, name: '' })), shoppingChecked: {} };
  save(); onUpdate();
  try {
    const data = await chat(buildPlanPrompt(days));
    const meals = Array.isArray(data.meals) ? data.meals : [];
    state.plan.meals = days.map((day, i) => cleanMeal(meals.find(m => String(m.day).toLowerCase().startsWith(day.slice(0, 3).toLowerCase())) || meals[i], day));
    state.plan.status = 'ready';
  } catch (err) {
    state.plan.status = 'error';
    state.plan.error = err.message;
    state.plan.errorCode = err.code;
    save(); onUpdate();
    throw err;
  }
  save(); onUpdate();
}

export function archivePlan() {
  const p = state.plan;
  if (!p) return;
  const names = p.meals.map(m => m.name).filter(Boolean);
  if (names.length) {
    state.history = [...state.history.filter(w => w.weekOf !== p.weekOf), { weekOf: p.weekOf, meals: names }].slice(-8);
  }
}

const strings = v => (Array.isArray(v) ? v : []).map(String).filter(x => x.trim());

export async function fetchRecipe(meal) {
  if (meal.recipe) return meal.recipe;
  const fam = familyRecipeFor(meal);
  const r = await chat(buildRecipePrompt(meal), { temperature: 0.5 });
  meal.recipe = {
    title: String((fam && fam.text ? fam.title : r.title) || meal.name),
    servings: r.servings || servings(),
    minutes: r.minutes || meal.minutes,
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map(i => typeof i === 'string'
      ? { item: i, amount: '', aisle: 'Other' }
      : { item: String(i.item || ''), amount: String(i.amount || ''), aisle: AISLES.includes(i.aisle) ? i.aisle : 'Other' }),
    steps: strings(r.steps),
    family_notes: strings(r.family_notes),
    tips: strings(r.tips),
    checked: {},
  };
  if (fam && fam.text) {
    // Keep a copy of the original as written, even if it's later removed from the cookbook
    Object.assign(meal.recipe, { kind: 'family', original: fam.text, tweaks: strings(r.tweaks), steps: [] });
  }
  save();
  return meal.recipe;
}

export async function swapMeal(day) {
  const others = state.plan.meals.filter(m => m.day !== day).map(m => `${m.day}: ${m.name}`).join('; ');
  const old = state.plan.meals.find(m => m.day === day);
  const prompt = `${familyContext()}

${RULES}

The week so far: ${others}.
Replace the ${day} dinner ("${old?.name}") with a different dish that isn't similar to anything else this week.
${SOURCE_RULES}

Return ONLY JSON, no other text:
{"meal":{"day":"${day}","name":"dish name, max 5 words","emoji":"one food emoji","cuisine":"...","minutes":30,"summary":"one appetizing sentence","why":"one short sentence naming members",${MEAL_SOURCE_JSON}}}`;
  const data = await chat(prompt, { temperature: 1 });
  const meal = cleanMeal(data.meal || data, day);
  state.plan.meals = state.plan.meals.map(m => (m.day === day ? meal : m));
  save();
  return meal;
}
