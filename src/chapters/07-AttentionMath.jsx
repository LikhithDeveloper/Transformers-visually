import { useMemo, useState } from 'react';
import { Bars, Btn, Callout, Figure, ScaleLegend, Seg, Slider, StepNav, Swatch, Tex } from '../components/ui.jsx';
import { EqRow, Matrix, Op } from '../components/Matrix.jsx';
import { attention, dot, fmt, mulberry32, pct, randMat, randn, softmax } from '../lib/math.js';
import { FEAT, K_COLS, Q_COLS, TOK, V_COLS, WK, WQ, WV, X } from '../data/mini.js';

const STEPS = [
  { title: 'Start with the input X' },
  { title: 'Make Queries, Keys and Values' },
  { title: 'Score every pair with a dot product' },
  { title: 'Scale the scores' },
  { title: 'Softmax each row' },
  { title: 'Blend the Values' },
  { title: 'What just happened' },
];

const DEFAULT_SEL = [[2, 0], [2, 0], [2, 1], [2, 1], [2, 1], [2, 0], [2, 1]];

const QC = 'var(--s1)';
const KC = 'var(--s2)';
const VC = 'var(--s3)';

function Walkthrough() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState(DEFAULT_SEL[0]);
  const [which, setWhich] = useState('Q');
  const [seed, setSeed] = useState(0); // 0 = hand-picked weights

  const W = useMemo(() => {
    if (seed === 0) return { Q: WQ, K: WK, V: WV };
    const rng = mulberry32(seed * 7919);
    return { Q: randMat(4, 3, rng), K: randMat(4, 3, rng), V: randMat(4, 3, rng) };
  }, [seed]);

  const r = useMemo(() => attention(X, W.Q, W.K, W.V), [W]);
  const hand = seed === 0;
  const cols = {
    Q: hand ? Q_COLS : ['q1', 'q2', 'q3'],
    K: hand ? K_COLS : ['k1', 'k2', 'k3'],
    V: V_COLS,
  };
  const [i, j] = sel;
  const pick = (a, b) => setSel([a, b]);
  const goStep = (s) => {
    setStep(s);
    setSel(DEFAULT_SEL[s]);
  };

  const top = (row) => {
    const w = r.weights[row];
    const best = w.indexOf(Math.max(...w));
    return { tok: TOK[best], w: w[best] };
  };

  let body;
  let text;

  if (step === 0) {
    text = (
      <>
        Our sentence is <b>“The cat chased mice”</b>. Each row below is one token's vector: its embedding with the
        position already added. Real vectors have hundreds of unnamed dimensions. To keep things readable we use only
        4, and we cheat by giving each a meaning: how noun-like, verb-like and article-like the token is, plus a
        rough position. This grid is called <Tex>X</Tex>.
      </>
    );
    body = (
      <>
        <EqRow>
          <Matrix title="X  (input)" data={X} rowLabels={TOK} colLabels={FEAT} cell={58} range={1.2} />
        </EqRow>
        <div className="readout">
          <span className="readout-title">Shape:</span>4 tokens × 4 dimensions. In symbols,{' '}
          <Tex>{String.raw`X \in \mathbb{R}^{n \times d_{\text{model}}}`}</Tex> with <Tex>n = 4</Tex> and{' '}
          <Tex>{String.raw`d_{\text{model}} = 4`}</Tex>.
        </div>
      </>
    );
  } else if (step === 1) {
    const Wm = W[which];
    const R = r[which];
    const name = { Q: 'queries', K: 'keys', V: 'values' }[which];
    const terms = X[i].map((x, k) => `${fmt(x, 1)}×${fmt(Wm[k][j], 1)}`).join(' + ');
    text = (
      <>
        Every token needs a Query, a Key and a Value. We get each one by multiplying <Tex>X</Tex> by its own weight
        matrix: <Tex>{String.raw`Q = XW_Q`}</Tex>, <Tex>{String.raw`K = XW_K`}</Tex>,{' '}
        <Tex>{String.raw`V = XW_V`}</Tex>. These three matrices are <b>the things the model learns</b>.{' '}
        {hand ? (
          <>
            Here we hand-picked them: <Tex>W_Q</Tex> makes verbs and articles ask for a noun (column “→noun”) and nouns
            ask for a verb, while <Tex>W_K</Tex> makes each token announce what it is.
          </>
        ) : (
          <>These are random weights, like a model before any training.</>
        )}
      </>
    );
    body = (
      <>
        <div className="controls">
          <Seg
            label="Which projection"
            value={which}
            onChange={(v) => {
              setWhich(v);
              setSel([2, 0]);
            }}
            options={[
              { value: 'Q', label: 'Queries  Q = X·W_Q' },
              { value: 'K', label: 'Keys  K = X·W_K' },
              { value: 'V', label: 'Values  V = X·W_V' },
            ]}
          />
        </div>
        <EqRow>
          <Matrix title="X" data={X} rowLabels={TOK} colLabels={FEAT} rowHi={i} cell={52} range={1.2} />
          <Op>×</Op>
          <Matrix title={`W_${which}  (learned)`} data={Wm} rowLabels={FEAT} colLabels={cols[which]} colHi={j} />
          <Op>=</Op>
          <Matrix
            title={`${which}  (${name})`}
            accent={{ Q: QC, K: KC, V: VC }[which]}
            data={R}
            rowLabels={TOK}
            colLabels={cols[which]}
            cellHi={sel}
            onCell={pick}
          />
        </EqRow>
        <div className="readout">
          <span className="readout-title">
            {which}[{TOK[i]}, {cols[which][j]}]
          </span>
          = (row “{TOK[i]}” of X) · (column “{cols[which][j]}” of W<sub>{which}</sub>) ={' '}
          <span className="mono">
            {terms} = <b>{fmt(R[i][j])}</b>
          </span>
        </div>
      </>
    );
  } else if (step === 2) {
    const terms = r.Q[i].map((q, k) => `${fmt(q)}×${fmt(r.K[j][k])}`).join(' + ');
    text = (
      <>
        Now every token's Query is compared with every token's Key using the dot product from Chapter 4. A big number
        means “this Key is what my Query was looking for”. With 4 tokens there are 4 × 4 = 16 pairs. In matrix form
        this is one multiplication: <Tex>{String.raw`S = QK^{\top}`}</Tex> (the <Tex>{String.raw`\top`}</Tex> flips{' '}
        <Tex>K</Tex> on its side so that rows meet rows).
      </>
    );
    body = (
      <>
        <EqRow>
          <Matrix title="Q" accent={QC} data={r.Q} rowLabels={TOK} colLabels={cols.Q} rowHi={i} />
          <Op>·</Op>
          <Matrix title="K" accent={KC} data={r.K} rowLabels={TOK} colLabels={cols.K} rowHi={j} />
          <Op>=</Op>
          <Matrix title="Scores S" data={r.scores} rowLabels={TOK} colLabels={TOK} cellHi={sel} onCell={pick} cell={56} />
        </EqRow>
        <div className="readout">
          <span className="readout-title">
            score({TOK[i]} → {TOK[j]})
          </span>
          = Query of “{TOK[i]}” · Key of “{TOK[j]}” ={' '}
          <span className="mono">
            {terms} = <b>{fmt(r.scores[i][j])}</b>
          </span>
          <div className="muted">Rows of S are the token asking. Columns are the token being looked at. Hover any cell.</div>
        </div>
      </>
    );
  } else if (step === 3) {
    text = (
      <>
        Before softmax, every score is divided by <Tex>{String.raw`\sqrt{d_k}`}</Tex>, where <Tex>d_k</Tex> is the
        length of the Query and Key vectors (here 3, so we divide by {fmt(Math.sqrt(3), 3)}). This keeps the scores in
        a comfortable range so that softmax does not become “winner takes all”. The demo further down this page shows
        why it matters.
      </>
    );
    body = (
      <>
        <EqRow>
          <Matrix title="Scores S" data={r.scores} rowLabels={TOK} colLabels={TOK} cellHi={sel} onCell={pick} cell={56} />
          <Op>÷</Op>
          <div className="mx-op" style={{ fontSize: 18, paddingTop: 20 }}>
            <Tex>{String.raw`\sqrt{3}`}</Tex>
          </div>
          <Op>=</Op>
          <Matrix
            title="Scaled scores"
            data={r.scaled}
            rowLabels={TOK}
            colLabels={TOK}
            cellHi={sel}
            onCell={pick}
            cell={56}
            range={Math.max(...r.scores.flat().map(Math.abs))}
          />
        </EqRow>
        <div className="readout">
          <span className="readout-title">
            {TOK[i]} → {TOK[j]}:
          </span>
          <span className="mono">
            {fmt(r.scores[i][j])} ÷ {fmt(Math.sqrt(3), 3)} = <b>{fmt(r.scaled[i][j])}</b>
          </span>
        </div>
      </>
    );
  } else if (step === 4) {
    const row = r.scaled[i];
    const ex = row.map((v) => Math.exp(v));
    const sum = ex.reduce((a, b) => a + b, 0);
    text = (
      <>
        Each <b>row</b> of scaled scores goes through softmax, turning it into percentages that sum to 100%. These are
        the <b>attention weights</b>: row “{TOK[i]}” says how {TOK[i]} splits its attention across the sentence.
        Hover a row to see its softmax worked out.
      </>
    );
    body = (
      <>
        <EqRow>
          <Matrix title="Scaled scores" data={r.scaled} rowLabels={TOK} colLabels={TOK} rowHi={i} onCell={pick} cell={56} />
          <Op>→</Op>
          <Matrix
            title="Attention weights A"
            data={r.weights}
            rowLabels={TOK}
            colLabels={TOK}
            rowHi={i}
            onCell={pick}
            scale="seq"
            range={1}
            cell={56}
          />
          <div style={{ alignSelf: 'flex-end' }}>
            <ScaleLegend kind="seq" left="0" right="1" />
          </div>
        </EqRow>
        <div className="readout">
          <span className="readout-title">Row “{TOK[i]}”:</span>
          <span className="mono">
            e^[{row.map((v) => fmt(v)).join(', ')}] = [{ex.map((v) => fmt(v)).join(', ')}], total {fmt(sum)}
          </span>
          <div>
            Divide each by the total →{' '}
            {r.weights[i].map((w, t) => (
              <span key={t} className="mono">
                {t > 0 && ' · '}
                {TOK[t]} <b>{pct(w)}</b>
              </span>
            ))}
          </div>
        </div>
      </>
    );
  } else if (step === 5) {
    const terms = r.weights[i].map((a, t) => `${fmt(a)}×${fmt(r.V[t][j])}`).join(' + ');
    text = (
      <>
        Finally each token builds its new vector as a <b>weighted average of everyone's Value vectors</b>, using its
        attention weights as the recipe. In matrix form: <Tex>{String.raw`Z = AV`}</Tex>. Row “{TOK[i]}” of the
        output is mostly made of whichever tokens it attended to.
      </>
    );
    body = (
      <>
        <EqRow>
          <Matrix title="Attention weights A" data={r.weights} rowLabels={TOK} colLabels={TOK} rowHi={i} scale="seq" range={1} cell={56} />
          <Op>×</Op>
          <Matrix title="V" accent={VC} data={r.V} rowLabels={TOK} colLabels={cols.V} colHi={j} />
          <Op>=</Op>
          <Matrix title="Output Z" data={r.out} rowLabels={TOK} colLabels={cols.V} cellHi={sel} onCell={pick} />
        </EqRow>
        <div className="readout">
          <span className="readout-title">
            Z[{TOK[i]}, {cols.V[j]}]
          </span>
          ={' '}
          {TOK.map((t, n) => (
            <span key={t}>
              {n > 0 && ' + '}
              {pct(r.weights[i][n])} of {t}
            </span>
          ))}{' '}
          = <span className="mono">{terms} = <b>{fmt(r.out[i][j])}</b></span>
        </div>
      </>
    );
  } else {
    text = hand ? (
      <>
        Each token started as a vector that knew only about itself. It now holds a blend of the tokens that matter to
        it. Look at the pattern: <b>chased</b> put {pct(r.weights[2][1])} on <b>cat</b> and {pct(r.weights[2][3])} on{' '}
        <b>mice</b> (a verb finding its nouns), <b>The</b> put {pct(r.weights[0][1])} on <b>cat</b> (an article
        finding its noun), and <b>cat</b> put {pct(r.weights[1][2])} on <b>chased</b> (a noun finding its verb).
        Nobody wrote rules for this. It fell out of three matrix multiplications and a softmax.
      </>
    ) : (
      <>
        With random weights the same arithmetic runs perfectly, but the pattern is meaningless: “chased” looks mostly
        at “{top(2).tok}” ({pct(top(2).w)}) for no good reason. This is what an untrained model looks like.{' '}
        <b>Training</b> (Chapter 14) is the search for values of <Tex>W_Q</Tex>, <Tex>W_K</Tex> and <Tex>W_V</Tex>{' '}
        that make these patterns useful.
      </>
    );
    body = (
      <div className="split">
        <div>
          <Matrix title="Attention weights A" data={r.weights} rowLabels={TOK} colLabels={TOK} rowHi={i} onCell={pick} scale="seq" range={1} cell={56} />
          <div style={{ marginTop: 10 }}>
            <ScaleLegend kind="seq" left="0" right="1" />
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 8 }}>
            How “{TOK[i]}” spends its attention (hover a row of the grid):
          </div>
          <Bars items={TOK.map((t, n) => ({ label: t, value: r.weights[i][n] }))} max={1} labelWidth={62} />
        </div>
      </div>
    );
  }

  return (
    <Figure
      title="Self-attention, one step at a time"
      hint="Every number below is computed live"
    >
      <div className="controls" style={{ justifyContent: 'space-between' }}>
        <Seg
          label="Weights"
          value={hand ? 'hand' : 'rand'}
          onChange={(v) => setSeed(v === 'hand' ? 0 : 1)}
          options={[
            { value: 'hand', label: 'Hand-picked weights' },
            { value: 'rand', label: 'Random weights (untrained)' },
          ]}
        />
        {!hand && <Btn onClick={() => setSeed((s) => s + 1)}>Shuffle again</Btn>}
      </div>
      <div className="step-head">
        <span className="step-count">
          Step {step + 1} of {STEPS.length}
        </span>
        <span className="step-title">{STEPS[step].title}</span>
      </div>
      <p className="step-text">{text}</p>
      {body}
      <StepNav steps={STEPS} step={step} onStep={goStep} />
    </Figure>
  );
}

