import type { FontReply } from './messages';

/** Fonts the overlay needs. Families are namespaced so they can never collide with the host page's fonts. */
export type FontId = 'display' | 'mono' | 'mono-medium' | 'pixel';

interface FontSpec {
  family: string;
  file: string;
  weight: string;
}

export const FONTS: Record<FontId, FontSpec> = {
  display: { family: 'Footlit Display', file: 'fonts/league-gothic.woff2', weight: '400' },
  mono: { family: 'Footlit Mono', file: 'fonts/dm-mono-400.woff2', weight: '400' },
  'mono-medium': { family: 'Footlit Mono', file: 'fonts/dm-mono-500.woff2', weight: '500' },
  pixel: { family: 'Footlit Pixel', file: 'fonts/press-start-2p.woff2', weight: '400' },
};

export type FontLoader = (file: string) => Promise<ArrayBuffer>;

const loaded = new Map<FontId, Promise<void>>();

/**
 * Load fonts from raw bytes instead of a CSS url(): github.com's CSP only allows fonts from its own CDN,
 * but a FontFace built from an ArrayBuffer involves no network fetch, so the policy never applies.
 * Failure is silent: themes carry system fallbacks.
 */
export function ensureFonts(ids: FontId[], load: FontLoader): Promise<void> {
  return Promise.all(
    ids.map((id) => {
      let p = loaded.get(id);
      if (!p) {
        const spec = FONTS[id];
        p = load(spec.file)
          .then(async (buf) => {
            const face = new FontFace(spec.family, buf, { weight: spec.weight });
            await face.load();
            document.fonts.add(face);
          })
          .catch(() => {
            loaded.delete(id);
          });
        loaded.set(id, p);
      }
      return p;
    }),
  ).then(() => undefined);
}

/** For extension pages (popup/options), where fetching our own files is allowed. */
export const loadFontFromExtension: FontLoader = async (file) => {
  const res = await fetch(chrome.runtime.getURL(file));
  return res.arrayBuffer();
};

/** For content scripts: ask the service worker, which is not bound by the page's CSP. */
export const loadFontViaBackground: FontLoader = async (file) => {
  const reply = (await chrome.runtime.sendMessage({ type: 'font', file })) as FontReply | undefined;
  if (!reply || !reply.ok) throw new Error('font unavailable');
  const bin = atob(reply.b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};
