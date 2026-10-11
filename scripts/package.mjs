// Produces the store upload zips.   npm run package
//   release/footlit-chrome-<version>.zip   -> Chrome Web Store (also fine for Edge Add-ons)
//   release/footlit-firefox-<version>.zip  -> addons.mozilla.org
import { zipSync } from 'fflate';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
await fs.mkdir(path.join(root, 'release'), { recursive: true });

async function walk(dir, base = '') {
  const files = {};
  for (const e of await fs.readdir(path.join(dir, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) Object.assign(files, await walk(dir, rel));
    else files[rel] = new Uint8Array(await fs.readFile(path.join(dir, rel)));
  }
  return files;
}

for (const target of ['chrome', 'firefox']) {
  execFileSync(process.execPath, [path.join(root, 'scripts/build.mjs'), '--prod', ...(target === 'firefox' ? ['--firefox'] : [])], { stdio: 'inherit' });
  const dir = path.join(root, target === 'firefox' ? 'dist-firefox' : 'dist');
  const files = await walk(dir);
  const zip = zipSync(files, { level: 9 });
  const file = path.join(root, 'release', `footlit-${target}-${pkg.version}.zip`);
  await fs.writeFile(file, zip);
  const names = Object.keys(files);
  console.log(`${path.relative(root, file)}  ${(zip.length / 1024).toFixed(0)} KB, ${names.length} files`);
}
