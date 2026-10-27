import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const Instagram = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5.2" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

export const Facebook = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M13.7 21.5v-8.2h2.8l.5-3.3h-3.3V7.9c0-1 .4-1.7 1.8-1.7h1.6V3.3c-.3 0-1.3-.1-2.4-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.6v3.3h2.9v8.2h3.2z" />
  </svg>
);

export const WhatsApp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z" />
    <path d="M9.2 8.4c.1 2.5 2.5 5.1 5.3 5.4l1.2-1.2-1.8-.9-.9.7a3.9 3.9 0 0 1-1.7-1.7l.7-.9-.9-1.8z" fill="currentColor" stroke="none" />
  </svg>
);

export const Arrow = (p: P) => (
  <svg {...base} {...p} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Down = (p: P) => (
  <svg {...base} {...p} strokeWidth={2}>
    <path d="M12 4v12M6 11l6 6 6-6M5 20h14" />
  </svg>
);

export const Tick = (p: P) => (
  <svg {...base} {...p} strokeWidth={2.4}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const Cross = (p: P) => (
  <svg {...base} {...p} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const GitHub = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
  </svg>
);
