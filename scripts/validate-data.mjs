// 数据校验：npm run validate-data（build 前自动执行）
// 检查 songId 引用、状态、日期格式、来源引用、重复 showId 等，发现错误时让构建失败。
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const { tour, shows } = read('shows.json');
const songs = read('songs.json');
const sources = read('sources.json');

const errors = [];
const warns = [];
const songIds = new Set();
for (const s of songs) {
  if (!/^[a-z0-9-]+$/.test(s.songId)) errors.push(`songId 只能用小写字母/数字/连字符: ${s.songId}`);
  if (songIds.has(s.songId)) errors.push(`重复 songId: ${s.songId}`);
  songIds.add(s.songId);
  if (!s.title) errors.push(`歌曲缺少 title: ${s.songId}`);
}

const STATUS = new Set(['VERIFIED', 'PENDING', 'UPCOMING']);
const FORMS = new Set(['full', 'medley', 'snippet', 'unspecified']);
const seen = new Set();
for (const sh of shows) {
  const id = sh.showId ?? '(no id)';
  if (seen.has(id)) errors.push(`重复 showId: ${id}`);
  seen.add(id);
  for (const k of ['showId', 'tour', 'date', 'cityKey', 'city', 'cityZh', 'country', 'countryZh', 'venue', 'status', 'lastVerifiedAt'])
    if (sh[k] === undefined || sh[k] === '') errors.push(`${id}: 缺少字段 ${k}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sh.date)) errors.push(`${id}: date 格式应为 YYYY-MM-DD`);
  if (!STATUS.has(sh.status)) errors.push(`${id}: status 必须是 VERIFIED / PENDING / UPCOMING`);
  if (sh.status === 'VERIFIED' && !(sh.surpriseSongs?.length >= 1)) errors.push(`${id}: VERIFIED 场次必须有 surpriseSongs`);
  if (sh.status !== 'VERIFIED' && sh.surpriseSongs?.length) warns.push(`${id}: 非 VERIFIED 场次的 surpriseSongs 不会计入统计`);
  if (sh.status === 'VERIFIED' && !(sh.sources?.length >= 2)) warns.push(`${id}: VERIFIED 场次建议至少 2 个独立来源`);
  for (const e of sh.surpriseSongs ?? []) {
    if (!songIds.has(e.songId)) errors.push(`${id}: 未知 songId "${e.songId}"（请先在 songs.json 中添加）`);
    if (e.form && !FORMS.has(e.form)) errors.push(`${id}: form 必须是 full / medley / snippet / unspecified`);
  }
  for (const it of sh.fullSetlist?.items ?? []) if (!songIds.has(it.songId)) errors.push(`${id}: fullSetlist 未知 songId ${it.songId}`);
  for (const c of sh.setlistChanges ?? []) {
    if (!songIds.has(c.target)) errors.push(`${id}: setlistChanges target 未知 ${c.target}`);
    if (c.with && !songIds.has(c.with)) errors.push(`${id}: setlistChanges with 未知 ${c.with}`);
  }
  for (const k of sh.sources ?? []) if (!sources[k]) errors.push(`${id}: 未知来源 "${k}"（请在 sources.json 中添加）`);
}
for (const act of tour.setlistTemplate.acts)
  for (const it of act.items) if (it.songId && !songIds.has(it.songId)) errors.push(`setlistTemplate 未知 songId ${it.songId}`);

const v = shows.filter((s) => s.status === 'VERIFIED');
const plays = v.reduce((n, s) => n + s.surpriseSongs.length, 0);
const uniq = new Set(v.flatMap((s) => s.surpriseSongs.map((e) => e.songId))).size;

warns.forEach((w) => console.warn('  ⚠ ' + w));
if (errors.length) {
  errors.forEach((e) => console.error('  ✗ ' + e));
  console.error(`\n数据校验失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log(`✓ 数据校验通过 — ${shows.length} 场（VERIFIED ${v.length}），随机曲目 ${plays} 次，不重复 ${uniq} 首，曲库 ${songs.length} 首`);
