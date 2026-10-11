import type { Detector } from './types';

const FLASH_SELECTOR = '.flash, [role="alert"], .flash-messages, .Toast, [data-testid="alert"], [data-testid="toast"]';
const DELETED_FLASH = /\brepositor(?:y|ies)\b[^.]*\b(?:was |were |has been |have been )?(?:successfully )?deleted\b/i;
const PENDING_KEY = 'footlit:pending-delete';

function setPending(nwo: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ nwo, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function getPending(): { nwo: string; at: number } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { nwo: string; at: number };
    if (Date.now() - p.at > 90_000) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Two independent signals, de-duplicated by repo name:
 *  A) the flash banner GitHub shows afterwards ("Your repository … was successfully deleted")
 *  B) you submitted the delete form, and then ended up outside that repo
 * Merely leaving a repo's settings page is never enough.
 */
export const repoDeleted: Detector = (api) => {
  // B, step 1: remember that the delete form was submitted
  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target as HTMLFormElement | null;
      const action = form?.getAttribute?.('action') ?? '';
      const m = action.match(/^\/([^/]+)\/([^/]+)\/settings\/delete\/?(?:\?.*)?$/);
      if (m) {
        setPending(`${m[1]}/${m[2]}`.toLowerCase());
        api.log('delete form submitted', m[1], m[2]);
      }
    },
    true,
  );

  // B, step 2: we're now somewhere else
  api.onNav(({ url }) => {
    const p = getPending();
    if (!p) return;
    const inside = url.pathname.toLowerCase().startsWith(`/${p.nwo}`);
    if (!inside) {
      clearPending();
      api.log('repo.deleted via form + navigation', p.nwo);
      api.emit('repo.deleted', { subject: p.nwo, key: p.nwo });
    }
  });

  // A: banner text
  api.onMutate(() => {
    for (const el of document.querySelectorAll(FLASH_SELECTOR)) {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!DELETED_FLASH.test(text)) continue;
      const nwo = (text.match(/([\w.-]+\/[\w.-]+)/)?.[1] ?? getPending()?.nwo ?? 'repository').toLowerCase();
      clearPending();
      api.log('repo.deleted via flash', nwo, text);
      api.emit('repo.deleted', { subject: nwo, key: nwo });
      return;
    }
  });
};
