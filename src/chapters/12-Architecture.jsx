import { useState } from 'react';
import { Callout, Figure, Seg, Slider, Tex } from '../components/ui.jsx';

const DETAILS = {
  input: {
    title: 'Input text',
    body: 'The raw text the model is given. For a chat model this is the whole conversation so far.',
    shape: 'a string of characters',
  },
  tokens: {
    title: 'Tokenizer',
    body: 'Chops the text into tokens and replaces each with its ID from the vocabulary.',
    shape: 'n integers',
    chapter: 'tokens',
  },
  embed: {
    title: 'Token embedding',
    body: 'Looks up each token ID in the embedding table and returns its vector: a learned description of what the token means.',
    shape: 'n × d_model',
    chapter: 'embeddings',
  },
  pos: {
    title: 'Positional encoding',
    body: 'Adds a position signal to every vector so the model can tell word order. Attention on its own is blind to order.',
    shape: 'n × d_model (unchanged)',
    chapter: 'position',
  },
  embedpos: {
    title: 'Embedding + position',
    body: 'Each token ID becomes a vector (embedding lookup), and a position signal is added so word order is visible.',
    shape: 'n × d_model',
    chapter: 'embeddings',
  },
  mha: {
    title: 'Multi-head self-attention',
    body: 'Every token gathers information from every other token in the same sequence, through several heads in parallel. No mask: each token can see the whole input.',
    shape: 'n × d_model → n × d_model',
    chapter: 'multi-head',
  },
  mmha: {
    title: 'Masked multi-head self-attention',
    body: 'Same as self-attention, but each token may only look at itself and earlier tokens. This is what lets the model generate text left to right.',
    shape: 'n × d_model → n × d_model',
    chapter: 'masking',
  },
  cross: {
    title: 'Cross-attention',
    body: 'The decoder asks questions of the encoder. Queries come from the text being written; Keys and Values come from the encoder output. This is how the output stays faithful to the input sentence.',
    shape: 'queries: m × d_model, keys/values: n × d_model',
    chapter: 'masking',
  },
  addnorm: {
    title: 'Add & Norm',
    body: 'Adds the sublayer output back onto its input (residual connection), then normalises the result. Keeps information and numbers stable through many layers.',
    shape: 'n × d_model (unchanged)',
    chapter: 'add-norm',
  },
  ffn: {
    title: 'Feed-forward network',
    body: 'Each token, on its own, is expanded to a wider hidden layer, passed through an activation function and contracted back. This is where gathered context gets processed.',
    shape: 'n × d_model → n × d_ff → n × d_model',
    chapter: 'feed-forward',
  },
  encout: {
    title: 'Encoder output',
    body: 'One context-rich vector per input token. The decoder reads these through cross-attention in every one of its blocks.',
    shape: 'n × d_model',
  },
  linear: {
    title: 'Linear (unembedding)',
    body: 'Converts the final vector into one raw score (a logit) for every token in the vocabulary. It is the embedding lookup in reverse, and often shares its weights with the embedding table.',
    shape: 'd_model → V scores',
    chapter: 'output',
  },
  softmax: {
    title: 'Softmax',
    body: 'Turns the V scores into probabilities that sum to 100%.',
    shape: 'V probabilities',
    chapter: 'output',
  },
  out: {
    title: 'Next-token probabilities',
    body: 'A probability for every token in the vocabulary. One is chosen, appended to the text, and the whole model runs again.',
    shape: 'V probabilities',
    chapter: 'output',
  },
  head: {
    title: 'Task head',
    body: 'A small layer on top that turns the token vectors into whatever the task needs: a label for the whole text (spam / not spam), a tag per token, or the identity of a blanked-out word.',
    shape: 'depends on the task',
  },
  result: {
    title: 'Result',
    body: 'For an encoder-only model: a classification, a set of tags, or an embedding vector used for search.',
    shape: 'depends on the task',
  },
};

