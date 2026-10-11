// Visual test rig: bundles the engine into a playground page, plays a show in headless Chrome, saves timed screenshots.
// usage: node scripts/shots.mjs <theme> <event> <mood|-> <outDir> [t1,t2,...] [WxH]
import esbuild from 'esbuild';
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [theme = 'marquee', event = 'pr.merged', mood = '-', outDir = path.join(root, '.shots'), times = '400,900,1500,2200,3000', size = '1440x800'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const dev = path.join(root, '.dev');

await fs.rm(dev, { recursive: true, force: true });
await fs.mkdir(path.join(dev, 'fonts'), { recursive: true });
await esbuild.build({ entryPoints: [path.join(root, 'src/dev/playground.ts')], bundle: true, outfile: path.join(dev, 'playground.js'), format: 'iife', target: 'chrome120', loader: { '.css': 'text' }, logLevel: 'error' });
for (const f of await fs.readdir(path.join(root, 'node_modules/@fontsource/league-gothic/files'))) if (f === 'league-gothic-latin-400-normal.woff2') await fs.cp(path.join(root, 'node_modules/@fontsource/league-gothic/files', f), path.join(dev, 'fonts/league-gothic.woff2'));
await fs.cp(path.join(root, 'node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2'), path.join(dev, 'fonts/dm-mono-400.woff2'));
await fs.cp(path.join(root, 'node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2'), path.join(dev, 'fonts/dm-mono-500.woff2'));
await fs.cp(path.join(root, 'node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2'), path.join(dev, 'fonts/press-start-2p.woff2'));
await fs.cp(path.join(root, 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'), path.join(dev, 'fonts/jetbrains-mono-400.woff2'));
await fs.cp(path.join(root, 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2'), path.join(dev, 'fonts/jetbrains-mono-700.woff2'));

// a stand-in for a GitHub PR page so overlays are judged against real-looking content
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

const server = http.createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (rel === '/') rel = '/index.html'; const p = path.join(dev, rel);
  try { const b = await fs.readFile(p); res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.woff2') ? 'font/woff2' : 'text/html' }); res.end(b); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

await fs.mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: W, height: H } });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() !== 'log') console.log('[page]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
const qs = new URLSearchParams({ theme, event, mood: mood === '-' ? '' : mood });
await page.goto(`http://localhost:${port}/?${qs}`);
await page.evaluate(() => { window.__p = window.run(); });
const t0 = Date.now();
for (const t of times.split(',').map(Number)) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const f = path.join(outDir, `${theme}-${event}-${mood}-${String(t).padStart(5, '0')}.png`);
  await page.screenshot({ path: f });
  console.log('saved', path.basename(f));
}
await page.evaluate(() => window.__p);
const left = await page.evaluate(() => document.querySelectorAll('footlit-stage').length);
console.log('stage elements left after show:', left);
await browser.close();
server.close();
