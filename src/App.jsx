import { useCallback, useEffect, useState } from 'react';
import { CHAPTERS, PARTS } from './chapters/index.js';
import { useTheme } from './lib/theme.jsx';

const idFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return CHAPTERS.some((c) => c.id === id) ? id : CHAPTERS[0].id;
};

function loadVisited() {
  try {
    return JSON.parse(localStorage.getItem('tv-visited') || '[]');
  } catch (e) {
    return [];
  }
}

export default function App() {
  const { dark, toggle } = useTheme();
  const [current, setCurrent] = useState(idFromHash);
  const [visited, setVisited] = useState(loadVisited);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setCurrent(idFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    setVisited((v) => {
      if (v.includes(current)) return v;
      const next = [...v, current];
      try {
        localStorage.setItem('tv-visited', JSON.stringify(next));
      } catch (e) {
        /* progress just won't persist */
      }
      return next;
    });
  }, [current]);

  const go = useCallback((id) => {
    window.location.hash = `/${id}`;
  }, []);

  const index = CHAPTERS.findIndex((c) => c.id === current);
  const chapter = CHAPTERS[index];
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];
  const Body = chapter.Component;
  const doneCount = CHAPTERS.filter((c) => visited.includes(c.id)).length;

  return (
    <div className="app">
      {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <nav className={`sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Chapters">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ opacity: [1, 0.35, 0.6, 0.35, 1, 0.35, 0.6, 0.35, 1][i] }} />
            ))}
          </div>
          <div>
            <div className="brand-name">Transformers, Visually</div>
            <div className="brand-sub">Self-attention from scratch</div>
          </div>
        </div>
        <div className="progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(doneCount / CHAPTERS.length) * 100}%` }} />
          </div>
          <div className="progress-text">
            {doneCount} of {CHAPTERS.length} chapters opened
          </div>
        </div>
        {PARTS.map((part) => (
          <div key={part}>
            <div className="nav-part">{part}</div>
            {CHAPTERS.filter((c) => c.part === part).map((c) => {
              const n = CHAPTERS.indexOf(c) + 1;
              const cls = `nav-item${c.id === current ? ' is-active' : ''}${visited.includes(c.id) ? ' is-done' : ''}`;
              return (
                <button
                  key={c.id}
                  className={cls}
                  onClick={() => go(c.id)}
                  aria-current={c.id === current ? 'page' : undefined}
                >
                  <span className="nav-num">{n}</span>
                  <span>{c.nav}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-btn" onClick={() => setMenuOpen(true)}>
              ☰ Chapters
            </button>
            <span className="topbar-title">
              Chapter {index + 1} of {CHAPTERS.length} · {chapter.nav}
            </span>
          </div>
          <button className="icon-btn" onClick={toggle} aria-label="Toggle dark mode">
            {dark ? '☀ Light' : '☾ Dark'}
          </button>
        </header>

        <main className="chapter" key={chapter.id}>
          <div className="kicker">
            {chapter.part} · Chapter {index + 1}
          </div>
          <Body go={go} />

          <div className="pager">
            {prev && (
              <button className="pager-btn" onClick={() => go(prev.id)}>
                <div className="pager-dir">← Previous</div>
                <div className="pager-title">{prev.nav}</div>
              </button>
            )}
            {next && (
              <button className="pager-btn is-next" onClick={() => go(next.id)}>
                <div className="pager-dir">Next →</div>
                <div className="pager-title">{next.nav}</div>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
