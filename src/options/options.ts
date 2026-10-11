import { EVENTS, MOODS, UNDERSTUDIES, type EventId, type Mood } from '../shared/events';
import { loadFontFromExtension } from '../shared/fonts';
import { INTENSITY_SCALE, clearStats, getSettings, getStats, saveSettings, watchSettings, watchStats, type Appearance, type Intensity, type LogEntry, type Settings } from '../shared/settings';
import { playShow, stopShow } from '../engine/play';
import { h } from '../engine/util';
import { EVENT_BY_ID } from '../shared/events';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let s: Settings;
let mood: Mood = 'applause';
let previewEvent: EventId = 'pr.merged';

function replay() {
  stopShow();
  const e = EVENT_BY_ID[previewEvent];
  void playShow({
    eventId: e.id,
    mood,
    themeId: s.theme,
    subject: e.id === 'pr.merged' ? 'acme/widget-shop #42' : 'acme/widget-shop',
    detail: e.id === 'pr.merged' ? 'Fix flaky login redirect on Safari' : undefined,
    tally: 7,
    scale: INTENSITY_SCALE[s.intensity],
    honorReducedMotion: s.honorReducedMotion,
    container: $('stagebox'),
    fontLoader: loadFontFromExtension,
  });
}

function segment<T extends string>(el: HTMLElement, options: { value: T; label: string }[], current: T, onPick: (v: T) => void) {
  el.replaceChildren(
    ...options.map((o) => {
      const b = h('button', { text: o.label, 'aria-pressed': String(o.value === current) });
      b.addEventListener('click', () => onPick(o.value));
      return b;
    }),
  );
}

function fmt(t: number) {
  return new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderLog(log: LogEntry[]) {
  const ol = $('log');
  ol.replaceChildren();
  if (!log.length) {
    ol.append(h('li', { text: 'Nothing has happened yet. Go push something.' }));
    return;
  }
  for (const e of log) {
    ol.append(
      h('li', {}, [
        h('span', { class: 'when', text: fmt(e.at) }),
        h('span', { text: `${EVENT_BY_ID[e.event]?.label ?? e.event}${e.subject ? ` · ${e.subject}` : ''}` }),
        h('span', { class: e.shown ? '' : 'skipped', text: e.shown ? '' : `not shown: ${e.reason ?? ''}` }),
      ]),
    );
  }
}

function render() {
  if (s.appearance === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', s.appearance);

  segment<Mood>($('moods'), (Object.keys(MOODS) as Mood[]).map((m) => ({ value: m, label: MOODS[m].label })), mood, (m) => {
    mood = m;
    render();
    replay();
  });
  segment<Intensity>($('intensity'), [{ value: 'brief', label: 'Brief' }, { value: 'standard', label: 'Standard' }, { value: 'long', label: 'Long' }], s.intensity, (v) => void saveSettings({ ...s, intensity: v }));
  segment<Appearance>($('appearance'), [{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Matinee' }, { value: 'dark', label: 'Evening' }], s.appearance, (v) => void saveSettings({ ...s, appearance: v }));
  ($('reduced') as HTMLInputElement).checked = s.honorReducedMotion;
  $('quietNote').textContent = Date.now() < s.quietUntil ? `Quiet until ${new Date(s.quietUntil).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.` : 'Off.';

  const ul = $('events');
  ul.replaceChildren();
  for (const e of EVENTS) {
    const sw = h('input', { type: 'checkbox', class: 'lever', 'aria-label': e.label });
    sw.checked = s.events[e.id].enabled;
    sw.addEventListener('change', () => void saveSettings({ ...s, events: { ...s.events, [e.id]: { enabled: sw.checked } } }));
    const rh = h('button', { class: 'btn', text: 'Rehearse' });
    rh.addEventListener('click', () => {
      previewEvent = e.id;
      mood = e.mood;
      render();
      replay();
      $('stagebox').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    ul.append(h('li', {}, [h('div', {}, [h('div', { class: 'name', text: e.label }), h('span', { class: 'note', text: e.blurb })]), h('span', { class: 'leader' }), rh, sw]));
  }
  for (const u of UNDERSTUDIES) ul.append(h('li', { class: 'dim' }, [h('div', {}, [h('div', { class: 'name', text: u.label }), h('span', { class: 'note', text: `${u.blurb} In rehearsal.` })])]));
}

async function init() {
  s = await getSettings();
  render();
  renderLog((await getStats()).log);
  watchSettings((n) => {
    s = n;
    render();
  });
  watchStats((st) => renderLog(st.log));
  $('replay').addEventListener('click', replay);
  ($('reduced') as HTMLInputElement).addEventListener('change', (e) => void saveSettings({ ...s, honorReducedMotion: (e.target as HTMLInputElement).checked }));
  $('quiet').addEventListener('click', () => void saveSettings({ ...s, quietUntil: Date.now() + 3_600_000 }));
  $('unquiet').addEventListener('click', () => void saveSettings({ ...s, quietUntil: 0 }));
  $('clear').addEventListener('click', () => void clearStats().then(() => renderLog([])));
  setTimeout(replay, 400);
}
void init();
