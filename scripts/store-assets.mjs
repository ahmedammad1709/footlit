// Generates store listing images into store/.   npm run store-assets   (needs: npm run build first)
//   store/screenshot-*.png        1280x800  (Chrome Web Store / Edge / AMO)
//   store/promo-small-440x280.png
//   store/promo-marquee-1400x560.png
import esbuild from 'esbuild';
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'store');
const dev = path.join(root, '.dev');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.rm(dev, { recursive: true, force: true });
await fs.mkdir(path.join(dev, 'fonts'), { recursive: true });

// ---- playground bundle (the real engine and themes) + fonts ----
await esbuild.build({ entryPoints: [path.join(root, 'src/dev/playground.ts')], bundle: true, outfile: path.join(dev, 'playground.js'), format: 'iife', target: 'chrome111', loader: { '.css': 'text' }, logLevel: 'error' });
const fonts = { 'league-gothic.woff2': '@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2', 'dm-mono-400.woff2': '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 'dm-mono-500.woff2': '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', 'press-start-2p.woff2': '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'jetbrains-mono-400.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-700.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', 'newsreader.woff2': '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2', 'newsreader-italic.woff2': '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2' };
for (const [to, from] of Object.entries(fonts)) await fs.cp(path.join(root, 'node_modules', from), path.join(dev, 'fonts', to));
const logo = await fs.readFile(path.join(root, 'src/assets/logo.svg'), 'utf8');

// a stand-in pull request page for overlays to play over
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
await fs.writeFile(path.join(dev, 'tile-small.html'), tile(440, 280, false));
await fs.writeFile(path.join(dev, 'tile-wide.html'), tile(1400, 560, true));

function tile(w, h, wide) {
  const swatches = [['Marquee', '#1B1612,#F2A81D,#F1E8D4,#B8301F'], ['Terminal', '#0A0D0C,#5CF29A,#6FD3E0,#FF6B5E'], ['Mission Control', '#06090D,#FF7A2B,#E8EEF3,#3FD68F'], ['Pixel Arcade', '#1D2B53,#FFEC27,#29ADFF,#FF004D'], ['Web Crawler', '#050506,#C9CED6,#E5322D,#6E757F'], ['Quiet', '#FFFFFF,#1A7F37,#CF222E,#59636E']];
  const chips = wide ? swatches.map(([n, c]) => `<div class=chip><span class=sw>${c.split(',').map((x) => `<i style="background:${x}"></i>`).join('')}</span><b>${n}</b></div>`).join('') : '';
  return `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:D;src:url(fonts/league-gothic.woff2)}@font-face{font-family:M;src:url(fonts/dm-mono-500.woff2)}@font-face{font-family:T;src:url(fonts/newsreader-italic.woff2);font-style:italic}
*{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;background:#F1E8D4;color:#1B1612;display:flex;flex-direction:column;justify-content:center;padding:${wide ? 70 : 26}px;overflow:hidden}
.row{display:flex;align-items:center;gap:${wide ? 44 : 20}px}.row svg{width:${wide ? 190 : 96}px;height:${wide ? 190 : 96}px;flex:none}
h1{font:400 ${wide ? 200 : 92}px/.9 D;letter-spacing:.02em;margin:0;text-transform:uppercase}
p{margin:${wide ? 14 : 8}px 0 0;font:italic ${wide ? 38 : 19}px T,serif;color:#5C5043}
.chips{display:flex;gap:12px;margin-top:${wide ? 54 : 0}px;flex-wrap:wrap}.chip{display:flex;align-items:center;gap:9px;border:3px solid #1B1612;padding:8px 11px}
.sw{display:flex;gap:4px}.sw i{width:15px;height:15px;border:2px solid #1B1612;display:block}.chip b{font:500 14.5px M;text-transform:uppercase;letter-spacing:.06em}
</style><div class=row>${logo.replace('<svg ', '<svg ')}<div><h1>Footlit</h1><p>GitHub, with stage lighting.</p></div></div>${wide ? `<div class=chips>${chips}</div>` : ''}`;
}

const types = { '.js': 'text/javascript', '.woff2': 'font/woff2', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png' };
const serve = (dir) => new Promise((resolve) => {
  const s = http.createServer(async (req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel === '/') rel = '/index.html';
    try { const b = await fs.readFile(path.join(dir, rel)); res.writeHead(200, { 'content-type': types[path.extname(rel)] ?? 'text/plain' }); res.end(b); } catch { res.writeHead(404); res.end(); }
  });
  s.listen(0, () => resolve(s));
});
const devServer = await serve(dev);
const distServer = await serve(path.join(root, 'dist'));
const devBase = `http://localhost:${devServer.address().port}`;
const distBase = `http://localhost:${distServer.address().port}`;

// 1440x900 at 0.8889 scale = exactly 1280x800 and crisp
const SCALE = 1280 / 1440;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 900, deviceScaleFactor: SCALE } });

async function overlay(file, theme, event, at) {
  const page = await browser.newPage();
  await page.goto(`${devBase}/?theme=${theme}&event=${event}&subject=${encodeURIComponent('acme/widget-shop #42')}`);
  await page.evaluate(() => { window.__p = window.run(); });
  await new Promise((r) => setTimeout(r, at));
  await page.screenshot({ path: path.join(out, file) });
  await page.evaluate(() => window.__p);
  await page.close();
  console.log('wrote', file);
}

await overlay('screenshot-1-marquee.png', 'marquee', 'pr.merged', 2500);
await overlay('screenshot-2-terminal.png', 'terminal', 'pr.merged', 3500);
await overlay('screenshot-3-mission-control.png', 'mission', 'ci.passed', 3300);
await overlay('screenshot-4-pixel-arcade.png', 'pixel', 'pr.merged', 2600);
await overlay('screenshot-5-web-crawler.png', 'crawler', 'issue.closed', 2600);
await overlay('screenshot-6-quiet.png', 'quiet', 'pr.merged', 1000);

// settings page, rendered from the built extension with a stubbed chrome.* so it runs outside the browser
{
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    const mem = { sync: { 'footlit:settings': { theme: 'terminal', onboarded: true } }, local: {} };
    const area = (n) => ({ get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}), set: async (o) => Object.assign(mem[n], o), remove: async () => {} });
    window.chrome = { storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } }, runtime: { getURL: (f) => '/' + f, openOptionsPage() {}, sendMessage: async () => ({}) }, tabs: { query: async () => [] } };
  });
  await page.goto(`${distBase}/options/options.html`);
  await new Promise((r) => setTimeout(r, 3300));
  await page.screenshot({ path: path.join(out, 'screenshot-7-settings.png') });
  await page.close();
  console.log('wrote screenshot-7-settings.png');
}

for (const [file, w, h] of [['promo-small-440x280.png', 440, 280], ['promo-marquee-1400x560.png', 1400, 560]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`${devBase}/${w === 440 ? 'tile-small' : 'tile-wide'}.html`);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(out, file) });
  await page.close();
  console.log('wrote', file);
}

await browser.close();
devServer.close();
distServer.close();
