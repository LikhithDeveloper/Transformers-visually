import { useRef, useState } from 'react';
import { Btn, Callout, Figure, Slider, Swatch, Tex } from '../components/ui.jsx';
import { EqRow, Matrix, Op } from '../components/Matrix.jsx';
import { fmt, matmul, pct, softmax } from '../lib/math.js';

/* ---------- Dot product playground ---------- */

const SIZE = 340;
const C = SIZE / 2;
const U = 34; // pixels per unit

function DotPlayground() {
  const [a, setA] = useState([3, 1]);
  const [b, setB] = useState([2, 2.5]);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);

  const move = (e) => {
    if (!drag) return;
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * SIZE;
    const py = ((e.clientY - r.top) / r.height) * SIZE;
    const snap = (v) => Math.max(-4, Math.min(4, Math.round(v * 2) / 2));
    const v = [snap((px - C) / U), snap((C - py) / U)];
    (drag === 'a' ? setA : setB)(v);
  };

  const d = a[0] * b[0] + a[1] * b[1];
  const la = Math.hypot(...a);
  const lb = Math.hypot(...b);
  const cos = la && lb ? d / (la * lb) : 0;
  const angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;

  let verdict;
  if (!la || !lb) verdict = 'One vector has zero length, so the dot product is 0.';
  else if (Math.abs(cos) < 0.12) verdict = 'Nearly perpendicular: the vectors have nothing in common, so the score is close to 0.';
  else if (cos > 0.85) verdict = 'Pointing almost the same way: a large positive score. These two “agree”.';
  else if (cos > 0) verdict = 'Pointing in a broadly similar direction: a positive score.';
  else if (cos < -0.85) verdict = 'Pointing in opposite directions: a large negative score. These two “disagree”.';
  else verdict = 'Pointing in broadly opposite directions: a negative score.';

  const tip = (v) => [C + v[0] * U, C - v[1] * U];
  const [ax, ay] = tip(a);
  const [bx, by] = tip(b);
  const ticks = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <Figure title="Dot product playground" hint="Drag the two arrow tips" caption={verdict}>
      <div className="split">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: '100%', maxWidth: 360, touchAction: 'none', display: 'block' }}
          onPointerMove={move}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          role="img"
          aria-label={`Vector a is ${a.join(', ')}. Vector b is ${b.join(', ')}. Dot product ${fmt(d)}.`}
        >
          <defs>
            <marker id="dp-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--s1)" />
            </marker>
            <marker id="dp-b" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--s2)" />
            </marker>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={C + t * U} x2={C + t * U} y1={C - 4.4 * U} y2={C + 4.4 * U} className="plot-grid" />
              <line y1={C + t * U} y2={C + t * U} x1={C - 4.4 * U} x2={C + 4.4 * U} className="plot-grid" />
            </g>
          ))}
          <line x1={C - 4.6 * U} x2={C + 4.6 * U} y1={C} y2={C} className="plot-axis" />
          <line y1={C - 4.6 * U} y2={C + 4.6 * U} x1={C} x2={C} className="plot-axis" />
          {[-4, -2, 2, 4].map((t) => (
            <g key={`l${t}`}>
              <text x={C + t * U} y={C + 14} textAnchor="middle" className="plot-tick">{t}</text>
              <text x={C - 7} y={C - t * U + 4} textAnchor="end" className="plot-tick">{t}</text>
            </g>
          ))}
          <line x1={C} y1={C} x2={ax} y2={ay} stroke="var(--s1)" strokeWidth="3" markerEnd="url(#dp-a)" />
          <line x1={C} y1={C} x2={bx} y2={by} stroke="var(--s2)" strokeWidth="3" markerEnd="url(#dp-b)" />
          {[
            ['a', ax, ay, 'var(--s1)'],
            ['b', bx, by, 'var(--s2)'],
          ].map(([k, x, y, col]) => (
            <g key={k} onPointerDown={() => setDrag(k)} style={{ cursor: 'grab' }}>
              <circle cx={x} cy={y} r="18" fill="transparent" />
              <circle cx={x} cy={y} r="8" fill={col} className="plot-dot" />
              <text x={x + 12} y={y - 10} className="svg-text" style={{ fontWeight: 700 }}>{k}</text>
            </g>
          ))}
        </svg>

        <div>
          <div className="legend">
            <span><Swatch color="var(--s1)" />a = [{a.join(', ')}]</span>
            <span><Swatch color="var(--s2)" />b = [{b.join(', ')}]</span>
          </div>
          <p className="small" style={{ marginBottom: 4 }}>Multiply matching positions, then add:</p>
          <div className="sample" style={{ whiteSpace: 'pre-wrap' }}>
            a · b = ({a[0]} × {b[0]}) + ({a[1]} × {b[1]}){'\n'}
            {'      '}= {fmt(a[0] * b[0], 2)} + {fmt(a[1] * b[1], 2)}{'\n'}
            {'      '}= <b>{fmt(d, 2)}</b>
          </div>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Angle between them</dt>
            <dd>{la && lb ? `${angle.toFixed(0)}°` : 'n/a'}</dd>
            <dt>Length of a, b</dt>
            <dd>{fmt(la)}, {fmt(lb)}</dd>
          </dl>
          <div className="controls is-bottom" style={{ gap: 8 }}>
            <Btn onClick={() => { setA([3, 1]); setB([3, 1]); }}>Same direction</Btn>
            <Btn onClick={() => { setA([3, 1]); setB([-1, 3]); }}>Perpendicular</Btn>
            <Btn onClick={() => { setA([3, 1]); setB([-3, -1]); }}>Opposite</Btn>
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ---------- Matrix multiplication ---------- */

