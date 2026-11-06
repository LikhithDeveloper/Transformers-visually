# Transformers, Visually

An interactive, beginner-friendly course on how Transformers and self-attention work, built with React and Vite.
Every number in every figure is computed live in the browser.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:5173. Use `npm run build` to produce a static site in `dist/`.

## Chapters

| Part | Chapters |
|---|---|
| 1 · Foundations | What is a Transformer? · Tokens · Embeddings · Dot product & softmax · Positional encoding |
| 2 · Attention | The intuition (Query / Key / Value) · The math, step by step · Multi-head attention · Masking |
| 3 · The full machine | Residuals & layer norm · Feed-forward network · The full architecture |
| 4 · Using and training it | Predicting the next word · How it learns · Recap, parameter calculator, quiz, glossary |

## Layout

- `src/chapters/` one file per chapter
- `src/components/` shared pieces: `Matrix` (hoverable number grids), `Plot`, sliders, bars, formulas (KaTeX)
- `src/lib/math.js` the linear algebra used by every figure (matmul, softmax, attention, layer norm, positional encoding)
- `src/data/mini.js` the 4-token example used in the step-by-step attention chapter. Edit the matrices there to experiment.

## What is real and what is illustrative

- The step-by-step attention chapter, masking, softmax, positional encoding, layer norm, the feed-forward network and
  the parameter calculator are real computations.
- The attention patterns on the long sentence ("The animal didn't cross the street…") and the four example heads are
  hand-written to resemble what trained models learn. They are labelled as illustrative in the app.
- The text generator in "Predicting the next word" is a tiny word-pair counter, not a Transformer. It demonstrates the
  generation loop only.
