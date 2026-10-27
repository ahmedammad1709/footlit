// Renders the GitHub social preview (1280x640) into docs/media/. Run: node scripts/make-social-card.mjs
// GitHub has no API for this: upload the PNG at Settings -> General -> Social preview.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';

const pub = path.resolve('public');
const out = path.resolve('../docs/media/social-preview.png');
const u = (p) => pathToFileURL(path.join(pub, p)).href;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${u('fonts/league-gothic.woff2')})}
@font-face{font-family:M;font-weight:400;src:url(${u('fonts/dm-mono-400.woff2')})}
@font-face{font-family:M;font-weight:500;src:url(${u('fonts/dm-mono-500.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1280px;height:640px;background:#1B1612;color:#F1E8D4;display:flex;align-items:center;padding:0 64px;gap:56px;overflow:hidden;position:relative}
.l{flex:none;width:540px}
.l img{width:68px;height:68px;display:block;margin-bottom:34px}
h1{font:400 112px/.9 D;letter-spacing:.005em;text-transform:uppercase}
h1 em{font-style:normal;color:#F2A81D}
.tags{margin-top:38px;font:500 18px/1.3 M;letter-spacing:.1em;white-space:nowrap;text-transform:uppercase;color:#F2A81D}
.r{flex:none;width:612px}
.shot{border:8px solid #F1E8D4;background:#000;line-height:0}
.shot img{width:100%;display:block}
.url{margin-top:22px;font:400 22px/1 M;color:#F1E8D4;letter-spacing:.02em}
.url b{color:#F2A81D;font-weight:500}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:#F2A81D}
</style>
<div class="l"><img src="${u('logo.svg')}" alt=""><h1>GitHub, with <em>stage lighting.</em></h1>
<p class="tags">Free · Open source · Chrome + Firefox</p></div>
<div class="r"><div class="shot"><img src="${u('mock/theme-marquee.png')}" alt=""></div>
<p class="url"><b>★</b> github.com/ahmedammad1709/footlit</p></div><div class="bar"></div>`;

const tmp = path.join(os.tmpdir(), 'footlit-social-card.html');
await fs.writeFile(tmp, html);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 640, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', out, (await fs.stat(out)).size, 'bytes');
