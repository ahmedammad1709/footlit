// Prepares everything the site takes from the extension: the engine bundle, fonts, metadata JSON and release zips.
// Run from site/:  npm run prep      (after `npm run package` in the repo root if you want fresh downloads)
import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const site = path.resolve(import.meta.dirname, '..');
const root = path.resolve(site, '..');
const require = createRequire(path.join(root, 'package.json'));

// 1. the engine, exactly as the extension runs it
await esbuild.build({
  entryPoints: [path.join(root, 'src/dev/site-engine.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'chrome111',
  loader: { '.css': 'text' },
  outfile: path.join(site, 'public/engine/footlit-engine.js'),
  logLevel: 'error',
  legalComments: 'none',
});

// 2. fonts (site UI + the ones themes load at runtime)
const fonts = {
  'league-gothic.woff2': '@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2',
  'dm-mono-400.woff2': '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2',
  'dm-mono-500.woff2': '@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2',
  'press-start-2p.woff2': '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2',
  'jetbrains-mono-400.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
  'jetbrains-mono-700.woff2': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2',
  'newsreader.woff2': '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
  'newsreader-italic.woff2': '@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2',
};
await fs.mkdir(path.join(site, 'public/fonts'), { recursive: true });
for (const [to, from] of Object.entries(fonts)) await fs.cp(path.join(root, 'node_modules', from), path.join(site, 'public/fonts', to));

// 3. metadata JSON (events, groups, themes, version, download sizes)
const tmp = path.join(site, '.prep-data.cjs');
await esbuild.build({ entryPoints: [path.join(root, 'src/dev/site-data.ts')], bundle: true, platform: 'node', format: 'cjs', loader: { '.css': 'text' }, outfile: tmp, logLevel: 'error' });
const meta = require(tmp).default;
await fs.rm(tmp);
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const downloads = {};
await fs.mkdir(path.join(site, 'public/downloads'), { recursive: true });
for (const target of ['chrome', 'firefox']) {
  const name = `footlit-${target}-${pkg.version}.zip`;
  const from = path.join(root, 'release', name);
  try {
    await fs.cp(from, path.join(site, 'public/downloads', name));
  } catch {
    /* keep an existing copy if there is no fresh build */
  }
  try {
    const st = await fs.stat(path.join(site, 'public/downloads', name));
    downloads[target] = { file: `/downloads/${name}`, kb: Math.round(st.size / 1024) };
  } catch {
    console.warn(`! missing ${name}: run "npm run package" in the repo root, then "npm run prep" here`);
  }
}
await fs.mkdir(path.join(site, 'src/data'), { recursive: true });
await fs.writeFile(path.join(site, 'src/data/footlit.json'), JSON.stringify({ version: pkg.version, downloads, ...meta }, null, 2));
// 3b. changelog (single source: CHANGELOG.md at the repo root)
try {
  const md = await fs.readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  const releases = [];
  for (const block of md.split(/^## /m).slice(1)) {
    const [head, ...rest] = block.split('\n');
    const m = head.match(/^(\S+)\s*-\s*(\S+)/);
    if (!m) continue;
    const lines = rest.map((l) => l.trim()).filter(Boolean);
    releases.push({ version: m[1], date: m[2], bullets: lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)), notes: lines.filter((l) => !l.startsWith('- ')) });
  }
  await fs.writeFile(path.join(site, 'src/data/changelog.json'), JSON.stringify(releases, null, 2));
} catch (e) {
  console.warn('! could not read CHANGELOG.md:', e.message);
}
// 4. brand files
await fs.cp(path.join(root, 'src/assets/logo.svg'), path.join(site, 'public/logo.svg'));
await fs.cp(path.join(root, 'src/assets/icons/icon-128.png'), path.join(site, 'src/app/icon.png'));
await fs.cp(path.join(root, 'src/assets/icons/icon-128.png'), path.join(site, 'src/app/apple-icon.png'));
console.log('prep done: engine, fonts, data, downloads, brand');
