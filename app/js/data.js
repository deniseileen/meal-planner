// Everything the questions are built from. Each option is visual: an emoji + a short label.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEKEND = ['Saturday', 'Sunday'];
export const DAY_COLORS = {
  Monday: '#3f9b5a', Tuesday: '#e8833a', Wednesday: '#3d7dd8', Thursday: '#d6453d',
  Friday: '#2a9d8f', Saturday: '#e0a526', Sunday: '#8a4fd0',
};

// ---- Martians -------------------------------------------------------------
export const AGES = [
  { id: 'toddler', emoji: '🍼', label: 'Toddler', scale: 0.66, portion: 0.4 },
  { id: 'kid', emoji: '🧒', label: 'Kid', scale: 0.78, portion: 0.6 },
  { id: 'teen', emoji: '🎧', label: 'Teen', scale: 0.9, portion: 1.2 },
  { id: 'adult', emoji: '🧑', label: 'Grown-up', scale: 1, portion: 1 },
  { id: 'senior', emoji: '👵', label: 'Grandparent', scale: 0.96, portion: 0.9 },
];
export const SWEATERS = ['#2a9d8f', '#e85d4a', '#f2b134', '#4f7fd9', '#5fb35a', '#d1679e', '#7b5cd6', '#f08a3c'];
export const PATTERNS = [
  { id: 'stripes', label: 'Stripes' }, { id: 'dots', label: 'Polka dots' },
  { id: 'stars', label: 'Stars' }, { id: 'plain', label: 'Plain' },
];
export const EXTRAS = [
  { id: 'none', emoji: '🙂', label: 'Just me' }, { id: 'lashes', emoji: '✨', label: 'Lashes' },
  { id: 'glasses', emoji: '👓', label: 'Glasses' }, { id: 'bow', emoji: '🎀', label: 'Bow' },
  { id: 'chef', emoji: '🧑‍🍳', label: 'Chef hat' },
];

export const FACES = [
  { id: 'happy', emoji: '😃', label: 'Happy' },
  { id: 'grin', emoji: '😊', label: 'Sweet smile' },
  { id: 'silly', emoji: '😛', label: 'Silly' },
  { id: 'wink', emoji: '😉', label: 'Winky' },
  { id: 'surprised', emoji: '😮', label: 'Surprised' },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { id: 'starry', emoji: '🤩', label: 'Starry-eyed' },
  { id: 'cool', emoji: '😎', label: 'Too cool' },
];
export const EYE_COLORS = ['#2fae4e', '#3d8bfd', '#8b5a2b', '#9b59d0', '#f2a516', '#e0457b', '#17a8a0', '#4a4a5a'];

export const FOOD_GROUPS = [
  { title: 'Proteins', items: [
    ['chicken', '🍗', 'Chicken'], ['beef', '🥩', 'Beef'], ['pork', '🥓', 'Pork'], ['fish', '🐟', 'Fish'],
    ['shrimp', '🍤', 'Shrimp'], ['tofu', '🫛', 'Tofu'], ['eggs', '🥚', 'Eggs'], ['beans', '🫘', 'Beans & lentils'],
  ] },
  { title: 'Veggies', items: [
    ['broccoli', '🥦', 'Broccoli'], ['mushrooms', '🍄', 'Mushrooms'], ['peppers', '🫑', 'Peppers'],
    ['tomatoes', '🍅', 'Tomatoes'], ['greens', '🥬', 'Leafy greens'], ['carrots', '🥕', 'Carrots'],
    ['onions', '🧅', 'Onions'], ['corn', '🌽', 'Corn'], ['avocado', '🥑', 'Avocado'],
    ['eggplant', '🍆', 'Eggplant'], ['zucchini', '🥒', 'Zucchini'], ['sweet-potato', '🍠', 'Sweet potato'],
  ] },
  { title: 'Carbs', items: [
    ['pasta', '🍝', 'Pasta'], ['rice', '🍚', 'Rice'], ['potatoes', '🥔', 'Potatoes'],
    ['bread', '🍞', 'Bread'], ['tortillas', '🌮', 'Tortillas'], ['noodles', '🍜', 'Noodles'],
  ] },
  { title: 'Flavors & favorites', items: [
    ['cheese', '🧀', 'Cheese'], ['garlic', '🧄', 'Garlic'], ['olives', '🫒', 'Olives'],
    ['coconut', '🥥', 'Coconut'], ['peanuts', '🥜', 'Peanut sauce'], ['citrus', '🍋', 'Citrus'],
    ['curry', '🍛', 'Curry'], ['soup', '🍲', 'Soups & stews'], ['salad', '🥗', 'Salads'], ['pizza', '🍕', 'Pizza'],
  ] },
];
export const FOOD_LABEL = Object.fromEntries(FOOD_GROUPS.flatMap(g => g.items.map(([id, , label]) => [id, label])));

