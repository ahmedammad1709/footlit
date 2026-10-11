import { RESERVED_OWNERS, type Detector } from './types';
import { whenTitleHas } from './track';

const RELEASE_FORM = /^\/[^/]+\/[^/]+\/releases\/new\/?$/;
const RELEASE_PAGE = /^\/([^/]+)\/([^/]+)\/releases\/tag\/(.+)$/;
const FORK_FORM = /^\/([^/]+)\/([^/]+)\/fork\/?$/;
const REPO_ROOT = /^\/([^/]+)\/([^/]+)\/?$/;

/**
 * Release published: you leave the "new release" form and land on the release's tag page.
 * Saving a draft lands on an "untagged-…" page, which is not a publication, so it is ignored.
 */
export const releasePublished: Detector = (api) => {
  api.onNav(({ url, prev }) => {
    if (!prev || !RELEASE_FORM.test(prev.pathname)) return;
    const m = url.pathname.match(RELEASE_PAGE);
    if (!m) return;
    const tag = decodeURIComponent(m[3]!);
    if (tag.startsWith('untagged-')) return;
    const nwo = `${m[1]}/${m[2]}`;
    api.log('release.published', nwo, tag);
    api.emit('release.published', { subject: nwo, detail: `Release ${tag}`, key: `${nwo}@${tag}`.toLowerCase() });
  });
};

/**
 * Repo forked: you leave the "create a new fork" form and land on a repository with the same name.
 * The name check keeps a stray click from the form to some other repo from counting.
 */
export const repoForked: Detector = (api) => {
  api.onNav(({ url, prev }) => {
    const from = prev?.pathname.match(FORK_FORM);
    if (!from) return;
    const to = url.pathname.match(REPO_ROOT);
    if (!to || RESERVED_OWNERS.has(to[1]!.toLowerCase())) return;
    if (to[2]!.toLowerCase() !== from[2]!.toLowerCase()) return;
    const nwo = `${to[1]}/${to[2]}`;
    whenTitleHas(nwo, () => {
      api.log('repo.forked confirmed', nwo);
      api.emit('repo.forked', { subject: nwo, key: nwo.toLowerCase() });
    });
  });
};
