import type { FontReply, Message } from '../shared/messages';
import { writeEvent, removeStats } from '../shared/settings';

let statsQueue: Promise<unknown> = Promise.resolve();
chrome.runtime.onMessage.addListener((msg: Message, _sender, respond) => {
  if (msg.type !== 'record-event' && msg.type !== 'clear-stats') return false;
  const operation = statsQueue.then(async () => {
    if (msg.type === 'record-event') return await writeEvent(msg.entry);
    await removeStats();
    return null;
  });
  statsQueue = operation.catch(() => {});
  void operation.then(respond, () => respond(null));
  return true;
});

// Content scripts can't fetch our font files under github.com's CSP, so they ask us for the bytes.
const ALLOWED = /^fonts\/[a-z0-9-]+\.woff2$/;

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse: (r: FontReply) => void) => {
  if (msg.type !== 'font') return false;
  if (!ALLOWED.test(msg.file)) {
    sendResponse({ ok: false });
    return false;
  }
  fetch(chrome.runtime.getURL(msg.file))
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      sendResponse({ ok: true, b64: btoa(bin) });
    })
    .catch(() => sendResponse({ ok: false }));
  return true; // async response
});

chrome.runtime.onInstalled.addListener((d) => {
  if (d.reason === 'install') void chrome.runtime.openOptionsPage();
});
