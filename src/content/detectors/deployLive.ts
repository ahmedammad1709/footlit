import type { Detector } from './types';
import { watchState } from './track';

const PAGES_PATH = /^\/([^/]+)\/([^/]+)\/settings\/pages\/?$/;

type Pages = 'pending' | 'live';

function readPages(): Pages | null {
  const text = (document.querySelector('main, #repo-content-pjax-container, [role="main"]') ?? document.body).textContent?.toLowerCase().replace(/\s+/g, ' ') ?? '';
  if (/your site is live at/.test(text)) return 'live';
  if (/(is being (built|deployed|published)|ready to be published|deployment (is )?in progress|building)/.test(text)) return 'pending';
  return null;
}

/**
 * Settings -> Pages: the banner changes from "being built / ready to be published" to "Your site is live at".
 * (The Actions run page of the "pages build and deployment" workflow is handled by the checks detector, which
 * emits the same event under the same key, so one deploy never plays twice.)
 */
export const deployLive: Detector = (api) => {
  watchState<Pages>(api, {
    match: (p) => p.match(PAGES_PATH),
    key: (m) => `${m[1]}/${m[2]}`.toLowerCase(),
    read: readPages,
    onChange(before, after, m) {
      if (before === 'pending' && after === 'live') api.emit('deploy.live', { subject: `${m[1]}/${m[2]}`, key: `${m[1]}/${m[2]}`.toLowerCase() });
    },
  });
};
