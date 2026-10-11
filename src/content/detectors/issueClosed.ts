import type { Detector } from './types';
import { itemTitle, readItemState, watchState, type ItemState } from './track';

const ISSUE_PATH = /^\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:\/.*)?$/;

/** Fires when the badge at the top of an issue flips Open -> Closed while you are looking at it. */
export const issueClosed: Detector = (api) => {
  watchState<ItemState>(api, {
    match: (p) => p.match(ISSUE_PATH),
    key: (m) => `${m[1]}/${m[2]}#${m[3]}`.toLowerCase(),
    settled: (m) => document.title.includes(`#${m[3]}`),
    read: readItemState,
    onChange(before, after, m) {
      if (before === 'open' && after === 'closed') {
        api.emit('issue.closed', { subject: `${m[1]}/${m[2]} #${m[3]}`, detail: itemTitle(), key: `${m[1]}/${m[2]}#${m[3]}`.toLowerCase() });
      }
    },
  });
};
