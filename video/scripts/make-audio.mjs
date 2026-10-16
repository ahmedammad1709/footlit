// Builds the film's sound: an original synthesised score and effects, plus the voiceover, mixed to out/audio-mix.wav.
// Everything is generated here (no samples, no licensed music), locked to src/cues.json, so it always matches the picture.
//   npm run audio
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const cues = JSON.parse(await fs.readFile(path.join(root, 'src/cues.json'), 'utf8'));
const vo = JSON.parse(await fs.readFile(path.join(root, 'src/vo.json'), 'utf8'));

const DUR = cues.duration;
const N = Math.round(SR * DUR);

import { SR, makeBus, rnd, noise, put, mtof, len, svf, expo, sat, env, asr, osc, sum, scale, kick, clap, hat, impact, hit, riser, siren, bass, pluckBass, pad, bell, pluck, brass, timpani, cymbal, whoosh, click, key, applause, putStereo, reverb } from './synth.mjs';
const bus = () => makeBus(N);
const music = bus(), sfx = bus(), voice = bus();

// =====================================================================
// THE SCORE (key of E; tension is E minor, the footlights bring E major)
// =====================================================================
const E1 = 28; // MIDI
const { hook, montage, logo, demo, trust, end } = cues;

// ---- hook: a room, a click, almost nothing ----
{
  const n = len(3.6);
  const hum = svf(noise(n), 160, 0.7); const sub = osc('sine', 49, n);
  const x = sum(scale(hum, 0.06), scale(sub, 0.05)); asr(x, 0.6, 0.2); put(music, 0, x, 1);
  // a single low, unsure note under the VO
  const note = pad([mtof(E1 + 12), mtof(E1 + 19)], 3.4, 1.2, 0.5, 420, 0.5); put(music, 0.1, note, 0.9);
  const sw = osc('sine', (i) => expo(70, 200, i / n), n); asr(sw, 1.4, 0.1); put(music, 0, sw, 0.04);
  // the click, down and up
  put(sfx, hook.click, click(0.9, 0.8), 1, 0.2); put(sfx, hook.click + 0.075, click(0.5, 0.65), 1, 0.2);
}

// ---- montage: 160 BPM eighths, cuts sit on the grid ----
{
  const u = montage.unit; // an eighth note at 160 BPM
  const t0 = montage.start, t1 = montage.end;
  const steps = Math.round((t1 - t0) / u);
  const bar = 8; // eighths per bar
  const roots = [0, 0, 1, 0, 3, 2, 1, 5]; // semitones over E, creeping up for tension
  const pat = [1, 0.45, 0.7, 0.45, 0.95, 0.45, 0.7, 0.55];
  for (let s = 0; s < steps; s++) {
    const t = t0 + s * u, barIdx = Math.floor(s / bar), pos = s % bar;
    const root = E1 + (roots[Math.min(barIdx, roots.length - 1)] ?? 0) + (pos === 6 && barIdx % 2 ? 12 : 0);
    const prog = s / steps;
    put(music, t, bass(mtof(root), u * 1.6, expo(220, 700, prog), expo(900, 5200, prog), 0.78 * pat[pos]), 0.8);
    // kick: half-time first, then four on the floor
    if (barIdx < 2 ? pos % 4 === 0 : pos % 2 === 0) put(music, t, kick(0.85), 0.9);
    // clap on 2 and 4 from bar 3
    if (barIdx >= 3 && pos % 4 === 2) put(music, t, clap(0.5 + 0.05 * barIdx), 0.9, 0.1);
    // hats: eighths, then sixteenths in the last bars
    if (barIdx >= 2) put(music, t + u / 2, hat(0.22 + 0.02 * barIdx), 0.8, -0.2);
    if (barIdx >= 5) put(music, t, hat(0.16, false), 0.8, 0.2);
    if (barIdx >= 6 && s >= steps - 12) put(music, t + u / 4, hat(0.18), 0.8, 0.1);
  }
  // rising sirens and noise over the whole montage
  put(music, t0, riser(t1 - t0, 0.5, 400, 11000), 0.8);
  put(music, t0, siren(t1 - t0, 180, 2200, 0.16), 0.7);
  // the cuts: heavier and heavier
  let t = t0;
  montage.shots.forEach((sh, i) => {
    put(sfx, t, i < 4 ? impact(0.55 + i * 0.08) : hit(0.7 + i * 0.015), 1);
    if (i === 0) put(sfx, t, impact(0.9), 1);
    t += sh.dur;
  });
}

