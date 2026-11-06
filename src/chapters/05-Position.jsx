import { useMemo, useState } from 'react';
import { Callout, Figure, ScaleLegend, Seg, Slider, Tex, Tok } from '../components/ui.jsx';
import { Matrix } from '../components/Matrix.jsx';
import { Plot, curve } from '../components/Plot.jsx';
import { divColor } from '../lib/colors.js';
import { fmt, positionalEncoding } from '../lib/math.js';
import { useTheme } from '../lib/theme.jsx';

const N_POS = 32;
const HM_W = 600;
const ROW_H = 10;
const LEFT = 34;
const TOP = 6;

function Heatmap({ d, pos, setPos, dim, setDim }) {
  const { dark } = useTheme();
  const [hover, setHover] = useState(null);
  const cw = HM_W / d;

  const cells = useMemo(() => {
    const out = [];
    for (let p = 0; p < N_POS; p++) {
      for (let i = 0; i < d; i++) {
        const v = positionalEncoding(p, i, d);
        out.push(
          <rect key={`${p}-${i}`} x={LEFT + i * cw} y={TOP + p * ROW_H} width={cw + 0.5} height={ROW_H + 0.5} fill={divColor(v, dark).bg} />
        );
      }
    }
    return out;
  }, [d, dark, cw]);

  const locate = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * (LEFT + HM_W) - LEFT;
    const y = ((e.clientY - r.top) / r.height) * (TOP + N_POS * ROW_H + 22) - TOP;
    const i = Math.floor(x / cw);
    const p = Math.floor(y / ROW_H);
    return i >= 0 && i < d && p >= 0 && p < N_POS ? { p, i } : null;
  };

  const show = hover || { p: pos, i: dim };
  const val = positionalEncoding(show.p, show.i, d);
  const k = Math.floor(show.i / 2);

  return (
    <>
      <svg
        viewBox={`0 0 ${LEFT + HM_W} ${TOP + N_POS * ROW_H + 22}`}
        style={{ width: '100%', maxWidth: 680, display: 'block', cursor: 'crosshair' }}
        onMouseMove={(e) => setHover(locate(e))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const c = locate(e);
          if (c) {
            setPos(c.p);
            setDim(c.i);
          }
        }}
        role="img"
        aria-label="Heatmap of positional encoding values. Rows are positions, columns are dimensions."
      >
        {cells}
        {[0, 5, 10, 15, 20, 25, 30].map((p) => (
          <text key={p} x={LEFT - 6} y={TOP + p * ROW_H + ROW_H / 2} textAnchor="end" dominantBaseline="middle" className="plot-tick">
            {p}
          </text>
        ))}
        <rect x={LEFT} y={TOP + pos * ROW_H} width={HM_W} height={ROW_H} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x={LEFT + dim * cw} y={TOP} width={cw} height={N_POS * ROW_H} fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 2" />
        <text x={LEFT} y={TOP + N_POS * ROW_H + 16} className="plot-label">dimension 0 (fast wave)</text>
        <text x={LEFT + HM_W} y={TOP + N_POS * ROW_H + 16} textAnchor="end" className="plot-label">dimension {d - 1} (slow wave)</text>
      </svg>
      <div className="readout">
        <span className="readout-title">Position {show.p}, dimension {show.i}:</span>
        <span className="mono">
          {show.i % 2 === 0 ? 'sin' : 'cos'}({show.p} ÷ 10000^({2 * k}/{d})) = <b>{fmt(val, 3)}</b>
        </span>
        <span className="muted"> · rows = position in the sentence (0 at top). Click a cell to select its row and column.</span>
      </div>
    </>
  );
}

const EMB = { the: [0.1, -0.8, 0.0, 0.9, -0.2, 0.1], cat: [0.9, 0.6, -0.5, -0.1, 0.7, 0.3], sat: [-0.6, 0.2, 0.9, 0.1, 0.3, -0.7] };

function AddFigure() {
  const [word, setWord] = useState('cat');
  const [p, setP] = useState(1);
  const e = EMB[word];
  const pe = e.map((_, i) => positionalEncoding(p, i, 6));
  const sum = e.map((v, i) => v + pe[i]);
  const cols = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
  return (
    <Figure
      title="Input vector = meaning + position"
      caption={`The same word “${word}” gets a different input vector at every position. Move the slider: the embedding row stays fixed, the position row changes, and so does the sum.`}
    >
      <div className="controls">
        <div className="toks">
          {Object.keys(EMB).map((w) => (
            <Tok key={w} active={w === word} onClick={() => setWord(w)}>
              {w}
            </Tok>
          ))}
        </div>
        <Slider label="Position in the sentence" value={p} min={0} max={12} onChange={setP} />
      </div>
      <Matrix
        data={[e, pe, sum]}
        rowLabels={[`embedding of “${word}”`, `+ position ${p}`, '= input to the model']}
        colLabels={cols}
        range={2}
        cell={58}
        rowHi={2}
      />
    </Figure>
  );
}

