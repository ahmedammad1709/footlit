// Renders the film deterministically: virtual time + BeginFrame control in chrome-headless-shell, frames piped to ffmpeg.
//   node scripts/render.mjs --preview=1.5,3.5,10        save PNG stills at those times to out/preview/
//   node scripts/render.mjs --full                      render the whole film to out/footlit-launch-1920x1080.mp4
//   options: --from=SEC --to=SEC (render only a range)   --fps=30   --no-audio   --crf=14
import puppeteer from 'puppeteer-core';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { safePath } from '../../scripts/safe-path.mjs';

const root = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(root, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const arg = (name, def) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(a.indexOf('=') + 1) : (process.argv.includes(`--${name}`) ? true : def); };

// which film: 'film' (the 60 s hero) or e.g. 'teaser' (src/teaser.html + src/teaser-cues.json)
const FILM = String(arg('film', 'film'));
const cues = JSON.parse(await fs.readFile(path.join(root, FILM === 'film' ? 'src/cues.json' : `src/${FILM}-cues.json`), 'utf8'));
const [VW, VH] = cues.size ?? [1920, 1080];
const FPS = Number(arg('fps', cues.fps ?? 30));
const DURATION = cues.duration;
const preview = arg('preview', '') ? String(arg('preview')).split(',').map(Number) : null;
const full = arg('full', false) === true;
const from = Number(arg('from', 0));
const to = Number(arg('to', DURATION));
const crf = String(arg('crf', 14));

// ---------- static server ----------
const popupJs = await fs.readFile(path.join(repo, 'dist/popup/popup.js'), 'utf8');
const BUILD = /build\s*!==\s*"([a-z0-9]+)"/.exec(popupJs)?.[1] ?? '';
const popupStub = `<script>(()=>{const mem={sync:{'footlit:settings':{onboarded:true,theme:(new URLSearchParams(location.search).get('theme')||'terminal')}},local:{'footlit:stats':{shows:214,log:[]}}};const ls=[];const area=(n)=>({get:async(k)=>(k in mem[n]?{[k]:mem[n][k]}:{}),set:async(o)=>{Object.assign(mem[n],o);const ch={};for(const k in o)ch[k]={newValue:o[k]};ls.forEach(f=>f(ch,n))},remove:async()=>{}});window.chrome={storage:{sync:area('sync'),local:area('local'),onChanged:{addListener(f){ls.push(f)},removeListener(){}}},runtime:{getURL:(f)=>'/ext/'+f,openOptionsPage(){},sendMessage:async()=>({})},tabs:{query:async()=>[{id:1,url:'https://github.com/acme/widget-shop'}],sendMessage:async(_i,m)=>m.type==='hello'?{build:'${BUILD}'}:{ok:true},reload(){}}};})();</script>`;
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const dirs = [
  ['/dist/', path.join(root, 'dist')],
  ['/ext/', path.join(repo, 'dist')],
  ['/fonts/', path.join(repo, 'site/public/fonts')],
  ['/assets/', path.join(root, 'assets')],
  ['/', path.join(root, 'src')],
];
const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  for (const [prefix, dir] of dirs) {
    if (!p.startsWith(prefix)) continue;
    const file = safePath(dir, p.slice(prefix.length) || 'index.html');
    if (!file) { res.writeHead(403); return res.end(); }
    try {
      let body = await fs.readFile(file);
      if (p === '/ext/popup/popup.html') body = Buffer.from(body.toString('utf8').replace('<script src="popup.js"></script>', popupStub + '<script src="popup.js"></script>'));
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      return void res.end(body);
    } catch { /* try the next mapping */ }
  }
  res.writeHead(404);
  res.end('not found');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ---------- browser ----------
