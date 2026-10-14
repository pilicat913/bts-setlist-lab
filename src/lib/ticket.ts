import { dayLabel, fmtDate, pad, shows, songById, tour, weekday, type Show } from './data';

export type TicketMode = 'collect' | 'attended';

export const W = 1080;
export const H = 1920;

const C = {
  red: '#C8232C',
  ink: '#111111',
  paper: '#F5F2EC',
  grey: '#77736E',
  light: '#E4E0D9',
};
const DISPLAY = '"Anton", "Impact", "Arial Narrow", sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
const TEXT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

/** 在画图前确保自托管字体已加载，避免导出时退回系统字体 */
export async function ensureFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load(`400 100px "Anton"`),
    document.fonts.load(`400 20px "IBM Plex Mono"`),
    document.fonts.load(`500 20px "IBM Plex Mono"`),
  ]).catch(() => undefined);
}

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

/** 把文字压到给定宽度内（Anton 为窄体，按比例缩小字号） */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, maxPx: number, minPx = 24) {
  let px = maxPx;
  ctx.font = font(px);
  while (ctx.measureText(text).width > maxW && px > minPx) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

export interface TicketOpts {
  show: Show;
  mode: TicketMode;
  name: string;
}

export function drawTicket(canvas: HTMLCanvasElement, { show, mode, name }: TicketOpts, scale = 1) {
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = 'alphabetic';
  const rand = rng(show.showId);
  const M = 56; // 外边距

  /* paper */
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  // 纸张纤维颗粒
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(17,17,17,0.035)' : 'rgba(255,255,255,0.5)';
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 1.6, 1 + rand() * 1.6);
  }

  /* header band */
  ctx.fillStyle = C.ink;
  ctx.fillRect(M, M, W - M * 2, 150);
  ctx.fillStyle = C.paper;
  ctx.font = `400 62px ${DISPLAY}`;
  ctx.fillText('BTS SETLIST LAB', M + 36, M + 92);
  ctx.font = `500 19px ${MONO}`;
  ctx.fillStyle = C.light;
  ctx.fillText('SURPRISE SONG ARCHIVE · COMMEMORATIVE STUB', M + 38, M + 128);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.red;
  ctx.font = `400 40px ${DISPLAY}`;
  ctx.fillText('ARIRANG', W - M - 36, M + 74);
  ctx.fillStyle = C.paper;
  ctx.font = `500 19px ${MONO}`;
  ctx.fillText('WORLD TOUR', W - M - 36, M + 106);
  ctx.textAlign = 'left';

  /* red sun with cut stripes — 原创几何图形 */
  const cx = W - M - 210, cy = 470, r = 210;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = C.paper;
  for (let i = 0; i < 9; i++) ctx.fillRect(cx - r, cy + 30 + i * 22, r * 2, 3 + i * 1.6);
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.stroke();

  /* show number */
  ctx.fillStyle = C.ink;
  ctx.font = `500 22px ${MONO}`;
  ctx.fillText('SHOW', M, 300);
  ctx.font = `400 168px ${DISPLAY}`;
  ctx.fillText(`№${pad(show.seq)}`, M - 4, 470);
  ctx.font = `500 22px ${MONO}`;
  ctx.fillStyle = C.grey;
  ctx.fillText(`/ ${pad(shows.length)} · ${dayLabel(show)}`, M, 510);

  /* city */
  ctx.fillStyle = C.ink;
  const cpx = fit(ctx, show.cityZh, (p) => `900 ${p}px ${TEXT}`, W - M * 2, 196, 90);
  ctx.font = `900 ${cpx}px ${TEXT}`;
  ctx.fillText(show.cityZh, M - 4, 560 + cpx * 0.86);
  const cityBase = 560 + cpx * 0.86;
  ctx.font = `400 46px ${DISPLAY}`;
  const en = show.city.toUpperCase();
  ctx.fillText(en, M, cityBase + 62);
  const enW = ctx.measureText(en).width;
  ctx.font = `700 30px ${TEXT}`;
  ctx.fillStyle = C.grey;
  ctx.fillText(`·  ${show.countryZh}`, M + enW + 16, cityBase + 60);
  ctx.fillStyle = C.ink;

  /* fact grid */
  let y = cityBase + 104;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  const colW = (W - M * 2) / 3;
  const facts: [string, string][] = [
    ['LOCAL DATE', `${fmtDate(show.date)}`],
    ['DAY', `${weekday(show.date)} · ${dayLabel(show)}`],
    ['REGION', show.countryCode],
  ];
  facts.forEach(([k, v], i) => {
    const x = M + i * colW;
    if (i) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 98); ctx.stroke(); }
    ctx.fillStyle = C.grey;
    ctx.font = `500 17px ${MONO}`;
    ctx.fillText(k, x + (i ? 20 : 0), y + 32);
    ctx.fillStyle = C.ink;
    ctx.font = `400 40px ${DISPLAY}`;
    ctx.fillText(v, x + (i ? 20 : 0), y + 82);
  });
  y += 98;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  ctx.fillStyle = C.grey;
  ctx.font = `500 17px ${MONO}`;
  ctx.fillText('VENUE', M, y + 32);
  ctx.fillStyle = C.ink;
  ctx.font = `600 36px ${TEXT}`;
  const vlines = wrap(ctx, show.venue, W - M * 2 - 150);
  vlines.slice(0, 2).forEach((l, i) => ctx.fillText(l, M + 130, y + 40 + i * 44));
  y += 40 + Math.min(vlines.length, 2) * 44 + 8;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();

  /* surprise songs block */
  const songsList = show.surpriseSongs;
  const n = Math.max(songsList.length, 1);
  const blockTop = y + 28;
  const rowH = n > 2 ? 96 : 132;
  const blockH = 70 + rowH * n + 26;
  ctx.fillStyle = C.red;
  ctx.fillRect(M, blockTop, W - M * 2, blockH);
  ctx.fillStyle = C.paper;
  ctx.font = `500 19px ${MONO}`;
  ctx.fillText('SURPRISE SONGS · 当晚随机曲目', M + 36, blockTop + 46);
  const moment = show.moments?.[0]?.split(' · ')[0];
  if (moment) {
    ctx.textAlign = 'right';
    ctx.font = `700 22px ${TEXT}`;
    ctx.fillText(moment, W - M - 36, blockTop + 47);
    ctx.textAlign = 'left';
  }
  songsList.forEach((e, i) => {
    const song = songById.get(e.songId);
    const ty = blockTop + 70 + i * rowH;
    if (i) {
      ctx.strokeStyle = 'rgba(245,242,236,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(M + 36, ty); ctx.lineTo(W - M - 36, ty); ctx.stroke();
    }
    ctx.fillStyle = C.paper;
    ctx.font = `500 18px ${MONO}`;
    ctx.fillText(`TRACK ${String(e.slot).padStart(2, '0')}`, M + 36, ty + 34);
    const title = (song?.title ?? e.songId).toUpperCase();
    const px = fit(ctx, title, (p) => `400 ${p}px ${DISPLAY}`, W - M * 2 - 230, n > 2 ? 70 : 92, 34);
    ctx.font = `400 ${px}px ${DISPLAY}`;
    ctx.fillText(title, M + 190, ty + 34 + px * 0.42);
    if (song?.titleKo) {
      ctx.font = `500 22px ${TEXT}`;
      ctx.fillStyle = 'rgba(245,242,236,0.82)';
      ctx.fillText(song.titleKo, M + 36, ty + 70);
    }
  });

  /* perforation */
  const py = blockTop + blockH + 70;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 12]);
  ctx.beginPath(); ctx.moveTo(48, py); ctx.lineTo(W - 48, py); ctx.stroke();
  ctx.setLineDash([]);

  /* stub */
  const sy = py + 44;
  ctx.fillStyle = C.ink;
  const big = mode === 'attended' ? 'I WAS THERE' : 'IN MY ARCHIVE';
  const zh = mode === 'attended' ? '我亲自去过这一场' : '我想收藏这一场';
  ctx.font = `400 84px ${DISPLAY}`;
  ctx.fillText(big, M, sy + 80);
  ctx.font = `700 30px ${TEXT}`;
  ctx.fillText(zh, M, sy + 128);
  if (name.trim()) {
    ctx.font = `500 22px ${MONO}`;
    ctx.fillStyle = C.grey;
    ctx.fillText('HOLDER', M, sy + 176);
    ctx.fillStyle = C.ink;
    ctx.font = `600 32px ${TEXT}`;
    ctx.fillText(name.trim().slice(0, 18), M + 110, sy + 178);
  }

  // 装饰性条纹（基于 showId 生成，非条形码）
  const bx = W - M - 300, bw = 300, bh = 120;
  const r2 = rng(show.showId + mode);
  let x = bx;
  while (x < bx + bw) {
    const w = 2 + Math.floor(r2() * 7);
    if (r2() > 0.35) { ctx.fillStyle = r2() > 0.9 ? C.red : C.ink; ctx.fillRect(x, sy + 30, w, bh); }
    x += w + 2 + Math.floor(r2() * 5);
  }
  ctx.fillStyle = C.ink;
  ctx.font = `500 16px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText(show.showId.toUpperCase(), W - M, sy + 176);
  ctx.textAlign = 'left';

  /* fine print */
  ctx.fillStyle = C.grey;
  ctx.font = `500 15px ${MONO}`;
  ctx.fillText(`${tour.name} · DATA VERIFIED ${show.lastVerifiedAt}`, M, H - M - 34);
  ctx.font = `500 18px ${TEXT}`;
  ctx.fillText('非官方粉丝档案纪念图像 · NOT A TICKET · 不可用于入场', M, H - M);

  /* notches — 真正镂空 */
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const nx of [0, W]) { ctx.beginPath(); ctx.arc(nx, py, 34, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, py, 34, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(W, py, 34, Math.PI / 2, (Math.PI * 3) / 2); ctx.stroke();
}

export function ticketFilename(show: Show) {
  return `BTS-SETLIST-LAB_${show.date}_${show.city.replace(/[^\w]+/g, '-')}_DAY${show.dayIndex}.png`;
}
