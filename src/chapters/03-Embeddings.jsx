import { useState } from 'react';
import { Btn, Callout, Figure, ScaleLegend, Swatch, Tex, Tok } from '../components/ui.jsx';
import { Matrix } from '../components/Matrix.jsx';
import { fmt } from '../lib/math.js';

const VOCAB = ['the', 'a', 'cat', 'dog', 'sat', 'ran', 'on', 'mat'];
const TABLE = [
  [0.1, -0.8, 0.0, 0.9, -0.2, 0.1],
  [0.2, -0.7, 0.1, 0.8, -0.3, 0.0],
  [0.9, 0.6, -0.5, -0.1, 0.7, 0.3],
  [0.8, 0.7, -0.4, 0.0, 0.5, 0.4],
  [-0.6, 0.2, 0.9, 0.1, 0.3, -0.7],
  [-0.5, 0.3, 0.8, 0.0, 0.5, -0.6],
  [0.0, -0.3, 0.1, 0.4, -0.9, 0.6],
  [0.5, 0.1, -0.6, -0.3, -0.2, 0.8],
];
const SENTENCE = ['the', 'cat', 'sat', 'on', 'the', 'mat'];

function LookupFigure() {
  const [pick, setPick] = useState(1);
  const row = VOCAB.indexOf(SENTENCE[pick]);
  return (
    <Figure
      title="The embedding table is a lookup"
      hint="Click a token"
      caption={
        <>
          Token <b>“{SENTENCE[pick]}”</b> has ID {row}, so the model copies out row {row}:{' '}
          <span className="mono">[{TABLE[row].map((v) => fmt(v, 1)).join(', ')}]</span>. Compare the rows for{' '}
          <b>cat</b> and <b>dog</b>, or <b>sat</b> and <b>ran</b>: similar words have similar rows.
        </>
      }
    >
      <div className="toks" style={{ marginBottom: 16 }}>
        {SENTENCE.map((w, i) => (
          <Tok key={i} active={i === pick} onClick={() => setPick(i)} sub={`ID ${VOCAB.indexOf(w)}`}>
            {w}
          </Tok>
        ))}
      </div>
      <Matrix
        title="Embedding table E"
        data={TABLE}
        rowLabels={VOCAB.map((w, i) => `${i} · ${w}`)}
        colLabels={['d1', 'd2', 'd3', 'd4', 'd5', 'd6']}
        rowHi={row}
        digits={1}
        range={1}
        cell={54}
      />
      <div style={{ marginTop: 12 }}>
        <ScaleLegend kind="div" left="−1" right="+1" />
      </div>
    </Figure>
  );
}

const GROUPS = {
  people: { label: 'People', color: 'var(--s1)' },
  animals: { label: 'Animals', color: 'var(--s2)' },
  food: { label: 'Food', color: 'var(--s3)' },
};

const POINTS = [
  { w: 'man', g: 'people', x: 2.0, y: 1.6 },
  { w: 'woman', g: 'people', x: 2.0, y: 3.2 },
  { w: 'king', g: 'people', x: 4.4, y: 2.0 },
  { w: 'queen', g: 'people', x: 4.4, y: 3.6 },
  { w: 'boy', g: 'people', x: 0.9, y: 1.0 },
  { w: 'girl', g: 'people', x: 0.9, y: 2.6 },
  { w: 'cat', g: 'animals', x: 7.2, y: 6.6 },
  { w: 'dog', g: 'animals', x: 8.0, y: 6.0 },
  { w: 'kitten', g: 'animals', x: 6.5, y: 7.4 },
  { w: 'puppy', g: 'animals', x: 8.5, y: 7.0 },
  { w: 'lion', g: 'animals', x: 6.9, y: 5.4 },
  { w: 'horse', g: 'animals', x: 8.9, y: 5.2 },
  { w: 'apple', g: 'food', x: 7.6, y: 1.9 },
  { w: 'banana', g: 'food', x: 8.5, y: 2.5 },
  { w: 'bread', g: 'food', x: 7.0, y: 0.9 },
  { w: 'pizza', g: 'food', x: 8.8, y: 1.1 },
];

