// Writes the .srt for upload (LinkedIn can take a captions file), timed exactly like the burned-in subtitles.
//   node scripts/make-marketing-subs.mjs  ->  out/footlit-marketing-linkedin.en.srt
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSubs, toSrt } from '../src/marketing-subs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const cues = JSON.parse(await fs.readFile(path.join(root, 'src/marketing-cues.json'), 'utf8'));
const durations = JSON.parse(await fs.readFile(path.join(root, 'out/marketing-vo-durations.json'), 'utf8'));
const out = path.join(root, 'out/footlit-marketing-linkedin.en.srt');
await fs.writeFile(out, toSrt(buildSubs(cues, durations)));
console.log('wrote', out);
