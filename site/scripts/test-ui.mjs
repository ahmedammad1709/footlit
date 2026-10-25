import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { safePath } from '../../scripts/safe-path.mjs';

const site = path.resolve(import.meta.dirname, '..');
const root = path.join(site, 'out');
const shots = path.join(site, '.shots/redesign');
await fs.mkdir(shots, { recursive: true });
assert.equal(safePath(root, '/%2e%2e%5cpackage.json'), null);
assert.equal(safePath(root, '/%E0%A4%A'), null);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = http.createServer(async (req, res) => {
  let file = safePath(root, new URL(req.url, 'http://localhost').pathname);
  if (!file) { res.writeHead(403); return res.end(); }
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream' });
    res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  const videos = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.error('pageerror:', e.message); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', (r) => { if (r.url().endsWith('.mp4')) videos.push(r.url()); });
  await page.setViewport({ width: 1440, height: 1000 });
  console.log('Opening', base);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  console.log('Page loaded');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.querySelector('button[class*="go"]')?.disabled);
  assert.equal(videos.length, 0, 'video must not load before visitor asks');
  const firefox = 'https://addons.mozilla.org/en-US/firefox/addon/footlit/';
  assert(await page.$(`a[href="${firefox}"]`), 'Firefox listing must be linked');
  assert(await page.$(`#install a[href="${firefox}"]`), 'Firefox must have a direct install link');
  assert(!await page.$eval('main', (el) => /Firefox.{0,30}(temporary preview|experimental)|This preview is removed/.test(el.textContent)), 'approved Firefox must not be described as a temporary preview');
  const count = await page.$eval('main', (el) => el.innerText.split(/\s+/).length);
  console.log(`Homepage visible words: ${count}`);
  await page.screenshot({ path: path.join(shots, 'desktop.png'), fullPage: true });
  await page.click('button[class*="go"]');
  await page.waitForSelector('footlit-stage');
  await page.waitForFunction(() => !document.querySelector('footlit-stage'), { timeout: 15000 });
  await page.click('button[class*="ghost"]');
  for (const name of ['Re-run checks', 'Close pull request', 'Reopen the demo']) await page.evaluate((name) => [...document.querySelectorAll('button')].find((b) => b.textContent === name).click(), name);
  await new Promise((r) => setTimeout(r, 1300));
  assert(await page.$eval('figure', (el) => el.textContent.includes('All checks have passed')), 'reset must cancel old check result');
  for (const name of ['Terminal', 'Mission Control', 'Pixel Arcade', 'Quiet']) {
    await page.evaluate((name) => [...document.querySelectorAll('#themes button')].find((b) => b.textContent === name)?.click(), name);
    await page.waitForSelector('#themes footlit-stage');
  }
  await page.evaluate(() => window.Footlit.stop());
  await page.click('button[aria-label="Play the 44-second Footlit film"]');
  await page.waitForFunction(() => document.querySelector('video')?.currentTime > 0, { timeout: 15000 });
  assert(videos.length > 0, 'video loads on request');
  await page.$eval('video', (el) => el.pause());
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewport({ width, height: 844 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const dims = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert(dims.page <= dims.viewport, `horizontal overflow at ${width}: ${dims.page}`);
    if (width === 390) {
      await page.screenshot({ path: path.join(shots, 'mobile.png'), fullPage: true });
      await page.click('header details summary');
      assert(await page.$eval('nav[aria-label="Mobile navigation"]', (el) => el.getBoundingClientRect().height > 0));
    }
  }
  for (const route of ['/themes/', '/themes/terminal/', '/events/', '/privacy/', '/changelog/']) {
    await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    assert(await page.$('h1'), `missing heading on ${route}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow on ${route}`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS responsive layouts, live demo, reset cancellation, theme previews, video playback, navigation, routes, and no browser errors');
  console.log(`Screenshots: ${shots}`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
