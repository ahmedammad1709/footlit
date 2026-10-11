// Stand-in "code host" pages for the film: generic, dark, no logos or marks. The overlay engine plays over these.
const CSS = `
.gh{font:14px/1.5 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#e6edf3;position:absolute;inset:0;overflow:hidden;background:#0d1117}
.gh *{box-sizing:border-box}
.gh .hd{position:absolute;left:0;right:0;top:0;height:48px;background:#010409;border-bottom:1px solid #30363d;display:flex;align-items:center;padding:0 20px;gap:14px}
.gh .hd .burger{width:18px;height:2px;background:#e6edf3;position:relative}
.gh .hd .burger:before,.gh .hd .burger:after{content:'';position:absolute;left:0;width:18px;height:2px;background:#e6edf3}
.gh .hd .burger:before{top:-6px}.gh .hd .burger:after{top:6px}
.gh .hd .crumb{font-weight:600;color:#e6edf3;margin-left:6px}
.gh .hd .sp{flex:1}
.gh .hd .search{width:260px;height:30px;border:1px solid #30363d;border-radius:6px;color:#7d8590;padding:3px 10px;font-size:13px}
.gh .hd .av{width:26px;height:26px;border-radius:50%;background:#6e7681}
.gh .muted{color:#7d8590}
.gh .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:6px;font-weight:600;padding:5px 16px;border:1px solid rgba(240,246,252,.1)}
.gh .green{background:#238636;color:#fff}
.gh .purple{background:#8957e5;color:#fff}
.gh .gray{background:#21262d;color:#7d8590}
.gh .pill{display:inline-flex;align-items:center;gap:6px;border-radius:2em;padding:4px 12px;font-weight:600;font-size:13px;color:#fff}
.gh .card{border:1px solid #30363d;border-radius:6px;background:#0d1117}
.gh .tabs{display:flex;gap:4px;border-bottom:1px solid #30363d}
.gh .tab{padding:8px 14px;color:#7d8590;font-size:14px}
.gh .tab.on{color:#e6edf3;border-bottom:2px solid #f78166;font-weight:600}
.gh input,.gh .fake{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;height:34px;padding:5px 12px;font:inherit;display:flex;align-items:center}
@keyframes ghspin{to{transform:rotate(360deg)}}
.gh .spin{width:16px;height:16px;border-radius:50%;border:3px solid #9e6a03;border-top-color:#d29922;animation:ghspin .9s linear infinite}
`;

const svgCheck = (c: string) => `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="${c}"/><path d="M6 11.5l3.2 3.2L16 8" stroke="#fff" stroke-width="2.2" fill="none"/></svg>`;
const svgX = (c: string) => `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="${c}"/><path d="M7 7l8 8M15 7l-8 8" stroke="#fff" stroke-width="2.2"/></svg>`;
const svgMerge = (c: string) => `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="${c}"/><circle cx="7.5" cy="6.5" r="1.8" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="7.5" cy="15.5" r="1.8" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="14.5" cy="12" r="1.8" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M7.5 8.3v5.4M7.5 8.5c0 3 7 1 7 1.7" stroke="#fff" stroke-width="1.6" fill="none"/></svg>`;

function div(css: string, html = '', cls = '', parent?: Element): HTMLElement {
  const e = document.createElement('div');
  e.style.cssText = css;
  if (cls) e.className = cls;
  e.innerHTML = html;
  parent?.append(e);
  return e;
}

const header = (crumb: string) => `<div class="hd"><div class="burger"></div><div class="crumb">${crumb}</div><div class="sp"></div><div class="search">Type / to search</div><div class="av"></div></div>`;

