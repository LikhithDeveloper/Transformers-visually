import { useState } from 'react';
import { Bars, Callout, Figure, Seg } from '../components/ui.jsx';

const NEXT_WORD = [
  { label: 'mat', value: 0.58 },
  { label: 'floor', value: 0.14 },
  { label: 'sofa', value: 0.09 },
  { label: 'bed', value: 0.07 },
  { label: 'table', value: 0.05 },
  { label: 'moon', value: 0.004 },
];

const STAGES = [
  {
    key: 'text',
    name: 'Text',
    chapter: null,
    title: 'Start with plain text',
    body: 'Whatever you type. A computer cannot do math on letters, so the first jobs are all about turning text into numbers.',
    sample: '"The cat sat on the"',
  },
  {
    key: 'tokens',
    name: 'Tokens',
    chapter: 'tokens',
    title: 'Chop the text into tokens',
    body: 'The text is cut into small pieces called tokens (roughly words or parts of words). Each token is replaced by its ID number from a fixed dictionary.',
    sample: '[The] [cat] [sat] [on] [the]\n → [464, 3797, 3332, 319, 262]',
  },
  {
    key: 'embed',
    name: 'Vectors',
    chapter: 'embeddings',
    title: 'Give every token a vector',
    body: 'Each ID is swapped for a long list of numbers (a vector) that captures what the token means. Similar words get similar vectors.',
    sample: 'cat → [0.21, −1.30, 0.75, …, 0.08]   (hundreds of numbers)',
  },
  {
    key: 'pos',
    name: '+ Position',
    chapter: 'position',
    title: 'Stamp in the word order',
    body: 'A position signal is added to each vector so the model knows which token came first, second, third. Without it, "dog bites man" and "man bites dog" would look identical.',
    sample: 'vector(cat) + position(2) → input vector',
  },
  {
    key: 'attn',
    name: 'Attention',
    chapter: 'intuition',
    title: 'Let tokens look at each other',
    body: 'This is the heart of the Transformer. Every token gathers information from the other tokens it finds relevant, and updates its own vector with what it learned.',
    sample: '"sat" looks at "cat" → now knows WHO sat',
  },
  {
    key: 'ffn',
    name: 'Feed-forward',
    chapter: 'feed-forward',
    title: 'Let each token think it over',
    body: 'After gathering context, each token passes through a small neural network on its own, which digests the new information.',
    sample: 'vector → bigger hidden layer → vector',
  },
  {
    key: 'stack',
    name: '× N layers',
    chapter: 'architecture',
    title: 'Repeat, many times',
    body: 'Attention + feed-forward is one "block". Real models stack dozens of blocks. Each layer refines the vectors a little more, from grammar toward meaning.',
    sample: 'block 1 → block 2 → … → block 96',
  },
  {
    key: 'out',
    name: 'Probabilities',
    chapter: 'output',
    title: 'Score every possible next token',
    body: 'The final vector is turned into one probability for every token in the dictionary. Pick one, add it to the text, and run the whole thing again for the next word.',
    sample: 'mat 58% · floor 14% · sofa 9% · …',
  },
];

const SENT = ['The', 'cat', 'that', 'I', 'saw', 'yesterday', 'was', 'hungry'];

function ReadingStyles() {
  const [mode, setMode] = useState('rnn');
  const xs = SENT.map((_, i) => 44 + i * 80);
  const y = 96;
  return (
    <Figure
      title="Two ways to connect “was” back to “cat”"
      caption={
        mode === 'rnn'
          ? 'Older models (RNNs) read one word at a time and pass a single memory along. After five hops, the signal about “cat” is faint, and words cannot be processed in parallel.'
          : 'A Transformer lets “was” look directly at “cat” in one step, no matter how far apart they are. Every word does this at the same time, which also makes it fast on modern hardware.'
      }
    >
      <div className="controls">
        <Seg
          label="Model type"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'rnn', label: 'Older approach (RNN)' },
            { value: 'attn', label: 'Transformer (attention)' },
          ]}
        />
      </div>
      <svg viewBox="0 0 648 140" style={{ width: '100%', maxWidth: 680, display: 'block' }} role="img"
        aria-label={mode === 'rnn' ? 'Information passes word by word and fades' : 'A direct link from was to cat'}>
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--s1)" />
          </marker>
        </defs>
        {mode === 'rnn' &&
          [1, 2, 3, 4, 5].map((i, k) => (
            <g key={i} opacity={Math.pow(0.68, k)}>
              <path
                d={`M${xs[i]},${y - 22} Q${(xs[i] + xs[i + 1]) / 2},${y - 52} ${xs[i + 1]},${y - 22}`}
                fill="none"
                stroke="var(--s1)"
                strokeWidth="2.5"
                markerEnd="url(#ah)"
              />
              <text x={(xs[i] + xs[i + 1]) / 2} y={y - 50} textAnchor="middle" className="svg-muted">
                {Math.round(Math.pow(0.68, k + 1) * 100)}%
              </text>
            </g>
          ))}
        {mode === 'attn' && (
          <>
            <path
              d={`M${xs[6]},${y - 22} Q${(xs[1] + xs[6]) / 2},${-34} ${xs[1]},${y - 22}`}
              fill="none"
              stroke="var(--s1)"
              strokeWidth="2.5"
              markerEnd="url(#ah)"
            />
            <text x={(xs[1] + xs[6]) / 2} y={22} textAnchor="middle" className="svg-muted">
              one direct look
            </text>
          </>
        )}
        {SENT.map((w, i) => {
          const key = i === 1 || i === 6;
          return (
            <g key={w}>
              <rect
                x={xs[i] - 37}
                y={y - 16}
                width={74}
                height={30}
                rx={7}
                fill={key ? 'var(--accent-wash)' : 'var(--surface)'}
                stroke={key ? 'var(--s1)' : 'var(--border-strong)'}
              />
              <text x={xs[i]} y={y + 4} textAnchor="middle" className="svg-text" style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>
                {w}
              </text>
            </g>
          );
        })}
        <text x={xs[1]} y={y + 34} textAnchor="middle" className="svg-muted">who is hungry?</text>
        <text x={xs[6]} y={y + 34} textAnchor="middle" className="svg-muted">needs its subject</text>
      </svg>
    </Figure>
  );
}

