// Dev-only: runs the overlay engine on a plain page (no extension APIs) so themes can be screenshotted.
import { playShow } from '../engine/play';
import type { EventId, Mood } from '../shared/events';
import type { FontLoader } from '../shared/fonts';

const q = new URLSearchParams(location.search);
const fontLoader: FontLoader = async (file) => (await fetch('/' + file)).arrayBuffer();

(window as unknown as { run: () => Promise<void> }).run = () =>
  playShow({
    eventId: (q.get('event') as EventId) ?? 'pr.merged',
    mood: (q.get('mood') as Mood) || undefined,
    themeId: q.get('theme') ?? 'marquee',
    subject: q.get('subject') ?? 'acme/widget-shop #42',
    detail: q.get('detail') ?? 'Fix flaky login redirect on Safari',
    tally: Number(q.get('tally') ?? 214),
    scale: Number(q.get('scale') ?? 1),
    honorReducedMotion: q.get('reduced') !== '0',
    fontLoader,
  });
