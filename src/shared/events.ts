export type Mood = 'applause' | 'farewell' | 'alarm';
export type EventId =
  | 'repo.created' | 'repo.deleted' | 'repo.forked'
  | 'pr.opened' | 'pr.merged' | 'pr.closed'
  | 'ci.passed' | 'ci.failed' | 'deploy.live'
  | 'release.published' | 'issue.closed';

export interface EventDef {
  id: EventId;
  label: string;
  /** short label for compact controls (popup chips) */
  chip: string;
  blurb: string;
  mood: Mood;
  /** small caps line on the ticket, e.g. "New repository" */
  kicker: string;
  /** takes a pull request / issue number in its subject, e.g. "acme/widget #42" */
  numbered: boolean;
}

export const EVENTS: EventDef[] = [
  { id: 'repo.created', label: 'Repo created', chip: 'Created', blurb: 'Opening night for something new.', mood: 'applause', kicker: 'New repository', numbered: false },
  { id: 'repo.deleted', label: 'Repo deleted', chip: 'Deleted', blurb: 'Strike the set.', mood: 'farewell', kicker: 'Repository deleted', numbered: false },
  { id: 'repo.forked', label: 'Repo forked', chip: 'Forked', blurb: 'Your own copy, ready to bend.', mood: 'applause', kicker: 'Repository forked', numbered: false },
  { id: 'pr.opened', label: 'Pull request opened', chip: 'Opened', blurb: 'A conversation begins.', mood: 'applause', kicker: 'Pull request opened', numbered: true },
  { id: 'pr.merged', label: 'Pull request merged', chip: 'Merged', blurb: 'Two branches, one story.', mood: 'applause', kicker: 'Merged', numbered: true },
  { id: 'pr.closed', label: 'Pull request closed', chip: 'Closed', blurb: 'Not every scene makes the cut.', mood: 'farewell', kicker: 'Closed without merging', numbered: true },
  { id: 'ci.passed', label: 'Checks passed', chip: 'Passed', blurb: 'The green check, with feeling.', mood: 'applause', kicker: 'Checks passed', numbered: true },
  { id: 'ci.failed', label: 'Checks failed', chip: 'Failed', blurb: 'The show stops.', mood: 'alarm', kicker: 'Checks failed', numbered: true },
  { id: 'deploy.live', label: 'Site or deploy live', chip: 'Deploy', blurb: 'Pages goes up, curtain goes up.', mood: 'applause', kicker: 'Now live', numbered: false },
  { id: 'release.published', label: 'Release published', chip: 'Release', blurb: 'A tag worth a trumpet.', mood: 'applause', kicker: 'Release published', numbered: false },
  { id: 'issue.closed', label: 'Issue closed', chip: 'Issue closed', blurb: 'One less thing on the list.', mood: 'applause', kicker: 'Issue closed', numbered: true },
];

export interface EventGroup {
  id: string;
  label: string;
  events: EventId[];
}

/** How events are grouped everywhere in the UI, so related things sit together. */
export const EVENT_GROUPS: EventGroup[] = [
  { id: 'repos', label: 'Repositories', events: ['repo.created', 'repo.deleted', 'repo.forked'] },
  { id: 'prs', label: 'Pull requests', events: ['pr.opened', 'pr.merged', 'pr.closed'] },
  { id: 'checks', label: 'Checks and deploys', events: ['ci.passed', 'ci.failed', 'deploy.live'] },
  { id: 'other', label: 'Releases and issues', events: ['release.published', 'issue.closed'] },
];

/** Events on the roadmap that are not wired up yet. Shown dimmed so the programme stays honest. */
export const UNDERSTUDIES: { label: string; blurb: string }[] = [
  { label: 'Push from your terminal', blurb: 'Needs a GitHub token. Later.' },
  { label: 'Starred or watched', blurb: 'Waiting on stable page markup.' },
];

export const MOODS: Record<Mood, { label: string; blurb: string }> = {
  applause: { label: 'Applause', blurb: 'Something went right.' },
  farewell: { label: 'Farewell', blurb: 'Something ended, on purpose.' },
  alarm: { label: 'Alarm', blurb: 'Something broke.' },
};

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e])) as Record<EventId, EventDef>;
