/**
 * GitHub navigates with Turbo (no full reload), and some flows (like creating a repo) do a full reload.
 * We watch both, and remember the previous URL across reloads via sessionStorage (tab-scoped).
 */
export interface NavInfo {
  url: URL;
  prev: URL | null;
}

const KEY = 'footlit:last-url';

function remembered(): URL | null {
  try {
    const s = sessionStorage.getItem(KEY);
    return s ? new URL(s) : null;
  } catch {
    return null;
  }
}

function remember(u: string) {
  try {
    sessionStorage.setItem(KEY, u);
  } catch {
    /* private mode or blocked storage: we just lose cross-reload memory */
  }
}

const key = (u: Location | URL) => u.pathname + u.search;

export function watchNavigation(cb: (n: NavInfo) => void): void {
  let prev = remembered();
  let current = new URL(location.href);
  remember(location.href);

  const check = () => {
    if (key(location) === key(current)) return;
    prev = current;
    current = new URL(location.href);
    remember(location.href);
    cb({ url: current, prev });
  };

  // Initial page load counts as a navigation too (prev may come from the previous full load).
  queueMicrotask(() => cb({ url: current, prev }));

  document.addEventListener('turbo:load', check);
  document.addEventListener('turbo:render', check);
  window.addEventListener('popstate', check);
  window.addEventListener('pageshow', check);
  setInterval(check, 250); // belt and braces for history.pushState calls we can't see from the isolated world
}
