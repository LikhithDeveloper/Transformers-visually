import { useMemo, useState } from 'react';
import { Bars, Btn, Callout, Figure, Slider, Tex, Tok } from '../components/ui.jsx';
import { fmt, pct, softmax } from '../lib/math.js';

/* ---------- Logits -> probabilities, temperature, top-k ---------- */

const CAND = ['mat', 'floor', 'sofa', 'bed', 'couch', 'table', 'roof', 'chair', 'moon', 'banana'];
const LOGITS = [5.2, 4.0, 3.7, 3.5, 3.3, 2.8, 2.3, 2.1, 0.4, -0.9];

function sampleFrom(probs) {
  let r = Math.random();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}

function SamplingFigure() {
  const [temp, setTemp] = useState(1);
  const [topK, setTopK] = useState(10);
  const [counts, setCounts] = useState(() => CAND.map(() => 0));
  const [last, setLast] = useState(null);

  const probs = useMemo(() => {
    const z = LOGITS.map((l, i) => (i < topK ? l / temp : -Infinity));
    return softmax(z);
  }, [temp, topK]);

  const reset = () => {
    setCounts(CAND.map(() => 0));
    setLast(null);
  };
  const draw = (n) => {
    const next = [...counts];
    let pick = last;
    for (let k = 0; k < n; k++) {
      pick = sampleFrom(probs);
      next[pick] += 1;
    }
    setCounts(next);
    setLast(pick);
  };
  const total = counts.reduce((a, b) => a + b, 0);

  let mood;
  if (temp <= 0.3) mood = 'Very low temperature: the model almost always picks the top token. Safe and repetitive.';
  else if (temp < 0.9) mood = 'Low temperature: sharper than the model’s natural distribution. Focused, predictable text.';
  else if (temp <= 1.1) mood = 'Temperature 1: the model’s own probabilities, unchanged.';
  else if (temp <= 1.6) mood = 'Higher temperature: unlikely tokens get a real chance. More varied, more surprising.';
  else mood = 'Very high temperature: the distribution is nearly flat. Even “banana” becomes plausible. Text turns incoherent.';

  return (
    <Figure
      title="From scores to a choice: “The cat sat on the ___”"
      caption={mood}
    >
      <div className="controls">
        <Slider label="Temperature T" value={temp} min={0.1} max={2.5} step={0.1} onChange={(v) => { setTemp(v); reset(); }} format={(v) => v.toFixed(1)} />
        <Slider label="Top-k (keep only the k best)" value={topK} min={1} max={10} onChange={(v) => { setTopK(v); reset(); }} />
        <Btn primary onClick={() => draw(1)}>Sample one</Btn>
        <Btn onClick={() => draw(100)}>Sample 100</Btn>
      </div>
      <div className="split is-wide-left">
        <div>
          <Bars
            items={CAND.map((c, i) => ({
              label: c,
              value: probs[i],
              note: i >= topK ? 'cut by top-k' : `logit ${fmt(LOGITS[i], 1)}`,
            }))}
            max={Math.max(0.5, ...probs)}
            digits={1}
            hi={last}
            labelWidth={62}
          />
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>Samples drawn: {total}</h3>
          {total === 0 ? (
            <p className="small muted">
              Press “Sample one”. The model does not simply take the top bar. It rolls a weighted die, so a 20% token
              is picked about one time in five.
            </p>
          ) : (
            <>
              <p className="small" style={{ marginTop: 0 }}>
                Last pick: <b>{CAND[last]}</b>
              </p>
              <div className="toks">
                {CAND.map((c, i) =>
                  counts[i] > 0 ? (
                    <Tok key={c} sub={`× ${counts[i]}`} active={i === last}>
                      {c}
                    </Tok>
                  ) : null
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Figure>
  );
}

/* ---------- Autoregressive loop with a toy bigram model ---------- */

const CORPUS = `the cat sat on the mat . the dog sat on the rug . the cat chased the mouse . the dog chased the cat .
the mouse ate the cheese . the cat ate the fish . the dog slept on the sofa . the cat slept on the mat .
a bird sang in the tree . the bird ate the seed . the mouse hid in the hole . the dog barked at the bird .
a cat sat in the tree . the bird sat on the roof . a dog ate the cheese . the mouse slept in the hole .`
  .split(/\s+/)
  .filter(Boolean);

const BIGRAM = (() => {
  const table = {};
  for (let i = 0; i < CORPUS.length - 1; i++) {
    const a = CORPUS[i];
    const b = CORPUS[i + 1];
    table[a] = table[a] || {};
    table[a][b] = (table[a][b] || 0) + 1;
  }
  return table;
})();

function nextDist(word, temp) {
  const entries = Object.entries(BIGRAM[word] || { the: 1 });
  const logits = entries.map(([, c]) => Math.log(c) / temp);
  const p = softmax(logits);
  return entries.map(([w], i) => ({ label: w, value: p[i] })).sort((a, b) => b.value - a.value);
}

function LoopFigure() {
  const [text, setText] = useState(['the', 'cat']);
  const [temp, setTemp] = useState(1);
  const dist = nextDist(text[text.length - 1], temp);

  const step = (n) => {
    const out = [...text];
    for (let k = 0; k < n && out.length < 60; k++) {
      const d = nextDist(out[out.length - 1], temp);
      out.push(d[sampleFrom(d.map((x) => x.value))].label);
    }
    setText(out);
  };

  return (
    <Figure
      title="The generation loop"
      caption="Honest label: to keep this page light, the predictor here is a tiny word-pair counter trained on 16 short sentences, not a Transformer. It only looks at the last word. The loop around it (predict, sample, append, repeat) is exactly what real models do, with the full context instead of one word."
    >
      <div className="controls">
        <Btn primary onClick={() => step(1)} disabled={text.length >= 60}>Generate next token</Btn>
        <Btn onClick={() => step(10)} disabled={text.length >= 60}>Generate 10</Btn>
        <Btn onClick={() => setText(['the', 'cat'])}>Start over</Btn>
        <Slider label="Temperature" value={temp} min={0.2} max={2.5} step={0.1} onChange={setTemp} format={(v) => v.toFixed(1)} />
      </div>
      <h3 style={{ marginTop: 0 }}>Text so far ({text.length} tokens)</h3>
      <div className="toks" style={{ marginBottom: 16 }}>
        {text.map((t, i) => (
          <Tok key={i} active={i === text.length - 1} tint={i < 2 ? 'b' : undefined}>
            {t}
          </Tok>
        ))}
        <Tok dim>?</Tok>
      </div>
      <h3>Predicted next token, given “… {text[text.length - 1]}”</h3>
      <Bars items={dist.slice(0, 7)} max={1} labelWidth={62} digits={0} />
    </Figure>
  );
}

export default function Output() {
  return (
    <>
      <h1>Predicting the next word</h1>
      <p className="lead">
        After the last Transformer block, every token has a rich, context-aware vector. One final step turns a
        vector back into something we can read: a probability for every token in the vocabulary.
      </p>

      <h2>From a vector back to words</h2>
      <p>To predict what follows the text, the model takes the final vector of the <strong>last token</strong> and does two things:</p>
      <ol>
        <li>
          <strong>Linear layer (unembedding).</strong> Multiply the vector by a matrix with one row per vocabulary
          token. The result is one raw score per token, called a <strong>logit</strong>. Each logit is a dot
          product: “how well does the final vector match this token?”
        </li>
        <li>
          <strong>Softmax.</strong> Turn the logits into probabilities, exactly as in Chapter 4.
        </li>
      </ol>
      <Tex block>{String.raw`\text{logits} = h_{\text{last}}\, W_U \in \mathbb{R}^{V}
        \qquad\qquad
        P(\text{token } i) = \frac{e^{\,\text{logit}_i / T}}{\sum_j e^{\,\text{logit}_j / T}}`}</Tex>
      <p>
        The <Tex>T</Tex> in that formula is the <strong>temperature</strong>, a dial you control at generation time.
        It is the same “multiply all the scores” effect you played with in the softmax playground: dividing by a
        small <Tex>T</Tex> makes scores bigger and the choice more decisive.
      </p>

      <h2>Choosing a token</h2>
      <p>
        The model gives a distribution, not an answer. Something has to pick. Always taking the most likely token
        (“greedy” decoding) sounds sensible but produces dull, repetitive text. Instead, generation usually{' '}
        <strong>samples</strong>: it picks at random, in proportion to the probabilities.
      </p>

      <SamplingFigure />

      <div className="cards">
        <div className="card">
          <h4>Temperature</h4>
          <p>Reshapes the distribution. Below 1: sharper and safer. Above 1: flatter and more adventurous. Near 0: effectively greedy.</p>
        </div>
        <div className="card">
          <h4>Top-k</h4>
          <p>Keep only the k most likely tokens and discard the rest, so the model can never pick something absurd from the long tail.</p>
        </div>
        <div className="card">
          <h4>Top-p (nucleus)</h4>
          <p>Keep the smallest set of tokens whose probabilities add up to p (say 90%). Adapts automatically: few options when the model is sure, many when it is not.</p>
        </div>
      </div>

      <h2>One token at a time</h2>
      <p>
        A Transformer never writes a sentence in one go. It predicts a single token, appends it to the input, and
        runs again on the longer text. This loop is called <strong>autoregressive generation</strong>.
      </p>

      <LoopFigure />

      <Callout kind="idea">
        Every word a language model writes comes from this loop: run the whole network, get probabilities, pick one
        token, append, repeat. A 500-word answer is roughly 700 complete passes through the model. The model also
        learns a special “end of text” token, and generation stops when that token is picked.
      </Callout>

      <Callout kind="note" title="The context window">
        The model can only attend to a limited number of tokens at once, called its <strong>context window</strong>.
        Early Transformers handled 512 tokens. Current models handle hundreds of thousands. Anything outside the
        window simply is not visible to attention.
      </Callout>
    </>
  );
}
