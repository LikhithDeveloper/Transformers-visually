import { useMemo, useState } from 'react';
import { Btn, Callout, Figure, Tok } from '../components/ui.jsx';

// A tiny teaching vocabulary: whole words first, then reusable word pieces.
const WORDS = `the a an and or but of to in on at for with by from is are was were be been it this that these those
i you he she we they my your his her our their not no yes do does did have has had can will would could should
cat dog mat sat sit run walk eat ate sleep bank river money animal street cross tired wide because too king queen
man woman hello world love like learn model token word text attention transform transformer machine play happy
kind believe quick brown fox jump over lazy how what why when where who all need new good big small time day
people think know see look make work read write language number vector deep neural network train data very more
most one two three power understand`.split(/\s+/);

const PIECES = `ization believ happi ably tion ness ment able less ing est ful ize ity ous ive pre dis un re ed er ly es al
n't 's a b c d e f g h i j k l m n o p q r s t u v w x y z 0 1 2 3 4 5 6 7 8 9 '`.split(/\s+/);

const PUNCT = ['.', ',', '!', '?', ';', ':', '-', '"', '(', ')'];

const VOCAB = [...new Set([...WORDS, ...PIECES, ...PUNCT])];
const ID = new Map(VOCAB.map((w, i) => [w, i + 100]));
const BY_LENGTH = [...VOCAB].sort((a, b) => b.length - a.length);

/** Greedy longest-match subword tokenizer (the idea behind WordPiece). */
function tokenize(text) {
  const out = [];
  const chunks = text.match(/[A-Za-z']+|\d|[^\sA-Za-z\d]/g) || [];
  for (const chunk of chunks) {
    const word = chunk.toLowerCase();
    if (ID.has(word)) {
      out.push({ text: chunk, id: ID.get(word), cont: false });
      continue;
    }
    let p = 0;
    while (p < word.length) {
      const piece = BY_LENGTH.find((v) => word.startsWith(v, p));
      if (!piece) {
        out.push({ text: chunk[p], id: 1, cont: p > 0, unk: true });
        p += 1;
        continue;
      }
      out.push({ text: chunk.slice(p, p + piece.length), id: ID.get(piece) + (p > 0 ? 1000 : 0), cont: p > 0 });
      p += piece.length;
    }
  }
  return out;
}

const EXAMPLES = [
  'The cat sat on the mat.',
  'Transformers are unbelievably powerful!',
  'Tokenization of unhappiness',
  'zyxq',
];

export default function Tokens() {
  const [text, setText] = useState(EXAMPLES[1]);
  const tokens = useMemo(() => tokenize(text), [text]);
  const wordCount = (text.match(/\S+/g) || []).length;

  return (
    <>
      <h1>Text becomes tokens</h1>
      <p className="lead">
        A neural network can only do arithmetic. So before anything else, text has to become numbers. The first step
        is to chop the text into small pieces called <strong>tokens</strong> and give each piece an ID number.
      </p>

      <h2>Try it</h2>
      <p>
        Type anything below. Common words stay whole. Rarer words are broken into smaller known pieces (shown with a{' '}
        <code>##</code> prefix, meaning “glued to the previous piece”).
      </p>

      <Figure
        title="A small tokenizer"
        hint={`${wordCount} word${wordCount === 1 ? '' : 's'} → ${tokens.length} token${tokens.length === 1 ? '' : 's'}`}
        caption="This demo uses a tiny dictionary of about 200 entries. Real models use the same idea with 50,000 to 200,000 entries."
      >
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence…"
          aria-label="Text to tokenize"
          spellCheck="false"
        />
        <div className="controls is-bottom" style={{ gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <Btn key={ex} onClick={() => setText(ex)}>
              {ex}
            </Btn>
          ))}
        </div>

        <h3>1. Split into tokens</h3>
        <div className="toks">
          {tokens.length === 0 && <span className="muted small">Nothing to tokenize yet.</span>}
          {tokens.map((t, i) => (
            <Tok key={i} sub={t.unk ? 'unknown' : t.id} tint={i % 2 ? 'b' : 'a'}>
              {(t.cont ? '##' : '') + t.text}
            </Tok>
          ))}
        </div>

        <h3>2. What the model actually receives</h3>
        <div className="sample">[{tokens.map((t) => t.id).join(', ')}]</div>
      </Figure>

      <Callout kind="idea">
        After this step the words are gone. The model only ever sees a list of integers. Everything it “knows” about
        language has to be learned from patterns in those integers.
      </Callout>

      <h2>Why pieces, and not letters or whole words?</h2>
      <div className="cards">
        <div className="card">
          <h4>Letters only</h4>
          <p>
            Tiny dictionary (about 100 symbols), but sentences become very long, and a single letter like “t” carries
            almost no meaning.
          </p>
        </div>
        <div className="card">
          <h4>Whole words only</h4>
          <p>
            Each token is meaningful, but the dictionary would need millions of entries, and any new word (“skibidi”,
            a typo, a name) would be unknown.
          </p>
        </div>
        <div className="card">
          <h4>Word pieces (what is used)</h4>
          <p>
            Frequent words are one token. Rare words are built from pieces. Nothing is ever unknown, and the
            dictionary stays a manageable size.
          </p>
        </div>
      </div>

      <p>
        Notice how the tokenizer handled <em>“unbelievably”</em>: <code>un</code> + <code>believ</code> +{' '}
        <code>ably</code>. The model has seen each of those pieces thousands of times in other words, so it can make a
        good guess at the meaning of a word it has never seen whole.
      </p>

      <Callout kind="note" title="How real tokenizers are built">
        Real systems learn their dictionary from data with an algorithm called <strong>Byte-Pair Encoding (BPE)</strong>:
        start with single characters, find the pair of neighbouring pieces that appears most often, merge it into a new
        piece, and repeat tens of thousands of times. A useful rule of thumb for English: one token is about four
        characters, or roughly three quarters of a word.
      </Callout>

      <h2>Words to remember</h2>
      <ul>
        <li>
          <strong>Token</strong>: one piece of text (a word, part of a word, or punctuation).
        </li>
        <li>
          <strong>Vocabulary</strong>: the fixed dictionary of all tokens the model knows. Its size is written{' '}
          <em>V</em>.
        </li>
        <li>
          <strong>Token ID</strong>: a token's row number in that dictionary.
        </li>
      </ul>
      <p>
        An ID like 3797 is just a label. It says nothing about meaning: token 3797 is not “close to” token 3798. The
        next chapter fixes that.
      </p>
    </>
  );
}
