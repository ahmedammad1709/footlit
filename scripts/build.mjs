import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const watch = process.argv.includes('--watch');
const prod = process.argv.includes('--prod');

const fonts = [
  ['@fontsource/league-gothic/files/league-gothic-latin-400-normal.woff2', 'league-gothic.woff2'],
  ['@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 'dm-mono-400.woff2'],
  ['@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', 'dm-mono-500.woff2'],
  ['@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2', 'press-start-2p.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'jetbrains-mono-400.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', 'jetbrains-mono-700.woff2'],
  ['@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2', 'newsreader.woff2'],
  ['@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2', 'newsreader-italic.woff2'],
];

const staticFiles = [
  ['src/manifest.json', 'manifest.json'],
  ['src/popup/popup.html', 'popup/popup.html'],
  ['src/popup/popup.css', 'popup/popup.css'],
  ['src/options/options.html', 'options/options.html'],
  ['src/options/options.css', 'options/options.css'],
  ['src/shared/tokens.css', 'shared/tokens.css'],
];

async function copyStatic() {
  await fs.mkdir(path.join(out, 'fonts'), { recursive: true });
  for (const [from, to] of fonts) {
    await fs.cp(path.join(root, 'node_modules', from), path.join(out, 'fonts', to));
  }
  for (const [from, to] of staticFiles) {
    await fs.mkdir(path.dirname(path.join(out, to)), { recursive: true });
    await fs.cp(path.join(root, from), path.join(out, to));
  }
  await fs.cp(path.join(root, 'src/assets/icons'), path.join(out, 'icons'), { recursive: true }).catch(() => {});
}

const common = {
  bundle: true,
  target: 'chrome120',
  format: 'iife',
  sourcemap: prod ? false : 'inline',
  minify: prod,
  legalComments: 'none',
  logLevel: 'info',
  loader: { '.css': 'text', '.svg': 'text' },
  define: { __BUILD__: JSON.stringify(Date.now().toString(36)) },
};

const entries = {
  content: 'src/content/index.ts',
  background: 'src/background/service-worker.ts',
  'popup/popup': 'src/popup/popup.ts',
  'options/options': 'src/options/options.ts',
};

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await copyStatic();

const ctx = await esbuild.context({
  ...common,
  entryPoints: Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, path.join(root, v)])),
  outdir: out,
});

if (watch) {
  await ctx.watch();
  console.log('watching… (static files are copied once; rerun build after editing html/css/manifest)');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('built →', out);
}
