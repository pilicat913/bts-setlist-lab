import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../lib/state';
import { appearances, dayLabel, fmtDate, pad, songById, songs, weekday } from '../lib/data';
import { albumName, cityName, countryName, formLabel, type Lang } from '../lib/i18n';
import { searchSongs } from '../lib/search';
import { Arrow } from '../components/bits';

const catalog = songs
  .filter((s) => appearances.has(s.songId))
  .sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }));

export default function Finder() {
  const { query, songId, set, go, lang, t } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchSongs(query), [query]);
  const song = songId ? songById.get(songId) ?? null : null;

  useEffect(() => {
    if (!songId && matchMedia('(pointer: fine)').matches) input.current?.focus();
  }, [songId]);

  const list = query.trim() ? hits.map((h) => h.song) : catalog;
  const groups = useMemo(() => {
    if (query.trim()) return [{ k: 'RESULTS', items: list }];
    const g = new Map<string, typeof list>();
    for (const s of list) {
      const k = /[a-z]/i.test(s.title[0]) ? s.title[0].toUpperCase() : '#';
      g.set(k, [...(g.get(k) ?? []), s]);
    }
    return [...g.entries()].map(([k, items]) => ({ k, items }));
  }, [list, query]);

  return (
    <section className={`finder ${song ? 'has-song' : ''}`}>
      <div className="finder__search">
        <label className="finder__label" htmlFor="q">
          SONG FINDER<span>{t('英文 / 한국어 / 中文译名 / 别名 · 输入即查', 'English / 한국어 / 中文 / nicknames · results as you type')}</span>
        </label>
        <div className="finder__field">
          <input
            id="q"
            ref={input}
            value={query}
            onChange={(e) => set({ query: e.target.value, songId: null })}
            placeholder={t('例如：Spring Day、봄날、春日', 'e.g. Spring Day, 봄날, Dope')}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query && <button className="sq" onClick={() => { set({ query: '', songId: null }); input.current?.focus(); }} aria-label={t('清空', 'Clear')}>×</button>}
        </div>
        <div className="finder__count mono">
          {query.trim() ? t(`${hits.length} 个匹配`, `${hits.length} matches`) : t(`已记录 ${catalog.length} 首随机曲目 · A–Z`, `${catalog.length} surprise songs so far · A–Z`)}
        </div>

        <div className="results">
          {query.trim() && hits.length === 0 && (
            <div className="none">
              <b>{t('当前已核实记录中尚未找到这首歌。', "This song isn't in the verified records yet.")}</b>
              <p>{t('这不代表它从未在本巡演中被演唱 —— 可能是名称写法未收录，或相关场次尚未核实录入。可以试试英文原名、韩文名或去掉标点。', "That doesn't mean it was never played on this tour. The spelling may differ, or the show may not be verified yet. Try the original English or Korean title, or drop punctuation.")}</p>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.k} className="results__group">
              {!query.trim() && <div className="results__k">{g.k}</div>}
              {g.items.map((s) => {
                const n = appearances.get(s.songId)?.length ?? 0;
                return (
                  <button key={s.songId} className={`res ${songId === s.songId ? 'is-on' : ''}`} onClick={() => set({ songId: s.songId })}>
                    <span className="res__t">{s.title}{s.titleKo && <i>{s.titleKo}</i>}</span>
                    {s.kind === 'setlist' && n === 0 ? <span className="res__fixed">{t('固定曲目', 'Main setlist')}</span> : <span className={`res__n ${n ? '' : 'is-zero'}`}><i className="x">×</i>{n}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="finder__detail">
        {song ? <Detail songId={song.songId} lang={lang} onBack={() => set({ songId: null })} go={go} /> : (
          <div className="finder__idle">
            <div className="finder__idle-big">?</div>
            <p>{t('选择左侧一首歌，或直接输入歌名。', 'Pick a song from the list, or type a title.')}<br />{t('结果只统计 VERIFIED 场次中作为 Surprise Song 的演出。', 'Only surprise-song performances at VERIFIED shows are counted.')}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Detail({ songId, lang, onBack, go }: { songId: string; lang: Lang; onBack: () => void; go: ReturnType<typeof useApp>['go'] }) {
  const t = (zh: string, en: string) => (lang === 'en' ? en : zh);
  const song = songById.get(songId)!;
  const apps = appearances.get(songId) ?? [];
  return (
    <div className="detail">
      <button className="detail__back link" onClick={onBack}>← {t('返回列表', 'Back to list')}</button>
      <div className="kicker">{albumName(song.album, lang) ?? '—'}{song.year ? ` · ${song.year}` : ''}</div>
      <h2 className="detail__title">{song.title}</h2>
      {(song.titleKo || song.aliases.length > 0) && (
        <div className="detail__alt">
          {song.titleKo && <span className="ko">{song.titleKo}</span>}
          {lang === 'zh' && song.aliases.filter((a) => /[一-鿿]/.test(a)).slice(0, 3).map((a) => <span key={a}>{a}</span>)}
        </div>
      )}

      {song.kind === 'setlist' && apps.length === 0 ? (
        <div className="detail__fixed">
          <b>{t('ARIRANG 巡演固定曲目', 'In the ARIRANG main setlist')}</b>
          <p>{t('本曲属于巡演常规歌单（参考框架见场次档案中的完整 Setlist），不在随机曲目统计范围内。', "This song is played every night as part of the main setlist (see Full setlist on any show), so it isn't counted as a surprise song.")}</p>
        </div>
      ) : (
        <>
          <div className="detail__count">
            <b>{apps.length}</b>
            <span>{t('次作为 Surprise Song', apps.length === 1 ? 'time as a surprise song' : 'times as a surprise song')}<br />{t('出现在已核实场次中', 'at verified shows')}</span>
          </div>
          {apps.length === 0 && (
            <p className="detail__none">{t('这首歌目前还没有在已核实场次中作为随机曲目出现。如果之后被唱到，这里会自动更新。', "This song hasn't been a surprise song at any verified show yet. If it gets played, this page updates automatically.")}</p>
          )}
          <ol className="detail__list">
            {apps.map((a, i) => (
              <li key={a.show.showId}>
                <button onClick={() => go('archive', { showId: a.show.showId })}>
                  <span className="dl__i">{pad(i + 1, 2)}</span>
                  <span className="dl__date mono">{fmtDate(a.show.date)}<em>{weekday(a.show.date)}</em></span>
                  <span className="dl__city">{cityName(a.show, lang)}<em>{countryName(a.show, lang)}{lang === 'zh' ? ` · ${a.show.city}` : ''}</em></span>
                  <span className="dl__venue">{a.show.venue}<em>{dayLabel(a.show)} · TRACK {String(a.entry.slot).padStart(2, '0')}{formLabel(a.entry.form, lang) ? ' · ' + formLabel(a.entry.form, lang) : ''}</em></span>
                  <Arrow />
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
