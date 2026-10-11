import type { EventId, Mood } from '../shared/events';
import type { FontId } from '../shared/fonts';

export interface Clock {
  /** Run fn after ms (already multiplied by the intensity scale). Cancelled automatically on abort. */
  after(ms: number, fn: () => void): void;
  /** Resolve at absolute time ms from show start; resolves false if the show was aborted. */
  at(ms: number): Promise<boolean>;
  /** scale a duration */
  d(ms: number): number;
}

export interface PlayContext {
  root: ShadowRoot;
  /** Fills the stage. Append your layers here. Has container-type:size, so cqw/cqh units work. */
  box: HTMLElement;
  eventId: EventId;
  mood: Mood;
  /** e.g. "acme/widget-shop" or "acme/widget-shop #42" */
  subject: string;
  /** optional second line, e.g. a PR title */
  detail: string;
  kicker: string;
  /** the n-th show this install has put on */
  tally: number;
  clk: Clock;
  signal: AbortSignal;
  /** user prefers reduced motion: no movement, no particles */
  reduced: boolean;
  /** true inside the options-page preview */
  embedded: boolean;
}

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  /** four colours shown on the theme card, darkest first */
  swatch: [string, string, string, string];
  fonts: FontId[];
  css: string;
  /** total runtime in ms at scale 1, used to size timelines and previews */
  runtime: number;
  play(ctx: PlayContext): Promise<void>;
}