// ---- 17.0 to 17.75: nothing. then the lights come up ----
{
  const t = logo.start;
  put(sfx, t - 0.02, impact(0.8), 1);
  put(sfx, t, whoosh(0.5, true, 0.5), 1);
  const chord = [mtof(E1 + 12), mtof(E1 + 19), mtof(E1 + 24), mtof(E1 + 28), mtof(E1 + 31), mtof(E1 + 38)];
  put(music, t, pad(chord, 4.9, 0.9, 1.4, 2400, 1.0), 1);
  put(music, t, pad([mtof(E1), mtof(E1 + 7)], 4.9, 0.4, 1.4, 500, 0.8), 1);
  // the four bands of light, a footlight at a time
  [0.1, 0.26, 0.42, 0.58].forEach((o, i) => put(sfx, t + o, kick(0.3 + i * 0.1), 0.9));
  for (let i = 0; i < 15; i++) put(sfx, t + 0.35 + i * 0.045, click(0.34, 1.0 + i * 0.07), 1, -0.7 + (i / 14) * 1.4);
  // wordmark letters
  for (let i = 0; i < 7; i++) put(sfx, t + 0.55 + i * 0.07, pluck(mtof(E1 + 36 + [0, 4, 7, 11, 12, 16, 19][i]), 0.9, 0.22), 1, -0.5 + i * 0.16);
  // the tagline
  [[1.75, 0], [1.95, 4], [2.15, 7], [2.35, 11]].forEach(([o, st]) => put(music, t + o, bell(mtof(E1 + 48 + st), 2.2, 0.22), 1, 0.2));
}

