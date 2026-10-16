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

  // pull request opened / closed, and the newer Primer markup
  '/acme/widget/compare/main...feature': page('Comparing changes · acme/widget', '<h1>Open a pull request</h1>'),
  '/acme/widget/pull/42?c=close-flip': prHtml({ badge: 'open', flip: flipAfter(1900, `const b=document.getElementById('badge');b.className='State State--closed';b.title='Status: Closed';b.textContent='Closed';`) }),
  '/acme/widget/pull/42?c=primer-merge': page('Fix flaky login · Pull Request #42 · acme/widget · GitHub',
    '<bdi class="js-issue-title">Fix flaky login</bdi><span id="hs" data-testid="header-state" data-status="pullOpened" class="prc-StateLabel">Open</span>',
    flipAfter(1900, `const b=document.getElementById('hs');b.setAttribute('data-status','pullMerged');b.textContent='Merged';`)),
  // issues
  '/acme/widget/issues/7?c=close-flip': page('Bug report · Issue #7 · acme/widget · GitHub',
    '<span id="hs" data-testid="header-state" data-status="issueOpened">Open</span>',
    flipAfter(1900, `const b=document.getElementById('hs');b.setAttribute('data-status','issueClosed');b.textContent='Closed';`)),
  '/acme/widget/issues/7?c=already-closed': page('Bug report · Issue #7 · acme/widget · GitHub', '<span data-testid="header-state" data-status="issueClosed">Closed</span>'),
  // releases
  '/acme/widget/releases/new': page('New Release · acme/widget', '<h1>New release</h1>'),
  '/acme/widget/releases/tag/v1.2.0': page('Release v1.2.0 · acme/widget · GitHub', '<h1>v1.2.0</h1>'),
  '/acme/widget/releases/tag/untagged-abc123': page('Release · acme/widget · GitHub', '<h1>Draft</h1>'),
  // forks
  '/acme/widget/fork': page('Create a new fork · acme/widget', '<h1>Create a new fork</h1>'),
  '/me/widget': page('GitHub - me/widget: a thing', '<meta name="octolytics-dimension-repository_nwo" content="me/widget">'),
  '/me/other': page('GitHub - me/other: another', ''),
  // pages / deploy
  '/acme/widget/settings/pages?c=live-flip': page('Pages · acme/widget', '<main><p id="pg">Your site is being deployed.</p></main>', flipAfter(1900, `document.getElementById('pg').textContent='Your site is live at https://acme.github.io/widget/';`)),
  '/acme/widget/settings/pages?c=already-live': page('Pages · acme/widget', '<main><p>Your site is live at https://acme.github.io/widget/</p></main>'),
  '/acme/widget/actions/runs/456?c=pages-run': page('pages build and deployment · acme/widget@abc123 · GitHub', '<div><span class="mb-1 d-block text-small color-fg-muted">Status</span><span id="st" class="h4">In progress</span></div>', flipAfter(1900, `document.getElementById('st').textContent='Success';`)),
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
  let queue = Promise.resolve();
  const area = (n) => ({
    get: async (k) => (k in mem[n] ? { [k]: mem[n][k] } : {}),
    set: async (o) => { Object.assign(mem[n], o); const s = o['footlit:stats']; if (s && s.log[0]) window.__events.push({ event: s.log[0].event, shown: s.log[0].shown, reason: s.log[0].reason }); },
    remove: async () => {},
  });
  window.chrome = {
    storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {}, removeListener() {} } },
    runtime: { id: 'footlit-test', getURL: (f) => '/' + f, sendMessage: async (msg) => {
      if (msg.type !== 'record-event') return { ok: false };
      const operation = queue.then(async () => {
        const old = mem.local['footlit:stats'] ?? { shows: 0, log: [] };
        const next = { shows: old.shows + Number(msg.entry.shown), log: [msg.entry, ...old.log].slice(0, 40) };
        await area('local').set({ 'footlit:stats': next });
        return next;
      });
      queue = operation;
      return operation;
    }, onMessage: { addListener: (l) => (window.__listeners ??= []).push(l) } },
  };
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