export const DIETS = [
  { id: 'none', emoji: '🍽️', label: 'No special diet' },
  { id: 'vegetarian', emoji: '🥕', label: 'Vegetarian' },
  { id: 'vegan', emoji: '🌱', label: 'Vegan' },
  { id: 'pescatarian', emoji: '🐟', label: 'Pescatarian' },
  { id: 'gluten-free', emoji: '🌾', label: 'Gluten-free', no: true },
  { id: 'dairy-free', emoji: '🥛', label: 'Dairy-free', no: true },
  { id: 'low-carb', emoji: '🥩', label: 'Low-carb' },
  { id: 'halal', emoji: '☪️', label: 'Halal' },
  { id: 'kosher', emoji: '✡️', label: 'Kosher' },
];
export const ALLERGIES = [
  { id: 'none', emoji: '👍', label: 'No allergies' },
  { id: 'peanuts', emoji: '🥜', label: 'Peanuts' },
  { id: 'tree-nuts', emoji: '🌰', label: 'Tree nuts' },
  { id: 'dairy', emoji: '🥛', label: 'Dairy' },
  { id: 'eggs', emoji: '🥚', label: 'Eggs' },
  { id: 'wheat', emoji: '🌾', label: 'Wheat / gluten' },
  { id: 'shellfish', emoji: '🦐', label: 'Shellfish' },
  { id: 'fish', emoji: '🐟', label: 'Fish' },
  { id: 'soy', emoji: '🫛', label: 'Soy' },
  { id: 'sesame', emoji: '🥯', label: 'Sesame' },
];
export const SPICE = [
  { id: 0, emoji: '🥛', label: 'No spice please' },
  { id: 1, emoji: '🌶️', label: 'A little kick' },
  { id: 2, emoji: '🌶️🌶️', label: 'Medium heat' },
  { id: 3, emoji: '🌶️🌶️🌶️', label: 'Bring the fire' },
];
export const ADVENTURE = [
  { id: 'favorites', emoji: '🧸', label: 'Sticks to favorites', sub: 'Familiar food = happy martian' },
  { id: 'curious', emoji: '🔭', label: 'Sometimes curious', sub: 'New things, in small bites' },
  { id: 'bold', emoji: '🚀', label: 'Will try anything!', sub: 'The weirder the better' },
];

// ---- Cooking habits (the bubbling pot) ------------------------------------
export const TIMES = [
  { id: 15, emoji: '⚡', label: '15 min', sub: 'Super speedy' },
  { id: 30, emoji: '⏱️', label: '30 min', sub: 'Quick & easy' },
  { id: 45, emoji: '🕒', label: '45 min', sub: 'Some time' },
  { id: 60, emoji: '🍲', label: '1 hour+', sub: 'Slow & cozy' },
];
export const SKILLS = [
  { id: 'beginner', emoji: '🥄', label: 'Just learning', sub: 'Simple steps please' },
  { id: 'confident', emoji: '🍳', label: 'Confident cook', sub: 'I can follow most recipes' },
  { id: 'wizard', emoji: '🧙', label: 'Kitchen wizard', sub: 'Bring on the techniques' },
];
export const GADGETS = [
  { id: 'basics', emoji: '🍳', label: 'Just the basics', sub: 'Stove + oven' },
  { id: 'slow-cooker', emoji: '🫕', label: 'Slow cooker' },
  { id: 'pressure-cooker', emoji: '⚡', label: 'Instant Pot' },
  { id: 'air-fryer', emoji: '🌀', label: 'Air fryer' },
  { id: 'grill', emoji: '🔥', label: 'Grill' },
  { id: 'rice-cooker', emoji: '🍚', label: 'Rice cooker' },
  { id: 'dutch-oven', emoji: '🥘', label: 'Dutch oven' },
  { id: 'wok', emoji: '🥢', label: 'Wok' },
  { id: 'blender', emoji: '🥤', label: 'Blender' },
];
export const LEFTOVERS = [
  { id: 'love', emoji: '😍', label: 'Love them', sub: 'Cook extra for lunches' },
  { id: 'sometimes', emoji: '👍', label: 'Now and then', sub: 'A night off is nice' },
  { id: 'never', emoji: '🙅', label: 'Fresh every night', sub: 'Just enough, please' },
];
export const BUDGETS = [
  { id: 'thrifty', emoji: '🪙', label: 'Thrifty', sub: 'Stretch every dollar' },
  { id: 'moderate', emoji: '💵', label: 'Middle of the road', sub: 'Sensible with treats' },
  { id: 'treat', emoji: '💎', label: 'Treat ourselves', sub: 'Good ingredients matter' },
];

