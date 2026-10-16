import type { EventId, Mood } from './events';
import type { LogEntry } from './settings';

export type Message =
  | { type: 'record-event'; entry: LogEntry }
  | { type: 'clear-stats' }
  | { type: 'font'; file: string }
  | { type: 'hello' }
  | { type: 'rehearse'; event: EventId; mood?: Mood; theme?: string; subject?: string };

export type FontReply = { ok: true; b64: string } | { ok: false };
export type HelloReply = { build: string };
export type RehearseReply = { ok: boolean; error?: string };
