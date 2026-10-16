// Renders the marketing site's mockup images from the real extension UI and engine into site/public/mock/.
//   npm run site-assets      (needs `npm run build` first so dist/ holds the popup and settings pages)
import esbuild from 'esbuild';
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { safePath } from './safe-path.mjs';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'site/public/mock');
const dev = path.join(root, '.dev');
await fs.mkdir(out, { recursive: true });
await fs.rm(dev, { recursive: true, force: true });
await fs.mkdir(path.join(dev, 'fonts'), { recursive: true });

await esbuild.build({ entryPoints: [path.join(root, 'src/dev/playground.ts')], bundle: true, outfile: path.join(dev, 'playground.js'), format: 'iife', target: 'chrome111', loader: { '.css': 'text' }, logLevel: 'error' });
const fonts = { 'league-gothic.woff2': '@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2', 'dm-mono-400.woff2': '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 'dm-mono-500.woff2': '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', 'press-start-2p.woff2': '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'jetbrains-mono-400.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-700.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', 'newsreader-italic.woff2': '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2' };
for (const [to, from] of Object.entries(fonts)) await fs.cp(path.join(root, 'node_modules', from), path.join(dev, 'fonts', to));

// a stand-in pull request page (no GitHub marks) for overlays to play over
await fs.writeFile(path.join(dev, 'index.html'), `<!doctype html><meta charset=utf-8><style>
body{margin:0;background:#0d1117;color:#e6edf3;font:14px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}
header{background:#010409;border-bottom:1px solid #30363d;padding:14px 24px;display:flex;gap:16px;align-items:center}
.dot{width:32px;height:32px;border-radius:50%;background:#e6edf3}
main{max-width:1100px;margin:24px auto;padding:0 24px}
h1{font-size:32px;font-weight:400;margin:0 0 8px}h1 span{color:#8b949e}
.badge{display:inline-block;background:#8957e5;color:#fff;border-radius:2em;padding:5px 12px;font-weight:600}
.box{border:1px solid #30363d;border-radius:6px;margin-top:16px;padding:16px;background:#0d1117}
.box h3{margin:0 0 8px;font-size:14px}.line{height:10px;border-radius:3px;background:#21262d;margin:10px 0}
</style><header><div class=dot></div><b>acme / widget-shop</b></header>
<main><h1>Fix flaky login redirect on Safari <span>#42</span></h1><span class=badge>Merged</span>
<div class=box><h3>Conversation</h3><div class=line style=width:90%></div><div class=line style=width:72%></div><div class=line style=width:81%></div><div class=line style=width:45%></div></div>
<div class=box><h3>Checks</h3><div class=line style=width:60%></div><div class=line style=width:50%></div></div>
<div class=box><h3>Files changed</h3><div class=line style=width:95%></div><div class=line style=width:77%></div><div class=line style=width:88%></div></div></main>
<script src=playground.js></script>`);

const types = { '.js': 'text/javascript', '.woff2': 'font/woff2', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png' };
const serve = (dir) => new Promise((resolve) => {
  const s = http.createServer(async (req, res) => {
    let rel = new URL(req.url, 'http://x').pathname;
    if (rel === '/') rel = '/index.html';
    const file = safePath(dir, rel);
    if (!file) { res.writeHead(403); return res.end(); }
    try { const b = await fs.readFile(file); res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'text/plain' }); res.end(b); } catch { res.writeHead(404); res.end(); }
  });
  s.listen(0, '127.0.0.1', () => resolve(s));
});
const devServer = await serve(dev);
const distServer = await serve(path.join(root, 'dist'));
const devBase = `http://127.0.0.1:${devServer.address().port}`;
const distBase = `http://127.0.0.1:${distServer.address().port}`;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

// build id the popup compares against (so it does not show its "out of date tab" notice)
const popupJs = await fs.readFile(path.join(root, 'dist/popup/popup.js'), 'utf8');
const BUILD = /build !== "([a-z0-9]+)"/.exec(popupJs)?.[1] ?? '';

