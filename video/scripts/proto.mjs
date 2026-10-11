// Prototype: can chrome-headless-shell render deterministic frames with virtual time + BeginFrame control?
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs/promises';

const root = path.resolve(import.meta.dirname, '..');
const cacheDir = path.join(root, '.cache/chrome-headless-shell');
const ver = (await fs.readdir(cacheDir)).find((d) => d.startsWith('win64-'));
const exe = path.join(cacheDir, ver, 'chrome-headless-shell-win64/chrome-headless-shell.exe');

const html = `<!doctype html><style>
body{margin:0;background:#111;overflow:hidden}
#a{position:absolute;top:20px;left:0;width:40px;height:40px;background:#f2a81d;animation:mv 10s linear forwards}
@keyframes mv{to{left:1000px}}
#b{position:absolute;top:80px;left:0;width:40px;height:40px;background:#e5604c}
#c{position:absolute;top:140px;left:0;width:40px;height:40px;background:#6fd3e0}
#d{position:absolute;top:200px;font:30px monospace;color:#fff}
canvas{position:absolute;top:260px}
</style><div id=a></div><div id=b></div><div id=c></div><div id=d>t=0</div><canvas id=cv width=400 height=100></canvas>
<script>
document.getElementById('b').animate([{left:'0px'},{left:'1000px'}],{duration:10000,fill:'both',easing:'linear'});
let n=0; const cx=document.getElementById('cv').getContext('2d');
const tick=(now)=>{ cx.fillStyle='#000';cx.fillRect(0,0,400,100); cx.fillStyle='#fff'; cx.fillRect((now/10)%380,40,20,20); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
setInterval(()=>{ document.getElementById('c').style.left = (performance.now()/10)+'px'; document.getElementById('d').textContent='t='+Math.round(performance.now()); }, 16);
</script>`;

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'shell',
  args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging', '--disable-image-animation-resync', '--no-sandbox'],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
const client = await page.createCDPSession();
await client.send('HeadlessExperimental.enable');
await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
await page.setContent(html, { waitUntil: 'load' });

const MODE = process.argv[2] ?? 'A';
const FPS = 30;
const interval = 1000 / FPS;
const t0 = 100000;
const rows = [];
for (let i = 0; i < 61; i++) {
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget: interval });
  await new Promise((res) => client.once('Emulation.virtualTimeBudgetExpired', res));
  const r = await client.send('HeadlessExperimental.beginFrame', MODE === 'A' ? { noDisplayUpdates: false, screenshot: { format: 'jpeg', quality: 80 } } : { frameTimeTicks: (await client.send('Runtime.evaluate', { expression: 'performance.timeOrigin + performance.now()' })).result.value, interval, noDisplayUpdates: false, screenshot: { format: 'jpeg', quality: 80 } });
  if (i % 10 === 0) {
    const pos = await page.evaluate(() => ({
      cssAnim: document.getElementById('a').getBoundingClientRect().left,
      waapi: document.getElementById('b').getBoundingClientRect().left,
      timer: document.getElementById('c').getBoundingClientRect().left,
      label: document.getElementById('d').textContent, tl: Math.round(document.timeline.currentTime),
    }));
    rows.push({ frame: i, ms: Math.round(i * interval), damage: r.hasDamage, shot: !!r.screenshotData, ...pos });
  }
}
console.table(rows.map((r) => ({ frame: r.frame, 'expected px (10px per 100ms)': Math.round(r.ms / 10), css: Math.round(r.cssAnim), waapi: Math.round(r.waapi), timer: Math.round(r.timer), label: r.label, tl: r.tl, shot: r.shot })));
await browser.close();
