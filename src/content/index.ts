import { EVENT_BY_ID, type EventId } from '../shared/events';
import { loadFontViaBackground } from '../shared/fonts';
import type { HelloReply, Message, RehearseReply } from '../shared/messages';
import { INTENSITY_SCALE, defaultSettings, getSettings, recordEvent, themeFor, watchSettings, type Settings } from '../shared/settings';
import { isPlaying, playShow } from '../engine/play';
import { watchNavigation, type NavInfo } from './nav';
import { RESERVED_OWNERS, type DetectorApi, type EmitInfo } from './detectors/types';
import { repoCreated } from './detectors/repoCreated';
import { prMerged } from './detectors/prMerged';
import { repoDeleted } from './detectors/repoDeleted';
import { ci } from './detectors/ci';

// A page can inject us twice (extension reload, bfcache). Only the first copy runs.
const FLAG = '__footlit__';
const w = window as unknown as Record<string, unknown>;
if (!w[FLAG]) {
  w[FLAG] = true;
  void main();
}

async function main() {
  let settings: Settings = defaultSettings();
  void getSettings().then((s) => (settings = s));
  watchSettings((s) => (settings = s));

  const debug = (() => {
    try {
      return localStorage.getItem('footlit:debug') === '1';
    } catch {
      return false;
    }
  })();
  const log = (...a: unknown[]) => {
    if (debug) console.debug('[footlit]', ...a);
  };

  const recent = new Map<string, number>();

  async function show(id: EventId, info: EmitInfo, opts: { force?: boolean; themeId?: string; mood?: import('../shared/events').Mood } = {}) {
    const def = EVENT_BY_ID[id];
    const entry = { at: Date.now(), event: id, subject: info.subject };

    if (!opts.force) {
      const k = `${id}:${info.key ?? info.subject ?? ''}`;
      const last = recent.get(k) ?? 0;
      if (Date.now() - last < 20_000) return;
      recent.set(k, Date.now());

      const reason = !settings.enabled ? 'Footlit is off' : !settings.events[id]?.enabled ? 'This event is switched off' : Date.now() < settings.quietUntil ? 'Quiet mode' : isPlaying() ? 'Another show was running' : '';
      if (reason) {
        void recordEvent({ ...entry, shown: false, reason });
        return;
      }
    }

    const stats = await recordEvent({ ...entry, shown: true });
    await playShow({
      eventId: id,
      mood: opts.mood ?? def.mood,
      themeId: opts.themeId ?? themeFor(settings, id),
      subject: info.subject,
      detail: info.detail,
      tally: stats.shows,
      scale: INTENSITY_SCALE[settings.intensity],
      honorReducedMotion: settings.honorReducedMotion,
      fontLoader: loadFontViaBackground,
    });
  }

  // ---- detector plumbing ----
  const navListeners: ((n: NavInfo) => void)[] = [];
  const mutateListeners: (() => void)[] = [];
  const api: DetectorApi = {
    emit: (id, info = {}) => void show(id, info),
    onNav: (cb) => void navListeners.push(cb),
    onMutate: (cb) => void mutateListeners.push(cb),
    log,
  };
  for (const install of [repoCreated, prMerged, repoDeleted, ci]) install(api);

  watchNavigation((n) => navListeners.forEach((cb) => cb(n)));

  let pending = 0;
  const mo = new MutationObserver(() => {
    if (pending) return;
    pending = window.setTimeout(() => {
      pending = 0;
      mutateListeners.forEach((cb) => cb());
    }, 120);
  });
  // quiet pages still need periodic evaluation so detectors can arm and see state flips that cause no other DOM noise
  setInterval(() => mutateListeners.forEach((cb) => cb()), 1500);
  const startObserving = () => mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'title'] });
  // at document_start the root element may not exist yet
  if (document.documentElement) startObserving();
  else {
    const wait = new MutationObserver(() => {
      if (!document.documentElement) return;
      wait.disconnect();
      startObserving();
    });
    wait.observe(document, { childList: true });
  }

  // ---- rehearsals from the popup / options page ----
  chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse: (r: HelloReply | RehearseReply) => void) => {
    if (msg.type === 'hello') {
      sendResponse({ build: __BUILD__ });
    } else if (msg.type === 'rehearse') {
      const def = EVENT_BY_ID[msg.event];
      if (!def) {
        sendResponse({ ok: false, error: 'unknown event' });
        return false;
      }
      const ctx = rehearsalContext(msg.event);
      void show(msg.event, { subject: msg.subject ?? ctx.subject, detail: ctx.detail }, { force: true, themeId: msg.theme, mood: msg.mood ?? def.mood });
      sendResponse({ ok: true });
    }
    return false;
  });
}

/**
 * What a rehearsal should show. Uses the repo you are looking at (and the PR title on a pull request page),
 * your own username on other pages, and only falls back to a made-up name when GitHub gives us nothing.
 */
function rehearsalContext(id: EventId): { subject: string; detail?: string } {
  const needsNumber = id === 'pr.merged' || id.startsWith('ci.');
  const sampleDetail = needsNumber ? 'Fix flaky login redirect on Safari' : undefined;
  const m = location.pathname.match(/^\/([^/]+)\/([^/]+)(?:\/(?:pull|issues)\/(\d+))?/);
  if (m && !RESERVED_OWNERS.has(m[1]!.toLowerCase())) {
    const nwo = `${m[1]}/${m[2]}`;
    const title = document.querySelector('.js-issue-title, bdi.markdown-title')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 90);
    return { subject: needsNumber ? `${nwo} #${m[3] ?? '42'}` : nwo, detail: title || sampleDetail };
  }
  const login = document.querySelector<HTMLMetaElement>('meta[name="user-login"]')?.content;
  const nwo = login ? `${login}/my-project` : 'acme/widget-shop';
  return { subject: needsNumber ? `${nwo} #42` : nwo, detail: sampleDetail };
}