// ---- the demo: 120 BPM, light and forward ----
{
  const b = 0.5, t0 = demo.start;
  const steps = Math.round((demo.end - t0) / b);
  const failA = demo.shows[1].t, failB = demo.steps[3].t;
  const roots = [0, 0, 5, 7]; // E E A B
  for (let s = 0; s < steps; s++) {
    const t = t0 + s * b;
    if (t > failA - 0.01 && t < failB - 0.01) continue; // the show stops
    const bar = Math.floor(s / 4), pos = s % 4;
    const root = E1 + 12 + roots[bar % 4];
    const calm = t < demo.browserIn - 0.1;
    put(music, t, kick(calm ? 0.45 : 0.62), 0.9);
    if (pos % 2 === 1) put(music, t, clap(0.28), 0.9, 0.1);
    put(music, t + b / 2, hat(0.2), 0.8, -0.2);
    put(music, t, pluckBass(mtof(root), 0.34, 0.5), 0.8);
    if (pos % 2 === 1) put(music, t + b / 2, pluckBass(mtof(root + 12), 0.2, 0.32), 0.8);
    // a bell arpeggio over the top
    const arp = [0, 7, 12, 16, 19, 16, 12, 7][s % 8];
    if (!calm || s % 2 === 0) put(music, t + b / 4, bell(mtof(E1 + 36 + arp + (roots[bar % 4] > 4 ? 0 : 0)), 1.1, 0.1), 1, 0.3 - (s % 5) * 0.12);
  }
  // pads that carry the harmony
  const pads = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]];
  for (let k = 0; t0 + k < demo.end - 1; k += 2) {
    const t = t0 + k * 1.0, root = [0, 5, 7, 4][(k / 2) % 4];
    if (t > failA - 0.1 && t < failB - 0.1) continue;
    put(music, t, pad(pads[(k / 2) % 4].map((x) => mtof(E1 + 24 + root * 0 + x + (root === 4 ? 0 : 0))), 2.05, 0.4, 0.9, 1400, 0.55), 1);
  }
  // UI sounds
  demo.themeClicks.forEach((t, i) => put(sfx, t, click(0.7, 0.9 + i * 0.12), 1, 0.2));
  put(sfx, demo.browserIn, whoosh(0.5, true, 0.45), 1);
  const per = (demo.typeEnd - demo.typeStart) / 11;
  for (let i = 0; i < 11; i++) put(sfx, demo.typeStart + i * per, key(0.9), 1, -0.1);
  put(sfx, demo.shows[0].t - 0.02, click(0.8, 0.85), 1, 0.3);
  put(sfx, demo.mergeClick, click(0.8, 0.85), 1, 0.1);

  // step 2 to 3: a build into the opening-night show
  put(music, demo.shows[0].t - 1.1, riser(1.1, 0.5, 500, 8000), 0.8);
  {
    const t = demo.shows[0].t;
    put(sfx, t, impact(0.9), 1);
    put(sfx, t, brass([mtof(E1 + 24), mtof(E1 + 31), mtof(E1 + 36), mtof(E1 + 40), mtof(E1 + 43)], 1.7, 1.0), 1);
    put(sfx, t + 0.14, brass([mtof(E1 + 28), mtof(E1 + 35), mtof(E1 + 40), mtof(E1 + 44), mtof(E1 + 47)], 1.4, 0.7), 1);
    put(sfx, t, cymbal(2.5, 0.5), 0.9);
    putStereo(sfx, t + 0.15, applause(3.4, 0.5, 80));
    [0, 2, 4].forEach((o, i) => put(sfx, t + 0.4 + i * 0.12, bell(mtof(E1 + 52 + o * 2), 2, 0.2), 1, -0.4 + i * 0.4));
  }

  // step 3: tension, then the build fails
  {
    const t = demo.steps[2].t;
    for (let i = 0; i < 9; i++) put(sfx, t + 0.3 + i * 0.22, click(0.18, 0.55), 1, 0.4); // the spinner, a slow clock
    put(music, t + 0.1, siren(failA - t - 0.1, 90, 520, 0.28), 0.8);
    put(music, t, pad([mtof(E1 + 12), mtof(E1 + 13), mtof(E1 + 19)], failA - t, 0.8, 0.05, 700, 0.5), 1);
    const f = failA;
    // power-down: the room loses its voltage
    const n = len(1.4);
    const down = svf(osc('saw', (i) => expo(520, 38, Math.min(1, i / n)), n), (i) => expo(2200, 90, i / n), 1.1); asr(down, 0.002, 0.6);
    put(sfx, f, down, 0.7);
    put(sfx, f, impact(1.0), 1);
    // alarm: two flat buzzes
    for (const [o, fr] of [[0.05, 196], [0.42, 165]]) {
      const bz = svf(osc('square', fr, len(0.3)), 1800, 0.9); asr(bz, 0.005, 0.12);
      put(sfx, f + o, bz, 0.55, 0); put(sfx, f + o, scale(osc('sine', fr / 2, len(0.3)), 1), 0.4, 0);
    }
    put(sfx, f + 0.3, brass([mtof(E1 + 24), mtof(E1 + 27), mtof(E1 + 30)], 1.3, 0.55), 1); // a sour chord
    put(music, f + 0.2, pad([mtof(E1), mtof(E1 + 1)], 3.9, 0.9, 1.1, 260, 0.9), 1);
  }

  // step 4: the music finds its feet again, then the big one
  {
    const t = failB;
    put(sfx, t + 0.05, whoosh(0.7, true, 0.4), 1);
    put(sfx, t + 0.38, click(0.5, 0.8), 1);
    put(sfx, demo.checksPass, bell(mtof(E1 + 44), 1.4, 0.3), 1, 0.2);
    put(sfx, demo.checksPass + 0.12, bell(mtof(E1 + 51), 1.8, 0.3), 1, 0.3);
    put(music, demo.mergeClick - 1.2, riser(1.2, 0.5, 400, 9000), 0.8);
    const m = demo.shows[2].t;
    put(sfx, m, impact(1.0), 1);
    put(sfx, m, timpani(mtof(E1 + 12), 1.0), 1);
    put(sfx, m, brass([mtof(E1 + 12), mtof(E1 + 24), mtof(E1 + 31), mtof(E1 + 36), mtof(E1 + 40), mtof(E1 + 43)], 2.2, 1.0), 1);
    put(sfx, m + 0.16, brass([mtof(E1 + 17), mtof(E1 + 29), mtof(E1 + 33), mtof(E1 + 36), mtof(E1 + 41), mtof(E1 + 45)], 1.0, 0.7), 1);
    put(sfx, m + 0.5, brass([mtof(E1 + 19), mtof(E1 + 31), mtof(E1 + 35), mtof(E1 + 38), mtof(E1 + 43), mtof(E1 + 47)], 3.4, 0.9), 1);
    put(sfx, m, cymbal(3.8, 0.6), 0.9);
    putStereo(sfx, m + 0.1, applause(demo.end - m - 0.1, 0.75, 120));
    [0, 4, 7, 12, 16, 19].forEach((o, i) => put(sfx, m + 0.3 + i * 0.1, bell(mtof(E1 + 48 + o), 2.2, 0.22), 1, -0.5 + i * 0.2));
  }
  put(sfx, demo.end - 0.28, whoosh(0.3, true, 0.4), 1);
}

