import type { Detector } from './types';

type Ci = 'pending' | 'success' | 'failure';

const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/;
const RUN_PATH = /^\/([^/]+)\/([^/]+)\/actions\/runs\/(\d+)(?:\/.*)?$/;

/** Headings in the pull request merge box. Matched on text because the box is rendered client-side. */
const MERGEBOX: [RegExp, Ci][] = [
  [/^all (required )?checks have passed/i, 'success'],
  [/^(some|all) (required )?checks (were not successful|have failed)|^checks were not successful|^all checks have failed/i, 'failure'],
  [/^(some )?(required )?checks (haven.t|have not) completed|^checks (are )?(pending|in progress)|^waiting for status/i, 'pending'],
];

/** Value of the "Status" cell on an Actions run page. */
function runStatus(text: string): Ci | null {
  const t = text.trim().toLowerCase();
  if (t === 'success') return 'success';
  if (t === 'failure' || t === 'startup failure') return 'failure';
  if (['in progress', 'queued', 'waiting', 'requested', 'pending'].includes(t)) return 'pending';
  return null; // cancelled / skipped / neutral: not worth a show
}

function readMergeBox(): Ci | null {
  for (const el of document.querySelectorAll<HTMLElement>('h2, h3, h4, [role="heading"], .status-heading')) {
    if (el.closest('.markdown-body, .comment-body, .js-comment-body')) continue; // someone's comment, not the merge box
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 80) continue;
    for (const [re, state] of MERGEBOX) if (re.test(text)) return state;
  }
  return null;
}

function readRun(): Ci | null {
  for (const el of document.querySelectorAll<HTMLElement>('span.text-small')) {
    if ((el.textContent ?? '').trim() !== 'Status') continue;
    const value = el.nextElementSibling?.textContent;
    if (value) return runStatus(value);
  }
  return null;
}

function prTitle(): string {
  const el = document.querySelector('.js-issue-title, bdi.markdown-title, [data-testid="issue-title"]');
  return (el?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90);
}

/**
 * Celebrates (or mourns) checks finishing while you watch: a pull request's merge box, or an Actions run page.
 * It only fires on a pending -> passed/failed transition it saw happen, so opening a PR whose checks are
 * already green or red never triggers a show.
 */
export const ci: Detector = (api) => {
  let tracked: { key: string; state: Ci | null; since: number; armed: boolean } | null = null;

  const evaluate = () => {
    const pr = location.pathname.match(PR_PATH);
    const run = location.pathname.match(RUN_PATH);
    if (!pr && !run) {
      tracked = null;
      return;
    }
    const m = (pr ?? run)!;
    const key = `${m[1]}/${m[2]}${pr ? '#' : '/run/'}${m[3]}`.toLowerCase();
    if (!tracked || tracked.key !== key) tracked = { key, state: null, since: performance.now(), armed: false };

    const state = pr ? readMergeBox() : readRun();
    if (!tracked.armed) {
      // wait for the page to settle and a first reading, so a Turbo navigation can't leak the previous page's state
      if (state && performance.now() - tracked.since > 500) {
        tracked.armed = true;
        tracked.state = state;
        api.log('ci armed', key, state);
      }
      return;
    }
    if (!state || state === tracked.state) return;
    const before = tracked.state;
    tracked.state = state;
    api.log('ci state', key, before, '->', state);
    if (before !== 'pending' || state === 'pending') return;

    const subject = pr ? `${m[1]}/${m[2]} #${m[3]}` : `${m[1]}/${m[2]}`;
    const detail = pr ? prTitle() : document.title.split(' · ')[0]!.slice(0, 90);
    api.emit(state === 'success' ? 'ci.passed' : 'ci.failed', { subject, detail, key: `${key}:${state}` });
  };

  api.onNav(() => {
    tracked = null;
    setTimeout(evaluate, 600);
    setTimeout(evaluate, 1200); // second look: arms the detector even if the page is otherwise quiet
  });
  api.onMutate(evaluate);
};