/* ---------- Why divide by sqrt(d_k)? ---------- */

const DKS = [4, 16, 64, 256, 1024];
const NAMES = ['key 1', 'key 2', 'key 3', 'key 4', 'key 5', 'key 6'];

function ScaleDemo() {
  const [idx, setIdx] = useState(2);
  const [seed, setSeed] = useState(3);
  const dk = DKS[idx];

  const raw = useMemo(() => {
    const rng = mulberry32(seed * 101 + dk);
    const q = Array.from({ length: dk }, () => randn(rng));
    return NAMES.map(() => dot(q, Array.from({ length: dk }, () => randn(rng))));
  }, [dk, seed]);

  const unscaled = softmax(raw);
  const scaled = softmax(raw.map((v) => v / Math.sqrt(dk)));
  const peak = Math.max(...unscaled);

  return (
    <Figure
      title="Why divide by √d_k?"
      caption={
        <>
          With vectors of length {dk}, raw scores here range from {fmt(Math.min(...raw), 1)} to{' '}
          {fmt(Math.max(...raw), 1)}. Without scaling, the top key takes <b>{pct(peak)}</b> of the attention.{' '}
          {peak > 0.9
            ? 'Softmax has collapsed onto a single token, and (as Chapter 14 explains) a saturated softmax gives the model almost no signal to learn from.'
            : 'Increase d_k and watch the left chart collapse onto one key while the right chart stays healthy.'}
        </>
      }
    >
      <div className="controls">
        <Slider label="Query / Key length d_k" value={idx} min={0} max={DKS.length - 1} onChange={setIdx} format={(v) => DKS[v]} />
        <Btn onClick={() => setSeed((s) => s + 1)}>New random vectors</Btn>
      </div>
      <div className="split">
        <div>
          <h3 style={{ marginTop: 0 }}>Without scaling</h3>
          <Bars items={NAMES.map((n, k) => ({ label: n, value: unscaled[k] }))} max={1} labelWidth={52} color="var(--s2)" />
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>Divided by √{dk} = {fmt(Math.sqrt(dk), 0)}</h3>
          <Bars items={NAMES.map((n, k) => ({ label: n, value: scaled[k] }))} max={1} labelWidth={52} color="var(--s1)" />
        </div>
      </div>
    </Figure>
  );
}

