import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../lib/state';
import {
  appearances, cities, dayLabel, fmtDate, FORM_LABEL, pad, REGION_LABEL, showById, shows, songById,
  sources, STATUS_LABEL, templateFor, tour, weekday, type Show,
} from '../lib/data';
import { Arrow, StatusMark, Swap } from '../components/bits';

const REGIONS = ['all', ...new Set(cities.map((c) => c.region))];

export default function Archive() {
  const { showId, set, go } = useApp();
  const show = showById.get(showId) ?? shows[0];
  const [region, setRegion] = useState<string>('all');
  const [drawer, setDrawer] = useState(false);

  const list = useMemo(() => cities.filter((c) => region === 'all' || c.region === region), [region]);
  const idx = shows.indexOf(show);
  const cityShows = cities.find((c) => c.cityKey === show.cityKey)!.shows;

  const pick = (s: Show) => set({ showId: s.showId });
  const step = (d: number) => {
    const n = shows[idx + d];
    if (n) pick(n);
  };

  // 键盘左右键切换场次
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  // 红色索引线：移动到当前城市
  const listRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ top: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const root = listRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-city="${show.cityKey}"]`);
    if (!root || !el) { setBar(null); return; }
    setBar({ top: el.offsetTop, h: el.offsetHeight });
    const r = el.getBoundingClientRect(), pr = root.getBoundingClientRect();
    if (r.top < pr.top || r.bottom > pr.bottom) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [show.cityKey, region]);

  // 手机：横向城市条自动滚到当前城市
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${show.cityKey}"]`);
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [show.cityKey]);

  return (
    <section className="archive">
      {/* ----------------------------------------------------- index */}
      <aside className="archive__index">
        <div className="panel-head">
          <span>INDEX</span>
          <span>{cities.length} CITIES · {shows.length} SHOWS</span>
        </div>
        <div className="chips" role="tablist" aria-label="按地区筛选">
          {REGIONS.map((r) => (
            <button key={r} role="tab" aria-selected={region === r} className={`chip ${region === r ? 'is-on' : ''}`} onClick={() => setRegion(r)}>
              {r === 'all' ? '全部' : REGION_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="citylist" ref={listRef}>
          {bar && <span className="citylist__bar" style={{ transform: `translateY(${bar.top}px)`, height: bar.h }} />}
          {list.map((c) => {
            const on = c.cityKey === show.cityKey;
            return (
              <div key={c.cityKey} data-city={c.cityKey} className={`cityrow ${on ? 'is-on' : ''}`}>
                <button className="cityrow__name" onClick={() => pick(c.shows.find((s) => s.status === 'VERIFIED') ?? c.shows[0])}>
                  <span className="cityrow__no">{pad(cities.indexOf(c) + 1, 2)}</span>
                  <span className="cityrow__cn">{c.cityZh}<em>{c.countryZh}</em></span>
                  <span className="cityrow__sub">{c.city} · {c.country}</span>
                </button>
                <div className="cityrow__days">
                  {c.shows.map((s) => (
                    <button key={s.showId} className={`day ${s.showId === show.showId ? 'is-on' : ''}`} onClick={() => pick(s)}>
                      <StatusMark status={s.status} />
                      <span className="day__d">D{String(s.dayIndex).padStart(2, '0')}</span>
                      <span className="day__date">{s.date.slice(5).replace('-', '.')}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ----------------------------------------------- mobile picker */}
      <div className="archive__mpick">
        <div className="mchips" ref={chipsRef}>
          {cities.map((c) => (
            <button key={c.cityKey} data-chip={c.cityKey} className={`mchip ${c.cityKey === show.cityKey ? 'is-on' : ''}`}
              onClick={() => pick(c.shows.find((s) => s.status === 'VERIFIED') ?? c.shows[0])}>
              {c.cityZh}
            </button>
          ))}
        </div>
        <div className="mdays">
          {cityShows.map((s) => (
            <button key={s.showId} className={`mday ${s.showId === show.showId ? 'is-on' : ''}`} onClick={() => pick(s)}>
              <span>{dayLabel(s)}</span>
              <b>{fmtDate(s.date).slice(5)}</b>
              <StatusMark status={s.status} />
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------- sheet */}
      <article className="sheet">
        <div className="sheet__bar">
          <span className="sheet__no">
            SHOW <b>№{pad(show.seq)}</b> / {pad(shows.length)}
          </span>
          <StatusMark status={show.status} label />
          <span className="sheet__nav">
            <button className="sq" onClick={() => step(-1)} disabled={idx === 0} aria-label="上一场">←</button>
            <button className="sq" onClick={() => step(1)} disabled={idx === shows.length - 1} aria-label="下一场">→</button>
          </span>
        </div>

        <header className="sheet__head">
          <div className="sheet__titles">
            <h2 className="sheet__city">
              <Swap value={show.cityKey}>{show.cityZh}</Swap>
            </h2>
            <div className="sheet__cityen">
              <Swap value={show.cityKey + 'en'}>{show.city.toUpperCase()}</Swap>
              <span>{show.countryZh}</span>
            </div>
          </div>
          <dl className="sheet__facts">
            <div><dt>CITY</dt><dd>{show.city}, {show.country}</dd></div>
            <div><dt>VENUE</dt><dd>{show.venue}</dd></div>
            <div><dt>LOCAL DATE</dt><dd className="mono">{fmtDate(show.date)} {weekday(show.date)}</dd></div>
            <div><dt>NIGHT</dt><dd className="mono">{dayLabel(show)} / {pad(cityShows.length, 2)}</dd></div>
          </dl>
        </header>

        <Tracks show={show} onSong={(songId) => go('finder', { songId, query: '' })} />

        <footer className="sheet__foot">
          <div className="sheet__actions">
            <button className="btn btn--black" onClick={() => setDrawer(true)}>完整 SETLIST <Arrow /></button>
            {show.status === 'VERIFIED' && (
              <button className="btn btn--line" onClick={() => go('ticket', { ticketShowId: show.showId })}>生成票根 <Arrow /></button>
            )}
          </div>
          <div className="sheet__src">
            {(show.moments?.length ?? 0) > 0 && (
              <ul className="moments">{show.moments!.map((m) => <li key={m}>{m}</li>)}</ul>
            )}
            {show.notes.length > 0 && (
              <ul className="notes">{show.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            )}
            <div className="srcline">
              <span className="srcline__k">SOURCES</span>
              {show.sources.map((k) => (
                sources[k]?.url
                  ? <a key={k} href={sources[k].url} target="_blank" rel="noreferrer">{sources[k].label}</a>
                  : <span key={k}>{sources[k]?.label ?? k}</span>
              ))}
            </div>
            <div className="srcline">
              <span className="srcline__k">LAST VERIFIED</span>
              <span className="mono">{show.lastVerifiedAt}</span>
            </div>
          </div>
        </footer>

        {drawer && <SetlistDrawer show={show} onClose={() => setDrawer(false)} />}
      </article>
    </section>
  );
}

function Tracks({ show, onSong }: { show: Show; onSong: (id: string) => void }) {
  if (show.status !== 'VERIFIED') {
    return (
      <div className={`tracks tracks--empty`}>
        <div className="tracks__label">SURPRISE SONGS</div>
        {[1, 2].map((n) => (
          <div className="track track--blank" key={n}>
            <span className="track__no">TRACK {String(n).padStart(2, '0')}</span>
            <span className="track__title"><Swap value={show.showId + n}>— — —</Swap></span>
          </div>
        ))}
        <p className="tracks__msg">
          {show.status === 'UPCOMING'
            ? '尚未演出。演出结束并完成核实后，这里会显示当晚的随机曲目。'
            : '演出日期已过，曲目记录尚未录入或仍在核实中。我们不会用推测的曲目填充。'}
        </p>
      </div>
    );
  }
  const debuts = show.surpriseSongs.filter((e) => appearances.get(e.songId)?.[0]?.show.showId === show.showId).length;
  const insight =
    show.surpriseSongs.length > 2 ? `本场演唱了 ${show.surpriseSongs.length} 首随机曲目` :
    debuts === show.surpriseSongs.length ? '两首均为本巡演首次演唱' :
    debuts === 0 ? '两首均在此前场次出现过' : `其中 ${debuts} 首为本巡演首次演唱`;
  return (
    <div className={`tracks tracks--n${show.surpriseSongs.length}`}>
      <div className="tracks__label">
        SURPRISE SONGS<span>{insight}</span>
      </div>
      {show.surpriseSongs.map((e) => {
        const song = songById.get(e.songId)!;
        const apps = appearances.get(e.songId) ?? [];
        const nth = apps.findIndex((a) => a.show.showId === show.showId) + 1;
        return (
          <button className="track" key={e.slot} onClick={() => onSong(e.songId)} title="在 SONG FINDER 中查看所有演出记录">
            <span className="track__no">TRACK {String(e.slot).padStart(2, '0')}</span>
            <span className={`track__title ${song.title.length > 14 ? 'track__title--long' : ''}`}>
              <Swap value={show.showId + e.slot}>{song.title}</Swap>
            </span>
            <span className="track__meta">
              {song.titleKo && <span className="ko">{song.titleKo}</span>}
              {song.album && <span>{song.album}{song.year ? ` · ${song.year}` : ''}</span>}
              {FORM_LABEL[e.form] && <span className="tag">{FORM_LABEL[e.form]}</span>}
              {nth === 1 && <span className="tag tag--red">巡演首唱</span>}
            </span>
            <span className="track__count">
              <span><b>{nth}</b>/{apps.length}</span>
              <em>{nth === 1 ? '本巡演首次' : `本巡演第 ${nth} 次`} · 累计 {apps.length}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SetlistDrawer({ show, onClose }: { show: Show; onClose: () => void }) {
  const verified = show.fullSetlist?.basis === 'verified';
  const acts = verified
    ? groupActs(show.fullSetlist!.items.map((i) => ({ act: i.act, songId: i.songId, note: i.note, surprise: i.type === 'surprise' })))
    : templateFor(show);
  let n = 0;
  return (
    <div className="drawer" role="dialog" aria-label="完整 Setlist">
      <div className="drawer__head">
        <div>
          <div className="kicker">FULL SETLIST · №{pad(show.seq)}</div>
          <h3>{show.cityZh} {dayLabel(show)}</h3>
        </div>
        <button className="sq" onClick={onClose} aria-label="关闭">×</button>
      </div>
      <div className={`drawer__basis ${verified ? 'is-ok' : ''}`}>
        {verified ? (
          <>本场完整歌单已按来源逐首核实（{show.fullSetlist!.sources.map((k) => sources[k]?.label).join('、')}）。</>
        ) : (
          <>
            <b>参考框架 · 非本场逐场核实歌单。</b>
            {tour.setlistTemplate.basis}
            {show.status === 'VERIFIED' ? ' 红色为本场已核实的随机曲目。' : ''}
          </>
        )}
      </div>
      <div className="drawer__body">
        {acts.map((a) => (
          <section key={a.act} className="act">
            <h4>{a.act}</h4>
            <ol>
              {a.items.map((it, i) => {
                n += 1;
                const s = it.songId ? songById.get(it.songId) : null;
                return (
                  <li key={i} className={`${it.surprise ? 'is-surprise' : ''} ${'changed' in it && it.changed ? 'is-changed' : ''}`}>
                    <span className="act__n">{String(n).padStart(2, '0')}</span>
                    <span className="act__t">{s ? s.title : it.surprise ? (show.status === 'UPCOMING' ? '随机曲目（待演出）' : '随机曲目（待核实）') : '—'}</span>
                    {it.surprise && <span className="act__tag">SURPRISE</span>}
                    {it.note && <span className="act__note">{it.note}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <p className="drawer__fine">
          状态：{show.status} · {STATUS_LABEL[show.status]}。框架来源：
          {tour.setlistTemplate.sources.map((k) => (
            <a key={k} href={sources[k]?.url} target="_blank" rel="noreferrer">{sources[k]?.label}</a>
          ))}
        </p>
      </div>
    </div>
  );
}

function groupActs(items: { act: string; songId: string; note?: string; surprise: boolean }[]) {
  const out: { act: string; items: typeof items }[] = [];
  for (const it of items) {
    const last = out[out.length - 1];
    if (last && last.act === it.act) last.items.push(it);
    else out.push({ act: it.act, items: [it] });
  }
  return out;
}