const W = 600;
const H = 400;
const sx = (x) => 30 + (x / 10) * (W - 60);
const sy = (y) => H - 28 - (y / 8.4) * (H - 56);
const P = Object.fromEntries(POINTS.map((p) => [p.w, p]));

function MeaningMap() {
  const [hover, setHover] = useState(null);
  const [analogy, setAnalogy] = useState(false);

  const neighbours = hover
    ? POINTS.filter((p) => p.w !== hover.w)
        .map((p) => ({ p, d: Math.hypot(p.x - hover.x, p.y - hover.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
    : [];

  const arrow = (a, b, key, dashed) => (
    <line
      key={key}
      x1={sx(a.x)}
      y1={sy(a.y)}
      x2={sx(b.x)}
      y2={sy(b.y)}
      stroke="var(--ink)"
      strokeWidth="2"
      strokeDasharray={dashed ? '5 4' : undefined}
      markerEnd="url(#emb-ah)"
    />
  );

  return (
    <Figure
      title="A map of meaning (2 dimensions)"
      hint="Hover a word to see its nearest neighbours"
      caption={
        analogy ? (
          <>
            The arrow from <b>man</b> to <b>woman</b> is a direction that means roughly “make it female”. Start at{' '}
            <b>king</b>, travel along the same arrow, and you land on <b>queen</b>. Directions in the space carry
            meaning: <span className="mono">king − man + woman ≈ queen</span>.
          </>
        ) : hover ? (
          <>
            Closest to <b>{hover.w}</b>:{' '}
            {neighbours.map((n, i) => (
              <span key={n.p.w}>
                {i > 0 && ', '}
                {n.p.w} <span className="mono muted">(distance {fmt(n.d, 1)})</span>
              </span>
            ))}
            . Words with related meanings sit near each other.
          </>
        ) : (
          'Each word is a point. Nobody placed these by hand in a real model: training moves words that appear in similar contexts close together.'
        )
      }
    >
      <div className="controls" style={{ justifyContent: 'space-between' }}>
        <div className="legend" style={{ margin: 0 }}>
          {Object.values(GROUPS).map((g) => (
            <span key={g.label}>
              <Swatch color={g.color} />
              {g.label}
            </span>
          ))}
        </div>
        <Btn primary={!analogy} onClick={() => setAnalogy((a) => !a)}>
          {analogy ? 'Hide the analogy' : 'Show: king − man + woman = ?'}
        </Btn>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 640, display: 'block' }}
        role="img"
        aria-label="Scatter plot of words. People, animals and food form three separate clusters."
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <marker id="emb-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
          </marker>
        </defs>
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="8" fill="none" stroke="var(--grid)" />
        {!analogy &&
          neighbours.map((n) => (
            <line
              key={n.p.w}
              x1={sx(hover.x)}
              y1={sy(hover.y)}
              x2={sx(n.p.x)}
              y2={sy(n.p.y)}
              stroke="var(--axis)"
              strokeWidth="1.5"
            />
          ))}
        {analogy && (
          <>
            {arrow(P.man, P.woman, 'a1')}
            {arrow(P.king, P.queen, 'a2', true)}
            <text x={sx(P.man.x) + 12} y={(sy(P.man.y) + sy(P.woman.y)) / 2 + 4} className="svg-muted">
              “female” direction
            </text>
            <text x={sx(P.king.x) + 14} y={(sy(P.king.y) + sy(P.queen.y)) / 2 + 4} className="svg-muted">
              same direction
            </text>
          </>
        )}
        {POINTS.map((p) => {
          const dim = analogy
            ? !['man', 'woman', 'king', 'queen'].includes(p.w)
            : hover && hover.w !== p.w && !neighbours.some((n) => n.p.w === p.w);
          return (
            <g key={p.w} opacity={dim ? 0.3 : 1} onMouseEnter={() => setHover(p)} style={{ cursor: 'pointer' }}>
              <circle cx={sx(p.x)} cy={sy(p.y)} r="16" fill="transparent" />
              <circle cx={sx(p.x)} cy={sy(p.y)} r="6" fill={GROUPS[p.g].color} className="plot-dot" />
              <text x={sx(p.x) + 10} y={sy(p.y) - 8} className="svg-text" style={{ fontSize: 12.5 }}>
                {p.w}
              </text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

export default function Embeddings() {
  return (
    <>
      <h1>Tokens become vectors</h1>
      <p className="lead">
        A token ID is just a label. To do anything useful, the model swaps each ID for a list of numbers that
        describes what the token <em>means</em>. That list is called an <strong>embedding</strong>.
      </p>

      <h2>First: what is a vector?</h2>
      <p>
        A <strong>vector</strong> is simply an ordered list of numbers, like <code>[0.9, 0.6, −0.5]</code>. You can
        think of it two ways, and both are useful:
      </p>
      <ul>
        <li>
          As a <strong>list of scores</strong>: each position measures some quality. Maybe the first number means
          “how alive is this thing?” and the second “how big is it?”.
        </li>
        <li>
          As a <strong>point in space</strong>: two numbers give a point on a flat map, three numbers a point in a
          room. More numbers work the same way, they are just harder to draw.
        </li>
      </ul>
      <p>
        The count of numbers in the vector is its <strong>dimension</strong>. Transformers use the same dimension
        everywhere inside the model, called <Tex>{String.raw`d_{\text{model}}`}</Tex>. The original Transformer used
        512. Large modern models use several thousand.
      </p>

      <h2>The embedding table</h2>
      <p>
        The model owns one big table with a row for every token in its vocabulary. Turning a token into a vector is a
        plain lookup: go to the row with that ID and copy it out. Here is a toy version with 8 tokens and 6 numbers
        per token.
      </p>

      <LookupFigure />

      <Callout kind="math">
        If the vocabulary has <Tex>V</Tex> tokens and each vector has <Tex>{String.raw`d_{\text{model}}`}</Tex>{' '}
        numbers, the table <Tex>E</Tex> is a matrix with <Tex>V</Tex> rows and{' '}
        <Tex>{String.raw`d_{\text{model}}`}</Tex> columns. The embedding of token <Tex>t</Tex> is its row:
        <Tex block>{String.raw`x_t = E[\,t\,] \in \mathbb{R}^{d_{\text{model}}}`}</Tex>A sentence of <Tex>n</Tex>{' '}
        tokens therefore becomes a grid of numbers with <Tex>n</Tex> rows and{' '}
        <Tex>{String.raw`d_{\text{model}}`}</Tex> columns. That grid is what flows through the rest of the model.
      </Callout>

      <h2>Meaning becomes geometry</h2>
      <p>
        Why is this powerful? Because once words are points in space, <strong>“similar meaning” becomes “close
        together”</strong>, and that is something arithmetic can measure. Below is a map with only 2 dimensions so we
        can draw it.
      </p>

      <MeaningMap />

      <Callout kind="idea">
        Nobody types these numbers in. They start out random, and training (Chapter 14) nudges them, a tiny bit at a
        time, until words used in similar ways end up with similar vectors. The individual numbers usually have no
        human-readable name. What matters is the distances and directions between words.
      </Callout>

      <h2>One problem left</h2>
      <p>
        An embedding gives a token one fixed vector. But the word <em>“bank”</em> means something different in{' '}
        <em>“river bank”</em> and <em>“bank account”</em>, and it gets the same row of the table both times. The
        embedding is only a starting point. The job of attention (Part 2) is to adjust each vector using the words
        around it.
      </p>
      <p>Before that, we need two small math tools. That is the next chapter.</p>
    </>
  );
}