export default function Intro({ go }) {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage];

  return (
    <>
      <h1>What is a Transformer?</h1>
      <p className="lead">
        A Transformer is a machine that reads some text and predicts what comes next. That one skill, done extremely
        well, is what powers ChatGPT, Claude, Gemini and almost every modern AI language system.
      </p>

      <p>
        This course builds a Transformer from the ground up. You do not need a machine learning background. If you can
        multiply and add numbers, you can follow every step, because we will build each idea before we use it, and
        every picture on these pages is a live calculation you can poke at.
      </p>

      <h2>The whole job in one picture</h2>
      <p>
        Give the model the words <em>“The cat sat on the”</em> and ask what comes next. It does not answer with one
        word. It answers with a probability for <strong>every</strong> word it knows:
      </p>

      <Figure
        title="Prediction for: “The cat sat on the ___”"
        caption="The model outputs a probability for every token in its dictionary (tens of thousands). Here are six of them. To write a whole paragraph it picks one, appends it, and predicts again."
      >
        <Bars items={NEXT_WORD} max={0.6} digits={1} />
      </Figure>

      <Callout kind="idea">
        A Transformer is a next-token predictor. Everything else in this course (tokens, vectors, attention, layers)
        is machinery for making that one prediction a good one.
      </Callout>

      <h2>The road from text to prediction</h2>
      <p>Here is the full journey. Click each stage for a one-line preview. Each one gets its own chapter.</p>

      <Figure title="The Transformer pipeline" hint="Click a stage">
        <div className="pipe">
          {STAGES.map((st, i) => (
            <button
              key={st.key}
              type="button"
              className={`pipe-stage${i === stage ? ' is-on' : ''}`}
              onClick={() => setStage(i)}
              aria-pressed={i === stage}
            >
              <b>Step {i + 1}</b>
              {st.name}
            </button>
          ))}
        </div>
        <div className="pipe-detail">
          <h4>{s.title}</h4>
          <p>{s.body}</p>
          <div className="sample">{s.sample}</div>
          {s.chapter && (
            <p className="small" style={{ marginBottom: 0 }}>
              <button className="linkish" onClick={() => go(s.chapter)}>
                Jump to this chapter →
              </button>
            </p>
          )}
        </div>
      </Figure>

      <h2>Why was the Transformer such a big deal?</h2>
      <p>
        Language is full of long-distance connections. In <em>“The cat that I saw yesterday was hungry”</em>, the word
        “was” belongs to “cat”, five words earlier. To understand a sentence, a model must connect words that are far
        apart.
      </p>

      <ReadingStyles />

      <p>
        The 2017 paper that introduced the Transformer was titled <strong>“Attention Is All You Need”</strong>. Its
        claim: you can throw away the word-by-word reading entirely and build a model out of one mechanism, called{' '}
        <strong>self-attention</strong>, that lets every word look at every other word directly. That mechanism is the
        main subject of this course.
      </p>

      <h2>How this course is organised</h2>
      <div className="cards is-4">
        <div className="card">
          <h4>Part 1 · Foundations</h4>
          <p>How text becomes numbers, and the two small pieces of math (dot product, softmax) that attention is made of.</p>
        </div>
        <div className="card">
          <h4>Part 2 · Attention</h4>
          <p>The intuition first, then every matrix and every number, then multi-head attention and masking.</p>
        </div>
        <div className="card">
          <h4>Part 3 · The full machine</h4>
          <p>The supporting parts (residuals, normalisation, feed-forward) and how they stack into a full model.</p>
        </div>
        <div className="card">
          <h4>Part 4 · Using and training it</h4>
          <p>How the model turns vectors back into words, and how it learns all of its numbers from raw text.</p>
        </div>
      </div>

      <Callout kind="note" title="How to read these pages">
        Go in order the first time. Later chapters reuse ideas from earlier ones. Anything inside a card is
        interactive: drag sliders, click tokens, hover over numbers to see where they come from.
      </Callout>
    </>
  );
}