const MA = [
  [1, 2, 0],
  [0, 1, 3],
];
const MB = [
  [2, 1],
  [1, 0],
  [0, 2],
];
const MC = matmul(MA, MB);

function MatmulFigure() {
  const [sel, setSel] = useState([0, 0]);
  const [i, j] = sel;
  const terms = MA[i].map((v, k) => `${v}×${MB[k][j]}`).join(' + ');
  return (
    <Figure
      title="Matrix multiplication = many dot products at once"
      hint="Hover a cell of the result"
      caption="Shape rule: (2 rows × 3 columns) times (3 rows × 2 columns) gives (2 rows × 2 columns). The inner numbers must match, and the outer numbers give the result's shape."
    >
      <EqRow>
        <Matrix title="A" data={MA} digits={0} scale="none" rowHi={i} cell={44} />
        <Op>×</Op>
        <Matrix title="B" data={MB} digits={0} scale="none" colHi={j} cell={44} />
        <Op>=</Op>
        <Matrix title="C" data={MC} digits={0} scale="none" cellHi={sel} onCell={(r, c) => setSel([r, c])} cell={44} />
      </EqRow>
      <div className="readout">
        <span className="readout-title">C[row {i + 1}, column {j + 1}]</span>= (row {i + 1} of A) · (column {j + 1} of B) ={' '}
        <span className="mono">{terms} = <b>{MC[i][j]}</b></span>
      </div>
    </Figure>
  );
}

/* ---------- Softmax playground ---------- */

const WORDS = ['mat', 'floor', 'sofa', 'moon'];

