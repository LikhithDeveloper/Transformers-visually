import { useMemo, useState } from 'react';
import { Callout, Figure, ScaleLegend, Seg, Tex, Tok } from '../components/ui.jsx';
import { EqRow, Matrix, Op } from '../components/Matrix.jsx';
import { attention, pct } from '../lib/math.js';
import { TOK, WK, WQ, WV, X } from '../data/mini.js';

const TRAIN = ['The', 'cat', 'chased', 'mice', '.'];

function PeekFigure({ masked, setMasked }) {
  return (
    <Figure
      title="One sentence, four predictions at once"
      caption={
        masked
          ? 'With the mask on, each position sees only itself and the tokens before it. Predicting the next token is a real test.'
          : 'With the mask off, every position can see the whole sentence, including the answer it is supposed to predict. The model would learn to copy, not to predict.'
      }
    >
      <div className="controls">
        <Seg
          label="Mask"
          value={masked}
          onChange={setMasked}
          options={[
            { value: true, label: 'Causal mask ON' },
            { value: false, label: 'Mask OFF (cheating)' },
          ]}
        />
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Position</th>
            <th>What it is allowed to see</th>
            <th>Must predict</th>
          </tr>
        </thead>
        <tbody>
          {TRAIN.slice(0, -1).map((_, i) => (
            <tr key={i}>
              <td className="mono">{i + 1}</td>
              <td>
                <div className="toks">
                  {TRAIN.map((t, j) => {
                    const visible = j <= i || !masked;
                    return (
                      <Tok key={j} dim={!visible} tint={visible && j > i ? 'a' : undefined}>
                        {visible ? t : '?'.repeat(Math.min(3, t.length))}
                      </Tok>
                    );
                  })}
                </div>
              </td>
              <td>
                <Tok active>{TRAIN[i + 1]}</Tok>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Figure>
  );
}

function MaskMath({ masked }) {
  const [row, setRow] = useState(1);
  const r = useMemo(() => attention(X, WQ, WK, WV, { causal: masked }), [masked]);
  const pick = (i) => setRow(i);
  const hidden = (i, j) => masked && j > i;

  return (
    <Figure
      title="The mask, in numbers"
      hint="Hover a row"
      caption={
        <>
          Row “{TOK[row]}”:{' '}
          {TOK.map((t, j) => (
            <span key={t} className="mono">
              {j > 0 && ' · '}
              {t} {pct(r.weights[row][j])}
            </span>
          ))}
          .{' '}
          {masked
            ? `Tokens after “${TOK[row]}” get exactly 0%, and the remaining weights still sum to 100%.`
            : 'Without the mask, attention flows to later tokens too.'}
        </>
      }
    >
      <EqRow>
        <Matrix
          title={masked ? 'Scaled scores + mask' : 'Scaled scores'}
          data={r.masked}
          rowLabels={TOK}
          colLabels={TOK}
          rowHi={row}
          onCell={pick}
          blank={hidden}
          cell={56}
        />
        <Op>→</Op>
        <div className="mx-op" style={{ fontSize: 14, paddingTop: 22 }}>softmax</div>
        <Op>→</Op>
        <Matrix
          title="Attention weights"
          data={r.weights}
          rowLabels={TOK}
          colLabels={TOK}
          rowHi={row}
          onCell={pick}
          scale="seq"
          range={1}
          cell={56}
        />
      </EqRow>
      <div style={{ marginTop: 12 }}>
        <ScaleLegend kind="seq" left="0" right="1" />
      </div>
    </Figure>
  );
}

function MiniGrid({ rows, cols, on }) {
  const s = 15;
  return (
    <svg viewBox={`0 0 ${cols * s} ${rows * s}`} width={cols * s} height={rows * s} aria-hidden="true" style={{ display: 'block', margin: '4px 0 10px' }}>
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => (
          <rect
            key={`${i}-${j}`}
            x={j * s}
            y={i * s}
            width={s - 2}
            height={s - 2}
            rx="2"
            fill={on(i, j) ? 'var(--s1)' : 'var(--surface-2)'}
            stroke={on(i, j) ? 'none' : 'var(--border)'}
          />
        ))
      )}
    </svg>
  );
}

