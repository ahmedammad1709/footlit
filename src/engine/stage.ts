export interface Stage {
  root: ShadowRoot;
  box: HTMLElement;
  /** screen-reader announcement */
  say(text: string): void;
  dispose(): void;
}

const BASE_CSS = `
:host { all: initial; }
.box { position: absolute; inset: 0; overflow: hidden; container-type: size; pointer-events: none; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

function build(host: HTMLElement, themeCss: string): Stage {
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = BASE_CSS + themeCss;
  const box = document.createElement('div');
  box.className = 'box';
  const live = document.createElement('div');
  live.className = 'sr';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.append(style, box, live);
  return {
    root,
    box,
    say: (t) => {
      live.textContent = t;
    },
    dispose: () => host.remove(),
  };
}

/** Full-viewport overlay on the host page. Never intercepts input. */
export function mountFullscreen(themeCss: string): Stage {
  const host = document.createElement('footlit-stage');
  host.setAttribute('style', 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;contain:strict;display:block');
  (document.body ?? document.documentElement).append(host);
  return build(host, themeCss);
}

/** Same stage, sized to a container (options-page preview). */
export function mountInto(container: HTMLElement, themeCss: string): Stage {
  const host = document.createElement('footlit-stage');
  host.setAttribute('style', 'all:initial;position:absolute;inset:0;pointer-events:none;contain:strict;display:block');
  container.append(host);
  return build(host, themeCss);
}
