// Make a small, silent web excerpt without changing the original launch film.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const ffmpeg = createRequire(path.join(root, 'video/package.json'))('ffmpeg-static');
const out = path.join(root, 'site/public/demo');
await fs.mkdir(out, { recursive: true });
const input = path.join(root, 'video/out/footlit-launch-1920x1080.mp4');
function encode(args) {
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Demo encoding failed');
}
encode(['-i', input, '-t', '17', '-an', '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-crf', '25', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, 'footlit-demo.mp4')]);
encode(['-ss', '5', '-i', input, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', path.join(out, 'poster.jpg')]);
console.log('Prepared 17-second demo and poster. Original film unchanged.');
