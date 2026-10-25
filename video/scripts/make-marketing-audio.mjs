// Sound for the marketing film: original synthesised score and effects, the voiceover, ducking, a limiter and a loudness pass.
// Locked to src/marketing-cues.json so the sound always matches the picture.   node scripts/make-marketing-audio.mjs  ->  out/marketing-audio-mix.wav
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { SR, makeBus, put, putStereo, reverb, mtof, len, svf, osc, expo, asr, kick, clap, hat, impact, hit, riser, siren, bass, pluckBass, pad, bell, pluck, brass, timpani, cymbal, whoosh, click, key, applause } from './synth.mjs';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const cues = JSON.parse(await fs.readFile(path.join(root, 'src/marketing-cues.json'), 'utf8'));
const vo = JSON.parse(await fs.readFile(path.join(root, 'src/marketing-vo.json'), 'utf8'));
const { hook, payoff, logo, demo, montage, trust, end } = cues;
const N = Math.round(SR * cues.duration);
const music = makeBus(N), sfx = makeBus(N), voice = makeBus(N);
const E1 = 28;
const E = (semi) => mtof(E1 + semi);

// =====================================================================
// THE BED: one continuous score from the first frame to the last.
// A single tempo (160 BPM eighth-note grid, U = 0.1875 s), one chord loop, the same bass pulse, kick, backbeat, hats, pad and arp
// the whole way through. Only the intensity and the colour change: hushed in the hook, full on the payoff, warm for the logo,
// a darker filtered version of the same groove while the build is broken (it never stops), then back up for the merge, the
// montage and the fine print, and a resolved glow at the end. Every cut and hit sits on the grid.
// =====================================================================
const U = montage.unit;
const BAR = 8 * U;
// intensity 0..1 over time (linear between points)
const KEYS = [
  [0, 0.12], [3.3, 0.2], [payoff.start, 1.0], [logo.start, 0.55], [logo.end, 0.6],
  [demo.shows[0].t, 0.88], [15.4, 0.6], [demo.steps[1].t, 0.5], [demo.checksFail, 0.3], [demo.steps[2].t, 0.35],
  [demo.checksPass, 0.7], [demo.shows[2].t, 1.0], [26.0, 0.8], [montage.start, 0.92], [trust.start, 0.75], [end.start, 0.55], [cues.duration, 0.15],
];
const intensity = (t) => {
  if (t <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) { const [t0, v0] = KEYS[i - 1], [t1, v1] = KEYS[i]; return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0); }
  return KEYS[KEYS.length - 1][1];
};
const darkFrom = demo.steps[1].t, darkTo = demo.steps[2].t;
const isDark = (t) => t >= darkFrom - 0.01 && t < darkTo - 0.01;
// major wherever the brass and bells play E-major fanfares (payoff, logo, the repo-created show, and from the merge to the end),
// minor for the tension (hook, the build-up to each show, the broken build), so the harmony underneath always agrees with what is on top
const isMajor = (t) => (t >= payoff.start && t < logo.end) || (t >= demo.shows[0].t - 0.1 && t < demo.steps[1].t) || t >= demo.shows[2].t - 0.1;
const MINOR = [{ r: 0, iv: [0, 3, 7] }, { r: 8, iv: [0, 4, 7] }, { r: 3, iv: [0, 4, 7] }, { r: 10, iv: [0, 4, 7] }]; // Em C G D
const MAJOR = [{ r: 0, iv: [0, 4, 7] }, { r: 7, iv: [0, 4, 7] }, { r: 9, iv: [0, 3, 7] }, { r: 5, iv: [0, 4, 7] }]; // E B C#m A
const PAT = [1, 0.5, 0.75, 0.5, 0.95, 0.5, 0.75, 0.6];

