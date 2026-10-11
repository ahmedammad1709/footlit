import { EVENTS, EVENT_BY_ID, MOODS, UNDERSTUDIES, type EventId, type Mood } from '../shared/events';
import { loadFontFromExtension } from '../shared/fonts';
import { INTENSITY_SCALE, clearStats, defaultSettings, getSettings, getStats, saveSettings, themeFor, watchSettings, watchStats, type Appearance, type Intensity, type LogEntry, type Settings } from '../shared/settings';
import { playShow, stopShow } from '../engine/play';
import { THEMES, getTheme } from '../themes';
import { h } from '../engine/util';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let s: Settings;
/** what the preview stage is showing */
let mood: Mood = 'applause';
let previewEvent: EventId = 'pr.merged';
let previewTheme = 'marquee';

// ---------------------------------------------------------------- saving

let savedTimer = 0;
function flashSaved() {
  const el = $('saved');
  el.textContent = 'Saved';
  el.classList.add('flash');
  clearTimeout(savedTimer);
  savedTimer = window.setTimeout(() => {
    el.textContent = 'Changes save automatically.';
    el.classList.remove('flash');
  }, 1600);
}

/** Apply a change everywhere: remember it, persist it, show the user it happened. */
function save(next: Settings) {
  s = next;
  void saveSettings(next);
  flashSaved();
  render();
}

// ---------------------------------------------------------------- preview

/** Deterministic pseudo-random so the contribution graph looks the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generic profile page (no GitHub marks) for the preview to play over. */
function buildMock(into: HTMLElement) {
  const r = rng(7);
  const cells = Array.from({ length: 26 * 7 }, (_, i) => {
    const wk = Math.floor(i / 7);
    const v = r() * (0.35 + (wk / 26) * 0.9);
    return h('b', { class: v > 0.95 ? 'l4' : v > 0.75 ? 'l3' : v > 0.55 ? 'l2' : v > 0.35 ? 'l1' : '' });
  });
  const repo = (name: string, desc: string, lang: string, color: string, stars: string) =>
    h('div', { class: 'm-repo' }, [
      h('div', {}, [h('a', { text: name }), h('i', { text: 'Public' })]),
      h('p', { text: desc }),
      h('div', { class: 'm-lang' }, [h('u', { style: `background:${color}` }), h('span', { text: lang }), h('span', { text: `  ★ ${stars}` })]),
    ]);
  const mock = h('div', { class: 'mock', 'aria-hidden': 'true' }, [
    h('div', { class: 'm-top' }, [
      h('span', { class: 'm-burger' }), h('span', { class: 'm-mark' }), h('span', { class: 'm-crumb', text: 'acme' }),
      h('span', { class: 'm-search', text: 'Type / to search' }), h('span', { class: 'm-dot' }), h('span', { class: 'm-dot' }), h('span', { class: 'm-av' }),
    ]),
    h('div', { class: 'm-tabs' }, [
      h('span', { class: 'on', text: 'Overview' }),
      h('span', {}, ['Repositories', h('b', { text: '24' })]),
      h('span', { text: 'Projects' }), h('span', { text: 'Packages' }),
      h('span', {}, ['Stars', h('b', { text: '311' })]),
    ]),
    h('div', { class: 'm-body' }, [
      h('div', {}, [
        h('div', { class: 'm-avatar', text: 'A' }),
        h('div', { class: 'm-name', text: 'Acme Labs' }),
        h('div', { class: 'm-handle', text: 'acme' }),
        h('div', { class: 'm-bio', text: 'Small tools for slow Mondays.' }),
        h('div', { class: 'm-btn', text: 'Follow' }),
        h('div', { class: 'm-stats' }, [h('b', { text: '128' }), ' followers · ', h('b', { text: '41' }), ' following']),
      ]),
      h('div', {}, [
        h('h3', { class: 'm-h', text: 'Popular repositories' }),
        h('div', { class: 'm-repos' }, [
          repo('widget-shop', 'A tiny storefront with a very opinionated cart.', 'TypeScript', '#3178c6', '412'),
          repo('login-redirect', 'Fixes the thing Safari does to cookies.', 'JavaScript', '#f1e05a', '96'),
          repo('dotfiles', 'Shell, editor and far too many aliases.', 'Shell', '#89e051', '58'),
          repo('pocket-cli', 'Save links from the terminal.', 'Go', '#00add8', '33'),
        ]),
        h('div', { class: 'm-graph' }, [h('h3', { class: 'm-h', text: '184 contributions in the last year' }), h('div', { class: 'm-cells' }, cells)]),
      ]),
    ]),
  ]);
  into.append(mock);
}

function replay() {
  stopShow();
  const e = EVENT_BY_ID[previewEvent];
  $('caption').textContent = `${getTheme(previewTheme).name} / ${e.label} / ${MOODS[mood].label}`;
  const pr = e.id === 'pr.merged' || e.id.startsWith('ci.');
  void playShow({
    eventId: e.id,
    mood,
    themeId: previewTheme,
    subject: pr ? 'acme/widget-shop #42' : 'acme/widget-shop',
    detail: pr ? 'Fix flaky login redirect on Safari' : undefined,
    tally: 7,
    scale: INTENSITY_SCALE[s.intensity],
    honorReducedMotion: s.honorReducedMotion,
    container: $('stagebox'),
    fontLoader: loadFontFromExtension,
  });
}

// ---------------------------------------------------------------- rendering

function segment<T extends string>(el: HTMLElement, options: { value: T; label: string }[], current: T, onPick: (v: T) => void) {
  el.replaceChildren(
    ...options.map((o) => {
      const b = h('button', { text: o.label, 'aria-pressed': String(o.value === current) });
      b.addEventListener('click', () => onPick(o.value));
      return b;
    }),
  );
}

