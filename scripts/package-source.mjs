// Builds the source-code zip that addons.mozilla.org asks for when the submitted code is bundled/minified.
//   npm run package:source   ->  release/footlit-source-<version>.zip
import { zipSync, strToU8 } from 'fflate';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

async function walk(dir, base) {
  const out = {};
  for (const e of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) Object.assign(out, await walk(rel, base));
    else out[rel] = new Uint8Array(await fs.readFile(path.join(root, rel)));
  }
  return out;
}

const files = {
  ...(await walk('src')),
  'scripts/build.mjs': new Uint8Array(await fs.readFile(path.join(root, 'scripts/build.mjs'))),
};
for (const f of ['package.json', 'package-lock.json', 'tsconfig.json', 'README.md', 'CHANGELOG.md']) files[f] = new Uint8Array(await fs.readFile(path.join(root, f)));

files['BUILD.txt'] = strToU8(`Footlit ${pkg.version}: how to reproduce the submitted Firefox package from this source

Requirements: Node.js 22 or newer, npm 10 or newer (any OS).

  npm ci
  node scripts/build.mjs --prod --firefox

The result is in dist-firefox/. Its contents (manifest.json, content.js, background.js, popup/, options/, icons/, fonts/)
are what was uploaded. The code is bundled and minified with esbuild (see scripts/build.mjs); there is no other
build step and no code is generated or fetched at runtime.

Third-party code (all from npm, pinned by package-lock.json): esbuild and TypeScript (build only); @fontsource/* font
files (SIL Open Font License) copied into dist-firefox/fonts/. The extension has no runtime dependencies and makes no
network requests.
`);

await fs.mkdir(path.join(root, 'release'), { recursive: true });
const zip = zipSync(files, { level: 9 });
const file = path.join(root, 'release', `footlit-source-${pkg.version}.zip`);
await fs.writeFile(file, zip);
console.log(`${path.relative(root, file)}  ${(zip.length / 1024).toFixed(0)} KB, ${Object.keys(files).length} files`);
