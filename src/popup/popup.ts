import { EVENTS, MOODS, UNDERSTUDIES, type EventId } from '../shared/events';
import type { HelloReply, RehearseReply } from '../shared/messages';
import { getSettings, getStats, saveSettings, watchSettings, type Settings } from '../shared/settings';
import { THEMES, getTheme } from '../themes';
import { h } from '../engine/util';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let s: Settings;
let githubTab: number | null = null;
/** true when the open GitHub tab is running an older content script than this popup */
let stale = false;

const save = (next: Settings) => {
  s = next;
  void saveSettings(next);
  render();
};

function applyAppearance() {
  if (s.appearance === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', s.appearance);
}

/** Ask the content script on the GitHub tab which build it is. No answer, or a different build, means it is out of date. */
async function checkTab() {
  stale = false;
  if (githubTab != null) {
    try {
      const r = (await chrome.tabs.sendMessage(githubTab, { type: 'hello' })) as HelloReply | undefined;
      stale = r?.build !== __BUILD__;
    } catch {
      stale = true;
    }
  }
}

async function rehearse(id: EventId) {
  if (githubTab == null) return;
  try {
    const r = (await chrome.tabs.sendMessage(githubTab, { type: 'rehearse', event: id })) as RehearseReply | undefined;
    if (r?.ok) return window.close();
    stale = true;
  } catch {
    stale = true;
  }
  render();
}

function render() {
  applyAppearance();
  const theme = getTheme(s.theme);
  $('tagline').textContent = theme.tagline;
  ($('master') as HTMLInputElement).checked = s.enabled;
  $('masterLabel').textContent = s.enabled ? 'On' : 'Off';
  document.body.classList.toggle('off', !s.enabled);
  $('stale').hidden = !stale;

  const quiet = Date.now() < s.quietUntil;
  $('quietBar').hidden = !quiet;
  if (quiet) $('quietText').textContent = `Quiet until ${new Date(s.quietUntil).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}. Nothing will play.`;
  $('mute').hidden = quiet;

  $('themes').replaceChildren(
    ...THEMES.map((t) => {
      const b = h('button', { class: 'tile', 'aria-pressed': String(t.id === s.theme), title: t.tagline }, [h('span', { class: 'sw' }, t.swatch.map((c) => h('i', { style: `background:${c}` }))), h('span', { class: 'nm', text: t.name })]);
      b.addEventListener('click', () => save({ ...s, theme: t.id }));
      return b;
    }),
  );

  const list = $('program');
  list.replaceChildren();
  for (const e of EVENTS) {
    const sw = h('input', { type: 'checkbox', class: 'lever', 'aria-label': `${e.label} on or off` });
    sw.checked = s.events[e.id].enabled;
    sw.addEventListener('change', () => save({ ...s, events: { ...s.events, [e.id]: { ...s.events[e.id], enabled: sw.checked } } }));
    const rh = h('button', { class: 'btn', text: 'Rehearse', title: 'Play this event on the open GitHub tab' });
    rh.disabled = githubTab == null || stale;
    rh.addEventListener('click', () => void rehearse(e.id));
    list.append(
      h('li', {}, [
        h('div', {}, [h('span', { class: 'name', text: e.label }), h('span', { class: 'label mood', text: MOODS[e.mood].label })]),
        h('span', { class: 'leader' }),
        rh,
        sw,
      ]),
    );
  }
  const next = UNDERSTUDIES[0];
  if (next) list.append(h('li', { class: 'dim' }, [h('div', {}, [h('span', { class: 'name', text: next.label }), h('span', { class: 'label mood', text: 'Coming soon' })])]));
  $('hint').textContent = githubTab == null ? 'Open a GitHub tab to rehearse a show on it.' : '';
}

async function init() {
  s = await getSettings();
  const stats = await getStats();
  $('tally').textContent = stats.shows ? `${stats.shows} performances` : 'No performances yet';
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    githubTab = tabs[0]?.url?.startsWith('https://github.com/') ? (tabs[0].id ?? null) : null;
  } catch {
    githubTab = null;
  }
  await checkTab();
  render();
  watchSettings((n) => {
    s = n;
    render();
  });
  ($('master') as HTMLInputElement).addEventListener('change', (e) => save({ ...s, enabled: (e.target as HTMLInputElement).checked }));
  $('mute').addEventListener('click', () => save({ ...s, quietUntil: Date.now() + 3_600_000 }));
  $('endQuiet').addEventListener('click', () => save({ ...s, quietUntil: 0 }));
  $('reloadTab').addEventListener('click', () => {
    if (githubTab != null) void chrome.tabs.reload(githubTab);
    stale = false;
    render();
    $('hint').textContent = 'Reloading the tab. Reopen Footlit in a moment.';
  });
  $('more').addEventListener('click', () => void chrome.runtime.openOptionsPage());
}
void init();
