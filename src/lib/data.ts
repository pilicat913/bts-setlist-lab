import showsFile from '../data/shows.json';
import songsFile from '../data/songs.json';
import sourcesFile from '../data/sources.json';

/* ------------------------------------------------------------------ types */

export type Status = 'VERIFIED' | 'PENDING' | 'UPCOMING';
/** 演出形式：完整 / 串烧 / 片段 / 来源未注明 */
export type PerformanceForm = 'full' | 'medley' | 'snippet' | 'unspecified';

export interface Song {
  songId: string;
  title: string;
  titleKo: string | null;
  aliases: string[];
  album: string | null;
  year: number | null;
  /** 首次正式发行日期（用于“按专辑发行顺序”排序） */
  released: string | null;
  /** setlist = 本巡演固定曲目; catalog = 曲库（随机曲目来源） */
  kind: 'setlist' | 'catalog';
}

export interface SurpriseEntry {
  songId: string;
  slot: number;
  form: PerformanceForm;
  note?: string;
}

export interface SetlistItem {
  act: string;
  songId: string;
  type: 'fixed' | 'surprise';
  note?: string;
}

export interface SetlistChange {
  type: 'replace' | 'annotate' | 'remove' | 'insertAfter';
  target: string;
  with?: string;
  note?: string;
}

export interface Show {
  showId: string;
  tour: string;
  seq: number;
  date: string; // 当地日期 YYYY-MM-DD
  dayIndex: number;
  cityKey: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
  countryCode: string;
  region: string;
  venue: string;
  status: Status;
  surpriseSongs: SurpriseEntry[];
  fullSetlist: { basis: 'verified'; sources: string[]; items: SetlistItem[] } | null;
  setlistChanges: SetlistChange[];
  notes: string[];
  /** 可选：notes 的英文版（英文界面使用） */
  notesEn?: string[];
  /** 现场特别时刻（如庆生），展示在场次档案和票根 */
  moments?: string[];
  sources: string[];
  lastVerifiedAt: string;
}

export interface Source {
  label: string;
  url: string;
  type: string;
  accessedAt: string;
}

export interface TemplateAct {
  act: string;
  items: { songId?: string; note?: string; slot?: 'surprise' }[];
}

/* ------------------------------------------------------------------- load */

export const tour = showsFile.tour as {
  tourId: string;
  name: string;
  nameZh: string;
  album: string;
  period: string;
  announcedShows: number;
  surpriseFormat: string;
  setlistTemplate: { basis: string; sources: string[]; acts: TemplateAct[] };
  dataUpdatedAt: string;
};

export const songs = songsFile as Song[];
export const sources = sourcesFile as Record<string, Source>;
export const songById = new Map(songs.map((s) => [s.songId, s]));

/** 浏览器本地日期（YYYY-MM-DD） */
function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 有效状态：数据里标为 UPCOMING 但日期已过（以浏览器所在时区的“昨天”为界，
 * 避免时差导致误判），自动显示为 PENDING —— 演出可能已举办但记录尚未更新。
 */
function effectiveStatus(s: { status: Status; date: string }): Status {
  if (s.status !== 'UPCOMING') return s.status;
  const t = new Date(todayISO() + 'T00:00:00');
  t.setDate(t.getDate() - 1);
  const y = t.toISOString().slice(0, 10);
  return s.date < y ? 'PENDING' : 'UPCOMING';
}

export const shows: Show[] = (showsFile.shows as Show[])
  .map((s) => ({ ...s, status: effectiveStatus(s) }))
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq));

export const showById = new Map(shows.map((s) => [s.showId, s]));
export const verifiedShows = shows.filter((s) => s.status === 'VERIFIED');

/* ---------------------------------------------------------------- derived */

export interface City {
  cityKey: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
  countryCode: string;
  region: string;
  venue: string;
  shows: Show[];
}

export const cities: City[] = (() => {
  const m = new Map<string, City>();
  for (const s of shows) {
    let c = m.get(s.cityKey);
    if (!c) {
      c = {
        cityKey: s.cityKey, city: s.city, cityZh: s.cityZh, country: s.country,
        countryZh: s.countryZh, countryCode: s.countryCode, region: s.region,
        venue: s.venue, shows: [],
      };
      m.set(s.cityKey, c);
    }
    c.shows.push(s);
  }
  return [...m.values()];
})();

