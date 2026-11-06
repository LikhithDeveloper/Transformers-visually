import { useState } from 'react';
import { Btn, Callout, Figure, ScaleLegend, Seg, Swatch, Tex } from '../components/ui.jsx';
import { Plot, curve } from '../components/Plot.jsx';
import { divColor } from '../lib/colors.js';
import { fmt, gelu, relu } from '../lib/math.js';
import { useTheme } from '../lib/theme.jsx';

// A small fixed network: 3 inputs -> 6 hidden -> 3 outputs.
const W1 = [
  [0.9, -0.4, 0.3],
  [-0.7, 0.8, 0.2],
  [0.2, 0.6, -0.9],
  [-0.5, -0.6, 0.7],
  [0.8, 0.3, 0.5],
  [-0.3, 0.9, -0.4],
];
const B1 = [0.1, -0.2, 0.0, 0.3, -0.5, 0.2];
const W2 = [
  [0.7, -0.3, 0.5, 0.0, 0.6, -0.4],
  [-0.2, 0.8, 0.0, 0.6, -0.5, 0.3],
  [0.4, 0.0, -0.7, 0.5, 0.3, 0.6],
];
const B2 = [0.0, 0.1, -0.1];

const VW = 600;
const VH = 320;
const XS = [80, 300, 520];
const ys = (n) => Array.from({ length: n }, (_, i) => VH / 2 + (i - (n - 1) / 2) * (n > 3 ? 46 : 78));
const Y_IN = ys(3);
const Y_H = ys(6);
const Y_OUT = ys(3);

function useNetwork({ x, act }) {
  const { dark } = useTheme();
  const f = act === 'relu' ? relu : gelu;
  const pre = W1.map((row, i) => row.reduce((s, w, k) => s + w * x[k], 0) + B1[i]);
  const h = pre.map(f);
  const out = W2.map((row, i) => row.reduce((s, w, k) => s + w * h[k], 0) + B2[i]);

  const edge = (x1, y1, x2, y2, w, key, live = true) => (
    <line
      key={key}
      x1={x1 + 19}
      y1={y1}
      x2={x2 - 19}
      y2={y2}
      stroke={w >= 0 ? 'var(--pos)' : 'var(--neg)'}
      strokeWidth={0.6 + Math.abs(w) * 2.2}
      opacity={live ? 0.18 + Math.min(1, Math.abs(w)) * 0.55 : 0.07}
    />
  );

  const node = (cx, cy, v, key, off = false) => {
    const c = divColor(v / 2.2, dark);
    return (
      <g key={key}>
        <circle
          cx={cx}
          cy={cy}
          r="18"
          fill={off ? 'var(--surface-2)' : c.bg}
          stroke={off ? 'var(--axis)' : 'var(--border-strong)'}
          strokeDasharray={off ? '3 3' : undefined}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fill: off ? 'var(--muted)' : c.fg }}>
          {fmt(v, 2)}
        </text>
      </g>
    );
  };

  return {
    pre,
    h,
    out,
    svg: (
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', maxWidth: 640, display: 'block' }} role="img"
        aria-label="Feed-forward network with 3 inputs, 6 hidden units and 3 outputs">
        <text x={XS[0]} y={16} textAnchor="middle" className="svg-muted">input x (3)</text>
        <text x={XS[1]} y={16} textAnchor="middle" className="svg-muted">hidden layer (6), after {act === 'relu' ? 'ReLU' : 'GELU'}</text>
        <text x={XS[2]} y={16} textAnchor="middle" className="svg-muted">output (3)</text>
        {W1.map((row, i) => row.map((w, k) => edge(XS[0], Y_IN[k], XS[1], Y_H[i], w, `a${i}-${k}`)))}
        {W2.map((row, i) => row.map((w, k) => edge(XS[1], Y_H[k], XS[2], Y_OUT[i], w, `b${i}-${k}`, Math.abs(h[k]) > 1e-9)))}
        {x.map((v, k) => node(XS[0], Y_IN[k], v, `i${k}`))}
        {h.map((v, k) => node(XS[1], Y_H[k], v, `h${k}`, Math.abs(v) < 1e-9))}
        {out.map((v, k) => node(XS[2], Y_OUT[k], v, `o${k}`))}
      </svg>
    ),
  };
}