// ---- trust: stripped back, three numbers ----
{
  const t0 = trust.start;
  put(sfx, t0, whoosh(0.3, false, 0.5), 1);
  put(music, t0, pad([mtof(E1 + 12), mtof(E1 + 19)], trust.end - t0, 0.3, 0.8, 600, 0.6), 1);
  const notes = [0, 4, 7];
  trust.nums.forEach((t, i) => {
    put(sfx, t, i < 2 ? hit(0.75) : impact(0.95), 1);
    put(sfx, t, bell(mtof(E1 + 40 + notes[i]), 2.4, 0.4), 1, -0.3 + i * 0.3);
    put(sfx, t, pluck(mtof(E1 + 28 + notes[i]), 0.8, 0.4), 1);
  });
  // a pulse under the numbers, so the act keeps moving: kick on the beat, a plucked bass, eighth-note hats
  for (let t = t0 + 0.2, k = 0; t < trust.end - 0.3; t += 0.5, k++) {
    put(music, t, kick(0.5), 0.9);
    put(music, t, pluckBass(mtof(E1 + 12 + [0, 0, 5, 7][k % 4]), 0.34, 0.45), 0.8);
    put(music, t + 0.25, hat(0.16), 0.7, k % 2 ? 0.3 : -0.3);
  }
  // the zero: a held breath
  put(sfx, trust.nums[2] + 0.02, osc('sine', 41, len(1.6)).map((v, i, a) => v * Math.exp(-i / SR / 0.9) * 0.9), 1);
}

// ---- end card: the room fills with light ----
{
  const t0 = end.start;
  put(sfx, t0, impact(0.6), 1);
  put(sfx, t0 - 0.05, whoosh(0.4, true, 0.4), 1);
  const chord = [mtof(E1 + 12), mtof(E1 + 19), mtof(E1 + 28), mtof(E1 + 31), mtof(E1 + 35), mtof(E1 + 38), mtof(E1 + 40)];
  put(music, t0, pad(chord, end.end - t0, 0.5, 2.2, 2600, 1.0), 1);
  put(music, t0, pad([mtof(E1), mtof(E1 + 7)], end.end - t0, 0.3, 2.0, 520, 0.8), 1);
  const mel = [16, 19, 23, 19, 16, 12, 16, 19];
  mel.forEach((m, i) => put(music, t0 + 0.4 + i * 0.5, bell(mtof(E1 + 48 + m), 2.4, 0.26), 1, -0.4 + i * 0.1));
  for (let i = 0; i < 15; i++) put(sfx, t0 + 2.6 + i * 0.1, click(0.14, 1.2 + (i % 5) * 0.08), 1, -0.8 + i * 0.11);
  put(sfx, end.end - 0.9, bell(mtof(E1 + 64), 1.2, 0.12), 1);
}

// =====================================================================
// VOICE: load, level, place
// =====================================================================
function readWav(buf) {
  let p = 12, fmt = null, data = null;
  while (p < buf.length - 8) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    if (id === 'data') { data = buf.subarray(p + 8, p + 8 + Math.min(size, buf.length - p - 8)); break; }
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('bad wav');
  const n = Math.floor(data.length / (fmt.bits / 8) / fmt.ch);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data.readInt16LE(i * fmt.ch * 2) / 32768;
  return { x: out, sr: fmt.sr };
}
const voActivity = new Float32Array(N);
for (const line of vo.lines) {
  const file = path.join(root, 'assets/vo', `${line.id}.wav`);
  const { x, sr } = readWav(await fs.readFile(file));
  if (sr !== SR) throw new Error(`${line.id}.wav must be ${SR} Hz`);
  // level each line to the same loudness
  let e = 0; for (const v of x) e += v * v; const rms = Math.sqrt(e / x.length) || 1;
  const g = Math.min(8, 0.115 / rms);
  const y = Float32Array.from(x, (v) => v * g);
  // gentle fade at the edges so lines never click
  const fe = Math.round(0.008 * SR); for (let i = 0; i < fe; i++) { y[i] *= i / fe; y[y.length - 1 - i] *= i / fe; }
  put(voice, line.at, y, 1, 0);
  put(sfx, line.at, y, 0.0, 0);
  const s0 = Math.round(line.at * SR);
  for (let i = 0; i < y.length; i++) voActivity[s0 + i] = 1;
}

