// Bundled for the marketing site: exposes the real overlay engine and themes as window.Footlit,
// so the site's demos are the extension's own code, not a lookalike.
import { playShow, stopShow } from '../engine/play';
import { THEMES } from '../themes';
import type { EventId, Mood } from '../shared/events';
import type { FontLoader } from '../shared/fonts';

const fontLoader: FontLoader = async (file) => (await fetch('/' + file)).arrayBuffer();

export interface SitePlayOptions {
  event: EventId;
  mood?: Mood;
  theme: string;
  subject?: string;
  detail?: string;
  /** render inside this element; omit for a full-page overlay */
  container?: HTMLElement;
  scale?: number;
}

const api = {
  themes: THEMES.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, swatch: t.swatch })),
  play(o: SitePlayOptions): Promise<void> {
    return playShow({
      eventId: o.event,
      mood: o.mood,
      themeId: o.theme,
      subject: o.subject ?? 'acme/widget-shop #42',
      detail: o.detail ?? 'Fix flaky login redirect on Safari',
      tally: 214,
      scale: o.scale ?? 1,
      honorReducedMotion: true,
      container: o.container,
      fontLoader,
    });
  },
  stop: stopShow,
};

(window as unknown as { Footlit: typeof api }).Footlit = api;
export type FootlitApi = typeof api;
