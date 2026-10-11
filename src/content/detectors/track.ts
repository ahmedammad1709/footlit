import type { DetectorApi } from './types';

export type ItemState = 'open' | 'draft' | 'merged' | 'closed';

/** Header badge of an issue or pull request: current Primer markup first, then the older .State badge. */
const BADGES = '[data-testid="header-state"], #partial-discussion-header .State, .gh-header-meta .State';

export function readItemState(): ItemState | null {
  const badge = document.querySelector<HTMLElement>(BADGES);
  if (!badge) return null;
  const probe = `${badge.getAttribute('data-status') ?? ''} ${badge.className} ${badge.getAttribute('title') ?? ''} ${badge.textContent ?? ''}`.toLowerCase();
  if (/merged/.test(probe)) return 'merged';
  if (/draft/.test(probe)) return 'draft';
  if (/closed/.test(probe)) return 'closed';
  if (/open/.test(probe)) return 'open';
  return null;
}

export function itemTitle(): string {
  const el = document.querySelector('.js-issue-title, bdi.markdown-title, [data-testid="issue-title"]');
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90);
}

export interface WatchOptions<S extends string> {
  match(path: string): RegExpMatchArray | null;
  key(m: RegExpMatchArray): string;
  /** true once the page on screen really is the one in the URL (guards against Turbo navigation lag) */
  settled?(m: RegExpMatchArray): boolean;
  read(m: RegExpMatchArray): S | null;
  onChange(before: S, after: S, m: RegExpMatchArray): void;
}

/**
 * Watches a page's state while you look at it and reports transitions only.
 * It waits for the page to settle and a first reading before "arming", so opening a page that is already
 * merged, closed or green never counts as something that just happened.
 */
export function watchState<S extends string>(api: DetectorApi, o: WatchOptions<S>): void {
  let tracked: { key: string; state: S | null; since: number; armed: boolean } | null = null;

  const evaluate = () => {
    const m = o.match(location.pathname);
    if (!m) {
      tracked = null;
      return;
    }
    const key = o.key(m);
    if (!tracked || tracked.key !== key) tracked = { key, state: null, since: performance.now(), armed: false };

    const state = o.read(m);
    if (!tracked.armed) {
      if (state && (o.settled?.(m) ?? true) && performance.now() - tracked.since > 500) {
        tracked.armed = true;
        tracked.state = state;
        api.log('armed', key, state);
      }
      return;
    }
    if (!state || state === tracked.state) return;
    const before = tracked.state as S;
    tracked.state = state;
    api.log('state', key, before, '->', state);
    o.onChange(before, state, m);
  };

  api.onNav(() => {
    tracked = null;
    setTimeout(evaluate, 600);
    setTimeout(evaluate, 1200); // second look: arms the detector even if the page is otherwise quiet
  });
  api.onMutate(evaluate);
}

/** Poll briefly until the document title mentions `needle` (the new page has really replaced the old one). */
export function whenTitleHas(needle: string, then: () => void, tries = 25): void {
  const check = () => {
    if (document.title.toLowerCase().includes(needle.toLowerCase())) then();
    else if (--tries > 0) setTimeout(check, 100);
  };
  check();
}