for (let s = 0; s * U < cues.duration - 0.05; s++) {
  const t = s * U, i = intensity(t), b = Math.floor(s / 8), pos = s % 8, dark = isDark(t);
  const chord = (isMajor(t) ? MAJOR : MINOR)[b % 4];
  const root = dark ? 0 : chord.r;
  // bass pulse: every eighth; plucked and soft when quiet, growling and open when full
  if (i > 0.55 && !dark) {
    const o = pos === 6 && b % 2 ? 12 : 0;
    put(music, t, bass(E(root + 12 + o), U * 1.6, expo(260, 700, i), expo(900, 5200, i), (0.2 + 0.55 * i) * PAT[pos]), 0.8);
  } else {
    put(music, t, pluckBass(E(root + (dark ? 0 : 12)), U * 1.5, (0.2 + 0.6 * i) * PAT[pos] * (dark ? 0.8 : 1)), 0.8);
  }
  // kick: a heartbeat when hushed, half-time in the middle, driving when full
  const kickPos = i < 0.3 ? [0] : i < 0.7 ? [0, 4] : [0, 2, 4, 6];
  if (kickPos.includes(pos)) put(music, t, kick(dark ? 0.4 : 0.3 + 0.5 * i), 0.9);
  // backbeat
  if (i >= 0.3 && !dark) {
    const clapPos = i < 0.7 ? [4] : [2, 6];
    if (clapPos.includes(pos)) put(music, t, clap(0.25 + 0.35 * i), 0.9, 0.1);
  }
  // hats
  if (i >= 0.3) put(music, t + U / 2, hat((dark ? 0.1 : 0.1) + 0.12 * i), 0.8, -0.2);
  if (i >= 0.85) { put(music, t + U / 4, hat(0.1), 0.8, 0.2); put(music, t + (3 * U) / 4, hat(0.1), 0.8, -0.1); }
  // the pad carries the harmony; under the broken build it turns dark and leans on a flat second, still moving with the bar
  if (pos === 0) {
    const tones = dark ? [0, 1, 7] : chord.iv;
    const freqs = [...tones.map((x) => E(12 + root + x)), E(24 + root + tones[1]), E(24 + root + tones[2])];
    put(music, t, pad(freqs, BAR + 0.6, 0.35, 0.7, dark ? 480 : 900 + 2200 * i, (dark ? 0.55 : 0.35 + 0.45 * i)), 1);
  }
  // arp bells on chord tones
  if (i >= 0.35 && !dark && [0, 3, 6].includes(pos)) {
    const tone = chord.iv[[0, 3, 6].indexOf(pos) % chord.iv.length];
    put(music, t + U / 4, bell(E(36 + chord.r + tone), 1.0, 0.06 + 0.1 * i), 1, 0.3 - pos * 0.08);
  }
}

// ---- accents, effects and risers: placed on the same grid, layered over the bed ----
// hook: one click, a held breath, then the hit
put(sfx, hook.click, click(0.9, 0.8), 1, 0.2);
put(sfx, hook.click + 0.075, click(0.5, 0.65), 1, 0.2);
put(music, hook.end - 0.56, riser(0.56, 0.35, 600, 7000), 0.8);

// payoff
{
  const t = payoff.start;
  put(sfx, t, impact(1.0), 1);
  put(sfx, t, timpani(E(12), 0.9), 1);
  put(sfx, t + 0.05, cymbal(2.0, 0.45), 0.9);
  put(sfx, t + 0.75, brass([E(24), E(31), E(36), E(40), E(43)], 1.5, 0.95), 1);
  put(sfx, t + 0.9, brass([E(28), E(35), E(40), E(44), E(47)], 1.2, 0.6), 1);
  putStereo(sfx, t + 0.9, applause(payoff.end - t - 0.9, 0.5, 90));
  [0, 4, 7, 12].forEach((o, i) => put(sfx, t + 1.0 + i * 0.1, bell(E(48 + o), 2.0, 0.2), 1, -0.4 + i * 0.25));
}

// logo
{
  const t = logo.start;
  put(sfx, t - 0.25, whoosh(0.5, true, 0.5), 1);
  [0.1, 0.26, 0.42, 0.58].forEach((o, i) => put(sfx, t + o, kick(0.3 + i * 0.1), 0.9));
  for (let i = 0; i < 15; i++) put(sfx, t + 0.2 + i * 0.045, click(0.34, 1.0 + i * 0.07), 1, -0.7 + (i / 14) * 1.4);
  for (let i = 0; i < 7; i++) put(sfx, t + 0.3 + i * 0.06, pluck(E(36 + [0, 4, 7, 11, 12, 16, 19][i]), 0.9, 0.22), 1, -0.5 + i * 0.16);
  [[1.5, 0], [1.7, 4], [1.9, 7], [2.1, 11]].forEach(([o, st]) => put(music, t + o, bell(E(48 + st), 2.2, 0.22), 1, 0.2));
  put(sfx, logo.popupAt - 0.05, whoosh(0.55, true, 0.4), 1);
  put(sfx, logo.popupAt + 0.5, click(0.4, 1.1), 1, 0.2);
}

