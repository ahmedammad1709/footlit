import type { Detector } from './types';
import { submissionIntent } from './intent';
import { itemTitle, readItemState, watchState, type ItemState } from './track';

const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/;
/** the page where you write a new pull request, and the banner link that leads to it */
const PR_FORM = /^\/[^/]+\/[^/]+\/(?:compare(?:\/|$)|pull\/new\/)/;

/**
 * Pull request lifecycle while you watch it:
 *  - merged  : header badge flips Open/Draft -> Merged
 *  - closed  : header badge flips Open/Draft -> Closed (not merged)
 *  - opened  : you leave the compare / new-PR form and land on the new pull request
 * Visiting an already merged or closed PR is never a celebration.
 */
export const prMerged: Detector = (api) => {
  const submitted = submissionIntent('pr', (p) => PR_FORM.test(p));
  watchState<ItemState>(api, {
    match: (p) => p.match(PR_PATH),
    key: (m) => `${m[1]}/${m[2]}#${m[3]}`.toLowerCase(),
    settled: (m) => document.title.includes(`#${m[3]}`),
    read: readItemState,
    onChange(before, after, m) {
      if (before !== 'open' && before !== 'draft') return;
      const subject = `${m[1]}/${m[2]} #${m[3]}`;
      const key = `${m[1]}/${m[2]}#${m[3]}`.toLowerCase();
      if (after === 'merged') api.emit('pr.merged', { subject, detail: itemTitle(), key });
      else if (after === 'closed') api.emit('pr.closed', { subject, detail: itemTitle(), key });
    },
  });

  api.onNav(({ url, prev }) => {
    if (!prev || !PR_FORM.test(prev.pathname)) return;
    const m = url.pathname.match(PR_PATH);
    if (!m) return;
    const wasSubmitted = submitted(prev.pathname);
    api.log('left the pull request form for', url.pathname, wasSubmitted ? '(submitted)' : '(not submitted: no show)');
    if (!wasSubmitted) return;
    // The new page may still be filling in (title first, header badge a moment later), so wait until both are there.
    let tries = 80;
    const attempt = () => {
      if (location.pathname !== url.pathname) return;
      const state = document.title.toLowerCase().includes(`#${m[3]}`) ? readItemState() : null;
      if (!state) {
        if (--tries > 0) setTimeout(attempt, 100);
        else api.log('pr.opened: the new page never showed a state badge');
        return;
      }
      if (state !== 'open' && state !== 'draft') return; // an already merged or closed PR is not an opening
      const key = `${m[1]}/${m[2]}#${m[3]}`.toLowerCase();
      api.log('pr.opened confirmed', key);
      api.emit('pr.opened', { subject: `${m[1]}/${m[2]} #${m[3]}`, detail: itemTitle(), key: `${key}:opened` });
    };
    attempt();
  });
};
