import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'src/assets');
const outDir = path.join(assets, 'icons');
await fs.mkdir(outDir, { recursive: true });

const full = await fs.readFile(path.join(assets, 'logo.svg'));
const small = await fs.readFile(path.join(assets, 'logo-small.svg'));

// 16/32 use the simplified mark so it survives the toolbar; 48/128 use the full one.
const plan = [[16, small], [32, small], [48, full], [128, full]];
for (const [size, svg] of plan) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(outDir, `icon-${size}.png`));
}

// contact sheet for eyeballing: real sizes on light and dark toolbar colours
const sheetW = 540, sheetH = 300;
const tiles = [];
const bg = (c, y) => ({ input: { create: { width: sheetW, height: 100, channels: 3, background: c } }, left: 0, top: y });
tiles.push(bg('#ffffff', 0), bg('#202124', 100), bg('#F1E8D4', 200));
let x = 20;
const layers = [...tiles];
for (const [size] of plan) {
  const buf = await fs.readFile(path.join(outDir, `icon-${size}.png`));
  for (const y of [0, 100, 200]) layers.push({ input: buf, left: x, top: y + Math.round((100 - size) / 2) });
  x += size + 24;
}
const big = await sharp(full, { density: 384 }).resize(200, 200).png().toBuffer();
layers.push({ input: big, left: 310, top: 50 });
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#888' } })
  .composite(layers).png().toFile(path.join(root, 'scripts/logo-sheet.png'));
console.log('icons written');
