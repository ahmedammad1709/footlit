// Remove the spoken "Edge" at the surrounding pauses in the existing closing take.
// Keep the original voice and delivery; the mixer reads the updated 10.wav.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const original = path.join(root, 'assets/vo/10-original.wav');
const current = path.join(root, 'assets/vo/10.wav');
try { await fs.access(original); } catch { await fs.copyFile(current, original); }
const result = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error', '-i', original,
  '-filter_complex', '[0:a]asplit=2[first][last];[first]atrim=end=2.87,asetpts=PTS-STARTPTS[a];[last]atrim=start=3.43,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=0.012:c1=tri:c2=tri[out]',
  '-map', '[out]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', current,
], { encoding: 'utf8', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr);
const durationsPath = path.join(root, 'out/vo-durations.json');
const durations = JSON.parse(await fs.readFile(durationsPath, 'utf8'));
durations['10'] = 3.97587;
await fs.writeFile(durationsPath, JSON.stringify(durations, null, 2));
console.log('Closing voice edited to Chrome and Firefox; original take preserved.');
