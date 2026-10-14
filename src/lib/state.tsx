import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { latestVerified, showById, shows, songById } from './data';

export type Scene = 'home' | 'archive' | 'lab' | 'finder' | 'ticket';
export const SCENES: { id: Scene; no: string; en: string; zh: string }[] = [
  { id: 'home', no: '01', en: 'HOME', zh: '首页' },
  { id: 'archive', no: '02', en: 'SHOW ARCHIVE', zh: '场次' },
  { id: 'lab', no: '03', en: 'DATA LAB', zh: '数据' },
  { id: 'finder', no: '04', en: 'SONG FINDER', zh: '反查' },
  { id: 'ticket', no: '05', en: 'MY TICKET', zh: '票根' },
];

interface AppState {
  scene: Scene;
  showId: string;
  songId: string | null;
  query: string;
  ticketShowId: string | null;
}

interface Ctx extends AppState {
  go: (scene: Scene, patch?: Partial<Omit<AppState, 'scene'>>) => void;
  set: (patch: Partial<AppState>) => void;
}

const AppCtx = createContext<Ctx | null>(null);
const LS_KEY = 'bts-setlist-lab:v1';
const sceneIds = SCENES.map((s) => s.id);

function readHash(): Partial<AppState> {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return {};
  const [path, qs] = h.split('?');
  const p = new URLSearchParams(qs ?? '');
  const out: Partial<AppState> = {};
  if (sceneIds.includes(path as Scene)) out.scene = path as Scene;
  const show = p.get('show');
  if (show && showById.has(show)) out.showId = show;
  const song = p.get('song');
  if (song && songById.has(song)) out.songId = song;
  return out;
}

function initial(): AppState {
  let saved: Partial<AppState> = {};
  try {
    saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    /* storage unavailable */
  }
  const base: AppState = {
    scene: 'home',
    showId: latestVerified?.showId ?? shows[0].showId,
    songId: null,
    query: '',
    ticketShowId: null,
  };
  if (saved.showId && !showById.has(saved.showId)) delete saved.showId;
  if (saved.songId && !songById.has(saved.songId)) delete saved.songId;
  if (saved.ticketShowId && !showById.has(saved.ticketShowId)) delete saved.ticketShowId;
  return { ...base, ...saved, scene: 'home', ...readHash() };
}

function toHash(s: AppState) {
  const p = new URLSearchParams();
  if (s.scene === 'archive' || s.scene === 'ticket') p.set('show', s.scene === 'ticket' && s.ticketShowId ? s.ticketShowId : s.showId);
  if ((s.scene === 'finder' || s.scene === 'lab') && s.songId) p.set('song', s.songId);
  const q = p.toString();
  return `#/${s.scene}${q ? '?' + q : ''}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);

  useEffect(() => {
    const h = toHash(state);
    if (location.hash !== h) history.replaceState(null, '', h);
    try {
      const { scene: _s, ...rest } = state;
      void _s;
      localStorage.setItem(LS_KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    const on = () => setState((s) => ({ ...s, ...readHash() }));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = useCallback<Ctx['go']>((scene, patch) => {
    setState((s) => ({ ...s, ...patch, scene }));
  }, []);
  const set = useCallback<Ctx['set']>((patch) => setState((s) => ({ ...s, ...patch })), []);

  const value = useMemo(() => ({ ...state, go, set }), [state, go, set]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

export function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}
