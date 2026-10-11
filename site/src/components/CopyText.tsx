'use client';

import { useState } from 'react';
import s from './CopyText.module.css';

/** Browsers will not follow chrome:// links from a web page, so offer the address as a one-click copy. */
export function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={s.copy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the address is visible, so it can be typed */
        }
      }}
      aria-label={`Copy ${text}`}
    >
      <code>{text}</code>
      <span>{done ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
