/**
 * @fileoverview Anonymous name generator for anonymous users.
 * @module utils/anonymousName
 */

const adjectives = [
  'Swift','Silent','Bright','Calm','Dark','Eager','Fair','Gentle','Happy','Iron',
  'Keen','Light','Mellow','Noble','Open','Pure','Quick','Rare','Sharp','True',
  'Urban','Vivid','Warm','Young','Zen','Bold','Cool','Deep','Elite','Free',
  'Grand','High','Ivy','Just','Kind','Lone','Mint','New','Old','Peak',
];

const nouns = [
  'Fox','Owl','Bear','Wolf','Hawk','Lynx','Crow','Deer','Hare','Pike',
  'Wren','Lark','Swan','Dove','Moth','Bee','Ant','Elk','Ram','Jay',
  'Rook','Seal','Toad','Carp','Bass','Koi','Newt','Mole','Vole','Yak',
  'Ibis','Emu','Kite','Dace','Cod','Ray','Orca','Wasp','Fly','Bat',
];

/**
 * Generate a random anonymous display name.
 * Format: "Adjective Noun XXXX" (e.g., "Silent Fox 4829")
 * @returns {string}
 */
export function generateAnonymousName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj} ${noun} ${num}`;
}

/**
 * Generate a unique anonymous ID (lowercase, no spaces).
 * @returns {string}
 */
export function generateAnonymousId() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)].toLowerCase();
  const noun = nouns[Math.floor(Math.random() * nouns.length)].toLowerCase();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `anon_${adj}_${noun}_${num}`;
}

export default { generateAnonymousName, generateAnonymousId };
