import { useMemo, useState } from 'react';
import { useApp } from '../lib/state';
import {
  appearances, catalogSize, dayLabel, fmtDate, pad, ranking, songById, stats, unplayed, verifiedShows, type Show, type Song,
} from '../lib/data';
import { albumName, cityName, countryName, regionLabel, shortName, type Lang } from '../lib/i18n';
import { Arrow } from '../components/bits';


type Sort = 'count' | 'first' | 'az';
type Density = 's' | 'm' | 'l';

export default function DataLab() {
  const { songId, set, go, lang, t } = useApp();
  const [tab, setTab] = useState<'rank' | 'rare' | 'unplayed'>('rank');
  const [uSort, setUSort] = useState<'az' | 'release'>('release');
  const [sort, setSort] = useState<Sort>('count');
  const [region, setRegion] = useState('all');
  const [min, setMin] = useState(1);
  const [density, setDensity] = useState<Density>('m');
  const [inspect, setInspect] = useState<{ show: Show; songId: string } | null>(null);

  const max = ranking[0]?.count ?? 1;
  const regions = ['all', ...new Set(verifiedShows.map((s) => s.region))];

  const cols = useMemo(() => verifiedShows.filter((s) => region === 'all' || s.region === region), [region]);
  const rows = useMemo(() => {
    const colIds = new Set(cols.map((c) => c.showId));
    const r = ranking
      .map((row) => ({ ...row, inView: (appearances.get(row.song.songId) ?? []).filter((a) => colIds.has(a.show.showId)).length }))
      .filter((row) => row.count >= min && row.inView > 0);
    if (sort === 'first') r.sort((a, b) => (a.first.date < b.first.date ? -1 : a.first.date > b.first.date ? 1 : 0));
    if (sort === 'az') r.sort((a, b) => a.song.title.localeCompare(b.song.title));
    return r;
  }, [cols, sort, min]);

  const lit = useMemo(() => {
    const m = new Set<string>();
    for (const [id, list] of appearances) for (const a of list) m.add(`${id}|${a.show.showId}`);
    return m;
  }, []);

  const selectSong = (id: string) => set({ songId: songId === id ? null : id });

  return (
    <section className="lab">
      {/* ------------------------------------------------ overview line */}
      <div className="lab__over">
        <div className="figure">
          <b>{stats.verified}</b>
          <span>{t('已核实场次', 'verified shows')}<em>/ {t(`共 ${stats.total} 场 · ${stats.cities} 座城市`, `of ${stats.total} · ${stats.cities} cities`)}</em></span>
        </div>
        <div className="figure">
          <b>{stats.plays}</b>
          <span>{t('随机曲目总次数', 'surprise song plays')}</span>
        </div>
        <div className="figure">
          <b>{stats.unique}</b>
          <span>{t('不重复曲目', 'different songs')}</span>
        </div>
        <div className="figure figure--top">
          <b className="red"><i className="x">×</i>{stats.top[0]?.count}</b>
          <span>
            {t('最常出现', 'Most played')}
            <em>
              {stats.top.map((t, i) => (
                <span key={t.song.songId}>
                  {i > 0 && <span className="muted"> / </span>}
                  <button className="link" onClick={() => go('finder', { songId: t.song.songId })}>
                    {t.song.title}
                  </button>
                </span>
              ))}
            </em>
          </span>
        </div>
      </div>

      {/* ------------------------------------------------- left column */}
      <aside className="lab__side">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'rank'} className={tab === 'rank' ? 'is-on' : ''} onClick={() => setTab('rank')}>
            RANKING <em>{t('出现次数', 'by plays')}</em>
          </button>
          <button role="tab" aria-selected={tab === 'rare'} className={tab === 'rare' ? 'is-on' : ''} onClick={() => setTab('rare')}>
            RARE <em>{t('仅出现一次', 'played once')} · {stats.once.length}</em>
          </button>
          <button role="tab" aria-selected={tab === 'unplayed'} className={tab === 'unplayed' ? 'is-on' : ''} onClick={() => setTab('unplayed')}>
            UNPLAYED <em>{t('未出现', 'not yet')} · {unplayed.length}</em>
          </button>
        </div>
        {tab === 'unplayed' ? (
          <Unplayed lang={lang} sort={uSort} setSort={setUSort} onSong={(id) => go('finder', { songId: id, query: '' })} />
        ) : (
        <div className="ranklist">
          {(tab === 'rank' ? ranking : stats.once).map((r) => {
            const on = songId === r.song.songId;
            const rank = ranking.findIndex((x) => x.count === r.count) + 1;
            const apps = appearances.get(r.song.songId) ?? [];
            return (
              <div key={r.song.songId} className={`rank ${on ? 'is-on' : ''}`}>
                <button className="rank__row" onClick={() => selectSong(r.song.songId)} aria-expanded={on}>
                  <span className="rank__n">{tab === 'rank' ? pad(rank, 2) : '—'}</span>
                  <span className="rank__t">
                    {r.song.title}
                    {r.song.titleKo && <i>{r.song.titleKo}</i>}
                  </span>
                  <span className="rank__bar"><i style={{ width: `${(r.count / max) * 100}%` }} /></span>
                  <span className="rank__c">{r.count}</span>
                </button>
                {(on || tab === 'rare') && (
                  <ul className="rank__apps">
                    {apps.map((a) => (
                      <li key={a.show.showId}>
                        <button onClick={() => go('archive', { showId: a.show.showId })}>
                          <span className="mono">{fmtDate(a.show.date)}</span>
                          <span>{cityName(a.show, lang)} {dayLabel(a.show)}</span>
                          <Arrow />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        )}
      </aside>

      {/* ------------------------------------------------------ matrix */}
      <div className="lab__matrix">
        <div className="mx-controls">
          <span className="mx-title">SURPRISE SONG MATRIX</span>
          <label>
            {t('排序', 'Sort')}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="count">{t('按次数', 'Most played')}</option>
              <option value="first">{t('按首次出现', 'First played')}</option>
              <option value="az">A–Z</option>
            </select>
          </label>
          <label>
            {t('地区', 'Region')}
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {regions.map((r) => <option key={r} value={r}>{r === 'all' ? t('全部', 'All') : regionLabel(r, lang)}</option>)}
            </select>
          </label>
          <label>
            {t('至少', 'At least')}
            <select value={min} onChange={(e) => setMin(+e.target.value)}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{t(`${n} 次`, `${n}×`)}</option>)}
            </select>
          </label>
          <div className="seg" role="group" aria-label={t('矩阵密度', 'Matrix density')}>
            {(['s', 'm', 'l'] as Density[]).map((d) => (
              <button key={d} className={density === d ? 'is-on' : ''} onClick={() => setDensity(d)} aria-label={`${t('密度', 'Density')} ${d}`}>
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className={`mx-wrap mx--${density}`}>
          <table className="mx">
            <thead>
              <tr>
                <th className="mx__corner">
                  <span>{t(`${rows.length} 首 × ${cols.length} 场`, `${rows.length} songs × ${cols.length} shows`)}</span>
                </th>
                {cols.map((s, i) => {
                  const first = i === 0 || cols[i - 1].cityKey !== s.cityKey;
                  return (
                    <th key={s.showId} className={`mx__col ${first ? 'is-first' : ''} ${inspect?.show.showId === s.showId ? 'is-hot' : ''}`} title={`${s.cityZh} ${s.city} ${dayLabel(s)} · ${fmtDate(s.date)}`}>
                      <span>{shortName(s, lang)}<b>{s.dayIndex}</b></span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const on = songId === r.song.songId;
                return (
                  <tr key={r.song.songId} className={`${on ? 'is-on' : ''} ${inspect?.songId === r.song.songId ? 'is-hot' : ''}`}>
                    <th className="mx__row">
                      <button onClick={() => selectSong(r.song.songId)}>
                        <span>{r.song.title}</span>
                        <b>{r.count}</b>
                      </button>
                    </th>
                    {cols.map((s, i) => {
                      const first = i === 0 || cols[i - 1].cityKey !== s.cityKey;
                      const isLit = lit.has(`${r.song.songId}|${s.showId}`);
                      return (
                        <td key={s.showId} className={first ? 'is-first' : ''}>
                          {isLit && (
                            <button
                              className={`cell ${inspect?.show.showId === s.showId && inspect.songId === r.song.songId ? 'is-sel' : ''}`}
                              style={{ animationDelay: `${Math.min(i * 6, 400)}ms` }}
                              onMouseEnter={() => setInspect({ show: s, songId: r.song.songId })}
                              onFocus={() => setInspect({ show: s, songId: r.song.songId })}
                              onClick={() => setInspect({ show: s, songId: r.song.songId })}
                              aria-label={`${r.song.title} · ${cityName(s, lang)} ${fmtDate(s.date)}`}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={`mx-inspect ${inspect ? 'is-on' : ''}`}>
          {inspect ? (
            <>
              <span className="mx-inspect__song">{songById.get(inspect.songId)!.title}</span>
              <span className="mx-inspect__city">{cityName(inspect.show, lang)} · {countryName(inspect.show, lang)}{lang === 'zh' && <em>{inspect.show.city}</em>}</span>
              <span className="mono">{fmtDate(inspect.show.date)}</span>
              <span className="mono">№{pad(inspect.show.seq)} · {dayLabel(inspect.show)}</span>
              <button className="link" onClick={() => go('archive', { showId: inspect.show.showId })}>{t('场次档案', 'Open show')} <Arrow /></button>
            </>
          ) : (
            <span className="muted">{t('悬停或点击红色格子，查看歌曲、城市、日期与场次。点击左侧歌名可高亮整行。', 'Hover or tap a red square to see the song, city, date and show. Tap a song name to highlight its row.')}</span>
          )}
        </div>
      </div>
    </section>
  );
}

function Unplayed({ lang, sort, setSort, onSong }: { lang: Lang; sort: 'az' | 'release'; setSort: (s: 'az' | 'release') => void; onSong: (id: string) => void }) {
  const t = (zh: string, en: string) => (lang === 'en' ? en : zh);
  const groups = useMemo(() => {
    const g = new Map<string, Song[]>();
    const list = [...unplayed].sort((a, b) =>
      sort === 'az'
        ? a.title.localeCompare(b.title, 'en', { numeric: true })
        : (a.released ?? '9').localeCompare(b.released ?? '9') || a.title.localeCompare(b.title, 'en', { numeric: true }),
    );
    for (const s of list) {
      const k = sort === 'az' ? (/[a-z]/i.test(s.title[0]) ? s.title[0].toUpperCase() : '#') : `${s.album ?? '—'}|${s.released ?? ''}`;
      g.set(k, [...(g.get(k) ?? []), s]);
    }
    return [...g.entries()];
  }, [sort]);
  return (
    <div className="ranklist unplayed">
      <div className="unplayed__head">
        <p>
          {t(`曲库共 ${catalogSize} 首团体曲与小分队曲，其中 `, `Of ${catalogSize} group and unit songs, `)}
          <b>{unplayed.length}</b>
          {t(' 首尚未在已核实场次中作为随机曲目出现。', " haven't been a surprise song at any verified show yet.")}
        </p>
        <div className="seg" role="group" aria-label={t('排序', 'Sort')}>
          <button className={sort === 'release' ? 'is-on' : ''} onClick={() => setSort('release')}>{t('按专辑发行', 'By release')}</button>
          <button className={sort === 'az' ? 'is-on' : ''} onClick={() => setSort('az')}>A–Z</button>
        </div>
      </div>
      {groups.map(([k, items]) => {
        const [album, date] = k.split('|');
        return (
          <div key={k} className="unplayed__group">
            {sort === 'az' ? (
              <div className="unplayed__k">{k}</div>
            ) : (
              <div className="unplayed__album">
                <span>{albumName(album, lang)}</span>
                <em className="mono">{date ? date.replace(/-/g, '.') : ''}</em>
              </div>
            )}
            {items.map((s) => (
              <button key={s.songId} className="unplayed__row" onClick={() => onSong(s.songId)}>
                <span className="rank__t">
                  {s.title}
                  {s.titleKo && <i>{s.titleKo}</i>}
                </span>
                {sort === 'az' && <span className="unplayed__meta">{albumName(s.album, lang)}{s.year ? ` · ${s.year}` : ''}</span>}
              </button>
            ))}
          </div>
        );
      })}
      <p className="unplayed__fine">
        {t(
          '范围：韩语、日语正式发行的团体曲与小分队曲。不含 solo 曲、Intro / Skit / Interlude、以其他艺人为主的合作曲、日语重录版，以及本巡演的固定曲目。',
          "Scope: officially released Korean and Japanese group and unit songs. Excludes solo songs, intros, skits and interludes, collaborations led by other artists, Japanese re-recordings, and songs in this tour's main setlist.",
        )}
      </p>
    </div>
  );
}