const B = (key, label, kind, small) => ({ key, label, kind, small });
const ENC_BLOCK = [B('mha', 'Multi-head self-attention', 'attn'), B('addnorm', 'Add & Norm', 'norm'), B('ffn', 'Feed-forward', 'ffn'), B('addnorm', 'Add & Norm', 'norm')];
const DEC_BLOCK = [B('mmha', 'Masked multi-head self-attention', 'attn'), B('addnorm', 'Add & Norm', 'norm'), B('ffn', 'Feed-forward', 'ffn'), B('addnorm', 'Add & Norm', 'norm')];

const ARCHS = {
  decoder: {
    label: 'Decoder-only (GPT, Claude, Llama)',
    blurb: 'The design behind today’s chat models. One stack that reads the text so far and predicts the next token. No encoder, so no cross-attention.',
    cols: [
      {
        title: 'Decoder stack',
        items: [
          B('input', 'Input text', 'io', '“The cat sat on the”'),
          B('tokens', 'Tokenizer'),
          B('embed', 'Token embedding'),
          B('pos', '+ Positional encoding'),
          { repeat: DEC_BLOCK },
          B('linear', 'Linear (unembedding)'),
          B('softmax', 'Softmax'),
          B('out', 'Next-token probabilities', 'io', 'mat 58% · floor 14% · …'),
        ],
      },
    ],
  },
  encdec: {
    label: 'Encoder–decoder (original, 2017)',
    blurb: 'The original design, built for translation. The encoder reads the whole source sentence. The decoder writes the translation one token at a time, consulting the encoder through cross-attention.',
    cols: [
      {
        title: 'Encoder (reads the input)',
        items: [
          B('input', 'Source text', 'io', '“Le chat dort”'),
          B('embedpos', 'Embedding + position'),
          { repeat: ENC_BLOCK },
          B('encout', 'Encoder output', 'io', 'sent to every decoder block →'),
        ],
      },
      {
        title: 'Decoder (writes the output)',
        items: [
          B('input', 'Output so far', 'io', '“The cat”'),
          B('embedpos', 'Embedding + position'),
          {
            repeat: [
              B('mmha', 'Masked multi-head self-attention', 'attn'),
              B('addnorm', 'Add & Norm', 'norm'),
              B('cross', 'Cross-attention', 'attn', '← Keys & Values from the encoder'),
              B('addnorm', 'Add & Norm', 'norm'),
              B('ffn', 'Feed-forward', 'ffn'),
              B('addnorm', 'Add & Norm', 'norm'),
            ],
          },
          B('linear', 'Linear (unembedding)'),
          B('softmax', 'Softmax'),
          B('out', 'Next-token probabilities', 'io', 'sleeps 71% · is 9% · …'),
        ],
      },
    ],
  },
  encoder: {
    label: 'Encoder-only (BERT)',
    blurb: 'Built for understanding, not writing. With no mask, every token sees the whole text in both directions. Used for classification, search and embeddings.',
    cols: [
      {
        title: 'Encoder stack',
        items: [
          B('input', 'Input text', 'io', '“This film was great”'),
          B('tokens', 'Tokenizer'),
          B('embedpos', 'Embedding + position'),
          { repeat: ENC_BLOCK },
          B('head', 'Task head'),
          B('result', 'Result', 'io', 'sentiment: positive'),
        ],
      },
    ],
  },
};

