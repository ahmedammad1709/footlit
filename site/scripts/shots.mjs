// Visual check of the built site (site/out). node scripts/shots.mjs <outDir> [mobile]
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const site = path.resolve(import.meta.dirname, '..');
const out = path.resolve(process.argv[2] ?? path.join(site, '.shots'));
const mobile = process.argv[3] === 'mobile';
await fs.mkdir(out, { recursive: true });

const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml', '.zip': 'application/zip', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(site, 'out', rel);
  try {
    const st = await fs.stat(file);
    if (st.isDirectory()) file = path.join(file, 'index.html');
    const b = await fs.readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(b);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true } : { width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push('console: ' + m.text()));
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
page.on('response', (r) => r.status() >= 400 && errors.push(`http ${r.status()}: ${r.url()}`));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { await page.screenshot({ path: path.join(out, `${mobile ? 'm-' : ''}${name}.png`) }); console.log('shot', name); };
const scrollTo = async (sel, offset = 0) => { await page.evaluate((s, o) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - o, behavior: 'instant' }); }, sel, offset); await wait(500); };

await page.goto(base + '/', { waitUntil: 'networkidle0' });
await wait(1500);
await shot('01-hero');

if (!mobile) {
  // hero demo: press Merge pull request
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Merge pull request'))?.click());
  await wait(2300);
  await shot('02-hero-merge-playing');
  await wait(3000);
}

await scrollTo('#themes', 70);
await wait(4300);
await shot('03-themes');
// pick Pixel Arcade and wait for it
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Pixel Arcade') && b.className.includes('card'))?.click());
await wait(2700);
await shot('04-themes-pixel');

await scrollTo('#events', 70); await shot('05-programme');
await scrollTo('#how', 70); await shot('06-how');
await scrollTo('#inside', 70); await wait(600); await shot('07-inside');
await scrollTo('#trust', 70); await shot('08-trust');
await scrollTo('#install', 70); await shot('09-install');
await scrollTo('#faq', 70); await shot('10-faq');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(500); await shot('11-footer');

await page.goto(base + '/privacy/', { waitUntil: 'networkidle0' });
await wait(500);
await shot('12-privacy');

await page.goto(base + '/themes/', { waitUntil: 'networkidle0' });
await wait(500);
await shot('13-themes-index');
await page.goto(base + '/themes/terminal/', { waitUntil: 'networkidle0' });
await wait(1200);
await shot('14-theme-terminal-top');
await scrollTo('#h-try', 90);
await wait(4300);
await shot('15-theme-terminal-demo');
await scrollTo('#h-see', 90);
await shot('16-theme-terminal-see');
await page.goto(base + '/events/', { waitUntil: 'networkidle0' });
await wait(500);
await scrollTo('main', -400);
await shot('17-events');
await page.goto(base + '/changelog/', { waitUntil: 'networkidle0' });
await wait(500);
await shot('18-changelog');

const dims = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: innerWidth }));
console.log('horizontal overflow?', dims.scrollW > dims.innerW ? `YES (${dims.scrollW} > ${dims.innerW})` : 'no');
console.log(errors.length ? 'ISSUES:\n' + [...new Set(errors)].join('\n') : 'no console errors, no failed requests');
await browser.close();
server.close();
