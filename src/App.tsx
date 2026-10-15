import { SCENES, useApp } from './lib/state';
import { tour, stats } from './lib/data';
import Home from './scenes/Home';
import Archive from './scenes/Archive';
import DataLab from './scenes/DataLab';
import Finder from './scenes/Finder';
import Ticket from './scenes/Ticket';

function LangSwitch() {
  const { lang, set } = useApp();
  return (
    <div className="langsw" role="group" aria-label="Language / 语言">
      <button className={lang === 'zh' ? 'is-on' : ''} onClick={() => set({ lang: 'zh' })} aria-pressed={lang === 'zh'}>中</button>
      <button className={lang === 'en' ? 'is-on' : ''} onClick={() => set({ lang: 'en' })} aria-pressed={lang === 'en'}>EN</button>
    </div>
  );
}

export default function App() {
  const { scene, go, lang, t } = useApp();
  const Scene = { home: Home, archive: Archive, lab: DataLab, finder: Finder, ticket: Ticket }[scene];

  return (
    <div className="app">
      <header className="top">
        <button className="wordmark" onClick={() => go('home')} aria-label={t('BTS SETLIST LAB 首页', 'BTS SETLIST LAB home')}>
          <span className="wordmark__main">BTS SETLIST LAB</span>
          <span className="wordmark__sub">ARIRANG · SSA</span>
        </button>
        <nav className="index-nav" aria-label={t('主导航', 'Main navigation')}>
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
        <LangSwitch />
        <div className="top__meta">
          <span className="top__credit">{t('made by 霹雳小猫', 'made by Pilicat.')}</span>
          <span className="top__date">DATA {tour.dataUpdatedAt.replace(/-/g, '.')}</span>
          <span>
            {stats.verified}/{stats.total} VERIFIED
          </span>
        </div>
      </header>

      <main className="stage">
        <div className="scene" key={scene + lang}>
          <Scene />
        </div>
      </main>

      <nav className="dock" aria-label={t('底部导航', 'Bottom navigation')}>
        {SCENES.map((s) => (
          <button
            key={s.id}
            className={`dock__item ${scene === s.id ? 'is-on' : ''}`}
            onClick={() => go(s.id)}
            aria-current={scene === s.id ? 'page' : undefined}
          >
            <span className="dock__no">{s.no}</span>
            <span className="dock__zh">{lang === 'en' ? s.short : s.zh}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