const CODE = `import numpy as np

def self_attention(X, W_Q, W_K, W_V):
    Q = X @ W_Q                        # queries   (n, d_k)
    K = X @ W_K                        # keys      (n, d_k)
    V = X @ W_V                        # values    (n, d_v)
    scores = Q @ K.T                   # every query · every key   (n, n)
    scores = scores / np.sqrt(K.shape[-1])
    A = softmax(scores, axis=-1)       # each row sums to 1
    return A @ V                       # blend the values          (n, d_v)`;

export default function AttentionMath() {
  return (
    <>
      <h1>Self-attention: the math</h1>
      <p className="lead">
        Time to open the box. This chapter computes self-attention for a four-word sentence, one small step at a
        time, with numbers you can check on a calculator. By the end, the famous formula will be something you have
        already done by hand.
      </p>

      <h2>The formula we are heading for</h2>
      <Tex block>{String.raw`\text{Attention}(Q, K, V) \;=\; \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right) V`}</Tex>
      <p>
        It looks dense, but it is exactly the four-step recipe from the last chapter, written compactly. Read it from
        the inside out:
      </p>
      <ul>
        <li>
          <Tex>{String.raw`QK^{\top}`}</Tex>: dot product of every <Swatch color={QC} />Query with every{' '}
          <Swatch color={KC} />Key → match scores.
        </li>
        <li>
          <Tex>{String.raw`\div \sqrt{d_k}`}</Tex>: shrink the scores to a sensible range.
        </li>
        <li>
          <Tex>{String.raw`\text{softmax}`}</Tex>: turn each row of scores into percentages → attention weights.
        </li>
        <li>
          <Tex>{String.raw`\times\, V`}</Tex>: use the weights to average the <Swatch color={VC} />Values.
        </li>
      </ul>

      <h2>Walk through it</h2>
      <p>
        Use <b>Next</b> to move through the steps. In every step you can hover a number in the result to see exactly
        which numbers produced it.
      </p>

      <Walkthrough />

      <Callout kind="idea">
        Self-attention is: <strong>three matrix multiplications</strong> to make Q, K and V,{' '}
        <strong>one more</strong> to score all pairs, a <strong>softmax</strong>, and a{' '}
        <strong>final multiplication</strong> to blend. There is no other magic. The intelligence lives in the
        learned numbers inside <Tex>W_Q</Tex>, <Tex>W_K</Tex> and <Tex>W_V</Tex>.
      </Callout>

      <h2>A closer look at the scaling step</h2>
      <p>
        Why the odd-looking <Tex>{String.raw`\sqrt{d_k}`}</Tex>? A dot product adds up <Tex>d_k</Tex> separate
        products. The longer the vectors, the more terms are added, and the larger the totals tend to get: their
        typical size grows like <Tex>{String.raw`\sqrt{d_k}`}</Tex>. You saw in Chapter 4 what softmax does with
        large scores: it gives everything to the winner. Dividing by <Tex>{String.raw`\sqrt{d_k}`}</Tex> cancels
        that growth exactly.
      </p>

      <ScaleDemo />

      <h2>The same thing in code</h2>
      <p>If you read Python, here is the entire mechanism. Each line is one of the steps above.</p>
      <pre className="sample" style={{ padding: '14px 16px', lineHeight: 1.55 }}>{CODE}</pre>

      <h2>Four things worth noticing</h2>
      <div className="cards is-4">
        <div className="card">
          <h4>Everything happens at once</h4>
          <p>All tokens compute their attention in parallel, as one batch of matrix operations. That is why Transformers train so fast on GPUs.</p>
        </div>
        <div className="card">
          <h4>Distance is free</h4>
          <p>Token 1 and token 1,000 are connected by a single dot product. Nothing has to be carried along a chain.</p>
        </div>
        <div className="card">
          <h4>Weights are fixed, attention is not</h4>
          <p>After training, the W matrices never change. But the attention pattern is recomputed for every new sentence, because it depends on X.</p>
        </div>
        <div className="card">
          <h4>The cost is n²</h4>
          <p>Every token is scored against every token. Double the length of the text and attention does four times the work.</p>
        </div>
      </div>

      <Callout kind="note" title="Did you notice order never appeared?">
        Nothing in these steps depends on where a token sits in the sentence. Shuffle the rows of <Tex>X</Tex> and
        each token gets exactly the same output as before. That is why the position signal from Chapter 5 has to be
        mixed into <Tex>X</Tex> before attention runs. In our toy example, it is the fourth column.
      </Callout>
    </>
  );
}
