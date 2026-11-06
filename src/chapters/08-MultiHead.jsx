import { useState } from 'react';
import { Callout, Figure, ScaleLegend, Slider, Tex } from '../components/ui.jsx';
import { seqColor } from '../lib/colors.js';
import { pct } from '../lib/math.js';
import { useTheme } from '../lib/theme.jsx';
import { HEADS, tokensFor } from '../data/sentence.js';

const TOKENS = tokensFor('tired');
const N = TOKENS.length;

function Thumb({ weights, size = 12 }) {
  const { dark } = useTheme();
  return (
    <svg viewBox={`0 0 ${N * size} ${N * size}`} width={N * size} height={N * size} aria-hidden="true">
      {weights.map((row, i) =>
        row.map((v, j) => (
          <rect key={`${i}-${j}`} x={j * size} y={i * size} width={size - 1} height={size - 1} rx="1.5" fill={seqColor(v, dark).bg} />
        ))
      )}
    </svg>
  );
}

function BigHeat({ weights, hover, setHover }) {
  const { dark } = useTheme();
  const cell = 30;
  const left = 70;
  const top = 70;
  return (
    <svg
      viewBox={`0 0 ${left + N * cell + 34} ${top + N * cell + 4}`}
      style={{ width: '100%', maxWidth: 460, display: 'block' }}
      onMouseLeave={() => setHover(null)}
      role="img"
      aria-label="Attention weights heatmap. Rows are the token looking, columns the token being looked at."
    >
      {TOKENS.map((t, j) => (
        <text
          key={`c${j}`}
          transform={`translate(${left + j * cell + cell / 2 + 4}, ${top - 8}) rotate(-50)`}
          className="plot-tick"
          style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: hover && hover[1] === j ? 700 : 400, fill: hover && hover[1] === j ? 'var(--ink)' : undefined }}
        >
          {t}
        </text>
      ))}
      {TOKENS.map((t, i) => (
        <text
          key={`r${i}`}
          x={left - 8}
          y={top + i * cell + cell / 2 + 4}
          textAnchor="end"
          className="plot-tick"
          style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: hover && hover[0] === i ? 700 : 400, fill: hover && hover[0] === i ? 'var(--ink)' : undefined }}
        >
          {t}
        </text>
      ))}
      {weights.map((row, i) =>
        row.map((v, j) => (
          <rect
            key={`${i}-${j}`}
            x={left + j * cell}
            y={top + i * cell}
            width={cell - 2}
            height={cell - 2}
            rx="3"
            fill={seqColor(v, dark).bg}
            stroke={hover && hover[0] === i && hover[1] === j ? 'var(--ink)' : 'none'}
            strokeWidth="2"
            onMouseEnter={() => setHover([i, j])}
          />
        ))
      )}
    </svg>
  );
}

function HeadsFigure() {
  const [h, setH] = useState(1);
  const [hover, setHover] = useState(null);
  const head = HEADS[h];
  return (
    <Figure
      title="Four heads reading the same sentence"
      hint="Pick a head · hover the grid"
      caption={
        <>
          <b>Head {h + 1}: {head.name}.</b> {head.blurb}{' '}
          <span className="muted">(Hand-written illustrative patterns. Real heads are learned and are often messier, but specialised heads like these really are found in trained models.)</span>
        </>
      }
    >
      <div className="controls" style={{ gap: 10 }}>
        {HEADS.map((hd, k) => (
          <button
            key={hd.name}
            type="button"
            className={`pipe-stage${k === h ? ' is-on' : ''}`}
            style={{ flex: '0 0 auto', padding: '8px 10px' }}
            onClick={() => setH(k)}
            aria-pressed={k === h}
          >
            <b>Head {k + 1}</b>
            <div style={{ margin: '4px 0 2px', background: 'var(--surface)', borderRadius: 4, padding: 3, lineHeight: 0 }}>
              <Thumb weights={hd.weights} />
            </div>
            {hd.name}
          </button>
        ))}
      </div>
      <div className="split is-wide-left">
        <BigHeat weights={head.weights} hover={hover} setHover={setHover} />
        <div>
          <ScaleLegend kind="seq" left="0%" right="100%" />
          <div className="readout">
            {hover ? (
              <>
                In this head, <b>“{TOKENS[hover[0]]}”</b> gives <b>{pct(head.weights[hover[0]][hover[1]])}</b> of its
                attention to <b>“{TOKENS[hover[1]]}”</b>.
              </>
            ) : (
              <>Each row is one token deciding where to look. Dark cells are where its attention goes. Hover a cell.</>
            )}
          </div>
          <p className="small muted">
            Rows: the token that is looking. Columns: the token being looked at. Every row sums to 100%.
          </p>
        </div>
      </div>
    </Figure>
  );
}

const DMS = [64, 128, 256, 512, 1024];
const HS = [1, 2, 4, 8, 16];