// ---------- reverbs: a hall on the music/sfx, a hint on the voice ----------
reverb(music, 0.16, 0.84, 0.4);
reverb(sfx, 0.12, 0.8, 0.45);
reverb(voice, 0.05, 0.7, 0.5);

// ---------- ducking: the music steps back under the voice ----------
const duck = new Float32Array(N);
{
  let g = 0; const atk = 1 - Math.exp(-1 / (0.04 * SR)), rel = 1 - Math.exp(-1 / (0.45 * SR));
  for (let i = 0; i < N; i++) { const target = voActivity[i]; g += (target - g) * (target > g ? atk : rel); duck[i] = 1 - 0.82 * g; }
}

// ---------- master ----------
const VOG = 1.5;
const outL = new Float32Array(N), outR = new Float32Array(N);
const sfxDuck = (i) => 1 - 0.72 * (1 - duck[i]) / 0.82;
const extra = new Float32Array(N).fill(1); // per-line extra dip so the voice always sits at least 9 dB above the rest
const assemble = () => {
  for (let i = 0; i < N; i++) {
    const e = extra[i];
    outL[i] = music.L[i] * 0.62 * duck[i] * e + sfx.L[i] * 0.75 * sfxDuck(i) * e + voice.L[i] * VOG;
    outR[i] = music.R[i] * 0.62 * duck[i] * e + sfx.R[i] * 0.75 * sfxDuck(i) * e + voice.R[i] * VOG;
  }
};
const voWav = {};
for (const line of vo.lines) voWav[line.id] = readWav(await fs.readFile(path.join(root, 'assets/vo', line.id + '.wav'))).x;
const ratioOf = (line) => {
  const a = Math.round(line.at * SR), x = voWav[line.id];
  let ev = 0, eo = 0;
  for (let i = 0; i < x.length; i++) { const j = a + i; const v = voice.L[j] * VOG; const o = outL[j] - v; ev += v * v; eo += o * o; }
  return 10 * Math.log10((ev + 1e-12) / (eo + 1e-12));
};
assemble();
const WANT = 11;
for (const line of vo.lines) {
  const r = ratioOf(line);
  if (r >= WANT) continue;
  const gl = Math.pow(10, -(WANT - r) / 20);
  const a = Math.round(line.at * SR), n = voWav[line.id].length;
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
for (const line of vo.lines) console.log(`vo ${line.id.padEnd(3)} at ${line.at.toFixed(2).padStart(5)}  voice over rest: ${ratioOf(line).toFixed(1)} dB`);
// the cut to silence at 17.0 and the fade at the very end
const fadeAt = (t, dur, from, to) => { const a = Math.round(t * SR), n = Math.round(dur * SR); for (let i = 0; i < n && a + i < N; i++) { const u = i / n, g = from + (to - from) * u; outL[a + i] *= g; outR[a + i] *= g; } };
{
  const cut = montage.end, resume = logo.start - 0.02;
  const a = Math.round(cut * SR), b = Math.round(resume * SR);
  for (let i = a; i < b; i++) { outL[i] = 0; outR[i] = 0; }
  fadeAt(cut - 0.012, 0.012, 1, 0);
  fadeAt(0, 0.4, 0, 1);
  fadeAt(DUR - 1.2, 1.2, 1, 0);
}
// soft limit
let peak = 0;
for (let i = 0; i < N; i++) { outL[i] = Math.tanh(outL[i] * 0.9); outR[i] = Math.tanh(outR[i] * 0.9); peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i])); }
console.log('peak after limiter', peak.toFixed(3));

// ---------- write wav, then normalise loudness ----------
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) { pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outL[i] * 30000))), i * 4); pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outR[i] * 30000))), i * 4 + 2); }
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
await fs.mkdir(path.join(root, 'out'), { recursive: true });
await fs.writeFile(path.join(root, 'out/audio-raw.wav'), Buffer.concat([head, pcm]));
const r = spawnSync(ffmpeg, ['-y', '-i', path.join(root, 'out/audio-raw.wav'), '-af', 'loudnorm=I=-15:TP=-1.5:LRA=9:print_format=summary', '-ar', String(SR), '-c:a', 'pcm_s16le', path.join(root, 'out/audio-mix.wav')], { encoding: 'utf8' });
if (r.status) { console.log(r.stderr.slice(-800)); process.exit(1); }
const m = /Input Integrated:\s+(-?[\d.]+)/.exec(r.stderr);
console.log('audio mixed:', path.join('out', 'audio-mix.wav'), m ? `(raw ${m[1]} LUFS, normalised to -15)` : '');
