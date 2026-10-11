export type Mood = 'applause' | 'farewell' | 'alarm';
export type EventId = 'repo.created' | 'pr.merged' | 'repo.deleted';

export interface EventDef {
  id: EventId;
  label: string;
  blurb: string;
  mood: Mood;
  /** small caps line on the ticket, e.g. "New repository" */
  kicker: string;
}

export const EVENTS: EventDef[] = [
  { id: 'repo.created', label: 'Repo created', blurb: 'Opening night for something new.', mood: 'applause', kicker: 'New repository' },
  { id: 'pr.merged', label: 'Pull request merged', blurb: 'Two branches, one story.', mood: 'applause', kicker: 'Merged' },
  { id: 'repo.deleted', label: 'Repo deleted', blurb: 'Strike the set.', mood: 'farewell', kicker: 'Repository deleted' },
];

/** Events on the roadmap that are not wired up yet. Shown dimmed so the programme stays honest. */
export const UNDERSTUDIES: { label: string; blurb: string }[] = [
  { label: 'CI passed', blurb: 'The green check, with feeling.' },
  { label: 'CI failed', blurb: 'The show stops.' },
  { label: 'Site or deploy live', blurb: 'Pages goes up, curtain goes up.' },
  { label: 'Release published', blurb: 'A tag worth a trumpet.' },
  { label: 'Push from your terminal', blurb: 'Needs a GitHub token. Later.' },
];

export const MOODS: Record<Mood, { label: string; blurb: string }> = {
  applause: { label: 'Applause', blurb: 'Something went right.' },
  farewell: { label: 'Farewell', blurb: 'Something ended, on purpose.' },
  alarm: { label: 'Alarm', blurb: 'Something broke.' },
};

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e])) as Record<EventId, EventDef>;
