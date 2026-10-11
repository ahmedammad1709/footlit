import { EVENT_BY_ID, type EventId, type Mood } from '../shared/events';
import { ensureFonts, type FontLoader } from '../shared/fonts';
import { getTheme } from '../themes';
import { makeClock } from './util';
import { mountFullscreen, mountInto } from './stage';

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

  const theme = getTheme(req.themeId);
  const def = EVENT_BY_ID[req.eventId];
  const mood = req.mood ?? def.mood;
  const embedded = !!req.container;

  await ensureFonts(theme.fonts, req.fontLoader);
  if (signal.aborted) return;

  // Don't perform to an empty room: wait (briefly) for the tab to be visible.
  if (!embedded && document.visibilityState === 'hidden') {
    await new Promise<void>((resolve) => {
      const t = setTimeout(done, 8000);
      function done() {
        clearTimeout(t);
        document.removeEventListener('visibilitychange', onVis);
        resolve();
      }
      function onVis() {
        if (document.visibilityState === 'visible') done();
      }
      document.addEventListener('visibilitychange', onVis);
    });
    if (signal.aborted || document.visibilityState === 'hidden') return;
  }

  const stage = embedded ? mountInto(req.container!, theme.css) : mountFullscreen(theme.css);
  const reduced = (req.honorReducedMotion ?? true) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const subject = req.subject ?? '';
  stage.say(`${def.label}${subject ? `: ${subject}` : ''}`);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') ctl.abort();
  };
  if (!embedded) window.addEventListener('keydown', onKey, true);

  try {
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
    window.removeEventListener('keydown', onKey, true);
    stage.dispose();
    if (current === ctl) current = null;
  }
}
