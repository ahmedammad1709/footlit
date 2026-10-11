// Audits the built site (site/out) the way a search engine crawler would see it.   npm run seo
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve(import.meta.dirname, '../out');
const issues = [];
const warnings = [];
const fail = (page, msg) => issues.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

async function walk(dir) {
  const files = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

const all = await walk(out);
const rel = (f) => '/' + path.relative(out, f).split(path.sep).join('/');
const htmlFiles = all.filter((f) => f.endsWith('.html') && !/(^|\\|\/)(404|_not-found)/.test(path.relative(out, f)));
const exists = new Set(all.map(rel));
const routeOf = (f) => rel(f).replace(/index\.html$/, '');

const attr = (html, re) => re.exec(html)?.[1]?.trim();
const meta = (html, key, by = 'name') => attr(html, new RegExp(`<meta[^>]+${by}="${key}"[^>]+content="([^"]*)"`, 'i')) ?? attr(html, new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${by}="${key}"`, 'i'));
const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const titles = new Map();
const descs = new Map();
const pages = [];

for (const f of htmlFiles) {
  const route = routeOf(f);
  const html = await fs.readFile(f, 'utf8');
  pages.push(route);

  // title
  const title = decode(attr(html, /<title[^>]*>([^<]*)<\/title>/i));
  if (!title) fail(route, 'missing <title>');
  else {
    if (title.length > 65) fail(route, `title is ${title.length} chars (keep it <= 65): "${title}"`);
    if (title.length < 25) warn(route, `title is short (${title.length}): "${title}"`);
    (titles.get(title) ?? titles.set(title, []).get(title)).push(route);
  }

  // description
  const desc = decode(meta(html, 'description'));
  if (!desc) fail(route, 'missing meta description');
  else {
    if (desc.length > 160) fail(route, `description is ${desc.length} chars (keep it <= 160)`);
    if (desc.length < 90) warn(route, `description is short (${desc.length})`);
    (descs.get(desc) ?? descs.set(desc, []).get(desc)).push(route);
  }

  // canonical
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  if (!canonical) fail(route, 'missing canonical link');
  else {
    if (!/^https?:\/\//.test(canonical)) fail(route, `canonical is not absolute: ${canonical}`);
    if (!canonical.endsWith(route)) fail(route, `canonical (${canonical}) does not end with the page path`);
    if (/localhost/.test(canonical)) warn(route, 'canonical points at localhost: set NEXT_PUBLIC_SITE_URL before the production build');
  }

  // social
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) if (!meta(html, k, 'property')) fail(route, `missing ${k}`);
  if (!meta(html, 'twitter:card')) fail(route, 'missing twitter:card');
  const ogImage = meta(html, 'og:image', 'property');
  if (ogImage) {
    const p = '/' + ogImage.replace(/^https?:\/\/[^/]+\//, '');
    if (!exists.has(p)) fail(route, `og:image file not found in the build: ${p}`);
  }

  // robots
  const robots = meta(html, 'robots');
  if (robots && /noindex/i.test(robots)) fail(route, `page is noindex: ${robots}`);
  if (!/<html[^>]+lang="/i.test(html)) fail(route, 'missing <html lang>');
  if (!/<meta[^>]+name="viewport"/i.test(html)) fail(route, 'missing viewport meta');

  // headings
  const h1s = html.match(/<h1[\s>]/gi) ?? [];
  if (h1s.length !== 1) fail(route, `expected exactly one <h1>, found ${h1s.length}`);

  // structured data
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (route === '/' && blocks.length === 0) fail(route, 'home page has no JSON-LD');
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1]);
      const types = (data['@graph'] ?? [data]).map((n) => n['@type']);
      if (route === '/') for (const need of ['SoftwareApplication', 'FAQPage', 'WebSite']) if (!types.includes(need)) fail(route, `JSON-LD missing ${need}`);
      for (const n of data['@graph'] ?? []) {
        if (n['@type'] === 'FAQPage') for (const q of n.mainEntity ?? []) if (!q.acceptedAnswer?.text) fail(route, `FAQ question without an answer: ${q.name}`);
      }
    } catch (e) {
      fail(route, 'JSON-LD does not parse: ' + e.message);
    }
  }
  if (route !== '/' && blocks.length === 0) warn(route, 'no JSON-LD');

  // images
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\balt="/i.test(tag)) fail(route, `image without alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth="/i.test(tag) || !/\bheight="/i.test(tag)) warn(route, `image without width/height (layout shift): ${tag.slice(0, 80)}`);
    const src = /\bsrc="([^"]+)"/i.exec(tag)?.[1];
    if (src?.startsWith('/') && !exists.has(src.split('?')[0])) fail(route, `image file not found: ${src}`);
  }

  // internal links
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const href = decode(m[1]);
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split('#')[0].split('?')[0];
    if (!target) continue;
    const ok = exists.has(target) || exists.has(target.replace(/\/$/, '') + '/index.html') || exists.has(target + 'index.html') || exists.has(target.replace(/\/$/, '') + '.html');
    if (!ok) fail(route, `broken internal link: ${href}`);
  }
}

for (const [t, rs] of titles) if (rs.length > 1) fail(rs.join(', '), `duplicate title: "${t}"`);
for (const [d, rs] of descs) if (rs.length > 1) fail(rs.join(', '), `duplicate description: "${d.slice(0, 60)}..."`);

// sitemap + robots
const sitemap = exists.has('/sitemap.xml') ? await fs.readFile(path.join(out, 'sitemap.xml'), 'utf8') : '';
if (!sitemap) fail('/sitemap.xml', 'missing');
for (const r of pages) if (sitemap && !sitemap.includes(`${r}</loc>`)) fail('/sitemap.xml', `does not list ${r}`);
const robots = exists.has('/robots.txt') ? await fs.readFile(path.join(out, 'robots.txt'), 'utf8') : '';
if (!/Sitemap:/i.test(robots)) fail('/robots.txt', 'missing Sitemap line');
if (/Disallow:\s*\/\s*$/m.test(robots)) fail('/robots.txt', 'disallows the whole site');
if (!exists.has('/llms.txt')) warn('/llms.txt', 'missing');

console.log(`Checked ${pages.length} pages:\n  ${pages.join('\n  ')}\n`);
if (warnings.length) console.log('Warnings:\n  - ' + warnings.join('\n  - ') + '\n');
if (issues.length) {
  console.log('PROBLEMS:\n  - ' + issues.join('\n  - '));
  process.exit(1);
}
console.log('SEO audit passed.');
