import { useState } from 'react';
import { Bars, Btn, Callout, Figure, Slider, Tex } from '../components/ui.jsx';
import { EqRow, Matrix, Op } from '../components/Matrix.jsx';
import { fmt, mean, std } from '../lib/math.js';

function ResidualDiagram() {
  return (
    <svg viewBox="0 0 600 130" style={{ width: '100%', maxWidth: 620, display: 'block' }} role="img"
      aria-label="Diagram: the input x goes into the attention sublayer and also skips around it. The two are added together.">
      <defs>
        <marker id="rd-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)" />
        </marker>
      </defs>
      <text x="20" y="89" className="svg-text" style={{ fontWeight: 700 }}>x</text>
      <line x1="36" y1="84" x2="176" y2="84" stroke="var(--ink-2)" strokeWidth="1.5" markerEnd="url(#rd-ah)" />
      <rect x="180" y="62" width="170" height="44" rx="8" fill="var(--surface)" stroke="var(--s1)" strokeWidth="2" />
      <text x="265" y="89" textAnchor="middle" className="svg-text">Attention (or FFN)</text>
      <line x1="350" y1="84" x2="436" y2="84" stroke="var(--ink-2)" strokeWidth="1.5" markerEnd="url(#rd-ah)" />
      <circle cx="452" cy="84" r="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
      <text x="452" y="90" textAnchor="middle" className="svg-text" style={{ fontSize: 18 }}>+</text>
      <line x1="466" y1="84" x2="556" y2="84" stroke="var(--ink-2)" strokeWidth="1.5" markerEnd="url(#rd-ah)" />
      <text x="511" y="74" textAnchor="middle" className="svg-muted">x + update</text>
      <path d="M90,84 L90,26 L452,26 L452,66" fill="none" stroke="var(--s2)" strokeWidth="2.5" markerEnd="url(#rd-ah)" />
      <text x="270" y="18" textAnchor="middle" className="svg-muted">skip connection: x travels around, untouched</text>
      <text x="393" y="102" textAnchor="middle" className="svg-muted">update</text>
    </svg>
  );
}

const XV = [0.0, 1.0, 0.1, 0.6];
const DV = [0.55, -0.1, 0.05, 0.2];
const COLS = ['d1', 'd2', 'd3', 'd4'];

function DepthFigure() {
  const [layers, setLayers] = useState(24);
  const keep = 0.88;
  const without = Math.pow(keep, layers);
  return (
    <Figure
      title="Why the shortcut matters in deep stacks (a cartoon)"
      caption={
        <>
          Suppose each layer, with no shortcut, passes on 88% of the signal it receives. After {layers}{' '}
          layers only <b>{(without * 100).toFixed(without < 0.01 ? 2 : 0)}%</b> of the original is left. With a skip
          connection the original always has a direct path to the top. The same is true in reverse for the learning
          signal that flows back down during training. This is a simplified illustration, not a measurement.
        </>
      }
    >
      <div className="controls">
        <Slider label="Number of layers" value={layers} min={1} max={96} onChange={setLayers} />
      </div>
      <Bars
        items={[
          { label: 'No shortcut', value: without, color: 'var(--s2)' },
          { label: 'With shortcut', value: 1, color: 'var(--s1)' },
        ]}
        max={1}
        labelWidth={104}
      />
    </Figure>
  );
}

function barPath(x, w, y0, y1, r = 4) {
  // Rounded at the data end (y1), square at the baseline (y0).
  const up = y1 < y0;
  const rr = Math.min(r, Math.abs(y1 - y0));
  const e = up ? y1 + rr : y1 - rr;
  return `M${x},${y0} L${x},${e} Q${x},${y1} ${x + rr},${y1} L${x + w - rr},${y1} Q${x + w},${y1} ${x + w},${e} L${x + w},${y0} Z`;
}

