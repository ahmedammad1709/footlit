import { EVENTS, type EventId } from './events';

export type Intensity = 'brief' | 'standard' | 'long';
export type Appearance = 'auto' | 'light' | 'dark';

export interface Settings {
  enabled: boolean;
  theme: string;
  events: Record<EventId, { enabled: boolean; /** overrides the default theme for this event; null = use the default */ theme: string | null }>;
  intensity: Intensity;
  appearance: Appearance;
  honorReducedMotion: boolean;
  /** epoch ms; shows are suppressed until then */
  quietUntil: number;
  /** the first-run welcome has been dismissed */
  onboarded: boolean;
}

export interface LogEntry {
  at: number;
  event: EventId;
  subject?: string;
  shown: boolean;
  /** why it was not shown, when shown is false */
  reason?: string;
}

export interface Stats {
  shows: number;
  log: LogEntry[];
}

/** The theme that will actually play for an event: its own choice, else the default. */
export function themeFor(s: Settings, id: EventId): string {
  return s.events[id]?.theme ?? s.theme;
}

export const INTENSITY_SCALE: Record<Intensity, number> = { brief: 0.65, standard: 1, long: 1.5 };

export function defaultSettings(): Settings {
  return {
    enabled: true,
    theme: 'marquee',
    events: Object.fromEntries(EVENTS.map((e) => [e.id, { enabled: true, theme: null }])) as Settings['events'],
    intensity: 'standard',
    appearance: 'auto',
    honorReducedMotion: true,
    quietUntil: 0,
    onboarded: false,
  };
}

const KEY = 'footlit:settings';
const STATS_KEY = 'footlit:stats';

function merge(stored: Partial<Settings> | undefined): Settings {
  const d = defaultSettings();
  if (!stored) return d;
  return {
    ...d,
    ...stored,
    events: Object.fromEntries(EVENTS.map((e) => [e.id, { ...d.events[e.id], ...(stored.events?.[e.id] ?? {}) }])) as Settings['events'],
  };
}

export async function getSettings(): Promise<Settings> {
  try {
    const r = await chrome.storage.sync.get(KEY);
    return merge(r[KEY] as Partial<Settings> | undefined);
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(next: Settings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [KEY]: next });
  } catch {
    /* storage unavailable: the in-memory copy still works for this session */
  }
}

export function watchSettings(cb: (s: Settings) => void): () => void {
  const fn = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'sync' && changes[KEY]) cb(merge(changes[KEY].newValue as Partial<Settings>));
  };
  chrome.storage.onChanged.addListener(fn);
  return () => chrome.storage.onChanged.removeListener(fn);
}

export async function getStats(): Promise<Stats> {
  try {
    const r = await chrome.storage.local.get(STATS_KEY);
    const s = r[STATS_KEY] as Partial<Stats> | undefined;
    return { shows: s?.shows ?? 0, log: s?.log ?? [] };
  } catch {
    return { shows: 0, log: [] };
  }
}

export async function recordEvent(entry: LogEntry): Promise<Stats> {
  const s = await getStats();
  const next: Stats = { shows: s.shows + (entry.shown ? 1 : 0), log: [entry, ...s.log].slice(0, 40) };
  try {
    await chrome.storage.local.set({ [STATS_KEY]: next });
  } catch {
    /* ignore */
  }
  return next;
}

export async function clearStats(): Promise<void> {
  try {
    await chrome.storage.local.remove(STATS_KEY);
  } catch {
    /* ignore */
  }
}

export function watchStats(cb: (s: Stats) => void): () => void {
  const fn = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[STATS_KEY]) {
      const s = changes[STATS_KEY].newValue as Partial<Stats> | undefined;
      cb({ shows: s?.shows ?? 0, log: s?.log ?? [] });
    }
  };
  chrome.storage.onChanged.addListener(fn);
  return () => chrome.storage.onChanged.removeListener(fn);
}
