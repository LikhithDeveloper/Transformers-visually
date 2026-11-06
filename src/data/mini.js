// A tiny, fully computed self-attention example: 4 tokens, d_model = 4, d_k = 3.
// The weights are hand-picked (not trained) so the arithmetic is easy to follow
// and the resulting attention pattern makes grammatical sense.

export const TOK = ['The', 'cat', 'chased', 'mice'];

// Each input dimension has a readable meaning in this toy example.
export const FEAT = ['noun', 'verb', 'article', 'position'];

export const X = [
  [0.1, 0.0, 1.0, 0.0],
  [1.0, 0.1, 0.0, 0.3],
  [0.0, 1.0, 0.1, 0.6],
  [0.9, 0.0, 0.0, 1.0],
];

// Query: "what am I looking for?"  Nouns look for a verb; verbs and articles look for a noun.
export const WQ = [
  [0.2, 2.0, 0.0],
  [2.0, 0.2, 0.0],
  [2.0, 0.0, 0.2],
  [0.1, 0.1, 0.0],
];

// Key: "what am I?"  Being later in the sentence makes a noun slightly less eager to match.
export const WK = [
  [2.0, 0.0, 0.0],
  [0.0, 2.0, 0.0],
  [0.0, 0.0, 2.0],
  [-0.5, 0.1, 0.0],
];

// Value: "what do I hand over?"
export const WV = [
  [1.0, 0.0, 0.5],
  [0.0, 1.0, 0.5],
  [0.5, 0.5, 0.0],
  [0.0, 0.2, 1.0],
];

export const Q_COLS = ['→noun', '→verb', '→art.'];
export const K_COLS = ['noun', 'verb', 'art.'];
export const V_COLS = ['v1', 'v2', 'v3'];