function SplitFigure() {
  const [di, setDi] = useState(3);
  const [hi, setHi] = useState(3);
  const d = DMS[di];
  const h = HS[hi];
  const dk = d / h;
  const params = 4 * d * d;
  return (
    <Figure
      title="How the vector is shared between heads"
      caption={
        <>
          Each head works with smaller Query, Key and Value vectors of size <b>d_k = {d} ÷ {h} = {dk}</b>. Gluing the{' '}
          {h} head output{h > 1 ? 's' : ''} side by side gives back a vector of size {h} × {dk} = {d}. The total
          number of weights stays at 4 × {d}² = <b>{params.toLocaleString()}</b> no matter how many heads you choose:
          more heads means more viewpoints, each a little narrower, for the same cost.
        </>
      }
    >
      <div className="controls">
        <Slider label="Model width d_model" value={di} min={0} max={DMS.length - 1} onChange={setDi} format={(v) => DMS[v]} />
        <Slider label="Number of heads h" value={hi} min={0} max={HS.length - 1} onChange={setHi} format={(v) => HS[v]} />
      </div>
      <div className="arch" style={{ flexDirection: 'column', gap: 0, alignItems: 'stretch', maxWidth: 640 }}>
        <div className="arch-box k-io">
          Input X<small>n tokens × {d} numbers each</small>
        </div>
        <div className="arch-arrow">↓ the same X goes to every head</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: h }, (_, k) => (
            <div key={k} className="arch-box k-attn" style={{ padding: '10px 2px', minWidth: 0, flex: 1, fontSize: 12 }}>
              {h <= 8 ? `Head ${k + 1}` : k + 1}
              {h <= 4 && <small>own W_Q, W_K, W_V · output n × {dk}</small>}
            </div>
          ))}
        </div>
        <div className="arch-arrow">↓ concatenate (glue side by side)</div>
        <div className="arch-box">
          Concatenated<small>n × ({h} × {dk}) = n × {d}</small>
        </div>
        <div className="arch-arrow">↓ multiply by W_O to mix the heads together</div>
        <div className="arch-box k-io">
          Output<small>n tokens × {d} numbers each (same shape as the input)</small>
        </div>
      </div>
    </Figure>
  );
}

export default function MultiHead() {
  return (
    <>
      <h1>Multi-head attention</h1>
      <p className="lead">
        One round of attention gives each word one way of looking at the sentence. But a word usually needs several
        things at once: its grammar partner, the thing it refers to, its neighbours. The fix is simple: run several
        attentions side by side. Each one is called a <strong>head</strong>.
      </p>

      <h2>Why one head is not enough</h2>
      <p>
        In the last chapter each token got a single row of attention weights, and that row must sum to 100%. If
        “it” spends most of its budget finding “animal”, it has little left to notice “was” or “tired”. A single
        softmax forces a single focus.
      </p>
      <p>
        With several heads, each head has <strong>its own</strong> <Tex>W_Q</Tex>, <Tex>W_K</Tex> and <Tex>W_V</Tex>,
        so each one asks a different kind of question and has its own 100% to spend.
      </p>

      <HeadsFigure />

      <Callout kind="analogy" title="Analogy: a team of readers">
        Imagine giving the same sentence to four editors. One checks grammar, one tracks who “it” and “they” refer
        to, one looks at word order, one looks at descriptions. Each writes notes. Then you staple all the notes
        together. Multi-head attention is that team, and the stapled notes are the output.
      </Callout>

      <h2>The mechanics</h2>
      <p>Nothing new is needed. Multi-head attention is the previous chapter, repeated and glued together:</p>
      <ol>
        <li>
          Give every head its own three weight matrices. Run ordinary attention in each head, in parallel.
        </li>
        <li>
          <strong>Concatenate</strong>: place the heads' output vectors side by side to make one long vector per
          token.
        </li>
        <li>
          Multiply by one more learned matrix, <Tex>W_O</Tex>, which mixes the heads' findings together.
        </li>
      </ol>
      <Tex block>{String.raw`\text{head}_i = \text{Attention}\big(XW_Q^{(i)},\; XW_K^{(i)},\; XW_V^{(i)}\big)`}</Tex>
      <Tex block>{String.raw`\text{MultiHead}(X) = \text{Concat}\big(\text{head}_1, \dots, \text{head}_h\big)\, W_O`}</Tex>

      <p>
        To keep the cost the same as one big head, each head gets a smaller slice of the vector:{' '}
        <Tex>{String.raw`d_k = d_{\text{model}} / h`}</Tex>. The original Transformer used{' '}
        <Tex>{String.raw`d_{\text{model}} = 512`}</Tex> with <Tex>h = 8</Tex> heads of size 64.
      </p>

      <SplitFigure />

      <Callout kind="idea">
        The output of multi-head attention has <strong>exactly the same shape as its input</strong>: one vector of
        size <Tex>{String.raw`d_{\text{model}}`}</Tex> per token. That is what makes Transformer layers stackable:
        the output of one layer can be fed straight into the next.
      </Callout>

      <Callout kind="note" title="Nobody assigns the jobs">
        We never tell head 2 to track pronouns. All heads start with random weights. Because they start out
        different, training pushes them toward different, complementary specialities. Researchers who inspect
        trained models do find heads for syntax, for coreference, for “the previous token” and many that are harder
        to name.
      </Callout>
    </>
  );
}