export default function Position() {
  const [d, setD] = useState(32);
  const [pos, setPos] = useState(6);
  const [dim, setDim] = useState(4);
  const di = Math.min(dim, d - 1);
  const k = Math.floor(di / 2);
  const wavelength = 2 * Math.PI * Math.pow(10000, (2 * k) / d);
  const pe = (x) => positionalEncoding(x, di, d);

  return (
    <>
      <h1>Positional encoding</h1>
      <p className="lead">
        Attention looks at all words at once, which is its strength. But it comes with a surprising weakness: on its
        own, it has no idea what order the words are in. We have to tell it.
      </p>

      <h2>The problem: a bag of words</h2>
      <p>These two sentences contain exactly the same tokens:</p>
      <div className="cards">
        <div className="card">
          <div className="toks"><Tok>dog</Tok><Tok>bites</Tok><Tok>man</Tok></div>
          <p>An ordinary Tuesday.</p>
        </div>
        <div className="card">
          <div className="toks"><Tok>man</Tok><Tok>bites</Tok><Tok>dog</Tok></div>
          <p>Front-page news.</p>
        </div>
      </div>
      <p>
        As you will see in Part 2, attention treats its input as a <em>set</em> of vectors: shuffle the words and
        every word receives exactly the same information as before. Since the embeddings for “dog”, “bites” and “man”
        are the same in both sentences, the model could not tell them apart. So before attention runs, we{' '}
        <strong>add a position signal to every token's vector</strong>.
      </p>

      <h2>The idea: give every position a unique fingerprint</h2>
      <p>
        For each position (0, 1, 2, …) we create a vector of the same size as the embedding, and simply add the two
        together. The original Transformer builds these position vectors out of sine and cosine waves of different
        speeds:
      </p>
      <Tex block>{String.raw`PE(pos,\,2k) = \sin\!\left(\frac{pos}{10000^{\,2k/d_{\text{model}}}}\right)
        \qquad
        PE(pos,\,2k{+}1) = \cos\!\left(\frac{pos}{10000^{\,2k/d_{\text{model}}}}\right)`}</Tex>
      <p>
        Read it like this: <Tex>pos</Tex> is the position of the token in the sentence. Each pair of dimensions{' '}
        <Tex>{String.raw`(2k,\ 2k{+}1)`}</Tex> is one wave. Small <Tex>k</Tex> gives a fast wave that changes a lot
        from one position to the next. Large <Tex>k</Tex> gives a very slow wave.
      </p>

      <Callout kind="analogy" title="Analogy: a clock">
        A clock tells time with hands of different speeds. The second hand spins fast and tells you fine detail. The
        hour hand moves slowly and tells you the big picture. Read all hands together and every moment of the day is
        unique. Positional encoding does the same with waves: the fast dimensions tell neighbours apart, the slow
        dimensions tell the start of a document from the end.
      </Callout>

      <Figure
        title="Every row is one position's fingerprint"
        hint="Hover to read values · click to select"
        caption="Left columns flicker quickly from row to row. Right columns barely change. No two rows are the same, so every position is distinguishable."
      >
        <div className="controls" style={{ justifyContent: 'space-between' }}>
          <Seg
            label="Vector size"
            value={d}
            onChange={setD}
            options={[16, 32, 64].map((v) => ({ value: v, label: `d_model = ${v}` }))}
          />
          <ScaleLegend kind="div" left="−1" right="+1" />
        </div>
        <Heatmap d={d} pos={pos} setPos={setPos} dim={di} setDim={setDim} />
      </Figure>

      <Figure
        title={`One column as a wave: dimension ${di}`}
        caption={`This dimension repeats about every ${wavelength < 100 ? wavelength.toFixed(1) : Math.round(wavelength).toLocaleString()} positions. The dots are the values actually used, one per token position. The larger dot is position ${pos}.`}
      >
        <div className="controls">
          <Slider label="Dimension" value={di} min={0} max={d - 1} onChange={setDim} />
          <Slider label="Selected position" value={pos} min={0} max={N_POS - 1} onChange={setPos} />
        </div>
        <Plot
          x={[0, N_POS - 1]}
          y={[-1.15, 1.15]}
          xTicks={[0, 5, 10, 15, 20, 25, 30]}
          yTicks={[-1, 0, 1]}
          xLabel="position in the sentence"
          label={`Wave for dimension ${di}`}
          h={220}
        >
          {({ sx, sy }) => (
            <>
              <path d={curve(pe, 0, N_POS - 1, sx, sy, 400)} className="plot-line" stroke="var(--s1)" />
              {Array.from({ length: N_POS }, (_, p) => (
                <circle key={p} cx={sx(p)} cy={sy(pe(p))} r={p === pos ? 6 : 3.2} fill="var(--s1)" className="plot-dot" />
              ))}
            </>
          )}
        </Plot>
      </Figure>

      <h2>Adding it in</h2>
      <p>
        The position vector is added, number by number, to the token's embedding. The result is the actual input to
        the first Transformer layer: a vector that says both <em>what</em> the token is and <em>where</em> it is.
      </p>
      <Tex block>{String.raw`x_i \;=\; \underbrace{E[\text{token}_i]}_{\text{what}} \;+\; \underbrace{PE(i)}_{\text{where}}`}</Tex>

      <AddFigure />

      <Callout kind="note" title="Why waves, and what modern models do">
        Sine and cosine have a handy property: the encoding for position <Tex>{String.raw`pos + k`}</Tex> is a simple
        rotation of the encoding for <Tex>pos</Tex>, so the model can easily learn “three words to the left”. They
        also work for sentences longer than any seen in training. Many later models use variations on the theme:
        GPT-2 and BERT simply <em>learn</em> a vector per position, and most recent large models use{' '}
        <strong>rotary position embeddings (RoPE)</strong>, which rotate the query and key vectors inside attention.
        The goal is identical in every case: make word order visible to attention.
      </Callout>

      <h2>Where we are</h2>
      <p>
        Text has become tokens, tokens have become vectors, and each vector now carries its position. That grid of
        numbers, one row per token, is ready for the main event: attention.
      </p>
    </>
  );
}
