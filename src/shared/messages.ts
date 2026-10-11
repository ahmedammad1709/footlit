import type { EventId, Mood } from './events';

export type Message =
  | { type: 'font'; file: string }
  | { type: 'hello' }
  | { type: 'rehearse'; event: EventId; mood?: Mood; theme?: string; subject?: string };

export type FontReply = { ok: true; b64: string } | { ok: false };
export type HelloReply = { build: string };
export type RehearseReply = { ok: boolean; error?: string };
