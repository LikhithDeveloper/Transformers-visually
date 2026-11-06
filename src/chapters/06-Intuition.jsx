import { useState } from 'react';
import { Bars, Callout, Figure, Seg, Swatch, Tok } from '../components/ui.jsx';
import { seqColor } from '../lib/colors.js';
import { pct } from '../lib/math.js';
import { useTheme } from '../lib/theme.jsx';
import { KEY_SAYS, WEIGHTS, tokensFor } from '../data/sentence.js';

const ROW = 30;
const VB_W = 540;

function AttentionLines({ variant, sel, setSel }) {
  const { dark } = useTheme();
  const tokens = tokensFor(variant);
  const w = WEIGHTS[variant][sel];
  const max = Math.max(...w);
  const y = (i) => 36 + i * ROW;
  const xL = 170;
  const xR = 360;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${tokens.length * ROW + 30}`}
      style={{ width: '100%', maxWidth: 600, display: 'block' }}
      role="img"
      aria-label={`Attention from ${tokens[sel]} to every token in the sentence`}
    >
      <text x={xL} y={11} textAnchor="end" className="svg-muted">the word that is looking</text>
      <text x={xR} y={11} className="svg-muted">where it looks</text>
      {w.map((v, j) => (
        <line
          key={`l${j}`}
          x1={xL + 10}
          y1={y(sel)}
          x2={xR - 10}
          y2={y(j)}
          stroke="var(--s1)"
          strokeWidth={1 + 9 * v}
          strokeLinecap="round"
          opacity={Math.min(1, 0.06 + (v / max) * 0.94)}
        />
      ))}
      {tokens.map((t, i) => {
        const c = seqColor(Math.min(1, (w[i] / max) * 0.72), dark);
        return (
          <g key={i}>
            <g onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} style={{ cursor: 'pointer' }}>
              <rect
                x={xL - 96}
                y={y(i) - 12}
                width={100}
                height={24}
                rx={6}
                fill={i === sel ? 'var(--accent)' : 'var(--surface)'}
                stroke={i === sel ? 'var(--accent)' : 'var(--border-strong)'}
              />
              <text
                x={xL - 8}
                y={y(i) + 4.5}
                textAnchor="end"
                style={{ fontFamily: 'var(--mono)', fontSize: 13, fill: i === sel ? 'var(--on-accent)' : 'var(--ink)' }}
              >
                {t}
              </text>
            </g>
            <rect x={xR - 4} y={y(i) - 12} width={100} height={24} rx={6} fill={c.bg} stroke="var(--border)" />
            <text x={xR + 8} y={y(i) + 4.5} style={{ fontFamily: 'var(--mono)', fontSize: 13, fill: c.fg }}>
              {t}
            </text>
            <text x={xR + 106} y={y(i) + 4.5} className="plot-tick" style={{ fontSize: 12 }}>
              {pct(w[i])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function QKVStory({ variant }) {
  const tokens = tokensFor(variant);
  const w = WEIGHTS[variant][7];
  const ranked = w
    .map((v, j) => ({ j, v }))
    .filter((d) => d.j !== 7)
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
  const items = ranked.map((d) => ({ label: tokens[d.j], value: d.v, note: `“I am ${KEY_SAYS[variant][d.j]}”` }));

  return (
    <Figure
      title={`How “it” decides where to look`}
      caption={
        <>
          The result: the new vector for “it” is a blend, roughly{' '}
          <span className="mono">
            {ranked.slice(0, 3).map((d, i) => `${i ? ' + ' : ''}${pct(d.v)} × Value(${tokens[d.j]})`)} + …
          </span>
          . After this step, “it” carries the meaning of “{tokens[ranked[0].j]}” inside it.
        </>
      }
    >
      <div className="cards" style={{ margin: '0 0 16px' }}>
        <div className="card">
          <h4><Swatch color="var(--s1)" />1 · Query</h4>
          <p>“it” broadcasts a question: <em>“I am a pronoun. Which noun, mentioned earlier, could be {variant}?”</em></p>
        </div>
        <div className="card">
          <h4><Swatch color="var(--s2)" />2 · Keys</h4>
          <p>Every word holds up a label describing itself. The Query is compared with each Key, giving a match score.</p>
        </div>
        <div className="card">
          <h4><Swatch color="var(--s3)" />3 · Values</h4>
          <p>Each word also has content to hand over. “it” collects those Values, taking more from the better matches.</p>
        </div>
      </div>
      <div className="small muted" style={{ marginBottom: 8 }}>
        Match between the Query of “it” and each word's Key (top five, after softmax):
      </div>
      <Bars items={items} max={Math.max(0.6, ranked[0].v)} labelWidth={64} noteWidth={270} />
    </Figure>
  );
}

export default function Intuition() {
  const [variant, setVariant] = useState('tired');
  const [sel, setSel] = useState(7);
  const tokens = tokensFor(variant);
  const w = WEIGHTS[variant][7];
  const referent = variant === 'tired' ? 'animal' : 'street';

  return (
    <>
      <h1>Attention: the intuition</h1>
      <p className="lead">
        Words get their meaning from the words around them. Self-attention is the mechanism that lets every word look
        at the rest of the sentence and pull in whatever it needs to be understood.
      </p>

      <h2>The problem attention solves</h2>
      <p>Read this sentence and ask yourself: what does the word “it” refer to?</p>
      <div className="toks" style={{ margin: '14px 0' }}>
        {tokens.map((t, i) => (
          <Tok key={i} active={i === 7} tint={i === 10 ? 'a' : undefined}>
            {t}
          </Tok>
        ))}
      </div>
      <p>
        You knew instantly: <strong>the {referent}</strong>. Now change one word at the end and watch your own answer
        change:
      </p>
      <div className="controls">
        <Seg
          label="Last word"
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'tired', label: '… it was too tired' },
            { value: 'wide', label: '… it was too wide' },
          ]}
        />
      </div>
      <p>
        Animals get tired. Streets are wide. You used a word at the <em>end</em> of the sentence to decide what a word
        in the <em>middle</em> means, and connected it to a word near the <em>start</em>. The embedding for “it” is
        the same in both sentences, so the model cannot get this from the embedding alone. It has to{' '}
        <strong>look at the context</strong>. That looking is attention.
      </p>

      <h2>Seeing attention</h2>
      <p>
        Below, pick any word on the left. The lines show how much of its attention goes to each word on the right.
        Thicker, darker lines mean more attention. The percentages for one word always add up to 100%: a word has a
        fixed budget of attention to spend.
      </p>

      <Figure
        title={`Where does “${tokens[sel]}” look?`}
        hint="Hover or click a word on the left"
        caption={
          <>
            With the ending “too {variant}”, the word “it” puts <b>{pct(w[variant === 'tired' ? 1 : 5])}</b> of its
            attention on “{referent}”. Switch the ending above and watch the thick line jump to the other noun.{' '}
            <span className="muted">(Hand-written illustrative weights, in the style of what trained models learn.)</span>
          </>
        }
      >
        <AttentionLines variant={variant} sel={sel} setSel={setSel} />
      </Figure>

      <Callout kind="idea">
        Attention answers one question for every word: <strong>“Which other words matter for understanding me, and
        how much?”</strong> The answer is a list of percentages, called <strong>attention weights</strong>. The word
        then updates its own vector by mixing in information from the others in those proportions.
      </Callout>

      <h2>How a word decides where to look: Query, Key, Value</h2>
      <p>
        How could a pile of numbers possibly “decide” that “it” should look at “{referent}”? With a neat trick. Each
        word's vector is turned into three different vectors, each with its own job:
      </p>
      <ul>
        <li>
          <Swatch color="var(--s1)" />
          <strong>Query</strong>: “Here is what I am looking for.”
        </li>
        <li>
          <Swatch color="var(--s2)" />
          <strong>Key</strong>: “Here is what I am, in case someone is looking.”
        </li>
        <li>
          <Swatch color="var(--s3)" />
          <strong>Value</strong>: “Here is the information I will hand over if you pick me.”
        </li>
      </ul>

      <Callout kind="analogy" title="Analogy: a library">
        You walk into a library with a question in mind (your <strong>Query</strong>). Every book has a title on its
        spine (its <strong>Key</strong>). You compare your question with each title. The books whose titles match
        best, you open and read (their <strong>Values</strong>). Attention is a soft version of this: instead of
        picking one book, you read a little of every book, and more of the ones that match well.
      </Callout>

      <QKVStory variant={variant} />

      <p>
        And how is “match” measured? With the tool from Chapter 4: the <strong>dot product</strong> between the Query
        vector and the Key vector. A big dot product means a good match. Then <strong>softmax</strong> turns the
        match scores into percentages. That is the entire mechanism:
      </p>
      <ol>
        <li>Each word makes a Query, a Key and a Value.</li>
        <li>Dot product of my Query with everyone's Key → match scores.</li>
        <li>Softmax → attention weights (percentages).</li>
        <li>My new vector = weighted average of everyone's Values.</li>
      </ol>

      <Callout kind="note" title="Why is it called self-attention?">
        Because the sentence attends to <em>itself</em>: the Queries, Keys and Values all come from the same set of
        words. Every word plays all three roles at once. It asks its own question, and it is also a candidate answer
        to every other word's question. All of this happens for all words in parallel.
      </Callout>

      <p>
        In the next chapter we do exactly these four steps with real numbers, small enough to check by hand.
      </p>
    </>
  );
}
