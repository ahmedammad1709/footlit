// Run in node by site/scripts/prep.mjs to export the extension's event and theme metadata as JSON for static pages.
import { EVENTS, EVENT_GROUPS, MOODS } from '../shared/events';
import { THEMES } from '../themes';

export default {
  events: EVENTS,
  groups: EVENT_GROUPS,
  moods: MOODS,
  themes: THEMES.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, swatch: t.swatch })),
};
