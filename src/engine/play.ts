import { EVENT_BY_ID, type EventId, type Mood } from '../shared/events';
import { ensureFonts, type FontLoader } from '../shared/fonts';
import { getTheme } from '../themes';
import { makeClock } from './util';
import { mountFullscreen, mountInto, type Stage } from './stage';

export interface ShowRequest {
  eventId: EventId;
  mood?: Mood;
  themeId: string;
  subject?: string;
  detail?: string;
  tally?: number;
  /** duration multiplier: brief 0.65, standard 1, long 1.5 */
  scale?: number;
  /** honour the OS reduced-motion preference */
  honorReducedMotion?: boolean;
  /** render inside this element instead of full-screen */
  container?: HTMLElement;
  fontLoader: FontLoader;
}

let current: AbortController | null = null;

export function isPlaying(): boolean {
  return current !== null && !current.signal.aborted;
}

export function stopShow(): void {
  current?.abort();
}

/** Plays one show. A newer show replaces an older one. Resolves when the stage has been cleaned up. */
export async function playShow(req: ShowRequest): Promise<void> {
  current?.abort();
  const ctl = new AbortController();
  current = ctl;
  const { signal } = ctl;
  let stage: Stage | undefined;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') ctl.abort();
  };

  try {
    const theme = getTheme(req.themeId);
    const def = EVENT_BY_ID[req.eventId];
    const mood = req.mood ?? def.mood;
    const embedded = !!req.container;

    await ensureFonts(theme.fonts, req.fontLoader);
    if (signal.aborted) return;

    // A page can be detected at document_start, before there is anywhere to put the stage.
    if (!embedded && !document.body) {
      await new Promise<void>((resolve) => {
        const done = () => {
          document.removeEventListener('DOMContentLoaded', done);
          signal.removeEventListener('abort', done);
          resolve();
        };
        document.addEventListener('DOMContentLoaded', done, { once: true });
        signal.addEventListener('abort', done, { once: true });
      });
      if (signal.aborted) return;
    }

    // Don't perform to an empty room: wait (briefly) for the tab to be visible.
    if (!embedded && document.visibilityState === 'hidden') {
      await new Promise<void>((resolve) => {
        const t = setTimeout(done, 8000);
        function done() {
          clearTimeout(t);
          document.removeEventListener('visibilitychange', onVis);
          signal.removeEventListener('abort', done);
          resolve();
        }
        function onVis() {
          if (document.visibilityState === 'visible') done();
        }
        document.addEventListener('visibilitychange', onVis);
        signal.addEventListener('abort', done, { once: true });
      });
      if (signal.aborted || document.visibilityState === 'hidden') return;
    }

    stage = embedded ? mountInto(req.container!, theme.css) : mountFullscreen(theme.css);
    const reduced = (req.honorReducedMotion ?? true) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const style = document.createElement('style');
      style.textContent = '* , *::before, *::after { animation: none !important; transition: none !important; }';
      stage.root.append(style);
    }
    const subject = req.subject ?? '';
    stage.say(`${def.label}${subject ? `: ${subject}` : ''}`);

    if (!embedded) window.addEventListener('keydown', onKey, true);

    await theme.play({
      root: stage.root,
      box: stage.box,
      eventId: req.eventId,
      mood,
      subject,
      detail: req.detail ?? '',
      kicker: def.kicker,
      tally: req.tally ?? 1,
      clk: makeClock(signal, req.scale ?? 1),
      signal,
      reduced,
      embedded,
    });
  } catch (err) {
    console.warn('[footlit] theme failed', err);
  } finally {
    ctl.abort();
    window.removeEventListener('keydown', onKey, true);
    stage?.dispose();
    if (current === ctl) current = null;
  }
}
