import { EVENTS, MOODS, UNDERSTUDIES, type EventId } from '../shared/events';
import { getSettings, getStats, saveSettings, watchSettings, type Settings } from '../shared/settings';
import { getTheme } from '../themes';
import { h } from '../engine/util';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let s: Settings;
let githubTab: number | null = null;

function applyAppearance() {
  if (s.appearance === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', s.appearance);
}

async function rehearse(id: EventId) {
  if (githubTab == null) return;
  try {
    await chrome.tabs.sendMessage(githubTab, { type: 'rehearse', event: id });
    window.close();
  } catch {
    $('hint').textContent = 'Reload the GitHub tab once, then try again.';
  }
}

function render() {
  applyAppearance();
  const theme = getTheme(s.theme);
  $('themeName').textContent = theme.name;

  ($('master') as HTMLInputElement).checked = s.enabled;
  $('masterLabel').textContent = s.enabled ? 'On' : 'Off';
  document.body.classList.toggle('off', !s.enabled);

  const list = $('program');
  list.replaceChildren();
  for (const e of EVENTS) {
    const sw = h('input', { type: 'checkbox', class: 'lever', 'aria-label': e.label });
    sw.checked = s.events[e.id].enabled;
    sw.addEventListener('change', () => void saveSettings({ ...s, events: { ...s.events, [e.id]: { enabled: sw.checked } } }));
    const rh = h('button', { class: 'btn', text: 'Rehearse' });
    rh.disabled = githubTab == null;
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
  for (const u of UNDERSTUDIES.slice(0, 2)) {
    list.append(h('li', { class: 'dim' }, [h('div', {}, [h('span', { class: 'name', text: u.label }), h('span', { class: 'label mood', text: 'In rehearsal' })])]));
  }
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
  render();
  watchSettings((n) => {
    s = n;
    render();
  });
  ($('master') as HTMLInputElement).addEventListener('change', (e) => void saveSettings({ ...s, enabled: (e.target as HTMLInputElement).checked }));
  $('mute').addEventListener('click', () => {
    void saveSettings({ ...s, quietUntil: Date.now() + 3_600_000 });
    $('hint').textContent = 'Quiet for an hour. Back on the hour.';
  });
  $('change').addEventListener('click', () => void chrome.runtime.openOptionsPage());
  $('more').addEventListener('click', () => void chrome.runtime.openOptionsPage());
}
void init();
