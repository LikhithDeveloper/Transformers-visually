import { useState } from 'react';
import { Btn, Callout, Figure, Slider, Tex, Tok } from '../components/ui.jsx';
import { Plot, curve } from '../components/Plot.jsx';
import { fmt, pct } from '../lib/math.js';

const SENT = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

function ShiftFigure() {
  return (
    <Figure
      title="Free training examples from any sentence"
      caption="One six-token sentence yields five training examples. The targets are just the input shifted one place to the left. Thanks to the causal mask (Chapter 9), all five predictions are made in a single pass."
    >
      <table className="tbl">
        <thead>
          <tr>
            <th>The model sees</th>
            <th>Correct next token</th>
          </tr>
        </thead>
        <tbody>
          {SENT.slice(0, -1).map((_, i) => (
            <tr key={i}>
              <td>
                <div className="toks">
                  {SENT.slice(0, i + 1).map((t, j) => (
                    <Tok key={j}>{t}</Tok>
                  ))}
                </div>
              </td>
              <td>
                <Tok active>{SENT[i + 1]}</Tok>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Figure>
  );
}

function LossFigure() {
  const [p, setP] = useState(0.2);
  const loss = -Math.log(p);
  const f = (x) => -Math.log(x);
  return (
    <Figure
      title="Cross-entropy loss: how wrong was the model?"
      caption={
        p > 0.8
          ? 'The model was confident and right: the loss is close to zero. Nothing much to fix.'
          : p > 0.3
            ? 'The model gave the right token a fair chance. A moderate loss, a moderate correction.'
            : p > 0.05
              ? 'The right token got little probability. The loss is high, so the correction will be large.'
              : 'The model was almost certain the right token was impossible. The loss shoots up: confident mistakes are punished hardest.'
      }
    >
      <div className="controls">
        <Slider
          label="Probability the model gave to the correct token"
          value={p}
          min={0.01}
          max={0.99}
          step={0.01}
          onChange={setP}
          format={(v) => pct(v)}
          width={340}
        />
        <div className="sample">loss = −ln({fmt(p, 2)}) = <b>{fmt(loss, 2)}</b></div>
      </div>
      <Plot
        x={[0, 1]}
        y={[0, 5]}
        xTicks={[0, 0.25, 0.5, 0.75, 1]}
        yTicks={[0, 1, 2, 3, 4, 5]}
        xFmt={(v) => `${v * 100}%`}
        xLabel="probability assigned to the correct token"
        yLabel="loss"
        label="Loss falls from very high to zero as the probability of the correct token rises"
      >
        {({ sx, sy }) => (
          <>
            <path d={curve(f, 0.0068, 1, sx, sy, 300)} className="plot-line" stroke="var(--s1)" />
            <line x1={sx(p)} x2={sx(p)} y1={sy(0)} y2={sy(Math.min(5, loss))} stroke="var(--axis)" strokeWidth="1" />
            <circle cx={sx(p)} cy={sy(Math.min(5, loss))} r="6" fill="var(--s1)" className="plot-dot" />
          </>
        )}
      </Plot>
    </Figure>
  );
}

const W0 = -2.6;

function DescentFigure() {
  const [lr, setLr] = useState(0.15);
  const [path, setPath] = useState([W0]);
  const w = path[path.length - 1];
  const f = (x) => x * x;
  const diverged = Math.abs(w) > 3.2;

  const step = (n) => {
    const out = [...path];
    for (let k = 0; k < n; k++) {
      const cur = out[out.length - 1];
      if (Math.abs(cur) > 50) break;
      out.push(cur - lr * 2 * cur);
    }
    setPath(out);
  };

  let verdict;
  if (diverged) verdict = 'The steps are so large that each one overshoots further than the last. The loss explodes. This is what “learning rate too high” looks like.';
  else if (lr > 0.5) verdict = 'Each step jumps past the bottom to the other side. It still gets there, but by bouncing.';
  else if (lr < 0.04) verdict = 'Tiny steps: safe, but painfully slow. Real training would take forever.';
  else verdict = 'A sensible learning rate: big steps while the slope is steep, smaller ones as it flattens near the bottom.';

  return (
    <Figure
      title="Gradient descent on one weight"
      caption={verdict}
    >
      <div className="controls">
        <Slider label="Learning rate η" value={lr} min={0.01} max={1.1} step={0.01} onChange={(v) => { setLr(v); setPath([W0]); }} format={(v) => v.toFixed(2)} />
        <Btn primary onClick={() => step(1)} disabled={diverged}>Take one step</Btn>
        <Btn onClick={() => step(10)} disabled={diverged}>Take 10 steps</Btn>
        <Btn onClick={() => setPath([W0])}>Reset</Btn>
      </div>
      <div>
        <Plot
          x={[-3.2, 3.2]}
          y={[0, 10.5]}
          xTicks={[-3, -2, -1, 0, 1, 2, 3]}
          yTicks={[0, 2, 4, 6, 8, 10]}
          xLabel="value of the weight w"
          yLabel="loss"
          label="A bowl-shaped loss curve with the path taken by gradient descent"
        >
          {({ sx, sy }) => {
            const vis = path.filter((x) => Math.abs(x) <= 3.2);
            return (
              <>
                <path d={curve(f, -3.2, 3.2, sx, sy)} className="plot-line" stroke="var(--axis)" />
                <polyline
                  points={vis.map((x) => `${sx(x)},${sy(f(x))}`).join(' ')}
                  fill="none"
                  stroke="var(--s1)"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                {vis.map((x, i) => (
                  <circle key={i} cx={sx(x)} cy={sy(f(x))} r={i === vis.length - 1 && !diverged ? 6.5 : 3.5} fill="var(--s1)" className="plot-dot" />
                ))}
              </>
            );
          }}
        </Plot>
        <div style={{ marginTop: 10 }}>
          <dl className="kv" style={{ maxWidth: 320 }}>
            <dt>Steps taken</dt>
            <dd>{path.length - 1}</dd>
            <dt>Weight w</dt>
            <dd>{diverged ? 'off the chart' : fmt(w, 3)}</dd>
            <dt>Loss w²</dt>
            <dd>{diverged ? 'exploding' : fmt(f(w), 3)}</dd>
            <dt>Slope here (2w)</dt>
            <dd>{diverged ? 'n/a' : fmt(2 * w, 3)}</dd>
          </dl>
          <p className="small muted">
            Each step: <span className="mono">w ← w − η × slope</span>. A negative slope means “loss falls if w goes
            up”, so w is increased, and vice versa.
          </p>
        </div>
      </div>
    </Figure>
  );
}

export default function Training() {
  return (
    <>
      <h1>How it learns</h1>
      <p className="lead">
        Every chapter so far has used “learned” numbers: the embedding table, the attention matrices{' '}
        <Tex>{String.raw`W_Q,\ W_K,\ W_V`}</Tex> and the feed-forward weights. Where do they come from? They all start as random noise, and are
        improved, a little at a time, by one simple game played billions of times: guess the next token.
      </p>

      <h2>The game: guess the next token</h2>
      <p>
        Take any text ever written. Hide what comes next and ask the model to predict it. We already know the
        answer, because it is right there in the text. No human needs to label anything. This is called{' '}
        <strong>self-supervised learning</strong>, and it is why models can train on a large share of the internet.
      </p>

      <ShiftFigure />

      <h2>Measuring the mistake: the loss</h2>
      <p>
        For each position the model outputs a probability for every token. We look at just one of those numbers: the
        probability it gave to the <strong>correct</strong> token. If that is high, good. If it is low, bad. The
        standard way to turn this into a penalty is the <strong>cross-entropy loss</strong>:
      </p>
      <Tex block>{String.raw`\mathcal{L} \;=\; -\ln\, P(\text{correct token})`}</Tex>

      <LossFigure />

      <p>
        The loss for a whole batch of text is the average over all positions. One number that says how badly the
        model is doing. Training means making that number go down.
      </p>

      <h2>Improving: gradient descent</h2>
      <p>
        The loss depends on every weight in the model. For each weight we can ask: “if I nudge this weight up a
        tiny bit, does the loss go up or down, and by how much?” That number is the weight's{' '}
        <strong>gradient</strong>, which is just the slope of the loss with respect to that weight. Then we move
        every weight a small step in the direction that lowers the loss:
      </p>
      <Tex block>{String.raw`w \;\leftarrow\; w \;-\; \eta \,\frac{\partial \mathcal{L}}{\partial w}`}</Tex>
      <p>
        <Tex>{String.raw`\eta`}</Tex> (eta) is the <strong>learning rate</strong>: how big a step to take. Below is
        the simplest possible case, one weight and a bowl-shaped loss. Try different learning rates.
      </p>

      <DescentFigure />

      <Callout kind="analogy" title="Analogy: walking downhill in fog">
        You are on a hillside in thick fog and want to reach the valley. You cannot see it, but you can feel the
        slope under your feet. So you take a step downhill, feel again, step again. Gradient descent is that, except
        the hill has billions of dimensions, one for every weight.
      </Callout>

      <h2>Backpropagation: getting all the slopes at once</h2>
      <p>
        A model has billions of weights. Nudging them one at a time to measure each slope would take forever.{' '}
        <strong>Backpropagation</strong> is the algorithm that computes the gradient for <em>every</em> weight in a
        single backward sweep through the network. It works because each layer is simple math (multiply, add,
        softmax), and the chain rule from calculus tells us how a change in an early layer ripples through to the
        loss. This is also where the residual connections from Chapter 10 pay off: they give the gradient a direct
        route back to the earliest layers.
      </p>

      <h2>The training loop</h2>
      <div className="cards is-4">
        <div className="card"><h4>1 · Forward pass</h4><p>Run a batch of text through the model and get next-token probabilities at every position.</p></div>
        <div className="card"><h4>2 · Loss</h4><p>Compare with the real next tokens. Compute the average cross-entropy.</p></div>
        <div className="card"><h4>3 · Backward pass</h4><p>Backpropagation gives the gradient of the loss for every weight.</p></div>
        <div className="card"><h4>4 · Update</h4><p>Move every weight a small step against its gradient. Then repeat with new text.</p></div>
      </div>

      <h2>What exactly gets learned?</h2>
      <p>Everything this course called a “weight” or “learned”. Nothing else changes during training.</p>
      <ul>
        <li>The <strong>embedding table</strong> <Tex>E</Tex> (and positions, if learned): which tokens are similar.</li>
        <li><Tex>W_Q</Tex>, <Tex>W_K</Tex>, <Tex>W_V</Tex>, <Tex>W_O</Tex> in every head of every layer: who should attend to whom, and what to pass along.</li>
        <li><Tex>W_1</Tex>, <Tex>W_2</Tex> and biases in every feed-forward network: how to process gathered information.</li>
        <li><Tex>{String.raw`\gamma`}</Tex> and <Tex>{String.raw`\beta`}</Tex> in every layer normalisation.</li>
        <li>The final <strong>unembedding</strong> matrix that turns vectors back into token scores.</li>
      </ul>

      <Callout kind="idea">
        Nobody programs grammar, facts or reasoning into a Transformer. The only instruction it ever receives is
        “predict the next token better”. To get good at that across trillions of words, the weights are forced to
        encode grammar, facts about the world, and patterns of reasoning, because all of those help predict what
        comes next.
      </Callout>

      <Callout kind="note" title="Pre-training and fine-tuning">
        Training on enormous amounts of general text is called <strong>pre-training</strong>, and it is the
        expensive part. The result can then be <strong>fine-tuned</strong>: trained a little more on a smaller,
        specific dataset (conversations, medical text, your company's documents) to specialise it. Same loop, same
        loss, less data.
      </Callout>
    </>
  );
}
