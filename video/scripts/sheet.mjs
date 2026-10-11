// Makes a contact sheet from preview stills:  node scripts/sheet.mjs out/sheet.png cols file1 file2 ...
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const [out, colsArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg), rows = Math.ceil(files.length / cols), W = Number(process.env.SW ?? 640), H = Number(process.env.SH ?? 360);
const inputs = files.flatMap((f) => ['-i', f]);
const scaled = files.map((_, i) => `[${i}:v]scale=${W}:${H}[s${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
const fc = `${scaled};${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}[v]`;
const r = spawnSync(ffmpeg, ['-y', ...inputs, '-filter_complex', fc, '-map', '[v]', '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status) console.log(r.stderr.slice(-500));