const stub = (settings, build) => {
  const mem = { sync: { 'footlit:settings': settings }, local: { 'footlit:stats': { shows: 214, log: [] } } };
  const area = (n) => ({ get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}), set: async (o) => Object.assign(mem[n], o), remove: async () => {} });
  window.chrome = {
    storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } },
    runtime: { getURL: (f) => '/' + f, openOptionsPage() {}, sendMessage: async () => ({}) },
    tabs: { query: async () => [{ id: 1, url: 'https://github.com/acme/widget-shop/pull/42' }], sendMessage: async (_id, m) => (m.type === 'hello' ? { build } : { ok: true }), reload() {} },
  };
};

// ---- popup (2x, just the popup's own box) ----
{
  const page = await browser.newPage();
  await page.setViewport({ width: 372, height: 700, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(stub, { theme: 'terminal', onboarded: true, events: { 'repo.deleted': { enabled: false, theme: null } } }, BUILD);
  await page.goto(`${distBase}/popup/popup.html`);
  await new Promise((r) => setTimeout(r, 900));
  const box = await page.evaluate(() => { const b = document.body.getBoundingClientRect(); return { w: Math.ceil(b.width), h: Math.ceil(b.height) + 24 }; });
  await page.screenshot({ path: path.join(out, 'popup.png'), clip: { x: 0, y: 0, width: 372, height: Math.min(box.h, 600) } });
  console.log('popup.png', box);
  await page.close();
}

// ---- settings page (three-column layout) ----
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 940, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(stub, { theme: 'marquee', onboarded: true }, BUILD);
  await page.goto(`${distBase}/options/options.html`);
  await new Promise((r) => setTimeout(r, 3300));
  await page.screenshot({ path: path.join(out, 'settings.png') });
  console.log('settings.png');
  await page.close();
}

// ---- one frame per theme (also the fallback / social imagery) ----
const shots = [['marquee', 'pr.merged', 2500], ['terminal', 'pr.merged', 3500], ['mission', 'ci.passed', 3300], ['pixel', 'pr.merged', 2600], ['crawler', 'issue.closed', 2600], ['quiet', 'pr.merged', 1000]];
for (const [theme, event, at] of shots) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${devBase}/?theme=${theme}&event=${event}`);
  await page.evaluate(() => { window.__p = window.run(); });
  await new Promise((r) => setTimeout(r, at));
  await page.screenshot({ path: path.join(out, `theme-${theme}.png`) });
  await page.evaluate(() => window.__p);
  await page.close();
  console.log(`theme-${theme}.png`);
}

// ---- social card 1200x630 ----
{
  const shot = (await fs.readFile(path.join(out, 'theme-marquee.png'))).toString('base64');
  const logo = await fs.readFile(path.join(root, 'src/assets/logo.svg'), 'utf8');
  await fs.writeFile(path.join(dev, 'og.html'), `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:D;src:url(fonts/league-gothic.woff2)}@font-face{font-family:M;src:url(fonts/dm-mono-500.woff2)}@font-face{font-family:T;src:url(fonts/newsreader-italic.woff2);font-style:italic}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#1B1612;color:#F1E8D4;position:relative;overflow:hidden}
.copy{position:absolute;left:64px;top:56px;width:560px}.logo svg{width:84px;height:84px}
h1{font:400 128px/.88 D;text-transform:uppercase;letter-spacing:.01em;margin:28px 0 0}h1 em{font-style:normal;color:#F2A81D}
p{display:none}.tag{position:absolute;left:64px;bottom:52px;font:500 20px M;letter-spacing:.14em;text-transform:uppercase;color:#F2A81D}
.frame{position:absolute;right:-90px;top:96px;width:720px;height:405px;border:6px solid #F1E8D4;background:url(data:image/png;base64,${shot}) center/cover}
</style><div class=copy><div class=logo>${logo}</div><h1>GitHub, with <em>stage lighting.</em></h1><p>Themed celebrations for merges, green checks, releases and deploys.</p></div><div class=frame></div><div class=tag>Free browser extension</div>`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(`${devBase}/og.html`);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(out, 'og.png') });
  console.log('og.png');
  await page.close();
}

await browser.close();
devServer.close();
distServer.close();