// demo
{
  put(sfx, demo.start - 0.3, whoosh(0.5, true, 0.45), 1);
  const per = (demo.typeEnd - demo.typeStart) / 11;
  for (let i = 0; i < 11; i++) put(sfx, demo.typeStart + i * per, key(0.9), 1, -0.1);
  put(sfx, demo.createClick, click(0.8, 0.85), 1, 0.3);
  put(music, demo.shows[0].t - 0.95, riser(0.95, 0.4, 500, 8000), 0.8);
  {
    const t = demo.shows[0].t;
    put(sfx, t, impact(0.9), 1);
    put(sfx, t, brass([E(24), E(31), E(36), E(40), E(43)], 1.7, 1.0), 1);
    put(sfx, t + 0.14, brass([E(28), E(35), E(40), E(44), E(47)], 1.4, 0.7), 1);
    put(sfx, t, cymbal(2.5, 0.5), 0.9);
    putStereo(sfx, t + 0.15, applause(2.6, 0.5, 80));
    [0, 2, 4].forEach((o, i) => put(sfx, t + 0.4 + i * 0.12, bell(E(52 + o * 2), 2, 0.2), 1, -0.4 + i * 0.4));
  }
  // break the build: tension rises inside the groove, then the voltage drops; the bed carries on, darker
  {
    const t = demo.steps[1].t, failA = demo.shows[1].t, f = demo.checksFail;
    for (let i = 0; i < 6; i++) put(sfx, t + 0.3 + i * 0.22, click(0.18, 0.55), 1, 0.4);
    put(music, t + 0.1, siren(f - t - 0.1, 90, 520, 0.22), 0.8);
    const n = len(1.2);
    const down = svf(osc('saw', (j) => expo(520, 38, Math.min(1, j / n)), n), (j) => expo(2200, 90, j / n), 1.1); asr(down, 0.002, 0.5);
    put(sfx, f, down, 0.7);
    put(sfx, f, impact(1.0), 1);
    for (const [o, fr] of [[0.05, 196], [0.42, 165]]) {
      const bz = svf(osc('square', fr, len(0.3)), 1800, 0.9); asr(bz, 0.005, 0.12);
      put(sfx, f + o, bz, 0.55, 0);
    }
    put(sfx, failA + 0.05, brass([E(24), E(27), E(30)], 1.3, 0.55), 1);
  }
  // merge it: the groove comes back, the checks ring, the big one
  {
    const m = demo.shows[2].t;
    put(sfx, demo.steps[2].t, whoosh(0.6, true, 0.4), 1);
    put(sfx, demo.checksPass, bell(E(44), 1.4, 0.3), 1, 0.2);
    put(sfx, demo.checksPass + 0.12, bell(E(51), 1.8, 0.3), 1, 0.3);
    put(sfx, demo.mergeClick, click(0.8, 0.85), 1, 0.1);
    put(music, m - 1.0, riser(1.0, 0.45, 400, 9000), 0.8);
    put(sfx, m, impact(1.0), 1);
    put(sfx, m, timpani(E(12), 1.0), 1);
    put(sfx, m, brass([E(12), E(24), E(31), E(36), E(40), E(43)], 2.2, 1.0), 1);
    put(sfx, m + 0.16, brass([E(17), E(29), E(33), E(36), E(41), E(45)], 1.0, 0.7), 1);
    put(sfx, m + 0.5, brass([E(19), E(31), E(35), E(38), E(43), E(47)], 3.0, 0.9), 1);
    put(sfx, m, cymbal(3.6, 0.6), 0.9);
    putStereo(sfx, m + 0.1, applause(demo.end - m - 0.1, 0.7, 120));
    [0, 4, 7, 12, 16, 19].forEach((o, i) => put(sfx, m + 0.3 + i * 0.1, bell(E(48 + o), 2.2, 0.22), 1, -0.5 + i * 0.2));
  }
  put(sfx, demo.end - 0.3, whoosh(0.3, true, 0.4), 1);
}

// montage: a hit on every cut, same groove underneath
{
  const t0 = montage.start, t1 = montage.end;
  put(music, t0, riser(t1 - t0, 0.15, 400, 9000), 0.8);
  let t = t0;
  montage.shots.forEach((sh, i) => { put(sfx, t, i === 0 ? impact(0.7) : hit(0.6 + i * 0.02), 1); t += sh.dur; });
}