export const REGION_LABEL: Record<string, string> = {
  asia: '亚洲',
  'north-america': '北美',
  europe: '欧洲',
  'latin-america': '拉美',
  oceania: '大洋洲',
};

export interface Appearance {
  show: Show;
  entry: SurpriseEntry;
}

/** songId -> 作为随机歌曲的所有演出（只统计 VERIFIED） */
export const appearances: Map<string, Appearance[]> = (() => {
  const m = new Map<string, Appearance[]>();
  for (const show of verifiedShows) {
    for (const entry of show.surpriseSongs) {
      const arr = m.get(entry.songId) ?? [];
      arr.push({ show, entry });
      m.set(entry.songId, arr);
    }
  }
  return m;
})();

export interface RankRow {
  song: Song;
  count: number;
  first: Show;
  last: Show;
}

export const ranking: RankRow[] = [...appearances.entries()]
  .map(([id, list]) => ({
    song: songById.get(id)!,
    count: list.length,
    first: list[0].show,
    last: list[list.length - 1].show,
  }))
  .sort((a, b) => b.count - a.count || (a.first.date < b.first.date ? -1 : 1));

/** 曲库中尚未作为随机曲目出现的团体曲 / 小分队曲（固定曲目除外） */
export const unplayed: Song[] = songs.filter((s) => s.kind === 'catalog' && !appearances.has(s.songId));
export const catalogSize = songs.filter((s) => s.kind === 'catalog').length;

export const stats = (() => {
  const plays = verifiedShows.reduce((n, s) => n + s.surpriseSongs.length, 0);
  const top = ranking.length ? ranking.filter((r) => r.count === ranking[0].count) : [];
  return {
    verified: verifiedShows.length,
    pending: shows.filter((s) => s.status === 'PENDING').length,
    upcoming: shows.filter((s) => s.status === 'UPCOMING').length,
    total: shows.length,
    plays,
    unique: ranking.length,
    top,
    once: ranking.filter((r) => r.count === 1),
    cities: new Set(verifiedShows.map((s) => s.cityKey)).size,
  };
})();

export const latestVerified: Show | undefined = verifiedShows[verifiedShows.length - 1];
export const nextUpcoming: Show | undefined = shows.find((s) => s.status === 'UPCOMING');

/* ---------------------------------------------------------------- helpers */



export const pad = (n: number, w = 3) => String(n).padStart(w, '0');
export const fmtDate = (d: string) => d.replace(/-/g, '.');
const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const weekday = (d: string) => WEEK[new Date(d + 'T12:00:00Z').getUTCDay()];
export const dayLabel = (s: Show) => `DAY ${String(s.dayIndex).padStart(2, '0')}`;
export const songTitle = (id: string) => songById.get(id)?.title ?? id;

export const STATUS_LABEL: Record<Status, string> = {
  VERIFIED: '已核实',
  PENDING: '待核实',
  UPCOMING: '未演出',
};

export const FORM_LABEL: Record<PerformanceForm, string> = {
  full: '完整演唱',
  medley: '串烧',
  snippet: '片段',
  unspecified: '',
};

/** 用标准框架 + 本场改动生成“参考框架”（不代表逐场核实） */
export function templateFor(show: Show) {
  const t = tour.setlistTemplate;
  return t.acts.map((act) => {
    const items: { songId: string | null; note?: string; surprise?: boolean; changed?: boolean }[] = [];
    for (const it of act.items) {
      if (it.slot === 'surprise') {
        const list = show.status === 'VERIFIED' ? show.surpriseSongs : [];
        if (list.length) list.forEach((s) => items.push({ songId: s.songId, surprise: true }));
        else items.push({ songId: null, surprise: true }, { songId: null, surprise: true });
        continue;
      }
      let songId = it.songId!;
      let note = it.note;
      let changed = false;
      let removed = false;
      for (const c of show.setlistChanges) {
        if (c.target !== songId) continue;
        if (c.type === 'replace' && c.with) { songId = c.with; note = c.note; changed = true; }
        if (c.type === 'annotate') { note = [note, c.note].filter(Boolean).join(' · '); changed = true; }
        if (c.type === 'remove') removed = true;
      }
      if (!removed) items.push({ songId, note, changed });
      for (const c of show.setlistChanges)
        if (c.type === 'insertAfter' && c.target === it.songId && c.with)
          items.push({ songId: c.with, note: c.note, changed: true });
    }
    return { act: act.act, items };
  });
}
