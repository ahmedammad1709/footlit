// Real-Firefox check: loads dist-firefox as a temporary add-on and serves GitHub-shaped fixture pages (with
// GitHub's restrictive font/style CSP) through request interception, then asserts Footlit detects events and plays.
//   npm run build:firefox && npm run test:firefox        (needs Firefox installed)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs/promises';

const root = path.resolve(import.meta.dirname, '..');
const firefox = process.env.FIREFOX ?? 'C:/Program Files/Mozilla Firefox/firefox.exe';
try { await fs.access(firefox); } catch { console.log(`Firefox not found at ${firefox}. Set FIREFOX=<path to firefox.exe>.`); process.exit(2); }

// GitHub's real policy, trimmed to the parts that matter for an extension: fonts only from GitHub's CDN, inline styles allowed.
const CSP = "default-src 'none'; font-src github.githubassets.com; style-src 'unsafe-inline' github.githubassets.com; script-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'";

const page = (title, body, script = '') => `<!doctype html><meta charset=utf-8><title>${title}</title><body style="background:#0d1117;color:#e6edf3;font:16px sans-serif">${body}<script>${script}</script>`;
const flip = (ms, js) => `setTimeout(() => { ${js} }, ${ms});`;

const routes = {
  '/acme/widget/pull/42': page('Fix flaky login · Pull Request #42 · acme/widget · GitHub',
    '<div id="partial-discussion-header"><bdi class="js-issue-title">Fix flaky login</bdi> <span id="badge" class="State State--open" title="Status: Open">Open</span></div>',
    flip(2200, "const b=document.getElementById('badge');b.className='State State--merged';b.title='Status: Merged';b.textContent='Merged';")),
  '/acme/widget/pull/43': page('Another · Pull Request #43 · acme/widget · GitHub',
    '<bdi class="js-issue-title">Another</bdi><section class="merge-pr"><h3 id="mb" class="status-heading">Some checks haven’t completed yet</h3></section>',
    flip(2200, "document.getElementById('mb').textContent='All checks have passed';")),
};

const browser = await puppeteer.launch({ browser: 'firefox', executablePath: firefox, headless: true, protocol: 'webDriverBiDi', defaultViewport: { width: 1280, height: 720 } });
let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !extra ? '' : `  (${extra})`}`); };
console.log('Firefox', await browser.version());

try {
  const id = await browser.installExtension(path.join(root, 'dist-firefox'));
  console.log('extension installed:', id);

  async function open(url) {
    const p = await browser.newPage();
    await p.setRequestInterception(true);
    p.on('request', (req) => {
      const u = new URL(req.url());
      const html = u.hostname === 'github.com' ? routes[u.pathname] : undefined;
      if (html) return void req.respond({ status: 200, contentType: 'text/html; charset=utf-8', headers: { 'content-security-policy': CSP }, body: html });
      return void req.respond({ status: 404, body: '' });
    });
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    return p;
  }
  const stage = (p) => p.evaluate(() => !!document.querySelector('footlit-stage'));
  const waitStage = async (p, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await stage(p)) return true; await new Promise((r) => setTimeout(r, 150)); } return false; };

  // 1) a pull request merges while you watch
  const pr = await open('https://github.com/acme/widget/pull/42');
  await new Promise((r) => setTimeout(r, 1500));
  check('no show on first load of an open PR', !(await stage(pr)));
  const shown = await waitStage(pr, 6000);
  check('open -> merged plays a show (content script + detector run in Firefox)', shown);
  if (shown) {
    await new Promise((r) => setTimeout(r, 1700));
    await pr.screenshot({ path: path.join(root, '.shots/firefox-merge.png') }).catch(() => {});
    const fams = await pr.evaluate(() => [...document.fonts].map((f) => f.family));
    check('theme fonts load despite the page CSP (via the background worker)', fams.some((f) => f.includes('Footlit')), fams.join(','));
  }

  // 2) checks go green
  const ci = await open('https://github.com/acme/widget/pull/43');
  check('checks pending -> passed plays a show', await waitStage(ci, 7000));
} catch (e) {
  console.log('could not drive Firefox automatically:', e.message);
  failed++;
}

await browser.close();
console.log(failed ? `\n${failed} failed` : '\nFirefox checks passed');
process.exit(failed ? 1 : 0);
