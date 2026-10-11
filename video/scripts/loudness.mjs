// Prints momentary loudness (LUFS) in 2-second windows for out/audio-mix.wav (or a given file), to sanity-check balance.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const file = process.argv[2] ?? path.resolve(import.meta.dirname, '../out/audio-mix.wav');
const r = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', file, '-af', 'ebur128=framelog=verbose', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
const rows = [];
for (const m of r.stderr.matchAll(/t:\s*([\d.]+)\s+TARGET:\S+ LUFS\s+M:\s*(-?[\d.]+)/g)) rows.push([Number(m[1]), Number(m[2])]);
const win = {};
for (const [t, v] of rows) { const k = Math.floor(t / 2); win[k] = Math.max(win[k] ?? -999, v); }
console.log(Object.keys(win).map((k) => `${String(k * 2).padStart(2)}-${String(k * 2 + 2).padStart(2)}s ${win[k] < -90 ? ' -inf' : win[k].toFixed(1).padStart(5)}`).join('\n'));