function ArchFigure({ go }) {
  const [arch, setArch] = useState('decoder');
  const [sel, setSel] = useState({ id: 'decoder-0-r4-0', key: 'mmha' });
  const a = ARCHS[arch];
  const d = DETAILS[sel.key];

  const box = (item, id) => (
    <button
      key={id}
      type="button"
      className={`arch-box${item.kind ? ` k-${item.kind}` : ''}${sel.id === id ? ' is-on' : ''}`}
      onClick={() => setSel({ id, key: item.key })}
      aria-pressed={sel.id === id}
    >
      {item.label}
      {item.small && <small>{item.small}</small>}
    </button>
  );

  const column = (col, c) => {
    const out = [];
    col.items.forEach((item, i) => {
      if (i > 0) out.push(<div key={`ar${i}`} className="arch-arrow">↓</div>);
      if (item.repeat) {
        out.push(
          <div key={`rep${i}`} className="arch-repeat">
            <span className="arch-times">× N layers</span>
            {item.repeat.map((r, k) => (
              <div key={k} style={{ display: 'contents' }}>
                {k > 0 && <div className="arch-arrow">↓</div>}
                {box(r, `${arch}-${c}-r${i}-${k}`)}
              </div>
            ))}
          </div>
        );
      } else {
        out.push(box(item, `${arch}-${c}-${i}`));
      }
    });
    return out;
  };

  return (
    <Figure title="The Transformer, box by box" hint="Click any box" caption={a.blurb}>
      <div className="controls">
        <Seg
          label="Architecture"
          value={arch}
          onChange={(v) => {
            setArch(v);
            const first = ARCHS[v].cols[0].items.find((it) => it.repeat);
            const idx = ARCHS[v].cols[0].items.indexOf(first);
            setSel({ id: `${v}-0-r${idx}-0`, key: first.repeat[0].key });
          }}
          options={Object.entries(ARCHS).map(([value, v]) => ({ value, label: v.label }))}
        />
      </div>
      <div className="arch">
        {a.cols.map((col, c) => (
          <div className="arch-col" key={col.title}>
            <div className="arch-coltitle">{col.title}</div>
            {column(col, c)}
          </div>
        ))}
        <div className="arch-detail">
          <h4>{d.title}</h4>
          <p>{d.body}</p>
          <dl className="kv">
            <dt>Shape</dt>
            <dd>{d.shape}</dd>
          </dl>
          {d.chapter && (
            <p className="small">
              <button className="linkish" onClick={() => go(d.chapter)}>
                Revisit this chapter →
              </button>
            </p>
          )}
          <p className="small muted" style={{ marginTop: 14 }}>
            Data flows from top to bottom here. (The original paper draws it bottom to top.) Colored edges mark the
            three kinds of sublayer: attention, feed-forward, and Add &amp; Norm.
          </p>
        </div>
      </div>
    </Figure>
  );
}

const DMS = [64, 512, 768, 4096];
const VS = [1000, 32000, 50257, 100000];

function ShapeFigure() {
  const [n, setN] = useState(6);
  const [di, setDi] = useState(1);
  const [vi, setVi] = useState(2);
  const d = DMS[di];
  const V = VS[vi];
  const f = (x) => x.toLocaleString();
  const rows = [
    ['Token IDs', `${n}`, f(n), 'one integer per token'],
    ['After embedding + position', `${n} × ${f(d)}`, f(n * d), 'one vector per token'],
    ['After every Transformer block', `${n} × ${f(d)}`, f(n * d), 'same shape in, same shape out'],
    ['After the final linear layer', `${n} × ${f(V)}`, f(n * V), 'a score per vocabulary token, at every position'],
    ['Next-token prediction', `${f(V)}`, f(V), 'softmax of the last position’s scores'],
  ];
  return (
    <Figure
      title="Follow the shapes"
      caption="The stream of vectors keeps the same shape (n × d_model) through the whole stack. Only the very last step widens out to the vocabulary size. When generating, only the last position’s prediction is used."
    >
      <div className="controls">
        <Slider label="Tokens in the text (n)" value={n} min={1} max={64} onChange={setN} />
        <Slider label="Vector size (d_model)" value={di} min={0} max={3} onChange={setDi} format={(v) => f(DMS[v])} />
        <Slider label="Vocabulary size (V)" value={vi} min={0} max={3} onChange={setVi} format={(v) => f(VS[v])} />
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Shape</th>
            <th className="num">Numbers held</th>
            <th style={{ paddingLeft: 16 }}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td>{r[0]}</td>
              <td className="mono">{r[1]}</td>
              <td className="num">{r[2]}</td>
              <td className="muted" style={{ paddingLeft: 16 }}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Figure>
  );
}

