// Renders the built popup/options pages in headless Chrome with a minimal in-memory stub of the chrome.* APIs.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const dist = path.resolve('dist');
const out = process.argv[2];
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer(async (q, r) => { try { const f = path.join(dist, decodeURIComponent(new URL(q.url, 'http://x').pathname)); const buf = await fs.readFile(f); r.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'text/plain' }); r.end(buf); } catch { r.writeHead(404); r.end(); } });
await new Promise((r) => srv.listen(0, r));
const base = `http://localhost:${srv.address().port}`;
const stub = (variant) => {
  const off = { enabled: false, theme: null };
  const mem = { sync: variant === 'mixed' ? { 'footlit:settings': { theme: 'terminal', onboarded: true, events: { 'repo.deleted': off, 'pr.closed': off, 'ci.failed': off, 'issue.closed': off } } } : variant === 'quiet' ? { 'footlit:settings': { quietUntil: Date.now() + 3000000, theme: 'terminal', onboarded: true } } : {}, local: {} };
  const area = (n) => ({ get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}), set: async (o) => { Object.assign(mem[n], o); }, remove: async (k) => { delete mem[n][k]; } });
  window.chrome = { storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } }, runtime: { getURL: (f) => '/' + f, openOptionsPage() {}, sendMessage: async () => ({}) }, tabs: { query: async () => (variant === 'quiet' ? [] : [{ id: 1, url: 'https://github.com/acme/widget-shop' }]), sendMessage: async () => { throw new Error('no receiver'); }, reload() {} } };
};
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
for (const [name, w, h, variant, file] of [['options', 1280, 1000, 'a', 'options'], ['popup', 380, 900, 'a', 'popup'], ['popup', 380, 900, 'quiet', 'popup-quiet'], ['popup', 380, 900, 'mixed', 'popup-mixed']]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errs.push(m.text()));
  await p.evaluateOnNewDocument(stub, variant);
  await p.goto(`${base}/${name}/${name}.html`);
  await new Promise((r) => setTimeout(r, name === 'options' ? 2300 : 700));
  await p.screenshot({ path: path.join(out, `ui-${file}.png`), fullPage: name === 'options' });
  const hgt = await p.evaluate(() => document.body.offsetHeight + 24);
  console.log(file, 'height', hgt, 'errors:', errs.length ? errs : 'none');
}
await b.close(); srv.close();
