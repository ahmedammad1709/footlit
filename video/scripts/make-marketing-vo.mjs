// Voiceover for the marketing films: synthesise with Kokoro (local, open licence), then trim and convert each line to mono 48 kHz.
//   node scripts/make-marketing-vo.mjs            synthesise + process every line
//   node scripts/make-marketing-vo.mjs --process  only re-process (use after dropping your own wavs into assets/vo-marketing/raw/<id>.24k.wav)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const script = JSON.parse(await fs.readFile(path.join(root, 'src/marketing-vo.json'), 'utf8'));
const raw = path.join(root, 'assets/vo-marketing/raw');
const out = path.join(root, 'assets/vo-marketing');
await fs.mkdir(raw, { recursive: true });

if (!process.argv.includes('--process')) {
  const py = path.join(root, '.cache/tts-venv/Scripts/python.exe');
  const r = spawnSync(py, [path.join(root, 'scripts/tts_kokoro.py'), path.join(root, 'src/marketing-vo.json'), raw], { stdio: 'inherit' });
  if (r.status) throw new Error('voice synthesis failed');
}

const durations = {};
for (const l of script.lines) {
  const input = path.join(raw, `${l.id}.24k.wav`);
  const wav = path.join(out, `${l.id}.wav`);
  // gentle clean-up: rumble filter, trim leading/trailing silence, 48 kHz mono
  const trim = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04';
  const r = spawnSync(ffmpeg, ['-y', '-v', 'error', '-i', input, '-af', `highpass=f=70,${trim},areverse,${trim},areverse`, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', wav], { encoding: 'utf8' });
  if (r.status) throw new Error(`ffmpeg failed on ${l.id}: ${r.stderr}`);
  const probe = spawnSync(ffmpeg, ['-i', wav, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...probe.stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  durations[l.id] = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}
await fs.mkdir(path.join(root, 'out'), { recursive: true });
await fs.writeFile(path.join(root, 'out/marketing-vo-durations.json'), JSON.stringify(durations, null, 2));
console.log('voice:', script.voice);
for (const l of script.lines) console.log(l.id, durations[l.id].toFixed(2) + 's', l.text);
