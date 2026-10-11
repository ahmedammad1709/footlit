'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEMES, type Mood } from './data';

export { DOWNLOADS, EVENTS, GROUPS, MOODS, THEMES, VERSION, type EventDef, type Mood, type ThemeMeta } from './data';

interface PlayOptions {
  mood?: Mood;
  /** render inside this element; leave out for a full-page show */
  container?: HTMLElement | null;
  theme?: string;
}

interface Engine {
  play(o: { event: string; mood?: string; theme: string; container?: HTMLElement; subject?: string; detail?: string }): Promise<void>;
  stop(): void;
}

declare global {
  interface Window {
    Footlit?: Engine;
  }
}

interface Ctx {
  themeId: string;
  setThemeId(id: string): void;
  ready: boolean;
  play(eventId: string, o?: PlayOptions): Promise<void>;
  stop(): void;
}

const FootlitContext = createContext<Ctx | null>(null);
const KEY = 'footlit-site-theme';

/** Connects React to the real overlay engine (public/engine/footlit-engine.js, loaded in the layout). */
export function FootlitProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeState] = useState('marquee');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && THEMES.some((t) => t.id === saved)) setThemeState(saved);
    } catch {
      /* storage may be blocked; the default is fine */
    }
    let tries = 0;
    const t = setInterval(() => {
      if (window.Footlit) {
        setReady(true);
        clearInterval(t);
      } else if (++tries > 200) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, []);

  const setThemeId = useCallback((id: string) => {
    setThemeState(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const play = useCallback(
    async (eventId: string, o: PlayOptions = {}) => {
      if (!window.Footlit) return;
      await window.Footlit.play({ event: eventId, mood: o.mood, theme: o.theme ?? themeId, container: o.container ?? undefined });
    },
    [themeId],
  );

  const value = useMemo<Ctx>(() => ({ themeId, setThemeId, ready, play, stop: () => window.Footlit?.stop() }), [themeId, setThemeId, ready, play]);
  return <FootlitContext.Provider value={value}>{children}</FootlitContext.Provider>;
}

export function useFootlit(): Ctx {
  const c = useContext(FootlitContext);
  if (!c) throw new Error('useFootlit must be used inside FootlitProvider');
  return c;
}
