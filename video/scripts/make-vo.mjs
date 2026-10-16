// Generates the scratch voiceover with a free neural voice, then measures every line so the cues can be tuned.
//   npm run vo
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'py' : 'python3');
const pythonCheck = spawnSync(python, ['--version'], { encoding: 'utf8', windowsHide: true });
if (pythonCheck.error || pythonCheck.status !== 0) throw new Error('Python is unavailable. Install Python with edge-tts, or set PYTHON to its executable path.');
const vo = JSON.parse(await fs.readFile(path.join(root, 'src/vo.json'), 'utf8'));
const dir = path.join(root, 'assets/vo');
await fs.mkdir(dir, { recursive: true });
await fs.mkdir(path.join(root, 'out'), { recursive: true });

const selected = process.argv.find((arg) => arg.startsWith('--line='))?.slice(7);
if (selected && !vo.lines.some((line) => line.id === selected)) throw new Error('Unknown voiceover line: ' + selected);
const durations = selected ? JSON.parse(await fs.readFile(path.join(root, 'out/vo-durations.json'), 'utf8').catch(() => '{}')) : {};
for (const l of vo.lines.filter((line) => !selected || line.id === selected)) {
  const file = path.join(dir, `${l.id}.mp3`);
  // the free service fails now and then (HTTP 403 on the handshake), so retry
  let ok = false;
  for (let attempt = 1; attempt <= 8 && !ok; attempt++) {
    try {
      execFileSync(python, ['-m', 'edge_tts', '--voice', vo.voice, `--rate=${l.rate ?? vo.rate}`, `--pitch=${l.pitch ?? vo.pitch}`, '--text', l.text, '--write-media', file], { stdio: 'pipe', windowsHide: true });
      ok = (await fs.stat(file)).size > 1000;
    } catch {
      ok = false;
    }
    if (!ok) await new Promise((r) => setTimeout(r, 1200 * attempt));
  }
  if (!ok) throw new Error('voice service kept failing for line ' + l.id);
  // trim the silence the service puts at both ends, and normalise to mono 48 kHz WAV for the mixer
  const wav = path.join(dir, `${l.id}.wav`);
  spawnSync(ffmpeg, ['-y', '-i', file, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse', '-ar', '48000', '-ac', '1', wav], { encoding: 'utf8' });
  // measure with ffmpeg (prints the decoded length on stderr)
  const r = spawnSync(ffmpeg, ['-i', wav, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  const secs = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN;
  durations[l.id] = secs;
}
await fs.writeFile(path.join(root, 'out/vo-durations.json'), JSON.stringify(durations, null, 2));
console.log('voice:', vo.voice, vo.rate, vo.pitch);
console.log('id   at     len    ends    text');
vo.lines.forEach((l, i) => {
  if (selected && l.id !== selected) return;
  const end = l.at + durations[l.id];
  const next = vo.lines[i + 1];
  const clash = next && end > next.at - 0.1 ? '   <-- overlaps next line' : '';
  console.log(`${l.id}  ${l.at.toFixed(2).padStart(5)}  ${durations[l.id].toFixed(2)}  ${end.toFixed(2).padStart(6)}  ${l.text}${clash}`);
});