const fmt = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
  $('welcome').hidden = s.onboarded;

  // themes: choosing a card sets the default and plays it
  $('themes').replaceChildren(
    ...THEMES.map((t) => {
      const on = t.id === s.theme;
      const card = h('button', { class: 'card', 'aria-pressed': String(on), 'aria-label': `${t.name}: ${t.tagline}` }, [
        h('span', { class: 'sw' }, t.swatch.map((c) => h('i', { style: `background:${c}` }))),
        h('span', { class: 'nm', text: t.name }),
        h('span', { class: 'tg', text: t.tagline }),
        ...(on ? [h('span', { class: 'stamp', text: 'Default' })] : []),
      ]);
      card.addEventListener('click', () => {
        previewTheme = t.id;
        if (t.id === s.theme) return replay();
        save({ ...s, theme: t.id });
        replay();
      });
      return card;
    }),
  );
  segment<Mood>($('moods'), (Object.keys(MOODS) as Mood[]).map((m) => ({ value: m, label: MOODS[m].label })), mood, (m) => {
    mood = m;
    render();
    replay();
  });

  // events: on/off, optional own theme, rehearse
  const ul = $('events');
  ul.replaceChildren();
  for (const e of EVENTS) {
    const sw = h('input', { type: 'checkbox', class: 'lever', 'aria-label': `${e.label} on or off` });
    sw.checked = s.events[e.id].enabled;
    sw.addEventListener('change', () => save({ ...s, events: { ...s.events, [e.id]: { ...s.events[e.id], enabled: sw.checked } } }));

    const sel = h('select', { class: 'sel', 'aria-label': `Theme for ${e.label}` });
    sel.append(h('option', { value: '', text: `Default (${getTheme(s.theme).name})` }), ...THEMES.map((t) => h('option', { value: t.id, text: t.name })));
    sel.value = s.events[e.id].theme ?? '';
    sel.addEventListener('change', () => {
      save({ ...s, events: { ...s.events, [e.id]: { ...s.events[e.id], theme: sel.value || null } } });
      previewTheme = themeFor(s, e.id);
      previewEvent = e.id;
      mood = e.mood;
      render();
      replay();
    });

    const rh = h('button', { class: 'btn', text: 'Rehearse' });
    rh.addEventListener('click', () => {
      previewEvent = e.id;
      mood = e.mood;
      previewTheme = themeFor(s, e.id);
      render();
      replay();
    });
    ul.append(h('li', {}, [h('div', { class: 'grow' }, [h('div', { class: 'name', text: e.label }), h('span', { class: 'note', text: e.blurb })]), sel, rh, sw]));
  }
  for (const u of UNDERSTUDIES) ul.append(h('li', { class: 'dim' }, [h('div', { class: 'grow' }, [h('div', { class: 'name', text: u.label }), h('span', { class: 'note', text: `${u.blurb} Coming soon.` })])]));

  // preferences
  segment<Intensity>($('intensity'), [{ value: 'brief', label: 'Brief' }, { value: 'standard', label: 'Standard' }, { value: 'long', label: 'Long' }], s.intensity, (v) => {
    save({ ...s, intensity: v });
    replay();
  });
  segment<Appearance>($('appearance'), [{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Matinee' }, { value: 'dark', label: 'Evening' }], s.appearance, (v) => save({ ...s, appearance: v }));
  ($('reduced') as HTMLInputElement).checked = s.honorReducedMotion;
  const quiet = Date.now() < s.quietUntil;
  $('quietNote').textContent = quiet ? `Quiet until ${new Date(s.quietUntil).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}. Nothing will play.` : 'Off. Pauses every show for an hour when switched on.';
}

/** Highlight the section you are reading in the sidebar. */
function trackSections() {
  const links = new Map(Array.from(document.querySelectorAll<HTMLAnchorElement>('.side nav a')).map((a) => [a.dataset.sec!, a]));
  const set = (id: string) => links.forEach((a, k) => (k === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) set(en.target.id);
    },
    { rootMargin: '-35% 0px -60% 0px' },
  );
  links.forEach((_, id) => io.observe($(id)));
  set('sec-themes');
}

async function init() {
  s = await getSettings();
  previewTheme = s.theme;
  render();
  renderLog((await getStats()).log);
  watchSettings((n) => {
    s = n;
    render();
  });
  watchStats((st) => renderLog(st.log));
  $('replay').addEventListener('click', replay);
  $('dismissWelcome').addEventListener('click', () => save({ ...s, onboarded: true }));
  ($('reduced') as HTMLInputElement).addEventListener('change', (e) => {
    save({ ...s, honorReducedMotion: (e.target as HTMLInputElement).checked });
    replay();
  });
  $('dockToggle').addEventListener('click', () => {
    const dock = $('dock');
    const hidden = dock.classList.toggle('collapsed');
    $('dockToggle').textContent = hidden ? 'Show' : 'Hide';
    $('dockToggle').setAttribute('aria-expanded', String(!hidden));
  });
  $('quiet').addEventListener('click', () => save({ ...s, quietUntil: Date.now() + 3_600_000 }));
  $('unquiet').addEventListener('click', () => save({ ...s, quietUntil: 0 }));
  $('clear').addEventListener('click', () => void clearStats().then(() => renderLog([])));
  $('reset').addEventListener('click', () => {
    if (!confirm('Reset every Footlit setting to its default?')) return;
    previewTheme = defaultSettings().theme;
    save({ ...defaultSettings(), onboarded: true });
    replay();
  });
  trackSections();
  buildMock($('stagebox'));
  setTimeout(replay, 400);
}
void init();