// fine print: one hit per word, the groove keeps going underneath
{
  const t0 = trust.start;
  put(sfx, t0, whoosh(0.3, false, 0.5), 1);
  const notes = [0, 4, 7];
  trust.words.forEach((o, i) => {
    const t = cues.vo['10'] + o;
    put(sfx, t, i < 2 ? hit(0.55) : impact(0.72), 1);
    put(sfx, t, bell(E(40 + notes[i]), 2.2, 0.4), 1, -0.3 + i * 0.3);
    put(sfx, t, pluck(E(28 + notes[i]), 0.8, 0.4), 1);
  });
}

// end card: the room fills with light
{
  const t0 = end.start;
  put(sfx, t0, impact(0.6), 1);
  put(sfx, t0 - 0.05, whoosh(0.4, true, 0.4), 1);
  [16, 19, 23, 19, 16, 12, 16, 19].forEach((m, i) => put(music, t0 + 0.375 + i * 0.375, bell(E(48 + m), 2.4, 0.26), 1, -0.4 + i * 0.1));
  for (let i = 0; i < 15; i++) put(sfx, t0 + 2.6 + i * 0.1, click(0.14, 1.2 + (i % 5) * 0.08), 1, -0.8 + i * 0.11);
  put(sfx, end.end - 0.9, bell(E(64), 1.2, 0.12), 1);
}

// ---------- the voice: level every line the same, place it ----------
function readWav(buf) {
  let p = 12, fmt = null, data = null;
  while (p < buf.length - 8) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12) };
    if (id === 'data') { data = buf.subarray(p + 8, p + 8 + Math.min(size, buf.length - p - 8)); break; }
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('bad wav');
  const n = Math.floor(data.length / 2 / fmt.ch);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data.readInt16LE(i * fmt.ch * 2) / 32768;
  return { x: out, sr: fmt.sr };
}
const voActivity = new Float32Array(N);
const voWav = {};
for (const l of vo.lines) {
  const { x, sr } = readWav(await fs.readFile(path.join(root, 'assets/vo-marketing', `${l.id}.wav`)));
  if (sr !== SR) throw new Error(`${l.id}.wav must be ${SR} Hz`);
  let e = 0; for (const v of x) e += v * v;
  const g = Math.min(8, 0.115 / (Math.sqrt(e / x.length) || 1));
  const y = Float32Array.from(x, (v) => v * g);
  const fe = Math.round(0.008 * SR);
  for (let i = 0; i < fe; i++) { y[i] *= i / fe; y[y.length - 1 - i] *= i / fe; }
  put(voice, cues.vo[l.id], y, 1, 0);
  voWav[l.id] = x;
  const s0 = Math.round(cues.vo[l.id] * SR);
  for (let i = 0; i < y.length; i++) voActivity[s0 + i] = 1;
}

// continuity check: the music bed on its own, in quarter-second windows, must never fall silent
{
  const w = Math.round(0.25 * SR); let quietest = 0, quietAt = 0, gaps = 0;
  const levels = [];
  for (let a = 0; a + w <= N; a += w) {
    let e = 0; for (let j = a; j < a + w; j++) e += music.L[j] * music.L[j];
    const db = 10 * Math.log10(e / w + 1e-12); levels.push(db);
    if (db < -60) gaps++;
  }
  const sec = []; for (let k = 0; k < levels.length; k += 4) sec.push(Math.max(...levels.slice(k, k + 4)).toFixed(0));
  console.log('music bed level per second (dBFS):', sec.join(' '));
  console.log('quarter-second windows with no music:', gaps);
}
reverb(music, 0.16, 0.84, 0.4);
reverb(sfx, 0.12, 0.8, 0.45);
reverb(voice, 0.04, 0.7, 0.5);

