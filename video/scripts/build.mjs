// Bundles the film page and the real Footlit engine into video/dist.
import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(root, '..');
await fs.mkdir(path.join(root, 'dist'), { recursive: true });

// the real engine and themes, exactly as the extension and the website run them
await esbuild.build({
  entryPoints: [path.join(repo, 'src/dev/site-engine.ts')],
  bundle: true, format: 'iife', target: 'chrome120', loader: { '.css': 'text' },
  outfile: path.join(root, 'dist/engine.js'), logLevel: 'error', legalComments: 'none',
});

// the films' own timeline code
for (const name of ['film', 'teaser', 'linkedin-product', 'marketing', 'marketing-reel']) {
  await esbuild.build({
    entryPoints: [path.join(root, `src/${name}.ts`)],
    bundle: true, format: 'iife', target: 'chrome120', loader: { '.json': 'json' },
    outfile: path.join(root, `dist/${name}.js`), logLevel: 'error',
  });
}
console.log('video bundles built');
