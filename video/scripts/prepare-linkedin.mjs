import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import puppeteer from 'puppeteer-core';
import {safePath} from '../../scripts/safe-path.mjs';
import {SR,makeBus,put,kick,hat,clap,pluck,pluckBass,pad,mtof,click,whoosh,reverb} from './synth.mjs';
const repo=path.resolve(import.meta.dirname,'../..');
const out=path.join(repo,'brag-output-2026-10-14-linkedin/composition/assets');
await fs.mkdir(out,{recursive:true});
for(const file of ['league-gothic.woff2','newsreader.woff2','newsreader-italic.woff2','dm-mono-400.woff2'])await fs.copyFile(path.join(repo,'site/public/fonts',file),path.join(out,file));
await fs.copyFile(path.join(repo,'video/linkedin-tools/node_modules/gsap/dist/gsap.min.js'),path.join(out,'gsap.min.js'));
await fs.copyFile(path.join(repo,'video/out/footlit-linkedin-product.mp4'),path.join(out,'product.mp4'));
const js=await fs.readFile(path.join(repo,'dist/popup/popup.js'),'utf8');
const build=/build !== "([^"]+)"/.exec(js)?.[1];
if(!build)throw Error('Cannot identify popup build');
const fixture=`<script>const mem={sync:{'footlit:settings':{onboarded:true,theme:'marquee'}},local:{'footlit:stats':{shows:0,log:[]}}};const listeners=[];const area=n=>({get:async k=>({[k]:mem[n][k]}),set:async o=>{Object.assign(mem[n],o);const c={};for(const k in o)c[k]={newValue:o[k]};listeners.forEach(f=>f(c,n))}});window.chrome={storage:{sync:area('sync'),local:area('local'),onChanged:{addListener(f){listeners.push(f)},removeListener(){}}},runtime:{getURL:f=>'/'+f,sendMessage:async()=>({}),openOptionsPage(){}},tabs:{query:async()=>[{id:1,url:'https://github.com/demo/your-next-release'}],sendMessage:async()=>({build:'${build}',ok:true})}};</script>`;
const server=http.createServer(async(req,res)=>{const f=safePath(path.join(repo,'dist'),new URL(req.url,'http://x').pathname.slice(1));if(!f){res.writeHead(403);return res.end()}try{let b=await fs.readFile(f);if(f.endsWith('popup.html'))b=Buffer.from(b.toString().replace('<script src="popup.js"></script>',fixture+'<script src="popup.js"></script>'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(f)]??'application/octet-stream');res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const cache=path.join(repo,'video/.cache/chrome-headless-shell');const ver=(await fs.readdir(cache)).find(x=>x.startsWith('win64-'));
const browser=await puppeteer.launch({executablePath:path.join(cache,ver,'chrome-headless-shell-win64/chrome-headless-shell.exe'),args:['--no-sandbox'],defaultViewport:{width:380,height:900,deviceScaleFactor:3}});
try{const p=await browser.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/popup/popup.html`);await p.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,600));if((await p.locator('body').waitHandle()).disposed)throw Error('Missing popup');const text=await p.evaluate(()=>document.body.innerText);if(text.includes('older Footlit'))throw Error('Stale popup fixture');await p.screenshot({path:path.join(out,'popup-marquee.png'),clip:{x:0,y:0,width:380,height:254}});await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='Terminal')?.click()});await new Promise(r=>setTimeout(r,250));await p.screenshot({path:path.join(out,'popup-terminal.png'),clip:{x:0,y:0,width:380,height:254}})}finally{await browser.close();server.close()}
// Original 120 BPM score, generated from oscillators; no sampled recordings.
const b=makeBus(SR*24);
const chords=[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,65]];
for(let bar=0;bar<10;bar++){const t=3+bar*2;if(t>=22)break;const c=chords[bar%4];put(b,t,pad(c.map(mtof),2.4,.16,.7,1800,.10),1,.12);put(b,t,pluckBass(mtof(c[0]-12),.7,.24));put(b,t+1.25,pluckBass(mtof(c[0]-12),.4,.18));for(let j=0;j<8;j++){const n=c[[0,2,1,3,2,1,3,2][j]]+12;put(b,t+j*.25,pluck(mtof(n),.32,.085),1,j%2?.28:-.28)}for(let j=0;j<4;j++){put(b,t+j*.5,kick(.20));if(j%2)put(b,t+j*.5,clap(.07));put(b,t+j*.5+.25,hat(.045))}}
put(b,.30,click(.17));put(b,1.1,click(.14,.8));put(b,2.65,whoosh(.35,true,.09));put(b,3.7,click(.23));put(b,4,pluck(mtof(84),1.3,.2));put(b,17.25,click(.2));put(b,19.5,pluck(mtof(81),1.8,.2));put(b,21,pad([57,60,64,71].map(mtof),3,.08,1.5,2200,.13));
reverb(b,.12,.7,.5);
const pcm=Buffer.alloc(44+b.L.length*4);pcm.write('RIFF');pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(2,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*4,28);pcm.writeUInt16LE(4,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
for(let i=0;i<b.L.length;i++){const t=i/SR;const g=Math.min(1,t/.025,(24-t)/1.2);pcm.writeInt16LE(Math.round(Math.tanh(b.L[i]*1.3)*g*27000),44+i*4);pcm.writeInt16LE(Math.round(Math.tanh(b.R[i]*1.3)*g*27000),46+i*4)}
await fs.writeFile(path.join(out,'score-raw.wav'),pcm);
const ff=createRequire(import.meta.url)('ffmpeg-static');const r=spawnSync(ff,['-y','-i',path.join(out,'score-raw.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=8','-ar','48000',path.join(out,'score.wav')],{encoding:'utf8'});if(r.status)throw Error(r.stderr);console.log('Product footage, genuine popup captures, fonts and original score ready.');
