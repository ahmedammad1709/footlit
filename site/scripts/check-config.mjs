// Runs before `next build`: reminds you about anything in src/site.config.ts that is still empty.
import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(import.meta.dirname, '../src/site.config.ts');
const text = await fs.readFile(file, 'utf8');
const empty = (key) => new RegExp(`${key}:\\s*['"]{2}`).test(text);
const warnings = [];
for (const k of ['instagram', 'facebook', 'whatsapp']) if (empty(k)) warnings.push(`social.${k} is empty: its footer link will not be shown`);
if (empty('chromeStoreUrl')) warnings.push('chromeStoreUrl is empty: the page shows "Chrome Web Store: coming soon"');
if (!process.env.NEXT_PUBLIC_SITE_URL) warnings.push('NEXT_PUBLIC_SITE_URL is not set: canonical links, sitemap and social cards will point at http://localhost:3000');
if (!process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION) warnings.push('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION is not set: add it to verify the site in Google Search Console (see docs/SEO.md)');
if (!process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION) warnings.push('NEXT_PUBLIC_BING_SITE_VERIFICATION is not set: optional, for Bing Webmaster Tools');
if (warnings.length) {
  console.warn('\n  Before you publish:\n' + warnings.map((w) => `   - ${w}`).join('\n') + '\n  (edit site/src/site.config.ts and set NEXT_PUBLIC_SITE_URL)\n');
}
