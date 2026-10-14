import { SCENES, useApp } from './lib/state';
import { tour, stats } from './lib/data';
import Home from './scenes/Home';
import Archive from './scenes/Archive';
import DataLab from './scenes/DataLab';
import Finder from './scenes/Finder';
import Ticket from './scenes/Ticket';

export default function App() {
  const { scene, go } = useApp();
  const Scene = { home: Home, archive: Archive, lab: DataLab, finder: Finder, ticket: Ticket }[scene];

  return (
    <div className="app">
      <header className="top">
        <button className="wordmark" onClick={() => go('home')} aria-label="BTS SETLIST LAB 首页">
          <span className="wordmark__main">BTS SETLIST LAB</span>
          <span className="wordmark__sub">ARIRANG · SSA</span>
        </button>
        <nav className="index-nav" aria-label="主导航">
          {SCENES.map((s) => (
            <button
              key={s.id}
              className={`index-nav__item ${scene === s.id ? 'is-on' : ''}`}
              onClick={() => go(s.id)}
              aria-current={scene === s.id ? 'page' : undefined}
            >
              <span className="index-nav__no">{s.no}</span>
              <span className="index-nav__en">{s.en}</span>
            </button>
          ))}
        </nav>
        <div className="top__meta">
          <span>DATA {tour.dataUpdatedAt.replace(/-/g, '.')}</span>
          <span>
            {stats.verified}/{stats.total} VERIFIED
          </span>
        </div>
      </header>

      <main className="stage">
        <div className="scene" key={scene}>
          <Scene />
        </div>
      </main>

      <nav className="dock" aria-label="底部导航">
        {SCENES.map((s) => (
          <button
            key={s.id}
            className={`dock__item ${scene === s.id ? 'is-on' : ''}`}
            onClick={() => go(s.id)}
            aria-current={scene === s.id ? 'page' : undefined}
          >
            <span className="dock__no">{s.no}</span>
            <span className="dock__zh">{s.zh}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
