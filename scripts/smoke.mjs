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
const stub = () => {
  const mem = { sync: {}, local: {} };
  const area = (n) => ({ get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}), set: async (o) => { Object.assign(mem[n], o); }, remove: async (k) => { delete mem[n][k]; } });
  window.chrome = { storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } }, runtime: { getURL: (f) => '/' + f, openOptionsPage() {}, sendMessage: async () => ({}) }, tabs: { query: async () => [], sendMessage: async () => {} } };
};
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
for (const [name, w, h] of [['options', 1280, 1000], ['popup', 380, 560]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errs.push(m.text()));
  await p.evaluateOnNewDocument(stub);
  await p.goto(`${base}/${name}/${name}.html`);
  await new Promise((r) => setTimeout(r, name === 'options' ? 2800 : 700));
  await p.screenshot({ path: path.join(out, `ui-${name}.png`) });
  console.log(name, 'errors:', errs.length ? errs : 'none');
}
await b.close(); srv.close();
