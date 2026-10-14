import { songs, appearances, type Song } from './data';

/** 归一化：NFKC、小写、去掉空格与标点（保留中日韩文字与字母数字） */
export function norm(s: string) {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s'’"“”.,:;!?()（）\-_/&·・。，、！？]+/g, '');
}

interface Indexed {
  song: Song;
  keys: string[];
}

const index: Indexed[] = songs.map((song) => ({
  song,
  keys: [song.title, song.titleKo ?? '', ...song.aliases, song.songId].filter(Boolean).map(norm),
}));

export interface Hit {
  song: Song;
  score: number;
  count: number;
}

/** 即时搜索：完全匹配 > 前缀 > 包含；同分按出现次数排序 */
export function searchSongs(q: string): Hit[] {
  const n = norm(q);
  if (!n) return [];
  const hits: Hit[] = [];
  for (const { song, keys } of index) {
    let score = 0;
    for (const k of keys) {
      if (k === n) score = Math.max(score, 3);
      else if (k.startsWith(n)) score = Math.max(score, 2);
      else if (k.includes(n)) score = Math.max(score, 1);
    }
    if (score) hits.push({ song, score, count: appearances.get(song.songId)?.length ?? 0 });
  }
  return hits.sort((a, b) => b.score - a.score || b.count - a.count || a.song.title.localeCompare(b.song.title));
}
