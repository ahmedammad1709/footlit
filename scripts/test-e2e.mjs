// Detector tests: serves fixture pages shaped like GitHub's, runs the REAL built content script (dist/content.js)
// in headless Chrome with a stub of chrome.*, and asserts which events fire. Run: npm run build && npm test
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const contentJs = await fs.readFile(path.join(root, 'dist/content.js'), 'utf8');

// ---------- fixtures ----------
const page = (title, body, script = '') => `<!doctype html><meta charset=utf-8><title>${title}</title>${body}<script>${script}</script>`;
const flipAfter = (ms, js) => `setTimeout(() => { ${js} }, ${ms});`;

const prHtml = ({ badge = 'open', merge = null, flip = '', comment = '' }) =>
  page('Fix flaky login · Pull Request #42 · acme/widget · GitHub',
    `<div id="partial-discussion-header"><bdi class="js-issue-title">Fix flaky login</bdi><span id="badge" class="State State--${badge}" title="Status: ${badge}">${badge}</span></div>` +
    (merge ? `<section class="merge-pr"><h3 id="mb" class="status-heading">${merge}</h3></section>` : '') +
    (comment ? `<div class="markdown-body"><h3>${comment}</h3></div>` : ''),
    flip);

const runHtml = (status, flip = '') =>
  page('CI · acme/widget@abc123 · GitHub', `<div><span class="mb-1 d-block text-small color-fg-muted">Status</span><span id="st" class="h4">${status}</span></div>`, flip);

const routes = {
  // PR merged
  '/acme/widget/pull/42?c=merge-flip': prHtml({ badge: 'open', flip: flipAfter(1900, `const b=document.getElementById('badge');b.className='State State--merged';b.title='Status: Merged';b.textContent='Merged';`) }),
  '/acme/widget/pull/42?c=already-merged': prHtml({ badge: 'merged' }),
  // CI on a PR
  '/acme/widget/pull/42?c=ci-pass': prHtml({ merge: 'Some checks haven’t completed yet', flip: flipAfter(1900, `document.getElementById('mb').textContent='All checks have passed';`) }),
  '/acme/widget/pull/42?c=ci-fail': prHtml({ merge: 'Some checks haven’t completed yet', flip: flipAfter(1900, `document.getElementById('mb').textContent='Some checks were not successful';`) }),
  '/acme/widget/pull/42?c=ci-already-green': prHtml({ merge: 'All checks have passed' }),
  '/acme/widget/pull/42?c=ci-comment-trap': prHtml({ merge: 'Some checks haven’t completed yet', comment: 'All checks have passed', flip: '' }),
  // CI on an Actions run page
  '/acme/widget/actions/runs/123?c=run-pass': runHtml('In progress', flipAfter(1900, `document.getElementById('st').textContent='Success';`)),
  '/acme/widget/actions/runs/123?c=run-fail': runHtml('In progress', flipAfter(1900, `document.getElementById('st').textContent='Failure';`)),
  '/acme/widget/actions/runs/123?c=run-cancel': runHtml('In progress', flipAfter(1900, `document.getElementById('st').textContent='Cancelled';`)),
  // repo created / deleted
  '/new': page('Create a new repository', '<h1>Create a new repository</h1>'),
  '/acme/widget': page('GitHub - acme/widget: a thing', '<meta name="octolytics-dimension-repository_nwo" content="acme/widget">'),
  '/settings/profile': page('Your profile', '<h1>Profile</h1>'),
  '/acme/widget/settings': page('Settings · acme/widget', '<h1>Settings</h1>'),
  '/acme-home': page('GitHub', '<div class="flash flash-success">Your repository "acme/widget" was successfully deleted.</div>'),
  '/acme-home-plain': page('GitHub', '<h1>Dashboard</h1>'),
};

