// Illustrative attention patterns for the classic example sentence.
// These are hand-written to resemble what trained models learn; they are not
// the output of a real model. (The step-by-step math chapter computes real ones.)

export const tokensFor = (variant) => [
  'The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', variant,
];

const N = 11;

function build(links, base = 0.12) {
  return Array.from({ length: N }, (_, i) => {
    const row = Array.from({ length: N }, (_, j) => base + ((links[i] || {})[j] || 0));
    const s = row.reduce((a, b) => a + b, 0);
    return row.map((v) => v / s);
  });
}

const COMMON = {
  0: { 0: 1, 1: 5 },
  2: { 2: 1.2, 3: 4, 1: 1.5 },
  3: { 3: 1.2, 1: 2.8, 5: 2.8, 2: 1.4 },
  4: { 4: 1, 5: 5 },
  6: { 6: 1.5, 3: 1.8, 10: 2, 2: 0.8 },
  8: { 8: 1, 7: 3, 10: 3 },
  9: { 9: 1, 10: 4.5 },
};

const TIRED = {
  ...COMMON,
  1: { 0: 1.2, 1: 2, 3: 2.2, 2: 0.8, 7: 0.8, 10: 1.6 },
  5: { 4: 1.4, 5: 2.2, 3: 2.4 },
  7: { 7: 1, 1: 6, 5: 1, 10: 1.6, 8: 0.5 },
  10: { 10: 1.5, 7: 2.4, 1: 3, 8: 1, 9: 1.4 },
};

const WIDE = {
  ...COMMON,
  1: { 0: 1.2, 1: 2, 3: 2.2, 2: 0.8 },
  5: { 4: 1.4, 5: 2.2, 3: 2.4, 7: 0.8, 10: 1.6 },
  7: { 7: 1, 5: 6, 1: 1, 10: 1.6, 8: 0.5 },
  10: { 10: 1.5, 7: 2.4, 5: 3, 8: 1, 9: 1.4 },
};

export const WEIGHTS = { tired: build(TIRED), wide: build(WIDE) };

export const KEY_SAYS = {
  tired: [
    'an article', 'a noun: a living thing, singular', 'a negation', 'an action (verb)', 'an article',
    'a noun: a place, singular', 'a word that introduces a reason', 'a pronoun', 'a linking verb',
    'an intensifier', 'a state that living things feel',
  ],
  wide: [
    'an article', 'a noun: a living thing, singular', 'a negation', 'an action (verb)', 'an article',
    'a noun: a place, singular', 'a word that introduces a reason', 'a pronoun', 'a linking verb',
    'an intensifier', 'a size that places and objects have',
  ],
};

// Four attention heads over the "tired" sentence, each specialising in one relationship.
const selfRows = (w, skip = []) =>
  Object.fromEntries(Array.from({ length: N }, (_, i) => [i, { [i]: w }]).filter(([i]) => !skip.includes(i)));

export const HEADS = [
  {
    name: 'Previous word',
    blurb: 'Every token looks at the token just before it. Simple, but it gives each word its local context.',
    weights: build(
      Object.fromEntries(Array.from({ length: N }, (_, i) => [i, i === 0 ? { 0: 6 } : { [i - 1]: 6, [i]: 0.6 }])),
      0.06
    ),
  },
  {
    name: 'Reference tracker',
    blurb: '“it” looks back at the noun it stands for. Most other tokens have nothing to resolve, so they idle on themselves.',
    weights: build({ ...selfRows(4), 7: { 1: 7, 7: 0.5 }, 10: { 1: 3, 7: 2, 10: 1 }, 1: { 1: 3, 7: 1.5 } }, 0.06),
  },
  {
    name: 'Verb ↔ subject / object',
    blurb: 'Verbs look for who is doing the action and what it is done to. Nouns look back at their verb.',
    weights: build(
      {
        ...selfRows(2),
        2: { 3: 3, 1: 3 },
        3: { 1: 4, 5: 4 },
        8: { 7: 4, 10: 3 },
        1: { 3: 3, 1: 0.6 },
        5: { 3: 3, 5: 0.6 },
        7: { 8: 3, 7: 0.6 },
      },
      0.06
    ),
  },
  {
    name: 'Describer → described',
    blurb: 'Articles and modifiers look at the word they attach to: “The” → “animal”, “the” → “street”, “too” → “tired”.',
    weights: build(
      { ...selfRows(3), 0: { 1: 6 }, 4: { 5: 6 }, 9: { 10: 6 }, 10: { 7: 3, 1: 2, 10: 0.6 }, 6: { 10: 2, 3: 2, 6: 0.6 } },
      0.06
    ),
  },
];