// ---- World cuisines (the map) ---------------------------------------------
// x/y are percentages inside the painted map on the kitchen wall.
export const CUISINES = [
  { id: 'american', flag: '🇺🇸', label: 'American', x: 19.7, y: 34.0 },
  { id: 'mexican', flag: '🇲🇽', label: 'Mexican', x: 17.7, y: 46.4 },
  { id: 'caribbean', flag: '🇯🇲', label: 'Caribbean', x: 27.8, y: 48.0 },
  { id: 'peruvian', flag: '🇵🇪', label: 'Peruvian', x: 27.3, y: 63.7 },
  { id: 'brazilian', flag: '🇧🇷', label: 'Brazilian', x: 35.0, y: 62.0 },
  { id: 'british', flag: '🇬🇧', label: 'British', x: 48.6, y: 20.6 },
  { id: 'french', flag: '🇫🇷', label: 'French', x: 50.2, y: 27.7 },
  { id: 'spanish', flag: '🇪🇸', label: 'Spanish', x: 47.2, y: 32.8 },
  { id: 'italian', flag: '🇮🇹', label: 'Italian', x: 53.8, y: 31.5 },
  { id: 'german', flag: '🇩🇪', label: 'German', x: 52.7, y: 24.0 },
  { id: 'eastern-european', flag: '🇵🇱', label: 'Eastern European', x: 58.3, y: 21.6 },
  { id: 'greek', flag: '🇬🇷', label: 'Greek', x: 57.3, y: 34.8 },
  { id: 'moroccan', flag: '🇲🇦', label: 'Moroccan', x: 47.7, y: 38.6 },
  { id: 'west-african', flag: '🇳🇬', label: 'West African', x: 51.2, y: 53.8 },
  { id: 'ethiopian', flag: '🇪🇹', label: 'Ethiopian', x: 61.9, y: 54.6 },
  { id: 'middle-eastern', flag: '🇱🇧', label: 'Middle Eastern', x: 60.6, y: 37.6 },
  { id: 'persian', flag: '🇮🇷', label: 'Persian', x: 66.0, y: 38.6 },
  { id: 'indian', flag: '🇮🇳', label: 'Indian', x: 70.0, y: 45.5 },
  { id: 'chinese', flag: '🇨🇳', label: 'Chinese', x: 76.6, y: 35.6 },
  { id: 'korean', flag: '🇰🇷', label: 'Korean', x: 82.2, y: 33.2 },
  { id: 'japanese', flag: '🇯🇵', label: 'Japanese', x: 85.8, y: 34.8 },
  { id: 'thai', flag: '🇹🇭', label: 'Thai', x: 75.1, y: 48.5 },
  { id: 'vietnamese', flag: '🇻🇳', label: 'Vietnamese', x: 77.4, y: 51.5 },
  { id: 'filipino', flag: '🇵🇭', label: 'Filipino', x: 82.4, y: 47.5 },
  { id: 'indonesian', flag: '🇮🇩', label: 'Indonesian', x: 79.7, y: 58.7 },
  { id: 'australian', flag: '🇦🇺', label: 'Australian', x: 83.7, y: 73.6 },
];
export const EXPLORE = [
  { id: 'pins', emoji: '📌', label: 'Stick to our pins', sub: 'Only the places we picked' },
  { id: 'mix', emoji: '🧭', label: 'Mix in something new', sub: 'One surprise a week' },
  { id: 'tour', emoji: '🌍', label: 'World tour!', sub: 'Take us everywhere' },
];

// ---- Cookbook --------------------------------------------------------------
export const SITES = [
  { id: 'nyt', label: 'NYT Cooking', color: '#222' },
  { id: 'serious-eats', label: 'Serious Eats', color: '#d62f2f' },
  { id: 'budget-bytes', label: 'Budget Bytes', color: '#2e9e5b' },
  { id: 'allrecipes', label: 'Allrecipes', color: '#e4572e' },
  { id: 'bon-appetit', label: 'Bon Appétit', color: '#1d1d1d' },
  { id: 'recipetin', label: 'RecipeTin Eats', color: '#f29d38' },
  { id: 'smitten', label: 'Smitten Kitchen', color: '#7d9d5a' },
  { id: 'minimalist-baker', label: 'Minimalist Baker', color: '#b88b4a' },
  { id: 'bbc-good-food', label: 'BBC Good Food', color: '#3a7bd5' },
  { id: 'food-network', label: 'Food Network', color: '#d7263d' },
  { id: 'half-baked', label: 'Half Baked Harvest', color: '#9b6a43' },
  { id: 'skinnytaste', label: 'Skinnytaste', color: '#5bb0a6' },
  { id: 'love-lemons', label: 'Love & Lemons', color: '#e6b422' },
  { id: 'woks-of-life', label: 'The Woks of Life', color: '#c0392b' },
  { id: 'atk', label: "America's Test Kitchen", color: '#c8102e' },
];
export const USE_RECIPES = [
  { id: 'weekly', emoji: '⭐', label: 'One a week', sub: 'Our classics, in rotation' },
  { id: 'often', emoji: '💛', label: 'As often as they fit', sub: 'We love our recipes' },
  { id: 'inspire', emoji: '💡', label: 'Just for inspiration', sub: 'Borrow the vibe' },
];

export const AISLES = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'];
export const AISLE_EMOJI = {
  Produce: '🥕', 'Meat & Seafood': '🍗', 'Dairy & Eggs': '🧀', Bakery: '🥖',
  Pantry: '🥫', Spices: '🧂', Frozen: '🧊', Other: '🛒',
};

export const byId = (list, id) => list.find(o => o.id === id);