const server = http.createServer((req, res) => {
  const key = req.url.replace(/&.*/, '');
  const html = routes[key] ?? routes[key.split('?')[0]];
  if (!html) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

// ---------- browser ----------
const stub = () => {
  window.__events = [];
  const mem = { sync: {}, local: {} };
  const area = (n) => ({
    get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}),
    set: async (o) => { Object.assign(mem[n], o); const s = o['footlit:stats']; if (s && s.log[0]) window.__events.push({ event: s.log[0].event, shown: s.log[0].shown, reason: s.log[0].reason }); },
    remove: async () => {},
  });
  window.chrome = {
    storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } },
    runtime: { getURL: (f) => '/' + f, sendMessage: async () => ({ ok: false }), onMessage: { addListener() {} } },
  };
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

async function open(url) {
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(stub);
  await p.evaluateOnNewDocument(contentJs);
  p.on('pageerror', (e) => console.log('   [pageerror]', e.message));
  await p.goto(base + url);
  return p;
}
const events = (p) => p.evaluate(() => window.__events.filter((e) => e.shown).map((e) => e.event));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = 0;
async function check(name, url, { expect, settle = 4200, then }) {
  const p = await open(url);
  if (then) await then(p);
  await wait(settle);
  const got = await events(p);
  const ok = JSON.stringify(got) === JSON.stringify(expect);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        expected ${JSON.stringify(expect)}, got ${JSON.stringify(got)}`}`);
  await p.close();
}

console.log('PR merged');
await check('open -> merged while watching fires pr.merged', '/acme/widget/pull/42?c=merge-flip', { expect: ['pr.merged'] });
await check('visiting an already-merged PR stays silent', '/acme/widget/pull/42?c=already-merged', { expect: [], settle: 3000 });

console.log('CI on a pull request');
await check('pending -> all checks passed fires ci.passed', '/acme/widget/pull/42?c=ci-pass', { expect: ['ci.passed'] });
await check('pending -> checks not successful fires ci.failed', '/acme/widget/pull/42?c=ci-fail', { expect: ['ci.failed'] });
await check('opening a PR that is already green stays silent', '/acme/widget/pull/42?c=ci-already-green', { expect: [], settle: 3000 });
await check('a comment containing "All checks have passed" is ignored', '/acme/widget/pull/42?c=ci-comment-trap', { expect: [], settle: 3000 });

console.log('CI on an Actions run page');
await check('In progress -> Success fires ci.passed', '/acme/widget/actions/runs/123?c=run-pass', { expect: ['ci.passed'] });
await check('In progress -> Failure fires ci.failed', '/acme/widget/actions/runs/123?c=run-fail', { expect: ['ci.failed'] });
await check('In progress -> Cancelled stays silent', '/acme/widget/actions/runs/123?c=run-cancel', { expect: [], settle: 3200 });

console.log('Repo created');
await check('/new -> the new repo page fires repo.created', '/new', {
  expect: ['repo.created'],
  then: async (p) => { await wait(400); await p.evaluate(() => location.assign('/acme/widget')); await p.waitForNavigation().catch(() => {}); },
});
await check('/new -> /settings/profile stays silent', '/new', {
  expect: [], settle: 2500,
  then: async (p) => { await wait(400); await p.evaluate(() => location.assign('/settings/profile')); await p.waitForNavigation().catch(() => {}); },
});

console.log('Repo deleted');
await check('delete banner after settings fires repo.deleted', '/acme/widget/settings', {
  expect: ['repo.deleted'],
  then: async (p) => { await wait(400); await p.evaluate(() => location.assign('/acme-home')); await p.waitForNavigation().catch(() => {}); },
});
await check('leaving settings with no banner stays silent', '/acme/widget/settings', {
  expect: [], settle: 2500,
  then: async (p) => { await wait(400); await p.evaluate(() => location.assign('/acme-home-plain')); await p.waitForNavigation().catch(() => {}); },
});

await browser.close();
server.close();
console.log(failed ? `\n${failed} failed` : '\nall detector tests passed');
process.exit(failed ? 1 : 0);
