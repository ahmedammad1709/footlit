/**
 * A tab-scoped "the user submitted this form" marker. It survives GitHub's full-page redirects, and it keeps a stray click
 * from the form to some other page from counting as a creation.
 *
 * GitHub's forms are a mix of classic server forms (method="post") and script-driven React forms, where the form has no
 * method at all (so it reads as "get") and the button just runs code. So the marker is set by either
 *   - any submit event on the page (whatever the method), or
 *   - a click on a submit-style button ("Create repository", "Publish release", "Create pull request", "Create fork").
 */
const SUBMIT_WORDS = /\b(create|publish|fork|submit|propose|open pull|import|generate)\b/i;

function isSubmitControl(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target.closest('button, input[type="submit"], [role="button"]') : null;
  if (!el) return false;
  if (el instanceof HTMLButtonElement && el.disabled) return false;
  if (el.matches('input[type="submit"], button[type="submit"]')) return true;
  const label = `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`.replace(/\s+/g, ' ').trim();
  return label.length < 60 && SUBMIT_WORDS.test(label);
}

export function submissionIntent(name: string, matches: (path: string) => boolean) {
  const key = `footlit:intent:${name}`;
  const mark = () => {
    if (!matches(location.pathname)) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ path: location.pathname, at: Date.now() }));
    } catch { /* If storage is blocked, prefer missing a show to a false positive. */ }
  };
  document.addEventListener('submit', mark, true);
  document.addEventListener('click', (event) => { if (isSubmitControl(event.target)) mark(); }, true);
  return (previousPath: string) => {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      sessionStorage.removeItem(key);
      return value?.path === previousPath && Date.now() - value.at < 90_000;
    } catch { return false; }
  };
}