function FFNFigure() {
  const [x, setX] = useState([1.0, -0.5, 0.8]);
  const [act, setAct] = useState('relu');
  const net = useNetwork({ x, act });
  const f = act === 'relu' ? relu : gelu;
  const offCount = net.h.filter((v) => Math.abs(v) < 1e-9).length;

  return (
    <Figure
      title="A feed-forward network you can drive"
      hint="Move the inputs"
      caption={
        act === 'relu'
          ? `Right now ${offCount} of 6 hidden units are switched off (dashed circles): their input was negative, so ReLU output 0 and they send nothing forward. Change the inputs and a different set of units switches on. That switching is what lets the network compute things a single matrix cannot.`
          : 'GELU is a smooth version of ReLU: negative inputs are squashed close to zero instead of being cut off sharply. Most modern Transformers use it.'
      }
    >
      <div className="controls">
        {x.map((v, i) => (
          <label className="slider" key={i} style={{ width: 150 }}>
            <span className="slider-top">
              <span className="slider-label">input x{i + 1}</span>
              <span className="slider-value">{fmt(v, 1)}</span>
            </span>
            <input type="range" min={-2} max={2} step={0.1} value={v} onChange={(e) => setX(x.map((y, n) => (n === i ? Number(e.target.value) : y)))} />
          </label>
        ))}
        <Seg
          label="Activation"
          value={act}
          onChange={setAct}
          options={[
            { value: 'relu', label: 'ReLU' },
            { value: 'gelu', label: 'GELU' },
          ]}
        />
        <Btn onClick={() => setX([1.0, -0.5, 0.8])}>Reset</Btn>
      </div>
      <div className="legend">
        <span><Swatch color="var(--pos)" />positive weight or value</span>
        <span><Swatch color="var(--neg)" />negative weight or value</span>
        <span>thicker line = larger weight</span>
      </div>
      {net.svg}
      <div className="split" style={{ marginTop: 10 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>The activation function</h3>
          <Plot
            w={300}
            h={200}
            x={[-3, 3]}
            y={[-0.6, 3]}
            xTicks={[-3, -2, -1, 0, 1, 2, 3]}
            yTicks={[0, 1, 2, 3]}
            xLabel="value going in"
            label="Activation function curve with the six hidden units marked"
          >
            {({ sx, sy }) => (
              <>
                <path d={curve(f, -3, 3, sx, sy)} className="plot-line" stroke="var(--s1)" />
                {net.pre.map((p, i) => {
                  const cx = Math.max(-3, Math.min(3, p));
                  return <circle key={i} cx={sx(cx)} cy={sy(f(cx))} r="5" fill="var(--s1)" className="plot-dot" />;
                })}
              </>
            )}
          </Plot>
        </div>
        <div>
          <p className="small" style={{ marginTop: 0 }}>
            Each dot is one hidden unit. Its horizontal position is the weighted sum it received (
            <Tex>{String.raw`W_1x + b_1`}</Tex>). Its height is what it passes on.
          </p>
          <ScaleLegend kind="div" left="negative" right="positive" />
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Before activation</dt>
            <dd>[{net.pre.map((v) => fmt(v, 1)).join(', ')}]</dd>
            <dt>After activation</dt>
            <dd>[{net.h.map((v) => fmt(v, 1)).join(', ')}]</dd>
            <dt>Output</dt>
            <dd>[{net.out.map((v) => fmt(v, 2)).join(', ')}]</dd>
          </dl>
        </div>
      </div>
    </Figure>
  );
}

export default function FeedForward() {
  return (
    <>
      <h1>The feed-forward network</h1>
      <p className="lead">
        Attention lets tokens <em>exchange</em> information. The feed-forward network (FFN) is where each token then{' '}
        <em>processes</em> what it has gathered, on its own. Every Transformer block has both: first talk, then
        think.
      </p>

      <h2>What it is</h2>
      <p>
        A feed-forward network is the simplest kind of neural network: two matrix multiplications with a simple
        “switch” function in between.
      </p>
      <Tex block>{String.raw`\text{FFN}(x) \;=\; W_2 \,\cdot\, \text{activation}\big(W_1 x + b_1\big) \;+\; b_2`}</Tex>
      <ol>
        <li>
          <strong>Expand.</strong> Multiply the token's vector by <Tex>W_1</Tex> to get a bigger vector, usually 4
          times larger (512 → 2048 in the original paper). Each of those numbers is a “hidden unit” that tests for
          some pattern in the input.
        </li>
        <li>
          <strong>Switch.</strong> Apply the activation function to every number. The classic choice, ReLU, is
          simply “if negative, make it zero”: <Tex>{String.raw`\text{ReLU}(z) = \max(0, z)`}</Tex>. Units whose
          pattern is absent are turned off.
        </li>
        <li>
          <strong>Contract.</strong> Multiply by <Tex>W_2</Tex> to bring the vector back to its original size, ready
          to be added to the residual stream.
        </li>
      </ol>

      <FFNFigure />

      <h2>Why the “switch” is essential</h2>
      <p>
        Without the activation function the network would compute <Tex>{String.raw`W_2 (W_1 x)`}</Tex>, and two
        matrix multiplications in a row can always be replaced by a single one. No matter how many layers you
        stacked, the whole model would collapse into one simple linear map, able to draw only straight lines through
        data. The activation function is a bend. Stack enough bends and you can approximate any shape. Attention
        weights also depend on the input, but the FFN is the main source of this <strong>non-linearity</strong>.
      </p>

      <h2>Each token, separately</h2>
      <p>
        The same FFN, with the same weights, is applied to every token position independently. Token 3 does not see
        token 5 here. That is by design:
      </p>
      <div className="cards">
        <div className="card">
          <h4>Attention = communication</h4>
          <p>Moves information <em>between</em> tokens. “Who is ‘it’? Let me gather that from ‘animal’.”</p>
        </div>
        <div className="card">
          <h4>Feed-forward = computation</h4>
          <p>Transforms information <em>within</em> a token. “I am ‘it’ and I now know I mean an animal. What follows from that?”</p>
        </div>
      </div>

      <Callout kind="idea">
        A useful way to think about it: the FFN acts like a large lookup memory. Each hidden unit detects a pattern
        (“this is about the Eiffel Tower”) and, when it fires, writes related information (“…located in Paris”) back
        into the token's vector. Much of what a model “knows” as facts appears to be stored in these layers.
      </Callout>

      <Callout kind="note" title="Where the parameters are">
        Because the hidden layer is 4 times wider, the FFN is heavy: it holds about two thirds of all the weights in
        a Transformer block. Attention gets the fame, but the feed-forward layers hold most of the numbers.
      </Callout>
    </>
  );
}
