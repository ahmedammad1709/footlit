import type { Detector } from './types';

const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/;

type State = 'open' | 'draft' | 'merged' | 'closed';

const BADGE = '#partial-discussion-header .State, .gh-header-meta .State, [data-testid="header-state"]';

function readState(): State | null {
  const badge = document.querySelector<HTMLElement>(BADGE);
  if (!badge) return null;
  const c = badge.className;
  if (/State--merged/.test(c)) return 'merged';
  if (/State--open/.test(c)) return 'open';
  if (/State--closed/.test(c)) return 'closed';
  if (/State--draft/.test(c)) return 'draft';
  const t = (badge.getAttribute('title') ?? badge.textContent ?? '').toLowerCase();
  if (t.includes('merged')) return 'merged';
  if (t.includes('draft')) return 'draft';
  if (t.includes('closed')) return 'closed';
  if (t.includes('open')) return 'open';
  return null;
}

function readTitle(): string {
  const el = document.querySelector('.js-issue-title, bdi.markdown-title, [data-testid="issue-title"]');
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90);
}

/**
 * Fires when the badge at the top of a pull request flips to "Merged" while you are looking at it.
 * Never fires on first load (visiting an already-merged PR is not a celebration), and waits for the page to
 * settle after a Turbo navigation so the previous PR's badge can't be mistaken for this one's.
 */
export const prMerged: Detector = (api) => {
  let tracked: { key: string; state: State | null; since: number; armed: boolean } | null = null;

  const evaluate = () => {
    const m = location.pathname.match(PR_PATH);
    if (!m) {
      tracked = null;
      return;
    }
    const [, owner, repo, num] = m;
    const key = `${owner}/${repo}#${num}`.toLowerCase();
    if (!tracked || tracked.key !== key) tracked = { key, state: null, since: performance.now(), armed: false };

    // the page belongs to this PR once its title mentions the number
    const titleOk = document.title.includes(`#${num}`);
    const state = readState();
    if (!tracked.armed) {
      if (titleOk && state && performance.now() - tracked.since > 500) {
        tracked.armed = true;
        tracked.state = state;
        api.log('pr armed', key, state);
      }
      return;
    }
    if (!state || state === tracked.state) return;
    const before = tracked.state;
    tracked.state = state;
    api.log('pr state', key, before, '->', state);
    if (state === 'merged' && (before === 'open' || before === 'draft')) {
      api.emit('pr.merged', { subject: `${owner}/${repo} #${num}`, detail: readTitle(), key });
    }
  };

  api.onNav(() => {
    tracked = null;
    setTimeout(evaluate, 600);
  });
  api.onMutate(evaluate);
};