export default function Architecture({ go }) {
  return (
    <>
      <h1>The full architecture</h1>
      <p className="lead">
        You have now met every part. This chapter snaps them together. A Transformer is a short list of components,
        with one block of them repeated many times.
      </p>

      <h2>One block, repeated</h2>
      <p>The repeating unit is called a <strong>Transformer block</strong> (or layer). It has two halves:</p>
      <ol>
        <li>
          <strong>Multi-head attention</strong>, wrapped in Add &amp; Norm. Tokens exchange information.
        </li>
        <li>
          <strong>Feed-forward network</strong>, wrapped in Add &amp; Norm. Each token processes what it gathered.
        </li>
      </ol>
      <p>
        The block's output has the same shape as its input, so blocks can be stacked like bricks. The original
        Transformer stacked 6. Large modern models stack around a hundred.
      </p>

      <ArchFigure go={go} />

      <h2>Three families of Transformer</h2>
      <p>
        Switch the tabs in the figure above to compare them. They are built from identical parts. The differences
        are whether tokens may look ahead, and whether there is a second stack.
      </p>
      <div className="cards">
        <div className="card">
          <h4>Encoder–decoder</h4>
          <p>Turns one sequence into another: translation, summarisation. Examples: the original Transformer, T5, BART.</p>
        </div>
        <div className="card">
          <h4>Decoder-only</h4>
          <p>Continues a text. It turned out that almost any task can be phrased as “continue this text”, which is why this family now dominates. Examples: GPT, Claude, Llama, Gemini.</p>
        </div>
        <div className="card">
          <h4>Encoder-only</h4>
          <p>Reads a complete text and produces a representation of it. Examples: BERT and the embedding models used for search.</p>
        </div>
      </div>

      <h2>Follow the shapes</h2>
      <p>
        A reliable way to check that you understand a network is to follow the size of the data through it. Here{' '}
        <Tex>n</Tex> is the number of tokens, <Tex>{String.raw`d_{\text{model}}`}</Tex> the vector size, and{' '}
        <Tex>V</Tex> the vocabulary size.
      </p>

      <ShapeFigure />

      <h2>What do the layers do?</h2>
      <p>
        Each block refines the token vectors a little. Studies of trained models suggest a rough progression as you
        climb the stack:
      </p>
      <ul>
        <li><strong>Early layers</strong> handle surface features: which words are neighbours, basic grammar, parts of speech.</li>
        <li><strong>Middle layers</strong> work out relationships: who did what to whom, what “it” refers to, facts about named things.</li>
        <li><strong>Late layers</strong> prepare the answer: shaping the final vector toward the specific next token.</li>
      </ul>

      <h2>How big are real models?</h2>
      <Figure title="The same blueprint at different scales">
        <table className="tbl">
          <thead>
            <tr>
              <th>Model</th>
              <th className="num">Layers N</th>
              <th className="num">d_model</th>
              <th className="num">Heads</th>
              <th className="num">d_ff</th>
              <th className="num">Parameters</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Original Transformer (base), 2017</td><td className="num">6 + 6</td><td className="num">512</td><td className="num">8</td><td className="num">2,048</td><td className="num">65 million</td></tr>
            <tr><td>BERT-base, 2018</td><td className="num">12</td><td className="num">768</td><td className="num">12</td><td className="num">3,072</td><td className="num">110 million</td></tr>
            <tr><td>GPT-2 small, 2019</td><td className="num">12</td><td className="num">768</td><td className="num">12</td><td className="num">3,072</td><td className="num">124 million</td></tr>
            <tr><td>GPT-3, 2020</td><td className="num">96</td><td className="num">12,288</td><td className="num">96</td><td className="num">49,152</td><td className="num">175 billion</td></tr>
          </tbody>
        </table>
      </Figure>

      <Callout kind="idea">
        Between a 65-million-parameter translator and a 175-billion-parameter language model, the blueprint barely
        changes. The same block, made wider and stacked deeper, and trained on far more text. That scalability is
        the Transformer's most important property.
      </Callout>
    </>
  );
}
