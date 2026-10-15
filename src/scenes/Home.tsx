import { useApp } from '../lib/state';
import {
  appearances, cities, dayLabel, fmtDate, latestVerified, nextUpcoming, pad, songById, stats, tour, weekday,
} from '../lib/data';
import { cityName, countryName, shortName } from '../lib/i18n';
import { Arrow, StatusMark } from '../components/bits';

export default function Home() {
  const { go, lang, t } = useApp();
  const latest = latestVerified;

  return (
    <section className="home">
      <div className="home__title">
        <div className="home__meta">
          <span>VOL.01</span>
          <span>{tour.name}</span>
          <span>{tour.period.replace(/-/g, '.')}</span>
          <span className="home__credit">{t('made by 霹雳小猫', 'made by Pilicat.')}</span>
        </div>
        <h1 className="mast" aria-label="BTS SETLIST LAB">
          <span className="mast__l1">BTS</span>
          <span className="mast__l2">SETLIST</span>
          <span className="mast__l3">
            LAB<i className="mast__dot" aria-hidden />
          </span>
        </h1>
        <p className="home__sub">
          <span className="home__sub-en">ARIRANG TOUR — SURPRISE SONG ARCHIVE</span>
          <span className="home__sub-zh">
            {t('ARIRANG 世界巡演 · 每场两首随机曲目的逐场档案', 'Every surprise song from every night of the ARIRANG world tour')}
          </span>
        </p>
        <div className="home__cta">
          <button className="btn btn--black btn--xl" onClick={() => go('archive')}>
            <span>{t('探索场次', 'Explore the shows')}</span>
            <Arrow />
          </button>
          <button className="btn btn--line" onClick={() => go('finder')}>
            {t('查一首歌', 'Look up a song')} <Arrow />
          </button>
        </div>
      </div>

      <div className="home__art">
        <svg className="sun" viewBox="0 0 400 400" aria-hidden>
          <defs>
            <clipPath id="sunclip">
              <circle cx="200" cy="200" r="190" />
            </clipPath>
          </defs>
          <circle cx="200" cy="200" r="190" fill="var(--red)" />
          <g clipPath="url(#sunclip)">
            {Array.from({ length: 11 }, (_, i) => (
              <rect key={i} x="0" y={232 + i * 15} width="400" height={2 + i * 0.9} fill="var(--paper)" />
            ))}
          </g>
          <circle cx="200" cy="200" r="198" fill="none" stroke="var(--ink)" strokeWidth="1" />
        </svg>
        <div className="home__vert" aria-hidden>
          아리랑 · ARIRANG · {pad(stats.verified)} / {pad(stats.total)}
        </div>

        {latest && (
          <button className="latest" onClick={() => go('archive', { showId: latest.showId })}>
            <div className="latest__head">
              <span>LATEST VERIFIED</span>
              <span>№{pad(latest.seq)}</span>
            </div>
            <div className="latest__city">{cityName(latest, lang)}</div>
            {lang === 'zh' && <div className="latest__en">{latest.city.toUpperCase()} · {latest.country.toUpperCase()}</div>}
            <div className="latest__meta">
              {countryName(latest, lang)} · {dayLabel(latest)} · {fmtDate(latest.date)} {weekday(latest.date)}
              <br />
              {latest.venue}
            </div>
            <ol className="latest__tracks">
              {latest.surpriseSongs.map((e) => {
                const song = songById.get(e.songId)!;
                const n = appearances.get(e.songId)?.length ?? 0;
                return (
                  <li key={e.songId}>
                    <span className="latest__no">TRACK {String(e.slot).padStart(2, '0')}</span>
                    <span className="latest__song">{song.title}</span>
                    <span className="latest__count">{n === 1 ? t('巡演首唱', 'Tour debut') : `×${n}`}</span>
                  </li>
                );
              })}
            </ol>
            <div className="latest__foot">
              {t('打开场次档案', 'Open this show')} <Arrow />
            </div>
          </button>
        )}
      </div>

      <div className="timeline">
        <div className="timeline__legend">
          <span className="timeline__count">
            <b>{stats.verified}</b> / {stats.total}
          </span>
          <span><StatusMark status="VERIFIED" /> {t('已核实', 'Verified')}</span>
          {stats.pending > 0 && <span><StatusMark status="PENDING" /> {t('待核实', 'Pending')}</span>}
          <span><StatusMark status="UPCOMING" /> {t('未演出', 'Upcoming')}</span>
          {nextUpcoming && (
            <span className="timeline__next">
              {t('下一场', 'NEXT')} · {cityName(nextUpcoming, lang)} {fmtDate(nextUpcoming.date)}
            </span>
          )}
        </div>
        <div className="timeline__track" role="list">
          {cities.map((c) => (
            <div className="timeline__city" key={c.cityKey} role="listitem" style={{ flexGrow: c.shows.length }}>
              <div className="timeline__ticks">
                {c.shows.map((s) => (
                  <button
                    key={s.showId}
                    className={`tick tick--${s.status.toLowerCase()}`}
                    title={`№${pad(s.seq)} ${cityName(s, lang)} ${fmtDate(s.date)} · ${s.status}`}
                    aria-label={`${cityName(s, lang)} ${fmtDate(s.date)}`}
                    onClick={() => go('archive', { showId: s.showId })}
                  />
                ))}
              </div>
              <span className="timeline__label" title={`${c.cityZh} ${c.city}`}>{shortName(c, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