// ---------- ducking: the music and effects step back under the voice ----------
const duck = new Float32Array(N);
{
  let g = 0; const atk = 1 - Math.exp(-1 / (0.04 * SR)), rel = 1 - Math.exp(-1 / (0.45 * SR));
  for (let i = 0; i < N; i++) { const target = voActivity[i]; g += (target - g) * (target > g ? atk : rel); duck[i] = 1 - 0.82 * g; }
}
const VOG = 1.5;
const sfxDuck = (i) => 1 - 0.72 * (1 - duck[i]) / 0.82;
const extra = new Float32Array(N).fill(1);
const outL = new Float32Array(N), outR = new Float32Array(N);
const assemble = () => {
  for (let i = 0; i < N; i++) {
    const e = extra[i];
    outL[i] = music.L[i] * 0.62 * duck[i] * e + sfx.L[i] * 0.75 * sfxDuck(i) * e + voice.L[i] * VOG;
    outR[i] = music.R[i] * 0.62 * duck[i] * e + sfx.R[i] * 0.75 * sfxDuck(i) * e + voice.R[i] * VOG;
  }
};
const ratioOf = (l) => {
  const a = Math.round(cues.vo[l.id] * SR), x = voWav[l.id];
  let ev = 0, eo = 0;
  for (let i = 0; i < x.length; i++) { const j = a + i; const v = voice.L[j] * VOG; const o = outL[j] - v; ev += v * v; eo += o * o; }
  return 10 * Math.log10((ev + 1e-12) / (eo + 1e-12));
};
assemble();
// per line: if the rest of the mix is too close to the voice, dip it a little more under that line
for (const l of vo.lines) {
  const r = ratioOf(l);
  if (r >= 12.5) continue;
  const gl = Math.pow(10, -(12.5 - r) / 20);
  const a = Math.round(cues.vo[l.id] * SR), n = voWav[l.id].length;
  const atk = 1 - Math.exp(-1 / (0.03 * SR)), rel = 1 - Math.exp(-1 / (0.4 * SR));
  let w = 0;
  for (let i = -Math.round(0.05 * SR); i < n + Math.round(1.6 * SR); i++) {
    const j = a + i; if (j < 0 || j >= N) continue;
    const target = i >= 0 && i < n ? 1 : 0;
    w += (target - w) * (target > w ? atk : rel);
    extra[j] = Math.min(extra[j], 1 - (1 - gl) * w);
  }
}
assemble();
for (const l of vo.lines) console.log(`vo ${l.id} at ${String(cues.vo[l.id].toFixed(2)).padStart(5)}  voice over rest: ${ratioOf(l).toFixed(1)} dB`);

// ---------- master: fade in/out, soft limit, loudness ----------
const fade = (t, dur, from, to) => { const a = Math.round(t * SR), n = Math.round(dur * SR); for (let i = 0; i < n && a + i < N; i++) { const g = from + ((to - from) * i) / n; outL[a + i] *= g; outR[a + i] *= g; } };
// gain rider: ease down the sections that run hot (montage hits, trust pulse) so loudness stays even from end to end
{
  let ms = 0; const k = 1 - Math.exp(-1 / (0.35 * SR));
  const T = -15.5, ratio = 0.55;
  let g = 1; const atk = 1 - Math.exp(-1 / (0.03 * SR)), rel = 1 - Math.exp(-1 / (0.5 * SR));
  for (let i = 0; i < N; i++) {
    const v = (outL[i] * outL[i] + outR[i] * outR[i]) / 2;
    ms += (v - ms) * k;
    const db = 10 * Math.log10(ms + 1e-12);
    const target = Math.pow(10, -(Math.max(0, db - T) * ratio) / 20);
    g += (target - g) * (target < g ? atk : rel);
    outL[i] *= g; outR[i] *= g;
  }
}
fade(0, 0.3, 0, 1);
fade(cues.duration - 1.2, 1.2, 1, 0);
let peak = 0;
for (let i = 0; i < N; i++) { outL[i] = Math.tanh(outL[i] * 0.9); outR[i] = Math.tanh(outR[i] * 0.9); peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i])); }
console.log('peak after limiter', peak.toFixed(3));
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outL[i] * 30000))), i * 4);
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outR[i] * 30000))), i * 4 + 2);
}
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
await fs.mkdir(path.join(root, 'out'), { recursive: true });
await fs.writeFile(path.join(root, 'out/marketing-audio-raw.wav'), Buffer.concat([head, pcm]));
const r = spawnSync(ffmpeg, ['-y', '-i', path.join(root, 'out/marketing-audio-raw.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=summary', '-ar', String(SR), '-c:a', 'pcm_s16le', path.join(root, 'out/marketing-audio-mix.wav')], { encoding: 'utf8' });
if (r.status) { console.log(r.stderr.slice(-800)); process.exit(1); }
const m = /Input Integrated:\s+(-?[\d.]+)/.exec(r.stderr);
console.log('marketing audio mixed: out/marketing-audio-mix.wav', m ? `(raw ${m[1]} LUFS, normalised to -14)` : '');
