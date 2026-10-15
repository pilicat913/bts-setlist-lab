/* 中 / EN 双语。UI 文案就地写成 t('中文', 'English')；数据里的中文字段在这里统一转换。 */
import type { Show, Status, PerformanceForm } from './data';

export type Lang = 'zh' | 'en';

export const makeT = (lang: Lang) => (zh: string, en: string) => (lang === 'en' ? en : zh);

type Place = { cityKey: string; city: string; cityZh: string; country: string; countryZh: string };

export const cityName = (s: Place, lang: Lang) => (lang === 'en' ? s.city : s.cityZh);
export const countryName = (s: Place, lang: Lang) => (lang === 'en' ? s.country : s.countryZh);

/** 矩阵列头 / 时间线用的简称 */
const ZH_SHORT: Record<string, string> = {
  mexico: '墨城', lasvegas: '维加斯', eastrutherford: '新泽西', laplata: '布宜诺', kualalumpur: '吉隆坡',
};
const EN_SHORT: Record<string, string> = {
  goyang: 'GOY', tokyo: 'TYO', tampa: 'TPA', elpaso: 'ELP', mexico: 'MEX', stanford: 'STF', lasvegas: 'LAS',
  busan: 'PUS', madrid: 'MAD', brussels: 'BRU', london: 'LON', munich: 'MUC', paris: 'PAR', eastrutherford: 'NJ',
  foxborough: 'FOX', baltimore: 'BAL', arlington: 'ARL', toronto: 'TOR', chicago: 'CHI', inglewood: 'LA',
  bogota: 'BOG', lima: 'LIM', santiago: 'SCL', laplata: 'BUE', saopaulo: 'SAO', kaohsiung: 'KHH', bangkok: 'BKK',
  kualalumpur: 'KUL', singapore: 'SIN', jakarta: 'JKT', melbourne: 'MEL', sydney: 'SYD', hongkong: 'HKG', bocaue: 'MNL',
};
export const shortName = (s: Place, lang: Lang) =>
  lang === 'en' ? EN_SHORT[s.cityKey] ?? s.city.slice(0, 3).toUpperCase() : ZH_SHORT[s.cityKey] ?? s.cityZh;

const REGION: Record<string, [string, string]> = {
  asia: ['亚洲', 'Asia'],
  'north-america': ['北美', 'North America'],
  europe: ['欧洲', 'Europe'],
  'latin-america': ['拉美', 'Latin America'],
  oceania: ['大洋洲', 'Oceania'],
};
export const regionLabel = (r: string, lang: Lang) => (REGION[r] ? REGION[r][lang === 'en' ? 1 : 0] : r);

const STATUS: Record<Status, [string, string]> = {
  VERIFIED: ['已核实', 'Verified'],
  PENDING: ['待核实', 'Pending'],
  UPCOMING: ['未演出', 'Upcoming'],
};
export const statusLabel = (s: Status, lang: Lang) => STATUS[s][lang === 'en' ? 1 : 0];

const FORM: Record<PerformanceForm, [string, string]> = {
  full: ['完整演唱', 'Full'],
  medley: ['串烧', 'Medley'],
  snippet: ['片段', 'Snippet'],
  unspecified: ['', ''],
};
export const formLabel = (f: PerformanceForm, lang: Lang) => FORM[f][lang === 'en' ? 1 : 0];

const ALBUM_EN: [string, string][] = [
  ['（日语单曲）', ' (Japanese single)'],
  ['（日语）', ' (Japanese)'],
  ['（单曲）', ' (Single)'],
  ['（非专辑曲）', ' (non-album)'],
  ['（BASTIONS OST）', ' (BASTIONS OST)'],
];
export const albumName = (a: string | null, lang: Lang) => {
  if (!a || lang !== 'en') return a;
  let s = a;
  for (const [zh, en] of ALBUM_EN) s = s.replace(zh, en);
  return s;
};

/** 数据中已有中文备注的英文版。新备注可在 shows.json 中写 notesEn。 */
const TEXT_EN: Record<string, string> = {
  'Show Intro 含 Hooligan 元素': 'Show intro with elements of Hooligan',
  '含 FYA 元素': 'with elements of FYA',
  '衔接 FAKE LOVE': 'transitions into FAKE LOVE',
  '演唱韩语版本': 'Korean version',
  '釜山两场以 One More Night 替代 Please': 'One More Night replaced Please at both Busan shows',
  '场馆 Estadio Único 位于布宜诺斯艾利斯省 La Plata。': 'Estadio Único is in La Plata, Buenos Aires Province.',
  '场馆 SoFi Stadium 位于洛杉矶都会区的 Inglewood。': 'SoFi Stadium is in Inglewood, in the Los Angeles area.',
  '场馆位于巴黎近郊 Saint-Denis。': 'The stadium is in Saint-Denis, just outside Paris.',
  '场馆实际位于内华达州 Paradise（拉斯维加斯都会区）。': 'The stadium is in Paradise, Nevada (Las Vegas area).',
  '官方日程中亦标注为 Seoul（首尔）站。': 'Listed as Seoul on the official schedule.',
  '马尼拉都会区附近，Bulacan 省。': 'In Bulacan province, near Metro Manila.',
  '本场演唱了三首随机歌曲（Wikipedia、F Zine 一致）。KPopGo 列为 IDOL / Ddaeng，与其他来源冲突，未采用。':
    'Three surprise songs were performed (Wikipedia and F Zine agree). KPopGo lists IDOL / Ddaeng, which conflicts with other sources and was not used.',
};
export const text = (s: string | undefined, lang: Lang) => (s && lang === 'en' ? TEXT_EN[s] ?? s : s);

export const showNotes = (show: Show, lang: Lang) =>
  lang === 'en' && show.notesEn?.length ? show.notesEn : show.notes.map((n) => text(n, lang)!);

/** moments 格式为「中文 · English」 */
export const momentText = (m: string, lang: Lang) => {
  const [zh, en] = m.split(' · ');
  return lang === 'en' ? en ?? zh : zh;
};

const SOURCE_EN: Record<string, string> = {
  'KPopGo · BTS ARIRANG Setlist 2026（逐场更新）': 'KPopGo · BTS ARIRANG Setlist 2026 (per-show tracker)',
  '站长校对版（逐场备忘录，2026-10-15）': "Site editor's checked list (show-by-show notes, 2026-10-15)",
};
export const sourceLabel = (label: string, lang: Lang) => (lang === 'en' ? SOURCE_EN[label] ?? label : label);