const cacheDir = path.join(root, '.cache/chrome-headless-shell');
const ver = (await fs.readdir(cacheDir)).find((d) => d.startsWith('win64-'));
const exe = path.join(cacheDir, ver, 'chrome-headless-shell-win64/chrome-headless-shell.exe');
const browser = await puppeteer.launch({
  executablePath: exe, headless: 'shell',
  args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging', '--disable-image-animation-resync', '--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
  defaultViewport: { width: VW, height: VH, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[film]')) console.log('[page]', m.text()); });
const client = await page.createCDPSession();
await client.send('HeadlessExperimental.enable');
const query = arg('q', '');
await page.goto(`${base}/${FILM}.html${query ? '?' + query : ''}`, { waitUntil: 'load' });
// load + fonts in real time, then freeze time
await page.waitForFunction('window.__ready === true', { timeout: 60000, polling: 200 }).catch(async (e) => { console.log('film never became ready; stage:', await page.evaluate(() => window.__stage ?? 'unknown')); throw e; });
await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });

const interval = 1000 / FPS;
const nowTicks = async () => (await client.send('Runtime.evaluate', { expression: 'performance.timeOrigin + performance.now()' })).result.value;
const advance = async (ms) => {
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: ms });
  await new Promise((res) => client.once('Emulation.virtualTimeBudgetExpired', res));
};
const frame = async (shot) => client.send('HeadlessExperimental.beginFrame', { frameTimeTicks: await nowTicks(), interval, noDisplayUpdates: !shot, ...(shot ? { screenshot: { format: 'png' } } : {}) });

await client.send('Runtime.evaluate', { expression: 'window.__start()' });

const totalFrames = Math.round(DURATION * FPS);
const startFrame = Math.round(from * FPS);
const endFrame = Math.min(totalFrames, Math.round(to * FPS));

// ---------- output ----------
let enc = null;
let lastPng = null;
if (full) {
  await fs.mkdir(path.join(root, 'out'), { recursive: true });
  const audio = path.join(root, FILM === 'film' ? 'out/audio-mix.wav' : `out/${FILM}-audio-mix.wav`);
  const haveAudio = !process.argv.includes('--no-audio') && (await fs.stat(audio).then(() => true, () => false));
  const outFile = path.join(root, 'out', from || to < DURATION ? `footlit-${FILM}-part-${from}-${to}.mp4` : (cues.output ?? 'footlit-launch-1920x1080.mp4'));
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0'];
  if (haveAudio) args.push('-ss', String(from), '-t', String(endFrame / FPS - startFrame / FPS), '-i', audio);
  if (cues.bt709) args.push('-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+bicubic,format=yuv420p');
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart');
  if (cues.tune) args.push('-tune', cues.tune);
  if (cues.bt709) args.push('-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv');
  if (haveAudio) args.push('-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push(outFile);
  enc = spawn(ffmpeg, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let errTail = '';
  enc.stderr.on('data', (d) => (errTail = (errTail + d).slice(-600)));
  enc.on('close', (c) => { if (c) console.log('ffmpeg exited', c, errTail); });
  console.log(`rendering ${endFrame - startFrame} frames at ${FPS} fps (${from}s to ${to}s) -> ${outFile}${haveAudio ? ' + audio' : ' (no audio)'}`);
}
const previewFrames = preview ? new Map(preview.map((t) => [Math.round(t * FPS), t])) : null;
if (preview) await fs.mkdir(path.join(root, 'out/preview'), { recursive: true });

// ---------- the frame loop ----------
const t0 = Date.now();
for (let f = 0; f < endFrame; f++) {
  if (f > 0) await advance(interval);
  const wantShot = (full && f >= startFrame) || (previewFrames && previewFrames.has(f));
  const r = await frame(wantShot);
  if (!wantShot) continue;
  if (r.screenshotData) lastPng = Buffer.from(r.screenshotData, 'base64');
  if (previewFrames?.has(f)) {
    const name = `t${String(previewFrames.get(f)).replace('.', '_')}.png`;
    await fs.writeFile(path.join(root, 'out/preview', name), lastPng);
    console.log('saved', name);
  }
  if (enc && lastPng) {
    if (!enc.stdin.write(lastPng)) await new Promise((res) => enc.stdin.once('drain', res));
    if (f % 90 === 0) console.log(`  frame ${f}/${endFrame}  (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
  }
  if (previewFrames && f >= Math.max(...previewFrames.keys())) break;
}
if (enc) { enc.stdin.end(); await new Promise((res) => enc.on('close', res)); console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`); }

if (arg('eval', '')) console.log('eval ->', JSON.stringify((await client.send('Runtime.evaluate', { expression: String(arg('eval')), returnByValue: true })).result.value));
await browser.close();
server.close();
