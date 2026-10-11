// Sound for the 12 s teaser: no voice, so it works with or without sound on. Original synthesis, locked to src/teaser-cues.json.
//   node scripts/make-teaser-audio.mjs   ->   out/teaser-audio-mix.wav
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { SR, makeBus, put, mtof, len, svf, noise, osc, expo, asr, kick, clap, hat, impact, hit, riser, siren, bass, pad, bell, pluck, whoosh, click } from './synth.mjs';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const cues = JSON.parse(await fs.readFile(path.join(root, 'src/teaser-cues.json'), 'utf8'));
const N = Math.round(SR * cues.duration);
const music = makeBus(N), sfx = makeBus(N);
const E1 = 28;
const { hook, montage, logo } = cues;

// ---- hook: a quiet room, one click ----
{
  const n = len(hook.end);
  const x = osc('sine', 49, n).map((v, i) => v * 0.05 + 0);
  asr(x, 0.4, 0.1);
  put(music, 0, x, 1);
  put(music, 0.05, pad([mtof(E1 + 12), mtof(E1 + 19)], hook.end - 0.05, 1.2, 0.3, 420, 0.5), 0.9);
  put(sfx, hook.click, click(0.9, 0.8), 1, 0.2);
  put(sfx, hook.click + 0.075, click(0.5, 0.65), 1, 0.2);
}

// ---- montage: 160 BPM eighths, every cut on the grid ----
{
  const u = montage.unit, t0 = montage.start, t1 = montage.end;
  const steps = Math.round((t1 - t0) / u);
  const bar = 8;
  const roots = [0, 0, 1, 3, 5];
  const pat = [1, 0.5, 0.75, 0.5, 0.95, 0.5, 0.75, 0.6];
  for (let s = 0; s < steps; s++) {
    const t = t0 + s * u, barIdx = Math.floor(s / bar), pos = s % bar, prog = s / steps;
    const root = E1 + roots[Math.min(barIdx, roots.length - 1)];
    put(music, t, bass(mtof(root), u * 1.6, expo(240, 800, prog), expo(1000, 5200, prog), 0.8 * pat[pos]), 0.8);
    if (pos % 2 === 0) put(music, t, kick(0.85), 0.9);
    if (barIdx >= 1 && pos % 4 === 2) put(music, t, clap(0.55 + 0.05 * barIdx), 0.9, 0.1);
    put(music, t + u / 2, hat(0.22 + 0.02 * barIdx), 0.8, -0.2);
    if (barIdx >= 3) put(music, t + u / 4, hat(0.16), 0.8, 0.2);
  }
  put(music, t0, riser(t1 - t0, 0.55, 400, 11000), 0.8);
  put(music, t0, siren(t1 - t0, 180, 2400, 0.18), 0.7);
  let t = t0;
  montage.shots.forEach((sh, i) => {
    put(sfx, t, i < 3 ? impact(0.6 + i * 0.1) : hit(0.75 + i * 0.02), 1);
    t += sh.dur;
  });
  put(sfx, t0, impact(0.9), 1);
}

// ---- 8.75 to 9.35: nothing. then the lights come up ----
{
  const t = logo.start;
  put(sfx, t - 0.02, impact(0.8), 1);
  put(sfx, t, whoosh(0.4, true, 0.45), 1);
  const chord = [mtof(E1 + 12), mtof(E1 + 19), mtof(E1 + 24), mtof(E1 + 28), mtof(E1 + 31), mtof(E1 + 38)];
  put(music, t, pad(chord, logo.end - t, 0.5, 0.5, 2600, 1.0), 1);
  put(music, t, pad([mtof(E1), mtof(E1 + 7)], logo.end - t, 0.3, 0.5, 520, 0.8), 1);
  [0.05, 0.15, 0.25, 0.35].forEach((o, i) => put(sfx, t + o, kick(0.3 + i * 0.1), 0.9));
  for (let i = 0; i < 9; i++) put(sfx, t + 0.2 + i * 0.05, click(0.34, 1.0 + i * 0.1), 1, -0.7 + (i / 8) * 1.4);
  for (let i = 0; i < 7; i++) put(sfx, t + 0.3 + i * 0.06, pluck(mtof(E1 + 36 + [0, 4, 7, 11, 12, 16, 19][i]), 0.8, 0.22), 1, -0.5 + i * 0.16);
  [[0.95, 0], [1.1, 4], [1.25, 7], [1.4, 11]].forEach(([o, st]) => put(music, t + o, bell(mtof(E1 + 48 + st), 1.8, 0.24), 1, 0.2));
  // the real popup slides up
  put(sfx, t + logo.popupAt - 0.05, whoosh(0.55, true, 0.4), 1);
  put(sfx, t + logo.popupAt + 0.45, click(0.4, 1.1), 1, 0.2);
  // the stamp lands
  put(sfx, t + logo.stampAt, impact(1.0), 1);
  put(sfx, t + logo.stampAt, bell(mtof(E1 + 55), 1.8, 0.3), 1);
  put(sfx, t + logo.stampAt, osc('sine', 41, len(1.3)).map((v, i) => v * Math.exp(-i / SR / 0.7) * 0.9), 1);
}

// ---- master ----
const mix = makeBus(N);
for (let i = 0; i < N; i++) {
  mix.L[i] = music.L[i] * 0.7 + sfx.L[i] * 0.8;
  mix.R[i] = music.R[i] * 0.7 + sfx.R[i] * 0.8;
}
const zero = (t0, t1) => { for (let i = Math.round(t0 * SR); i < Math.round(t1 * SR); i++) { mix.L[i] = 0; mix.R[i] = 0; } };
const ramp = (t, dur, from, to) => { const a = Math.round(t * SR), n = Math.round(dur * SR); for (let i = 0; i < n && a + i < N; i++) { const g = from + ((to - from) * i) / n; mix.L[a + i] *= g; mix.R[a + i] *= g; } };
ramp(montage.end - 0.012, 0.012, 1, 0);
zero(montage.end, logo.start - 0.02);
ramp(0, 0.3, 0, 1);
ramp(cues.duration - 0.6, 0.6, 1, 0);
for (let i = 0; i < N; i++) { mix.L[i] = Math.tanh(mix.L[i] * 0.9); mix.R[i] = Math.tanh(mix.R[i] * 0.9); }

const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mix.L[i] * 30000))), i * 4);
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mix.R[i] * 30000))), i * 4 + 2);
}
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
await fs.mkdir(path.join(root, 'out'), { recursive: true });
await fs.writeFile(path.join(root, 'out/teaser-audio-raw.wav'), Buffer.concat([head, pcm]));
const r = spawnSync(ffmpeg, ['-y', '-i', path.join(root, 'out/teaser-audio-raw.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=summary', '-ar', String(SR), '-c:a', 'pcm_s16le', path.join(root, 'out/teaser-audio-mix.wav')], { encoding: 'utf8' });
if (r.status) { console.log(r.stderr.slice(-800)); process.exit(1); }
const m = /Input Integrated:\s+(-?[\d.]+)/.exec(r.stderr);
console.log('teaser audio mixed: out/teaser-audio-mix.wav', m ? `(raw ${m[1]} LUFS, normalised to -14)` : '');
