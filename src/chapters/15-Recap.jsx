import { useState } from 'react';
import { Bars, Callout, Figure, Seg, Slider, Tex } from '../components/ui.jsx';

/* ---------- Parameter calculator ---------- */

const PRESETS = {
  small: { label: 'GPT-2 small', d: 768, N: 12 },
  medium: { label: 'GPT-2 medium', d: 1024, N: 24 },
  large: { label: 'GPT-2 large', d: 1280, N: 36 },
};
const V = 50257;
const CTX = 1024;

function ParamFigure() {
  const [d, setD] = useState(768);
  const [N, setN] = useState(12);
  const dff = 4 * d;

  const tokEmb = V * d;
  const posEmb = CTX * d;
  const attn = N * (4 * d * d + 4 * d);
  const ffn = N * (2 * d * dff + dff + d);
  const norms = N * 4 * d + 2 * d;
  const total = tokEmb + posEmb + attn + ffn + norms;
  const f = (x) => x.toLocaleString();
  const preset = Object.entries(PRESETS).find(([, p]) => p.d === d && p.N === N);

  const items = [
    { label: 'Token embeddings', value: tokEmb / total, note: `V × d = ${f(tokEmb)}` },
    { label: 'Position embeddings', value: posEmb / total, note: `${f(CTX)} × d = ${f(posEmb)}` },
    { label: 'Attention (all layers)', value: attn / total, note: `N × (4d² + 4d) = ${f(attn)}` },
    { label: 'Feed-forward (all layers)', value: ffn / total, note: `N × (8d² + 5d) = ${f(ffn)}` },
    { label: 'Layer norms', value: norms / total, note: f(norms) },
  ];

  return (
    <Figure
      title="Count the parameters yourself"
      caption={
        <>
          Total: <b>{f(total)}</b> parameters ({total >= 1e9 ? `${(total / 1e9).toFixed(2)} billion` : `${(total / 1e6).toFixed(1)} million`}).{' '}
          {preset
            ? `This matches the published size of ${preset[1].label}.`
            : 'Notice how attention and feed-forward grow with d², so doubling the width roughly quadruples the model.'}{' '}
          Settings follow GPT-2: vocabulary {f(V)}, context {f(CTX)} tokens, d_ff = 4 × d_model, and the output layer
          reuses the embedding table, so it adds nothing.
        </>
      }
    >
      <div className="controls">
        <Seg
          label="Preset"
          value={preset ? preset[0] : null}
          onChange={(k) => {
            setD(PRESETS[k].d);
            setN(PRESETS[k].N);
          }}
          options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))}
        />
        <Slider label="Vector size d_model" value={d} min={64} max={1600} step={64} onChange={setD} />
        <Slider label="Layers N" value={N} min={1} max={48} onChange={setN} />
      </div>
      <Bars items={items} max={1} labelWidth={206} noteWidth={232} digits={1} />
    </Figure>
  );
}

/* ---------- Quiz ---------- */

const QUIZ = [
  {
    q: 'What does the dot product between a Query and a Key tell the model?',
    opts: ['The position of the token in the sentence', 'How well the two vectors match', 'The probability of the next token'],
    a: 1,
    why: 'The dot product is a match score. A large value means the Key is what the Query was looking for.',
  },
  {
    q: 'Each row of the attention weight matrix always…',
    opts: ['sums to 1 (100%)', 'contains only zeros and ones', 'is identical to every other row'],
    a: 0,
    why: 'Softmax is applied to each row, so every token has exactly 100% of attention to distribute.',
  },
  {
    q: 'Why are the scores divided by √d_k before the softmax?',
    opts: [
      'To make the computation faster',
      'To add information about word order',
      'To keep scores from growing with vector size, which would make softmax pick a single winner',
    ],
    a: 2,
    why: 'Dot products of longer vectors are larger. Unscaled, softmax saturates and the model gets almost no learning signal.',
  },
  {
    q: 'Without positional encoding, a Transformer could not…',
    opts: ['tell “dog bites man” from “man bites dog”', 'represent words as vectors', 'use more than one head'],
    a: 0,
    why: 'Attention treats its input as an unordered set. Position has to be added to the vectors explicitly.',
  },
  {
    q: 'What does the causal mask prevent?',
    opts: ['Tokens attending to themselves', 'Tokens attending to later tokens', 'The model using too much memory'],
    a: 1,
    why: 'Setting future scores to −∞ gives them zero weight, so a position can never peek at the token it must predict.',
  },
  {
    q: 'In a Transformer block, what is the job of the feed-forward network?',
    opts: [
      'Moving information between different tokens',
      'Normalising the vectors',
      'Processing each token’s vector on its own, with a non-linearity',
    ],
    a: 2,
    why: 'Attention is communication between tokens. The feed-forward network is per-token computation.',
  },
  {
    q: 'What single objective trains a GPT-style model?',
    opts: ['Predicting the next token', 'Matching human-written grammar rules', 'Maximising the attention weights'],
    a: 0,
    why: 'Cross-entropy loss on next-token prediction. Everything the model knows is a by-product of getting better at that.',
  },
];

