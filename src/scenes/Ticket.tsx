import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../lib/state';
import { cities, dayLabel, fmtDate, latestVerified, showById, songById, verifiedShows } from '../lib/data';
import { drawTicket, ensureFonts, ticketFilename, type TicketMode } from '../lib/ticket';
import { Arrow } from '../components/bits';
import { cityName } from '../lib/i18n';

const vCities = cities.filter((c) => c.shows.some((s) => s.status === 'VERIFIED'));

export default function Ticket() {
  const { ticketShowId, showId, set, lang, t } = useApp();
  const fallback = showById.get(showId)?.status === 'VERIFIED' ? showId : latestVerified?.showId;
  const show = showById.get(ticketShowId ?? '') ?? showById.get(fallback ?? '') ?? verifiedShows[verifiedShows.length - 1];
  const [mode, setMode] = useState<TicketMode>('collect');
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [printed, setPrinted] = useState(0);
  const [saveImg, setSaveImg] = useState<string | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);

  useEffect(() => { ensureFonts().then(() => setReady(true)); }, []);
  useEffect(() => {
    if (preview.current && show) drawTicket(preview.current, { show, mode, name, lang }, 1);
  }, [show, mode, name, ready, lang]);

  const cityShows = useMemo(() => vCities.find((c) => c.cityKey === show.cityKey)?.shows.filter((s) => s.status === 'VERIFIED') ?? [], [show]);

  async function exportPng() {
    setBusy(true);
    try {
      await ensureFonts();
      const c = document.createElement('canvas');
      drawTicket(c, { show, mode, name, lang }, 2); // 2160 × 3840
      const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
      const file = new File([blob], ticketFilename(show), { type: 'image/png' });
      const coarse = matchMedia('(pointer: coarse)').matches;
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (coarse && nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'BTS SETLIST LAB' });
          setPrinted((n) => n + 1);
          return;
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      if (coarse) {
        setSaveImg(url); // 部分 App 内置浏览器不支持下载：长按图片保存
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
      setPrinted((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ticket">
      <div className="ticket__ctrl">
        <div className="kicker">MY TICKET{lang === 'zh' ? ' · 纪念票根' : ''}</div>
        <h2 className="ticket__h">{t('选一场，', 'Pick a show,')}<br />{t('印一张。', 'print a stub.')}</h2>

        <label className="field">
          <span>{t('城市', 'City')}</span>
          <select
            value={show.cityKey}
            onChange={(e) => {
              const c = vCities.find((x) => x.cityKey === e.target.value)!;
              set({ ticketShowId: c.shows.filter((s) => s.status === 'VERIFIED').slice(-1)[0].showId });
            }}
          >
            {vCities.map((c) => <option key={c.cityKey} value={c.cityKey}>{lang === 'en' ? `${c.city}, ${c.country}` : `${c.cityZh} · ${c.city}`}</option>)}
          </select>
        </label>

        <div className="field">
          <span>{t('场次', 'Night')}</span>
          <div className="seg seg--wide">
            {cityShows.map((s) => (
              <button key={s.showId} className={s.showId === show.showId ? 'is-on' : ''} onClick={() => set({ ticketShowId: s.showId })}>
                {dayLabel(s)}<em>{fmtDate(s.date).slice(5)}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>{t('票根文字', 'Stub text')}</span>
          <div className="seg seg--wide">
            <button className={mode === 'collect' ? 'is-on' : ''} onClick={() => setMode('collect')}>{t('我想收藏这场', 'Collecting it')}<em>IN MY ARCHIVE</em></button>
            <button className={mode === 'attended' ? 'is-on' : ''} onClick={() => setMode('attended')}>{t('我亲自去过', 'I was there')}<em>I WAS THERE</em></button>
          </div>
        </div>

        <label className="field">
          <span>{t('署名（可选）', 'Your name (optional)')}</span>
          <input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} placeholder={t('留空则不显示', 'Leave blank to hide')} />
        </label>

        <div className="ticket__songs">
          {show.surpriseSongs.map((e) => (
            <div key={e.slot}><span className="mono">TRACK {String(e.slot).padStart(2, '0')}</span> {songById.get(e.songId)?.title}</div>
          ))}
        </div>

        <button className="btn btn--red btn--xl" onClick={exportPng} disabled={busy}>
          <span>{busy ? t('正在印制…', 'Printing…') : t('导出高清 PNG', 'Save HD PNG')}</span>
          <Arrow />
        </button>
        <p className="fine">{t('2160 × 3840 px。纪念图像，非官方票务，不可用于入场。只能选择已核实（VERIFIED）的场次。', '2160 × 3840 px. A keepsake image, not a real ticket and not valid for entry. Only VERIFIED shows can be printed.')}</p>
      </div>

      <div className="ticket__stage">
        <div className="ticket__paper" key={printed}>
          <canvas ref={preview} className="ticket__canvas" aria-label={`${cityName(show, lang)} ${fmtDate(show.date)} ${t('纪念票根预览', 'ticket preview')}`} />
          {printed > 0 && <span className="stamp" aria-hidden>PRINTED</span>}
        </div>
      </div>

      {saveImg && (
        <div className="saveimg" role="dialog" aria-label={t('保存图片', 'Save image')} onClick={() => { URL.revokeObjectURL(saveImg); setSaveImg(null); }}>
          <img src={saveImg} alt={t('纪念票根', 'Keepsake ticket')} onClick={(e) => e.stopPropagation()} />
          <p>{t('长按图片保存到相册 · 点击空白处关闭', 'Press and hold the image to save it · tap outside to close')}</p>
          <a className="btn btn--line btn--inv" href={saveImg} download={ticketFilename(show)} onClick={(e) => e.stopPropagation()}>{t('或下载文件', 'Or download the file')}</a>
        </div>
      )}
    </section>
  );
}
