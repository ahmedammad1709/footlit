// Theme matrix test: every theme x every event (default mood), plus reduced-motion, in real headless Chrome.
// Asserts: no page errors, the show finishes, and the overlay removes itself from the page. Run: npm run test:themes
import esbuild from 'esbuild';
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dev = path.join(root, '.dev');
await fs.rm(dev, { recursive: true, force: true });
await fs.mkdir(path.join(dev, 'fonts'), { recursive: true });
await esbuild.build({ entryPoints: [path.join(root, 'src/dev/playground.ts')], bundle: true, outfile: path.join(dev, 'playground.js'), format: 'iife', target: 'chrome120', loader: { '.css': 'text' }, logLevel: 'error' });
const fonts = { 'league-gothic.woff2': '@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2', 'dm-mono-400.woff2': '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 'dm-mono-500.woff2': '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', 'press-start-2p.woff2': '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'jetbrains-mono-400.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-700.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2' };
for (const [to, from] of Object.entries(fonts)) await fs.cp(path.join(root, 'node_modules', from), path.join(dev, 'fonts', to));
await fs.writeFile(path.join(dev, 'index.html'), '<!doctype html><meta charset=utf-8><body style="margin:0;background:#0d1117;height:100vh"><script src=playground.js></script>');

const types = { '.js': 'text/javascript', '.woff2': 'font/woff2', '.html': 'text/html' };
const server = http.createServer(async (req, res) => {
  let rel = new URL(req.url, 'http://x').pathname;
  if (rel === '/') rel = '/index.html';
  try { const b = await fs.readFile(path.join(dev, rel)); res.writeHead(200, { 'content-type': types[path.extname(rel)] ?? 'text/plain' }); res.end(b); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const themes = ['marquee', 'terminal', 'mission', 'pixel', 'crawler', 'quiet'];
const events = ['repo.created', 'repo.deleted', 'repo.forked', 'pr.opened', 'pr.merged', 'pr.closed', 'ci.passed', 'ci.failed', 'deploy.live', 'release.published', 'issue.closed'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 720 } });

let failed = 0;
async function run(label, theme, event, { reduced = false, size } = {}) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    window.__intervals = new Set();
    window.__observers = new Set();
    window.__roots = [];
    const set = window.setInterval.bind(window), clear = window.clearInterval.bind(window);
    window.setInterval = (...args) => { const id = set(...args); window.__intervals.add(id); return id; };
    window.clearInterval = (id) => { window.__intervals.delete(id); clear(id); };
    const Observer = window.ResizeObserver;
    window.ResizeObserver = class extends Observer {
      observe(...args) { window.__observers.add(this); super.observe(...args); }
      disconnect() { window.__observers.delete(this); super.disconnect(); }
    };
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) { const root = attach.call(this, options); window.__roots.push(root); return root; };
  });
  if (size) await page.setViewport(size);
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.text().includes('[footlit] theme failed')) && !m.text().includes('404') && errors.push(m.text()));
  await page.goto(`${base}/?theme=${theme}&event=${event}&scale=0.45&reduced=${reduced ? 1 : 0}`);
  const result = page.evaluate(async () => {
    const show = window.run();
    await new Promise((r) => setTimeout(r, 150));
    window.__animated = window.__roots.some((r) => [...r.querySelectorAll('*')].some((el) => getComputedStyle(el).animationName !== 'none'));
    await show;
    return 'done';
  });
  const finished = await Promise.race([
    result,
    new Promise((r) => setTimeout(() => r('timeout'), 15000)),
  ]);
  const left = await page.evaluate(() => document.querySelectorAll('footlit-stage').length);
  const resources = await page.evaluate(() => ({ intervals: window.__intervals.size, observers: window.__observers.size, animated: window.__animated, playing: window.isPlaying() }));
  const ok = finished === 'done' && left === 0 && errors.length === 0 && !resources.intervals && !resources.observers && !resources.playing && (!reduced || !resources.animated);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (${finished}, ${left} stage left, errors: ${JSON.stringify(errors)}, resources: ${JSON.stringify(resources)})`}`);
  await page.close();
}

for (const t of themes) for (const e of events) await run(`${t} / ${e}`, t, e);
console.log('Reduced motion');
for (const t of themes) await run(`${t} / reduced motion`, t, 'ci.passed', { reduced: true });
for (const t of themes) await run(`${t} / reduced motion alarm`, t, 'ci.failed', { reduced: true });
console.log('Small window');
for (const t of themes) await run(`${t} / 420x700`, t, 'pr.merged', { size: { width: 420, height: 700 } });

const hidden = await browser.newPage();
await hidden.goto(`${base}/?theme=quiet&event=pr.merged&scale=0.1`);
const hiddenOK = await hidden.evaluate(async () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  await window.run();
  const released = !window.isPlaying();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  await window.run();
  return released && !window.isPlaying() && !document.querySelector('footlit-stage');
});
if (!hiddenOK) failed++;
console.log(`${hiddenOK ? 'PASS' : 'FAIL'}  hidden-tab timeout releases player and next show completes`);
await hidden.close();

await browser.close();
server.close();
console.log(failed ? `\n${failed} failed` : '\nall theme tests passed');
process.exit(failed ? 1 : 0);