export default function Masking() {
  const [masked, setMasked] = useState(true);
  return (
    <>
      <h1>Masking &amp; kinds of attention</h1>
      <p className="lead">
        A model that writes text one token at a time must never peek at tokens that have not been written yet. A
        small trick called a <strong>mask</strong> enforces that rule inside attention.
      </p>

      <h2>The problem: no peeking at the answer</h2>
      <p>
        A language model is trained to predict the next token. To train efficiently, we feed in a whole sentence and
        ask for a prediction at <em>every</em> position simultaneously: after “The” predict “cat”, after “The cat”
        predict “chased”, and so on. But plain self-attention lets every token see every other token, including the
        ones that come later. The answer would be sitting in plain view.
      </p>

      <PeekFigure masked={masked} setMasked={setMasked} />

      <h2>The fix: set forbidden scores to −∞</h2>
      <p>
        Recall the order of steps: scores, scale, softmax. Just before the softmax, we overwrite every score where a
        token would look at a <em>later</em> token with negative infinity. Since{' '}
        <Tex>{String.raw`e^{-\infty} = 0`}</Tex>, softmax assigns those positions a weight of exactly zero, and
        shares the 100% among the allowed positions only.
      </p>
      <Tex block>{String.raw`\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}} + M\right)V,
        \qquad M_{ij} = \begin{cases} 0 & j \le i \\ -\infty & j > i \end{cases}`}</Tex>

      <MaskMath masked={masked} />

      <p>
        The allowed region is a triangle: the first token can only see itself, the second can see two tokens, and so
        on. This is called a <strong>causal mask</strong> (or look-ahead mask), and attention that uses it is called{' '}
        <strong>masked self-attention</strong>.
      </p>

      <Callout kind="idea">
        The mask is what makes a model a <em>generator</em>. Because position <Tex>i</Tex> never depends on anything
        after it, the model behaves identically during training (whole sentence present) and during generation
        (later tokens do not exist yet).
      </Callout>

      <h2>Three kinds of attention</h2>
      <p>
        Same formula every time. The only differences are where the Queries, Keys and Values come from, and which
        positions are allowed.
      </p>
      <div className="cards">
        <div className="card">
          <h4>Self-attention</h4>
          <MiniGrid rows={4} cols={4} on={() => true} />
          <p>
            Q, K, V all come from the same sentence. Every token sees every token. Used in <b>encoders</b> (for
            example BERT), whose job is to understand a complete text.
          </p>
        </div>
        <div className="card">
          <h4>Masked self-attention</h4>
          <MiniGrid rows={4} cols={4} on={(i, j) => j <= i} />
          <p>
            Q, K, V from the same sentence, but each token sees only itself and earlier tokens. Used in{' '}
            <b>decoders</b> (GPT, Claude, and other text generators).
          </p>
        </div>
        <div className="card">
          <h4>Cross-attention</h4>
          <MiniGrid rows={4} cols={6} on={() => true} />
          <p>
            Queries come from one sequence, Keys and Values from <em>another</em>. In translation, each English word
            being written looks at all the French input words. The grid is not square: 4 output tokens × 6 input
            tokens.
          </p>
        </div>
      </div>

      <Callout kind="note" title="One more mask: padding">
        Models process many sentences together in a batch, and shorter sentences are padded with a dummy token to
        make all rows the same length. A <strong>padding mask</strong> uses the same −∞ trick to make sure nobody
        attends to those empty slots.
      </Callout>

      <h2>End of Part 2</h2>
      <p>
        You now know the complete attention mechanism: Queries, Keys and Values, scaled dot-product scores, softmax,
        multiple heads, and masks. What remains is the scaffolding around attention that turns it into a deep,
        trainable network.
      </p>
    </>
  );
}
