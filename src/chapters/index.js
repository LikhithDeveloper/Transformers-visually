import Intro from './01-Intro.jsx';
import Tokens from './02-Tokens.jsx';
import Embeddings from './03-Embeddings.jsx';
import Toolkit from './04-Toolkit.jsx';
import Position from './05-Position.jsx';
import Intuition from './06-Intuition.jsx';
import AttentionMath from './07-AttentionMath.jsx';
import MultiHead from './08-MultiHead.jsx';
import Masking from './09-Masking.jsx';
import AddNorm from './10-AddNorm.jsx';
import FeedForward from './11-FeedForward.jsx';
import Architecture from './12-Architecture.jsx';
import Output from './13-Output.jsx';
import Training from './14-Training.jsx';
import Recap from './15-Recap.jsx';

const P1 = 'Part 1 · Foundations';
const P2 = 'Part 2 · Attention';
const P3 = 'Part 3 · The full machine';
const P4 = 'Part 4 · Using and training it';

export const PARTS = [P1, P2, P3, P4];

export const CHAPTERS = [
  { id: 'intro', nav: 'What is a Transformer?', part: P1, Component: Intro },
  { id: 'tokens', nav: 'Text becomes tokens', part: P1, Component: Tokens },
  { id: 'embeddings', nav: 'Tokens become vectors', part: P1, Component: Embeddings },
  { id: 'toolkit', nav: 'Math toolkit: dot product & softmax', part: P1, Component: Toolkit },
  { id: 'position', nav: 'Positional encoding', part: P1, Component: Position },
  { id: 'intuition', nav: 'Attention: the intuition', part: P2, Component: Intuition },
  { id: 'attention-math', nav: 'Self-attention: the math', part: P2, Component: AttentionMath },
  { id: 'multi-head', nav: 'Multi-head attention', part: P2, Component: MultiHead },
  { id: 'masking', nav: 'Masking & kinds of attention', part: P2, Component: Masking },
  { id: 'add-norm', nav: 'Residuals & layer norm', part: P3, Component: AddNorm },
  { id: 'feed-forward', nav: 'Feed-forward network', part: P3, Component: FeedForward },
  { id: 'architecture', nav: 'The full architecture', part: P3, Component: Architecture },
  { id: 'output', nav: 'Predicting the next word', part: P4, Component: Output },
  { id: 'training', nav: 'How it learns', part: P4, Component: Training },
  { id: 'recap', nav: 'Recap & cheat sheet', part: P4, Component: Recap },
];
