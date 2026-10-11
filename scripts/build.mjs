// Builds the extension.   node scripts/build.mjs [--watch] [--prod] [--firefox]
//   default  -> dist/          (Chrome, Edge and other Chromium browsers)
//   --firefox -> dist-firefox/  (Firefox: manifest adapted, otherwise the same code)
//   --prod   -> minified, no source maps (what gets zipped for the stores)
import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');
const prod = process.argv.includes('--prod');
const firefox = process.argv.includes('--firefox');
const out = path.join(root, firefox ? 'dist-firefox' : 'dist');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

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
  ['src/popup/popup.html', 'popup/popup.html'],
  ['src/popup/popup.css', 'popup/popup.css'],
  ['src/options/options.html', 'options/options.html'],
  ['src/options/options.css', 'options/options.css'],
  ['src/shared/tokens.css', 'shared/tokens.css'],
];

/** One source manifest; the version always comes from package.json, and Firefox gets its own background/options keys. */
async function writeManifest() {
  const m = JSON.parse(await fs.readFile(path.join(root, 'src/manifest.json'), 'utf8'));
  m.version = pkg.version;
  if (firefox) {
    delete m.minimum_chrome_version;
    m.background = { scripts: ['background.js'] };
    m.options_ui = { page: m.options_page, open_in_tab: true };
    delete m.options_page;
    m.browser_specific_settings = { gecko: { id: '{8c1b5f0e-6d2a-4b7e-9d41-5f3a7c2e91b6}', strict_min_version: '140.0', data_collection_permissions: { required: ['none'] } }, gecko_android: { strict_min_version: '142.0' } };
  }
  await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(m, null, 2));
}

async function copyStatic() {
  await fs.mkdir(path.join(out, 'fonts'), { recursive: true });
  for (const [from, to] of fonts) await fs.cp(path.join(root, 'node_modules', from), path.join(out, 'fonts', to));
  for (const [from, to] of staticFiles) {
    await fs.mkdir(path.dirname(path.join(out, to)), { recursive: true });
    await fs.cp(path.join(root, from), path.join(out, to));
  }
  await fs.cp(path.join(root, 'src/assets/icons'), path.join(out, 'icons'), { recursive: true }).catch(() => {});
  await writeManifest();
}

const common = {
  bundle: true,
  target: firefox ? 'firefox140' : 'chrome111',
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
  console.log(`built ${firefox ? 'firefox' : 'chrome'}${prod ? ' (prod)' : ''} v${pkg.version} →`, out);
}
