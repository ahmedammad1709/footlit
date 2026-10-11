import { RESERVED_OWNERS, type Detector } from './types';

/** pages where you fill in the "new repository" form */
const FORM_PATHS = [
  /^\/new\/?$/,
  /^\/new\/import\/?$/,
  /^\/repositories\/new\/?$/,
  /^\/organizations\/[^/]+\/repositories\/new\/?$/,
  /^\/[^/]+\/[^/]+\/generate\/?$/, // "use this template"
];
const REPO_ROOT = /^\/([^/]+)\/([^/]+)\/?$/;

/**
 * Creating a repo = leaving the "new repository" form and landing on that repo's front page.
 * We confirm it really is a repo page (meta tag or <title>) so a stray click to /settings/profile can't trigger it.
 */
export const repoCreated: Detector = (api) => {
  api.onNav(({ url, prev }) => {
    if (!prev || !FORM_PATHS.some((r) => r.test(prev.pathname))) return;
    const m = url.pathname.match(REPO_ROOT);
    if (!m) return;
    const owner = m[1]!;
    const repo = m[2]!;
    if (RESERVED_OWNERS.has(owner.toLowerCase())) return;
    const nwo = `${owner}/${repo}`.toLowerCase();

    let tries = 0;
    const confirm = () => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="octolytics-dimension-repository_nwo"]')?.content?.toLowerCase();
      const title = document.title.toLowerCase();
      if (meta === nwo || title.includes(nwo)) {
        api.log('repo.created confirmed', nwo, { meta, title });
        api.emit('repo.created', { subject: `${owner}/${repo}`, key: nwo });
      } else if (++tries < 25) {
        setTimeout(confirm, 100);
      } else {
        api.log('repo.created not confirmed (no repo marker on page)', nwo, { meta, title });
      }
    };
    confirm();
  });
};