export function buildGh() {
  if (!document.getElementById('gh-css')) {
    const st = document.createElement('style');
    st.id = 'gh-css';
    st.textContent = CSS;
    document.head.append(st);
  }
  return {
    hookBoxes() {
      return `<div class="gh" style="background:transparent">
        <div class="h-open card" style="position:absolute;inset:0;padding:22px 24px;background:#0d1117">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <div style="margin-top:3px">${svgCheck('#238636')}</div>
            <div><div style="font-size:18px;font-weight:600">This branch has no conflicts with the base branch</div><div class="muted" style="margin-top:4px">Merging can be performed automatically.</div></div>
          </div>
          <div style="margin-top:26px;display:flex;gap:12px"><div class="h-btn btn green" style="font-size:16px;padding:8px 22px">Merge pull request</div><div class="btn gray" style="font-size:16px;padding:8px 18px">Squash and merge</div></div>
        </div>
        <div class="h-done card" style="position:absolute;inset:0;padding:22px 24px;background:#0d1117;border-color:#8957e5">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <div style="margin-top:3px">${svgMerge('#8957e5')}</div>
            <div><div style="font-size:18px;font-weight:600">Pull request successfully merged and closed</div><div class="muted" style="margin-top:4px">You're all set. The branch can be safely deleted.</div></div>
          </div>
          <div style="margin-top:26px"><div class="btn gray" style="font-size:16px;padding:8px 18px">Delete branch</div></div>
        </div>
      </div>`;
    },

    chrome(browser: HTMLElement, bw: number) {
      const strip = div(`position:absolute;left:0;top:0;width:${bw}px;height:44px;background:#202124`, '', '', browser);
      div(`position:absolute;left:14px;top:8px;width:300px;height:36px;background:#35363a;border-radius:10px 10px 0 0;color:#e8eaed;font:13px/36px 'Segoe UI',Arial,sans-serif;padding:0 14px 0 38px;white-space:nowrap;overflow:hidden`, '<span class="t-title"></span>', '', strip);
      div(`position:absolute;left:28px;top:18px;width:14px;height:14px;border-radius:50%;background:#7d8590`, '', '', strip);
      div(`position:absolute;right:20px;top:14px;color:#9aa0a6;font:16px 'Segoe UI',sans-serif;letter-spacing:34px`, '&#8211;&#9633;&#215;', '', strip);
      const bar = div(`position:absolute;left:0;top:44px;width:${bw}px;height:52px;background:#35363a`, '', '', browser);
      div(`position:absolute;left:24px;top:14px;color:#9aa0a6;font:20px 'Segoe UI',sans-serif;letter-spacing:22px`, '&#8592;&#8594;&#8635;', '', bar);
      div(`position:absolute;left:150px;top:8px;right:150px;height:36px;border-radius:18px;background:#202124;color:#e8eaed;font:15px/36px 'Segoe UI',Arial,sans-serif;padding:0 18px 0 22px`, '<span class="u-text" style="color:#e8eaed"></span>', '', bar);
      const ext = document.createElement('img');
      ext.src = '/ext/icons/icon-32.png';
      ext.style.cssText = 'position:absolute;right:76px;top:13px;width:26px;height:26px';
      bar.append(ext);
      div(`position:absolute;right:40px;top:19px;width:6px;height:6px;border-radius:50%;background:#9aa0a6;box-shadow:0 9px 0 #9aa0a6,0 -9px 0 #9aa0a6`, '', '', bar);
    },

    pages(view: HTMLElement, sc: number) {
      const root = div(`position:absolute;left:0;top:0;width:1108px;height:${Math.ceil(view.clientHeight / sc)}px;transform-origin:0 0;transform:scale(${sc})`, '', '', view);

      // ---------- new repo ----------
      const newRepo = div('position:absolute;inset:0', `<div class="gh">${header('Create a new repository')}
        <div style="position:absolute;left:178px;top:76px;width:752px">
          <div style="font-size:26px;font-weight:600">Create a new repository</div>
          <div class="muted" style="margin-top:6px">A repository contains all project files, including the revision history.</div>
          <div style="border-top:1px solid #30363d;margin:18px 0 12px"></div>
          <div class="muted" style="font-style:italic;font-size:13px">Required fields are marked with an asterisk (*).</div>
          <div style="display:flex;align-items:flex-end;gap:12px;margin-top:18px">
            <div><div style="font-weight:600;margin-bottom:6px">Owner *</div><div class="fake" style="width:190px;justify-content:space-between"><span>acme</span><span class="muted">&#9662;</span></div></div>
            <div style="padding-bottom:6px;font-size:20px" class="muted">/</div>
            <div><div style="font-weight:600;margin-bottom:6px">Repository name *</div><div class="f-input fake" style="width:330px;border-color:#1f6feb;box-shadow:0 0 0 2px rgba(31,111,235,.35);position:relative"><span class="f-name"></span><span class="f-caret" style="display:inline-block;width:2px;height:18px;background:#e6edf3;margin-left:1px;opacity:0"></span></div></div>
          </div>
          <div class="f-ok" style="color:#3fb950;margin-top:10px;font-size:13px;display:flex;gap:6px;align-items:center">${svgCheck('#238636').replace('width="22" height="22"', 'width="15" height="15"')} widget-shop is available.</div>
          <div class="muted" style="margin-top:14px">Great repository names are short and memorable.</div>
          <div style="font-weight:600;margin:20px 0 6px">Description <span class="muted" style="font-weight:400">(optional)</span></div>
          <div class="fake" style="width:752px"></div>
          <div style="border-top:1px solid #30363d;margin:22px 0 14px"></div>
          <div style="display:flex;gap:12px;align-items:center"><div style="width:18px;height:18px;border-radius:50%;border:5px solid #1f6feb;background:#0d1117"></div><div><b>Public</b> <span class="muted">Anyone on the internet can see this repository.</span></div></div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:12px"><div style="width:18px;height:18px;border-radius:50%;border:2px solid #7d8590"></div><div><b>Private</b> <span class="muted">You choose who can see and commit.</span></div></div>
          <div style="border-top:1px solid #30363d;margin:22px 0 16px"></div>
          <div style="display:flex;justify-content:flex-end"><div class="f-create btn green" style="font-size:15px;padding:6px 18px">Create repository</div></div>
        </div></div>`, '', root);

      // ---------- repo home ----------
      const repo = div('position:absolute;inset:0', `<div class="gh">${header('acme / widget-shop')}
        <div style="position:absolute;left:64px;right:64px;top:70px">
          <div style="display:flex;align-items:center;gap:10px;font-size:20px"><span class="muted">acme</span><span class="muted">/</span><b style="color:#58a6ff">widget-shop</b><span style="border:1px solid #30363d;border-radius:2em;padding:0 9px;font-size:12px;color:#7d8590;margin-left:4px">Public</span></div>
          <div class="tabs" style="margin-top:16px"><div class="tab on">Code</div><div class="tab">Issues</div><div class="tab">Pull requests</div><div class="tab">Actions</div><div class="tab">Projects</div><div class="tab">Security</div><div class="tab">Insights</div></div>
          <div class="card" style="margin-top:26px;padding:20px 24px">
            <div style="font-size:18px;font-weight:600">Quick setup <span class="muted" style="font-weight:400;font-size:15px">if you've done this kind of thing before</span></div>
            <div class="fake" style="margin-top:14px;width:520px;color:#7d8590">https://github.com/acme/widget-shop.git</div>
            <div style="font-size:16px;font-weight:600;margin-top:22px">...or create a new repository on the command line</div>
            <div style="margin-top:10px;background:#161b22;border-radius:6px;padding:14px 18px;font:13px/1.7 Consolas,'Courier New',monospace;color:#c9d1d9">echo "# widget-shop" &gt;&gt; README.md<br>git init<br>git add README.md<br>git commit -m "first commit"</div>
          </div>
        </div></div>`, '', root);

      // ---------- pull request ----------
      const prHtml = `<div class="gh">${header('acme / widget-shop')}
        <div style="position:absolute;left:64px;right:64px;top:64px">
          <div style="font-size:28px;font-weight:400;line-height:1.2">Fix flaky login redirect on Safari <span class="muted">#42</span></div>
          <div style="margin-top:12px;display:flex;align-items:center;gap:12px;position:relative;height:30px">
            <div class="open-pill pill" style="background:#238636;position:absolute;left:0;top:0">Open</div>
            <div class="merged-pill pill" style="background:#8957e5;position:absolute;left:0;top:0;opacity:0">Merged</div>
            <div class="muted" style="position:absolute;left:96px;top:3px">acme-dev wants to merge 1 commit into <b style="color:#58a6ff;font-weight:500">main</b> from <b style="color:#58a6ff;font-weight:500">fix/login-redirect</b></div>
          </div>
          <div class="tabs" style="margin-top:16px"><div class="tab on">Conversation</div><div class="tab">Commits 2</div><div class="tab">Checks 2</div><div class="tab">Files changed 3</div></div>
          <div class="card" style="margin-top:18px;padding:14px 18px;height:84px"><b>acme-dev</b> <span class="muted">commented</span><div style="margin-top:6px;color:#c9d1d9">Safari drops the redirect parameter after sign-in. This keeps it through the round trip.</div></div>
          <div style="position:relative;margin-top:14px;height:62px">
            <div style="padding:6px 0;color:#c9d1d9"><span class="muted">&#9679;</span>&nbsp; Fix flaky login redirect <span class="muted" style="font:12px Consolas,monospace;margin-left:8px">a1b2c3d</span></div>
            <div class="commit-fix" style="position:absolute;left:0;top:30px;padding:6px 0;color:#c9d1d9;opacity:0"><span class="muted">&#9679;</span>&nbsp; fix: keep redirect through the Safari round trip <span class="muted" style="font:12px Consolas,monospace;margin-left:8px">e4f5a6b</span></div>
          </div>
          <div class="boxes" style="position:relative;margin-top:14px;height:200px"></div>
        </div></div>`;
      const pr = div('position:absolute;inset:0', prHtml, '', root);
      const boxes = pr.querySelector<HTMLElement>('.boxes')!;
      const row = (icon: string, name: string, state: string, color: string) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-top:1px solid #30363d">${icon}<span style="font-weight:600">${name}</span><span class="muted">${state}</span></div>`;
      const box = (head: string, headIcon: string, rows: string, action: string, border = '#30363d') =>
        `<div class="card" style="position:absolute;inset:0;border-color:${border}"><div style="display:flex;align-items:center;gap:12px;padding:14px 18px 12px">${headIcon}<div><div style="font-size:16px;font-weight:600">${head}</div></div></div>${rows}${action}</div>`;
      const spin = '<div class="spin"></div>';
      const boxPending = div('position:absolute;inset:0', box("Some checks haven't completed yet", spin, row(spin, 'build / test', 'In progress', '#d29922') + row(svgCheck('#238636'), 'lint', 'Successful in 12s', ''), `<div style="padding:12px 18px;border-top:1px solid #30363d"><div class="btn gray">Merge pull request</div></div>`, '#9e6a03'), '', boxes);
      const boxFail = div('position:absolute;inset:0', box('All checks have failed', svgX('#da3633'), row(svgX('#da3633'), 'build / test', 'Failing after 41s', '') + row(svgCheck('#238636'), 'lint', 'Successful in 12s', ''), `<div style="padding:12px 18px;border-top:1px solid #30363d"><div class="btn gray">Merge pull request</div></div>`, '#da3633'), '', boxes);
      const boxPass = div('position:absolute;inset:0', box('All checks have passed', svgCheck('#238636'), row(svgCheck('#238636'), 'build / test', 'Successful in 38s', '') + row(svgCheck('#238636'), 'lint', 'Successful in 12s', ''), `<div style="padding:12px 18px;border-top:1px solid #30363d"><div class="b-merge btn green" style="font-size:15px;padding:6px 20px;display:inline-flex">Merge pull request</div></div>`, '#238636'), '', boxes);
      const boxMerged = div('position:absolute;inset:0', box('Pull request successfully merged and closed', svgMerge('#8957e5'), `<div style="padding:10px 18px 16px;border-top:1px solid #30363d" class="muted">You're all set. The fix/login-redirect branch can be safely deleted.</div>`, `<div style="padding:0 18px"><div class="btn gray">Delete branch</div></div>`, '#8957e5'), '', boxes);
      for (const b of [boxPending, boxFail, boxPass, boxMerged]) b.style.opacity = '0';

      // the engine plays over the page itself (the viewport), exactly where the extension puts it
      const overlayHost = div('position:absolute;inset:0;z-index:20;pointer-events:none', '', '', view);

      for (const p of [newRepo, repo, pr]) p.style.opacity = '0';
      return {
        newRepo, repo, pr, boxPending, boxFail, boxPass, boxMerged, overlayHost,
        commitFix: pr.querySelector<HTMLElement>('.commit-fix')!,
        openPill: pr.querySelector<HTMLElement>('.open-pill')!,
        mergedPill: pr.querySelector<HTMLElement>('.merged-pill')!,
      };
    },
  };
}