function SoftmaxPlayground() {
  const [scores, setScores] = useState([2.0, 1.0, 0.5, -1.0]);
  const [k, setK] = useState(1);
  const z = scores.map((s) => s * k);
  const ex = z.map((v) => Math.exp(v));
  const sum = ex.reduce((p, c) => p + c, 0);
  const probs = softmax(z);

  return (
    <Figure
      title="Softmax playground"
      hint="Drag the scores"
      caption={
        k >= 2.5
          ? 'With large scores, softmax becomes “winner takes all”: the top score grabs nearly everything. Remember this. It is the reason attention divides its scores by a constant.'
          : k <= 0.4
            ? 'With small scores, the differences wash out and softmax spreads the probability almost evenly.'
            : 'Softmax keeps the order of the scores but exaggerates the gaps: a score that is a bit higher gets a lot more probability.'
      }
    >
      <div className="controls">
        <Slider label="Multiply all scores by" value={k} min={0.1} max={4} step={0.1} onChange={setK} format={(v) => `× ${v.toFixed(1)}`} />
        <Btn onClick={() => { setScores([2.0, 1.0, 0.5, -1.0]); setK(1); }}>Reset</Btn>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Option</th>
            <th style={{ width: 170 }}>Score z</th>
            <th className="num">e<sup>z</sup></th>
            <th style={{ width: '38%', paddingLeft: 16 }}>Probability = e<sup>z</sup> ÷ total</th>
          </tr>
        </thead>
        <tbody>
          {WORDS.map((w, i) => (
            <tr key={w}>
              <td className="mono">{w}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={scores[i]}
                    aria-label={`Score for ${w}`}
                    onChange={(e) => setScores(scores.map((s, n) => (n === i ? Number(e.target.value) : s)))}
                  />
                  <span className="mono" style={{ width: 44, textAlign: 'right' }}>{fmt(z[i], 1)}</span>
                </div>
              </td>
              <td className="num">{fmt(ex[i], 2)}</td>
              <td style={{ paddingLeft: 16 }}>
                <div className="bar-row">
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `calc((100% - 58px) * ${probs[i].toFixed(4)})`, background: 'var(--s1)' }} />
                    <div className="bar-value">{pct(probs[i], 1)}</div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="muted">Total</td>
            <td className="num">{fmt(sum, 2)}</td>
            <td style={{ paddingLeft: 16 }} className="mono">100.0%</td>
          </tr>
        </tbody>
      </table>
    </Figure>
  );
}

export default function Toolkit() {
  return (
    <>
      <h1>Math toolkit: dot product &amp; softmax</h1>
      <p className="lead">
        Self-attention is built from just two small operations. The <strong>dot product</strong> measures how well two
        vectors match. <strong>Softmax</strong> turns a list of scores into percentages. Learn these two and the
        attention formula will read like plain English.
      </p>

      <h2>Tool 1: the dot product, a “how similar?” meter</h2>
      <p>
        Take two vectors of the same length. Multiply the first numbers together, multiply the second numbers
        together, and so on, then add everything up. The single number you get is the <strong>dot product</strong>.
      </p>
      <Tex block>{String.raw`a \cdot b \;=\; a_1 b_1 + a_2 b_2 + \dots + a_d b_d \;=\; \sum_{i=1}^{d} a_i b_i`}</Tex>
      <p>
        What does that number tell you? Drag the arrows and watch. When the vectors point the same way the result is
        big and positive. When they are at right angles it is zero. When they point in opposite directions it is
        negative.
      </p>

      <DotPlayground />

      <Callout kind="idea">
        The dot product is a <strong>match score</strong>. In attention, one vector will mean “this is what I am
        looking for” and another “this is what I have”. Their dot product says how good the match is.
      </Callout>

      <p className="small muted">
        For the curious, there is a second, equivalent formula:{' '}
        <Tex>{String.raw`a \cdot b = \lVert a \rVert\, \lVert b \rVert \cos\theta`}</Tex>, the two lengths times the
        cosine of the angle between them. That is why direction matters so much.
      </p>

      <h2>Doing many dot products at once: matrices</h2>
      <p>
        A <strong>matrix</strong> is a grid of numbers: a stack of vectors. When you multiply two matrices, every cell
        of the result is one dot product, a row from the left matrix with a column from the right one. It is nothing
        more than a tidy way to compute lots of dot products in one go.
      </p>

      <MatmulFigure />

      <p>
        Multiplying a vector by a matrix is also how neural networks <strong>transform</strong> vectors: the matrix
        re-mixes the input numbers into a new set of numbers. The numbers inside such a matrix are called{' '}
        <strong>weights</strong>, and they are what the model learns.
      </p>

      <h2>Tool 2: softmax, from scores to percentages</h2>
      <p>
        Suppose the model has a raw score for each option: 2.0, 1.0, 0.5, −1.0. Scores can be any size and can be
        negative. We often want <strong>percentages</strong> instead: all positive, adding up to 100%. Softmax does
        that in two steps:
      </p>
      <ol>
        <li>
          Raise <Tex>e</Tex> (about 2.718) to the power of each score. This makes everything positive, and makes big
          scores <em>much</em> bigger than small ones.
        </li>
        <li>Divide each result by the total, so they sum to 1.</li>
      </ol>
      <Tex block>{String.raw`\text{softmax}(z)_i \;=\; \frac{e^{z_i}}{\sum_{j} e^{z_j}}`}</Tex>

      <SoftmaxPlayground />

      <Callout kind="note" title="Try this">
        Slide “multiply all scores by” up to 4. The order of the options never changes, but the winner takes almost
        everything. Slide it down to 0.1 and all options become nearly equal. How large the scores are controls how
        “decisive” softmax is. This will matter twice: once inside attention (Chapter 7) and once when the model picks
        its next word (Chapter 13).
      </Callout>

      <h2>You now have everything you need</h2>
      <ul>
        <li><strong>Vector</strong>: a list of numbers describing something.</li>
        <li><strong>Dot product</strong>: a match score between two vectors.</li>
        <li><strong>Matrix multiplication</strong>: lots of dot products at once, used to transform vectors.</li>
        <li><strong>Softmax</strong>: turns scores into percentages that sum to 100%.</li>
      </ul>
    </>
  );
}