function SignedBars({ values, range, label }) {
  const W = 300;
  const H = 170;
  const mid = H / 2;
  const span = H / 2 - 22;
  const slot = (W - 20) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 320, display: 'block' }} role="img" aria-label={label}>
      <line x1="6" x2={W - 6} y1={mid} y2={mid} className="plot-axis" />
      {values.map((v, i) => {
        const x = 10 + i * slot + (slot - 22) / 2;
        const y1 = mid - (Math.max(-range, Math.min(range, v)) / range) * span;
        return (
          <g key={i}>
            {Math.abs(y1 - mid) > 0.5 && <path d={barPath(x, 22, mid, y1)} fill="var(--s1)" />}
            <text x={x + 11} y={v >= 0 ? y1 - 6 : y1 + 14} textAnchor="middle" className="plot-tick" style={{ fill: 'var(--ink)' }}>
              {fmt(v, Math.abs(v) >= 100 ? 0 : 1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const START = [2.0, -1.0, 0.5, 4.0, -3.0, 1.5];

function LayerNormFigure() {
  const [v, setV] = useState(START);
  const mu = mean(v);
  const sd = std(v);
  const out = v.map((x) => (sd > 1e-9 ? (x - mu) / sd : 0));
  const range = Math.max(4, ...v.map(Math.abs));

  return (
    <Figure
      title="Layer normalisation, live"
      caption="Try “× 10” and “+ 5”. The input changes wildly, but the normalised output does not move at all. LayerNorm removes the overall size and offset of a vector and keeps only its pattern, which is what keeps numbers stable across dozens of layers."
    >
      <div className="controls" style={{ gap: 8 }}>
        <Btn onClick={() => setV(v.map((x) => x * 10))} disabled={range > 5000}>× 10 everything</Btn>
        <Btn onClick={() => setV(v.map((x) => x + 5))}>+ 5 everything</Btn>
        <Btn onClick={() => setV(START)}>Reset</Btn>
      </div>
      <div className="split">
        <div>
          <h3 style={{ marginTop: 0 }}>Before: one token's vector</h3>
          <SignedBars values={v} range={range} label="Values before normalisation" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, maxWidth: 320 }}>
            {v.map((x, i) => (
              <input
                key={i}
                type="range"
                min={-5}
                max={5}
                step={0.5}
                value={Math.max(-5, Math.min(5, x))}
                aria-label={`Value ${i + 1}`}
                onChange={(e) => setV(v.map((y, n) => (n === i ? Number(e.target.value) : y)))}
              />
            ))}
          </div>
          <dl className="kv" style={{ marginTop: 10 }}>
            <dt>Mean μ</dt>
            <dd>{fmt(mu)}</dd>
            <dt>Standard deviation σ</dt>
            <dd>{fmt(sd)}</dd>
          </dl>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>After: (value − μ) ÷ σ</h3>
          <SignedBars values={out} range={2.6} label="Values after normalisation" />
          <dl className="kv" style={{ marginTop: 38 }}>
            <dt>Mean</dt>
            <dd>{fmt(mean(out))}</dd>
            <dt>Standard deviation</dt>
            <dd>{fmt(std(out))}</dd>
          </dl>
        </div>
      </div>
    </Figure>
  );
}

export default function AddNorm() {
  const sum = XV.map((x, i) => x + DV[i]);
  return (
    <>
      <h1>Residuals &amp; layer normalisation</h1>
      <p className="lead">
        Attention is the star, but a Transformer stacks dozens of layers, and deep stacks are fragile: information
        gets lost and numbers drift out of control. Two small pieces of plumbing, usually drawn together as{' '}
        <strong>“Add &amp; Norm”</strong>, keep everything stable.
      </p>

      <h2>Add: the residual connection</h2>
      <p>
        Instead of <em>replacing</em> a token's vector with the output of attention, the model <em>adds</em> the
        output to what was already there:
      </p>
      <Tex block>{String.raw`\text{output} \;=\; x \;+\; \text{Sublayer}(x)`}</Tex>

      <Figure title="A shortcut around every sublayer">
        <ResidualDiagram />
      </Figure>

      <Figure
        title="In numbers"
        caption="The output is still recognisably x. Attention did not rewrite the token: it wrote a small correction on top. Every sublayer in the model works this way."
      >
        <EqRow>
          <Matrix title="x  (“chased” going in)" data={[XV]} colLabels={COLS} shape={false} range={1.2} />
          <Op>+</Op>
          <Matrix title="update from attention" data={[DV]} colLabels={COLS} shape={false} range={1.2} />
          <Op>=</Op>
          <Matrix title="output" data={[sum]} colLabels={COLS} shape={false} range={1.2} />
        </EqRow>
      </Figure>

      <Callout kind="analogy" title="Analogy: editing a shared document">
        Picture each token's vector as a document passed down a line of editors (the layers). Without residuals,
        every editor would retype the whole document from memory. With residuals, each editor just adds comments and
        corrections. Nothing is lost, and each editor only needs to contribute what is new.
      </Callout>

      <p>This simple idea has two large benefits:</p>
      <ul>
        <li>
          <strong>Information is preserved.</strong> The original token identity and position travel all the way up
          the stack, even through layers that have nothing to add.
        </li>
        <li>
          <strong>Deep models become trainable.</strong> During training, the correction signal has to travel from
          the output back to the earliest layers. The skip connections give it a direct path.
        </li>
      </ul>

      <DepthFigure />

      <Callout kind="note" title="The “residual stream”">
        A helpful mental picture: each token has a running vector flowing straight up through the model. Every
        attention and feed-forward sublayer <em>reads</em> from that stream and <em>adds</em> its result back in.
        That is why every layer must keep the same vector size <Tex>{String.raw`d_{\text{model}}`}</Tex>.
      </Callout>

      <h2>Norm: layer normalisation</h2>
      <p>
        After many additions and multiplications, the numbers in a vector can grow huge or shrink to nearly nothing,
        and the next layer would struggle with either. <strong>Layer normalisation</strong> rescales each token's
        vector, on its own, so that its numbers have mean 0 and standard deviation 1:
      </p>
      <Tex block>{String.raw`\text{LayerNorm}(x) \;=\; \gamma \odot \frac{x - \mu}{\sigma} \;+\; \beta
        \qquad \mu = \frac{1}{d}\sum_i x_i, \quad \sigma = \sqrt{\frac{1}{d}\sum_i (x_i - \mu)^2}`}</Tex>
      <p>
        In words: subtract the average, divide by the spread. The two extra vectors{' '}
        <Tex>{String.raw`\gamma`}</Tex> (scale) and <Tex>{String.raw`\beta`}</Tex> (shift) are learned, letting the
        model stretch or move the result if that turns out to be useful. They start at 1 and 0, where they change
        nothing.
      </p>

      <LayerNormFigure />

      <h2>Putting them together</h2>
      <p>Each sublayer (attention, and the feed-forward network in the next chapter) is wrapped in both:</p>
      <div className="cards">
        <div className="card">
          <h4>Post-norm (original 2017 paper)</h4>
          <Tex block>{String.raw`x \leftarrow \text{LayerNorm}\big(x + \text{Sublayer}(x)\big)`}</Tex>
          <p>Add first, then normalise. This is the “Add &amp; Norm” box in the famous diagram.</p>
        </div>
        <div className="card">
          <h4>Pre-norm (most modern models)</h4>
          <Tex block>{String.raw`x \leftarrow x + \text{Sublayer}\big(\text{LayerNorm}(x)\big)`}</Tex>
          <p>Normalise the input of the sublayer, then add. The stream itself is never squashed, which trains more reliably in very deep models.</p>
        </div>
      </div>
    </>
  );
}