async function open(url) {
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(stub);
  await p.evaluateOnNewDocument(contentJs);
  p.on('pageerror', (e) => { failed++; console.log('   [pageerror]', e.message); });
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
  then: async (p) => { await wait(400); await submit(p); await Promise.all([p.waitForNavigation(), p.evaluate(() => location.assign('/acme/widget'))]); },
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

console.log('Pull request opened / closed');
async function submit(p) {
  await p.evaluate(() => {
    const form = document.createElement('form'); form.method = 'post'; document.body.append(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.remove();
  });
}
const go = (to, submitted = true) => async (p) => { await wait(400); if (submitted) await submit(p); await Promise.all([p.waitForNavigation(), p.evaluate((u) => location.assign(u), to)]); };
await check('submitted compare -> open PR fires pr.opened', '/acme/widget/compare/main...feature', { expect: ['pr.opened'], then: go('/acme/widget/pull/42?c=ci-already-green') });
await check('compare navigation without submission stays silent', '/acme/widget/compare/main...feature', { expect: [], then: go('/acme/widget/pull/42?c=ci-already-green', false) });
await check('submitted compare -> already merged PR stays silent', '/acme/widget/compare/main...feature', { expect: [], then: go('/acme/widget/pull/42?c=already-merged') });
await check('compare page -> repo root stays silent', '/acme/widget/compare/main...feature', { expect: [], settle: 2500, then: go('/acme/widget') });
await check('open -> closed while watching fires pr.closed', '/acme/widget/pull/42?c=close-flip', { expect: ['pr.closed'] });
await check('Primer markup: open -> merged fires pr.merged', '/acme/widget/pull/42?c=primer-merge', { expect: ['pr.merged'] });

console.log('Issues');
await check('open -> closed fires issue.closed', '/acme/widget/issues/7?c=close-flip', { expect: ['issue.closed'] });
await check('visiting a closed issue stays silent', '/acme/widget/issues/7?c=already-closed', { expect: [], settle: 3000 });

console.log('Releases and forks');
await check('release form -> tag page fires release.published', '/acme/widget/releases/new', { expect: ['release.published'], then: go('/acme/widget/releases/tag/v1.2.0') });
await check('saving a draft (untagged) stays silent', '/acme/widget/releases/new', { expect: [], settle: 2500, then: go('/acme/widget/releases/tag/untagged-abc123') });
await check('fork form -> your copy fires repo.forked', '/acme/widget/fork', { expect: ['repo.forked'], then: go('/me/widget') });
await check('fork form -> a different repo stays silent', '/acme/widget/fork', { expect: [], settle: 2500, then: go('/me/other') });
await check('fork form -> original repo stays silent', '/acme/widget/fork', { expect: [], settle: 2500, then: go('/acme/widget') });
await check('new repo form cancelled to existing repo stays silent', '/new', { expect: [], settle: 2500, then: go('/acme/widget', false) });

// GitHub's newer pages are script-driven: the form has no method attribute (it reads as "get") or there is no form at all,
// and the button just runs code. These must still count as a deliberate submission.
console.log('Script-driven GitHub forms');
const clickSubmit = (kind, label, to) => async (p) => {
  await wait(400);
  await p.evaluate((kind, label) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (kind === 'react-form') { // <form> without method, submit handled by script, real submit button
      const f = document.createElement('form'); f.addEventListener('submit', (e) => e.preventDefault()); b.type = 'submit'; f.append(b); document.body.append(f);
    } else if (kind === 'loose-button') { // no form at all, plain button
      b.type = 'button'; document.body.append(b);
    }
    b.click();
  }, kind, label);
  await Promise.all([p.waitForNavigation(), p.evaluate((u) => location.assign(u), to)]);
};
await check('script-driven repo form (no method) -> fires repo.created', '/new', { expect: ['repo.created'], then: clickSubmit('react-form', 'Create repository', '/acme/widget') });
await check('plain "Create repository" button, no form -> fires repo.created', '/new', { expect: ['repo.created'], then: clickSubmit('loose-button', 'Create repository', '/acme/widget') });
await check('plain "Publish release" button -> fires release.published', '/acme/widget/releases/new', { expect: ['release.published'], then: clickSubmit('loose-button', 'Publish release', '/acme/widget/releases/tag/v1.2.0') });
await check('script-driven "Create pull request" -> fires pr.opened', '/acme/widget/compare/main...feature', { expect: ['pr.opened'], then: clickSubmit('loose-button', 'Create pull request', '/acme/widget/pull/42?c=ci-already-green') });
await check('clicking "Cancel" then wandering to a repo stays silent', '/new', { expect: [], settle: 2500, then: clickSubmit('loose-button', 'Cancel', '/acme/widget') });
await check('persistent deletion banner fires only once', '/acme-home', { expect: ['repo.deleted'], settle: 22500 });

console.log('Deploys');
await check('Pages: being deployed -> live fires deploy.live', '/acme/widget/settings/pages?c=live-flip', { expect: ['deploy.live'] });
await check('Pages: already live stays silent', '/acme/widget/settings/pages?c=already-live', { expect: [], settle: 3000 });
await check('Pages workflow run succeeding fires deploy.live, not ci.passed', '/acme/widget/actions/runs/456?c=pages-run', { expect: ['deploy.live'] });

console.log('Rehearse and stale-tab handshake');
{
  const p = await open('/acme-home-plain');
  await wait(500);
  const ask = (msg) => p.evaluate((m) => new Promise((res) => window.__listeners[0](m, null, res)), msg);
  const hello = await ask({ type: 'hello' });
  const okHello = typeof hello?.build === 'string' && hello.build.length > 0;
  if (!okHello) failed++;
  console.log(`${okHello ? 'PASS' : 'FAIL'}  content script answers hello with its build id`);
  for (const ev of ['repo.created', 'repo.deleted', 'repo.forked', 'pr.opened', 'pr.merged', 'pr.closed', 'ci.passed', 'ci.failed', 'deploy.live', 'release.published', 'issue.closed']) {
    const reply = await ask({ type: 'rehearse', event: ev });
    await wait(900);
    const shown = await p.evaluate(() => !!document.querySelector('footlit-stage'));
    const ok = reply?.ok === true && shown;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  rehearse ${ev} replies ok and plays a show`);
    await p.keyboard.press('Escape');
    await wait(500);
  }
  const bad = await ask({ type: 'rehearse', event: 'no.such.event' });
  const okBad = bad?.ok === false;
  if (!okBad) failed++;
  console.log(`${okBad ? 'PASS' : 'FAIL'}  an unknown event is refused instead of throwing`);
  await p.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} failed` : '\nall detector tests passed');
process.exit(failed ? 1 : 0);