function Quiz() {
  const [answers, setAnswers] = useState({});
  const score = QUIZ.filter((q, i) => answers[i] === q.a).length;
  const done = Object.keys(answers).length === QUIZ.length;
  return (
    <Figure
      title="Check yourself"
      hint={`${Object.keys(answers).length} of ${QUIZ.length} answered`}
      caption={done ? `You got ${score} of ${QUIZ.length}. ${score === QUIZ.length ? 'Perfect. You understand how a Transformer works.' : 'Revisit the chapters behind any you missed, then try again.'}` : 'Pick an answer for each question. Explanations appear as you go.'}
    >
      {QUIZ.map((q, i) => {
        const picked = answers[i];
        return (
          <div className="quiz-q" key={i}>
            <p>
              {i + 1}. {q.q}
            </p>
            <div className="quiz-opts">
              {q.opts.map((o, k) => {
                const state = picked === undefined ? '' : k === q.a ? ' is-right' : k === picked ? ' is-wrong' : '';
                return (
                  <button
                    key={k}
                    type="button"
                    className={`quiz-opt${state}`}
                    disabled={picked !== undefined}
                    onClick={() => setAnswers({ ...answers, [i]: k })}
                  >
                    {picked !== undefined && k === q.a && '✓ '}
                    {picked !== undefined && k === picked && k !== q.a && '✗ '}
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== undefined && (
              <div className="quiz-why">
                <b>{picked === q.a ? 'Correct.' : 'Not quite.'}</b> {q.why}
              </div>
            )}
          </div>
        );
      })}
      {done && (
        <button type="button" className="btn" onClick={() => setAnswers({})}>
          Try again
        </button>
      )}
    </Figure>
  );
}

const GLOSSARY = [
  ['Token', 'A piece of text (word, part of a word, or punctuation) that the model treats as one unit.'],
  ['Vocabulary (V)', 'The fixed list of all tokens a model knows.'],
  ['Embedding', 'The vector that represents a token. Looked up from the embedding table by token ID.'],
  ['d_model', 'The size of the vector carried for each token through the whole model.'],
  ['Positional encoding', 'A signal added to each embedding so the model can tell token order.'],
  ['Dot product', 'Multiply matching entries of two vectors and add. Measures how well they match.'],
  ['Softmax', 'Turns a list of scores into positive numbers that sum to 1.'],
  ['Query, Key, Value', 'Three projections of each token’s vector: what it is looking for, what it offers as a match, and what it hands over.'],
  ['Attention weights', 'For each token, the percentages saying how much it draws from every other token.'],
  ['Self-attention', 'Attention where Queries, Keys and Values all come from the same sequence.'],
  ['Head', 'One independent attention computation. Multi-head attention runs several in parallel.'],
  ['Causal mask', 'Blocks attention to later tokens so the model cannot see the future.'],
  ['Cross-attention', 'Attention where Queries come from one sequence and Keys and Values from another.'],
  ['Residual connection', 'Adding a sublayer’s output to its input instead of replacing it.'],
  ['Layer normalisation', 'Rescaling each token’s vector to mean 0 and standard deviation 1.'],
  ['Feed-forward network (FFN)', 'A two-layer network applied to each token separately: expand, activate, contract.'],
  ['Logits', 'The raw scores, one per vocabulary token, before the final softmax.'],
  ['Temperature', 'A divisor applied to logits before softmax. Low is predictable, high is random.'],
  ['Autoregressive', 'Generating one token at a time, feeding each output back in as input.'],
  ['Loss', 'A single number measuring how wrong the model’s predictions were.'],
  ['Gradient descent', 'Repeatedly nudging every weight in the direction that lowers the loss.'],
  ['Parameters / weights', 'All the learned numbers in the model.'],
  ['Context window', 'The maximum number of tokens the model can attend to at once.'],
];

export default function Recap({ go }) {
  return (
    <>
      <h1>Recap &amp; cheat sheet</h1>
      <p className="lead">
        You have gone from raw text to a trained, generating Transformer. Here is everything on one page: the whole
        pipeline in formulas, a parameter calculator, a glossary, and a short quiz.
      </p>

      <h2>The whole model in eight lines</h2>
      <Figure title="Forward pass of a decoder-only Transformer">
        <table className="tbl">
          <thead>
            <tr>
              <th>Step</th>
              <th>Formula</th>
              <th>Chapter</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Tokenize', String.raw`\text{text} \rightarrow (t_1, \dots, t_n)`, 'tokens', 2],
              ['Embed + position', String.raw`x_i = E[t_i] + PE(i)`, 'position', 5],
              ['Queries, Keys, Values', String.raw`Q = XW_Q,\;\; K = XW_K,\;\; V = XW_V`, 'attention-math', 7],
              ['Attention', String.raw`\text{softmax}\!\left(\tfrac{QK^\top}{\sqrt{d_k}} + M\right)V`, 'attention-math', 7],
              ['Multi-head', String.raw`\text{Concat}(\text{head}_1,\dots,\text{head}_h)\,W_O`, 'multi-head', 8],
              ['Add & Norm', String.raw`x \leftarrow \text{LayerNorm}(x + \text{Sublayer}(x))`, 'add-norm', 10],
              ['Feed-forward', String.raw`W_2\,\text{act}(W_1x + b_1) + b_2`, 'feed-forward', 11],
              ['Predict', String.raw`P = \text{softmax}(h_{\text{last}} W_U / T)`, 'output', 13],
            ].map(([name, tex, id, n]) => (
              <tr key={name}>
                <td>{name}</td>
                <td><Tex>{tex}</Tex></td>
                <td>
                  <button className="linkish" onClick={() => go(id)}>
                    Ch. {n}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Figure>
      <p>
        Steps 3 to 7 form one block, repeated <Tex>N</Tex> times. Training adjusts every <Tex>W</Tex>, <Tex>E</Tex>{' '}
        and <Tex>b</Tex> to minimise <Tex>{String.raw`-\ln P(\text{correct next token})`}</Tex>.
      </p>

      <Callout kind="idea" title="The one-paragraph summary">
        Text is split into tokens, and each token becomes a vector that encodes its meaning and position. In every
        layer, each token uses <strong>attention</strong> to pull in information from the tokens that are relevant
        to it (Query matched against Keys by dot product, softmax into weights, weighted average of Values, several
        heads in parallel), and then a <strong>feed-forward network</strong> processes the result. Residual
        connections and normalisation keep the deep stack stable. The final vector is compared against every token
        in the vocabulary to produce next-token probabilities. All the weights are learned by predicting the next
        token over and over on vast amounts of text.
      </Callout>

      <h2>Where do the parameters live?</h2>
      <p>
        With the formulas from this course you can count every weight in a real model. Pick a GPT-2 preset and
        compare the total with the published number.
      </p>
      <ParamFigure />

      <h2>Quiz</h2>
      <Quiz />

      <h2>Glossary</h2>
      <div>
        {GLOSSARY.map(([term, def]) => (
          <details className="gloss" key={term}>
            <summary>{term}</summary>
            <p>{def}</p>
          </details>
        ))}
      </div>

      <h2>Where to go next</h2>
      <ul>
        <li>
          Read the original paper,{' '}
          <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
            “Attention Is All You Need”
          </a>{' '}
          (Vaswani et al., 2017). After this course, its diagrams and equations should all look familiar.
        </li>
        <li>
          Jay Alammar's{' '}
          <a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noreferrer">
            “The Illustrated Transformer”
          </a>{' '}
          covers the encoder–decoder model with a translation example.
        </li>
        <li>
          Build one. Andrej Karpathy's “Let's build GPT: from scratch, in code, spelled out” video and his nanoGPT
          repository implement everything on these pages in a few hundred lines of Python.
        </li>
        <li>
          Go deeper on topics we only touched: rotary position embeddings (RoPE), key-value caching for fast
          generation, flash attention, and mechanistic interpretability (the study of what individual heads and
          neurons do).
        </li>
      </ul>
    </>
  );
}
