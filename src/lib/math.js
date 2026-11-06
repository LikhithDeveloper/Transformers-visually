// Small linear-algebra helpers. Everything shown in the app is computed with these.

export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

export const matmul = (A, B) =>
  A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));

export const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));

export const scaleMat = (A, s) => A.map((r) => r.map((v) => v * s));

export const addMat = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));

export function softmax(v) {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

export const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;

export function std(v) {
  const m = mean(v);
  return Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
}

export function layerNorm(v, eps = 1e-5) {
  const m = mean(v);
  const s = std(v);
  return v.map((x) => (x - m) / (s + eps));
}

export const relu = (x) => Math.max(0, x);

export const gelu = (x) =>
  0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));

// Deterministic random numbers so the page looks the same on every load.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng) {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const randMat = (rows, cols, rng, scale = 1) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(randn(rng) * scale * 10) / 10)
  );

export function fmt(x, d = 2) {
  if (x === -Infinity) return '−∞';
  if (x === Infinity) return '∞';
  const s = x.toFixed(d);
  const clean = Number(s) === 0 ? (0).toFixed(d) : s;
  return clean.replace('-', '−');
}

export const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;

// Sinusoidal positional encoding from "Attention Is All You Need".
export function positionalEncoding(pos, i, dModel) {
  const k = Math.floor(i / 2);
  const angle = pos / Math.pow(10000, (2 * k) / dModel);
  return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}

// Scaled dot-product attention, returning every intermediate step.
export function attention(X, WQ, WK, WV, { causal = false } = {}) {
  const Q = matmul(X, WQ);
  const K = matmul(X, WK);
  const V = matmul(X, WV);
  const dk = WQ[0].length;
  const scores = matmul(Q, transpose(K));
  const scaled = scaleMat(scores, 1 / Math.sqrt(dk));
  const masked = causal
    ? scaled.map((r, i) => r.map((v, j) => (j > i ? -Infinity : v)))
    : scaled;
  const weights = masked.map((r) => softmax(r));
  const out = matmul(weights, V);
  return { Q, K, V, dk, scores, scaled, masked, weights, out };
}
