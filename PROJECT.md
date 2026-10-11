# Footlit

A Chrome extension that makes GitHub react to what you do. Create a repo, merge a PR, ship a deploy, break CI: the page responds with an animated, themeable overlay (theatre marquee, pixel arcade, terminal, mission control, and so on). Sound is optional and off by default. The visuals are the product.

## Quality bar (non-negotiable)

Footlit is used by developers, who notice everything and share what looks good. So:

- **Every theme is a complete, art-directed production**, not a confetti variant: its own palette, typography, motion language and copy, written for people who live in terminals and diffs. No stock clip-art, no emoji, no generic gradients, no AI-slop look (see `DESIGN.md`).
- **Themes use developer metaphors** where possible (two lines merging for a merge, a commit graph growing for a new repo, `rm -rf` dissolving a deleted repo, exit codes, T-minus countdowns) instead of generic "congrats" visuals.
- **Professional by default:** never blocks the page, respects reduced motion, has a quiet/minimal option for people using it at work, and every claim in the UI is true (the settings page says nothing leaves the browser, so it must not).
- **Original or CC0 assets only**, each recorded in `assets/LICENSES.md`.
- **Reliability over feature count:** a detector that misfires is worse than a missing event. Each detector ships with a debug trail and a fixture test.

Inspiration: a LeetCode "Theme Studio" extension (Pixel Art / Web Crawler / Vintage Paper / Anime / Adventure themes that restyle the page and play a themed animation on Accepted/Wrong Answer). We apply the same idea to GitHub, with a much wider event surface.

---

## 1. Does this already exist? (research, Oct 2026)

Short answer: pieces exist, the product does not.

| Existing | What it does | Gap |
|---|---|---|
| Merge Confetti (Chrome Web Store) | Confetti when you merge a PR or resolve a conflict | One event, one effect, ~9 users, no themes |
| GitHub Confetti | Confetti when you tick an issue/PR checkbox | Checkbox only |
| Confetti Cannon (open source) | Fires confetti from a button | Not tied to GitHub events |
| Travis / PR Check Status / GitHub Live PRs | Show CI status badges, optional failure notifications | Utilitarian, no celebration, no themes |
| LeetCode theme extensions | Editor themes | Different site; the animated Theme Studio from the screenshots wasn't indexed by search, so I couldn't verify its details |

Nobody found covers: many GitHub events (repo created/deleted, deploy live, release, star, CI pass/fail) + multiple full themes + per-event customization. That's the open space.

Caveat: web search only covers indexed listings. Before we publish, re-check the Chrome Web Store directly with searches like "github animation", "github celebrate", "github theme".

Sources:
- https://extensionauditor.com/scan/merge-confetti-lgfpgfdedjongkifpppleelllpbcknhh
- https://chrome.google.com/webstore/detail/dkdgopcaioggfmpkljgmgnjhmblldcpb
- https://github.com/tobysmith568/Confetti-Chrome-Extension
- https://addons.mozilla.org/firefox/addon/github-live-prs/
- https://chrome.google.com/webstore/detail/github-travis-stat/ekkfhiophiaakmeppcnkblpbbjlnlnmh

---

## 2. Product definition

**Core loop:** detect a GitHub event -> look up the user's active theme -> play that theme's animation for that event.

**Principles**
- Visual first. Sound is an opt-in toggle.
- Never block the page: overlay is `pointer-events: none` (except a dismiss/skip), auto-ends in 1.5-4 s.
- Every event can be toggled on/off and mapped to a mood: `success`, `danger`, `info`.
- Themes are data + assets, so adding one doesn't require touching detection code.
- Works with zero setup (page-detection only). Optional GitHub token unlocks background events (see Tier B).

**Out of scope for v1:** mobile, GitLab/Bitbucket, accounts/backend, selling themes.

---

## 3. Event catalogue

Detection tiers:
- **Tier A (page):** content script on github.com sees it happen in the tab. No login or token needed.
- **Tier B (API):** extension polls the GitHub API with the user's own token (fine-grained PAT, read-only). Catches things that happen elsewhere, such as a `git push` from the terminal.

Everything below is a plan; the exact selectors and flash-message text must be verified against live GitHub during implementation, since GitHub changes its markup.

| # | Event | Mood | Tier | How we detect it (to verify) | Phase |
|---|---|---|---|---|---|
| 1 | Repo created | success | A | Navigation from `/new` to `/{owner}/{repo}` (the "Quick setup" page) | 1 |
| 2 | PR merged | success | A | PR page's state badge flips Open -> Merged (MutationObserver) | 1 |
| 3 | Repo deleted | danger | A | Redirect after `/settings` delete + flash "successfully deleted" | 1 |
| 4 | PR opened | info | A | Navigation from `/compare/...` to `/pull/{n}` | 2 |
| 5 | PR closed (unmerged) | danger | A | State badge -> Closed | 2 |
| 6 | Issue closed / opened | info | A | Issue state badge changes | 2 |
| 7 | CI / Actions passed | success | A+B | Checks box or run page turns green; or API check-run conclusion | 2 |
| 8 | CI / Actions failed | danger | A+B | Checks box or run page turns red; or API conclusion `failure` | 2 |
| 9 | Pages / deployment live | success | A+B | Pages settings "site is live", or workflow `pages build and deployment` succeeds, or Deployments API | 3 |
| 10 | Release published | success | A | Navigation to `/releases/tag/...` after publishing | 3 |
| 11 | Star / fork | info | A | Star button state flips; fork redirect | 3 |
| 12 | Push from terminal | success | B | `GET /users/{you}/events` -> `PushEvent` | 4 |
| 13 | Merge conflict | danger | A | Merge box shows conflict state | 4 |
| 14 | Streak / milestone (10th repo, 100th commit...) | success | B | Counters from the API | later |

Known risk: the Events API can lag by minutes, so push-from-terminal celebration won't be instant. We'll measure it in Phase 4 and decide whether to keep it, or to do the cleaner thing for terminal pushes: a tiny optional CLI later.

---

## 4. Architecture

```
manifest.json (MV3)
 ├─ content script (github.com/*)
 │    ├─ detectors/        one file per event, each calls emit(eventId, ctx)
 │    ├─ bus               dedupe + cooldown so one action doesn't fire twice
 │    ├─ engine/           renders overlay in a Shadow DOM, canvas for particles
 │    └─ themes/<name>/    theme.json + assets (sprites, fonts, css)
 ├─ service worker         (Phase 4) alarms + GitHub API polling
 ├─ options page           pick theme, per-event on/off, test buttons, token
 └─ chrome.storage.sync    settings
```

Choices:
- **TypeScript + esbuild (or Vite)** for bundling. Content scripts can't use plain ES-module imports, so we bundle.
- **Shadow DOM overlay** so GitHub's CSS can't break our animation and ours can't break GitHub.
- **GitHub is a SPA (Turbo navigation):** detectors listen to `turbo:load` / URL changes plus MutationObservers, not just page load.
- **Theme contract:** a theme declares, per mood (and optionally per event), a title text, colours, and a `play(ctx)` function or a sprite/CSS animation. Missing entries fall back to the default confetti theme.
- **Dev test harness:** a "Test event" button in the options page fires any event without needing to actually delete a repo.
- **Permissions:** host access to `github.com` only; `storage`; later `alarms` and `api.github.com`. Keep it minimal. It helps Web Store review and user trust.

---

## 5. Themes (planned)

Each theme gets a distinct visual language and its own copy for every event and mood. Palettes are deliberately different from each other so the picker feels like a real choice.

| Theme | Idea and palette | Success | Failure | Assets |
|---|---|---|---|---|
| **Marquee** (done, default) | Theatre: velvet, bulbs, paper. Amber on ink | "BRAVO!" bill drops, bulbs chase, confetti | "SHOW STOPPED", hazard tape | none |
| **Terminal** | CRT phosphor, scanlines, typed output. Green or amber on near-black | `$ git merge ... ✔ exit 0`, output types itself, cursor blinks | `exit 1`, red stack trace, glitch | none (canvas + mono font) |
| **Mission Control** | NASA launch room: telemetry, countdown. Off-white, signal orange, dark slate | "T-0 LIFTOFF", all stations GO, trajectory arc | "ANOMALY", abort sequence | none (SVG/CSS) |
| **Pixel Arcade** | 8-bit: "STAGE CLEAR!" / "GAME OVER". Limited 16-colour palette | blocky fireworks, bonus counter, tiny hero | "GAME OVER", continue? countdown | Press Start 2P + original sprite |
| **Web Crawler** | Spiders and webs (from the LeetCode inspiration). Black, red, silver | webs spread, "BUILD COMPILED" | red web, "BROKEN BUILD" | original SVG, drawn in-house |
| **Quiet** | For the office: a restrained toast with a hand-drawn check, no full-screen takeover | check draws itself | thin red line, one-line message | none |
| Later | Blueprint, Vintage Paper, Anime | | | commissioned or CC0 |

Dev-metaphor signature moments (replace generic "confetti" where it fits):
- **Merge:** two branch lines run toward each other and fuse into one.
- **Repo created:** a commit graph grows from a single node.
- **Repo deleted:** the repo name dissolves line by line (`rm -rf`).
- **Fun extras:** "Friday 5pm deploy" badge, "first PR of the year", "100th merge".

Order: Terminal (no assets, proves the theme contract with a second style) -> Mission Control -> Pixel Arcade -> Web Crawler -> Quiet.

---

## 6. Roadmap (we build one step at a time)

- **Phase 0, scaffold:** repo layout, MV3 manifest, build script, load unpacked in Chrome, "hello overlay" on github.com.
- **Phase 1, engine + 3 events:** overlay engine, default confetti theme, events 1-3 (repo created / PR merged / repo deleted), options page with toggles and Test buttons.
- **Phase 2, more page events:** events 4-8.
- **Phase 3, theme system + 2 themes:** theme.json contract, Matrix + Pixel Art, theme picker with live preview. Add events 9-11.
- **Phase 4, API tier:** optional token, background polling, events 12-13.
- **Phase 5, polish and ship:** icons, store listing, screenshots/GIF demo, privacy policy, Chrome Web Store + Firefox add-on, short demo video for LinkedIn.

---

## 7. Assets needed (we'll collect as each phase starts)

**Phase 0-1**
- [ ] Final name (and check Web Store / GitHub / npm / domain availability before you get attached to it)
- [ ] Extension icon: 16, 32, 48, 128 px PNG (I can generate a placeholder; you or a designer replace it later)

**Phase 3 (themes)**
- [ ] Pixel font (free options: Press Start 2P, VT323, Silkscreen, all OFL-licensed)
- [ ] Pixel sprites: a hero character, particles, "stage clear / game over" art. Source: CC0 packs (Kenney, OpenGameArt) or commission. **Record each licence in `assets/LICENSES.md`.**
- [ ] Web Crawler: spider and web artwork, which I can draw as SVG/CSS myself
- [ ] Optional sound effects, CC0 only

**Phase 5 (ship)**
- [ ] Store screenshots (1280x800), 440x280 promo tile, short demo GIF/MP4
- [ ] Privacy policy page (a single static page; GitHub Pages works)

Rule: don't use copyrighted game sprites, logos or anime characters from the internet. Stores reject that, and the author can file takedowns. Original or CC0 only.

---

## 8. Risks

- **GitHub DOM changes break detectors.** Mitigation: one small detector per event, a "detector health" test page, and fall back gracefully (no animation instead of errors).
- **Double-firing / false positives** (e.g. visiting an already-merged PR). Mitigation: only fire on a *transition* seen in the live tab, never on first load.
- **Annoyance.** Mitigation: cooldowns, per-event toggles, a global "quiet mode", and respecting `prefers-reduced-motion`.
- **Store review for token handling.** Mitigation: the token is optional, stored only in `chrome.storage.local`, sent only to `api.github.com`.

---

## 9. Open decisions

1. Final name.
2. Pure content-script v1 (no token) first: **recommended**.
3. Firefox support at launch or after Chrome (the LeetCode one shipped both; MV3 code is mostly portable).

---

## Status (2026-10-10)

Name: **Footlit** (checked on npm, .com, .dev, .app, .io, web search and GitHub; no existing product). Design rules: `DESIGN.md`.

Built: logo + icons, animation engine, **Marquee** theme (applause / farewell / alarm), detectors for repo created / PR merged / repo deleted, popup, settings page with live preview and activity log.
Verified: typecheck clean; overlay screenshots reviewed; popup and settings render without errors (stubbed chrome APIs).
**Not verified:** the detectors on real, logged-in github.com. PR-badge markup was checked against a public page; the repo-create and repo-delete flows rely on assumptions about GitHub's UI. Turn on debug (`localStorage.setItem('footlit:debug','1')` on github.com) and watch the console.
Not built yet: Pixel theme, CI/deploy/release events, API (token) tier, store listing assets.

Run: `npm install`, `npm run build`, then load `dist/` at chrome://extensions (Developer mode, Load unpacked).

Update 2026-10-11: owner tested the extension in Chrome and it works. Repo initialised (private) with a remote; `.gitignore` added.

Update 2026-10-11 (later): added **CI passed / CI failed** events and the **Terminal** theme.
- CI detector (`src/content/detectors/ci.ts`): PR merge-box headings (matched by text; the box is client-side rendered) and the Actions run page "Status" cell (verified against a real public run page). Fires only on a pending -> passed/failed transition it watched happen.
- Terminal theme: JetBrains Mono, scripted `gh`/`git` commands, ASCII merge graph, decode effect, chromatic glitch on failure, dissolve on delete. ASCII only plus SVG icons (the bundled font subset lacks check/block glyphs).
- Theme picker added to the settings page; "Change" link in the popup.
- `npm test` runs 13 detector tests (positive and negative cases) against fixture pages using the real built content script. This caught and fixed a quiet-page arming bug and a document_start observer crash.
- **Still unverified on live GitHub:** the PR merge-box heading text ("All checks have passed", "Some checks were not successful", "Some checks haven't completed yet") and the repo create/delete flows. Use the debug flag and report what the console shows.

---

## 10. Full plan: extension -> site -> launch

**Stage 1: finish the extension (current).** This is the product; the rest only amplifies it.
1. Detector reliability on real GitHub (keep the debug trail, add fixture tests).
2. Phase 2 events, CI passed/failed first (the most-wanted moment).
3. Themes in the order of section 5, each to the quality bar above.
4. Per-event theme choice, theme gallery in settings, milestone moments, local "season ticket" stats.
5. Firefox build; Edge (Chromium) listing comes nearly free.
6. Store assets: screenshots, promo tile, privacy policy, store description.

**Stage 2: marketing site (Next.js).** Landing page, theme gallery with live previews (the same engine runs in the page), install buttons, changelog, privacy page, a short FAQ. Static export where possible; deploy on Vercel. SEO targets: "github confetti extension", "github themes chrome", "celebrate merged pull request".

**Stage 3: measurement, kept small and honest.**
- **Already free:** the Chrome Web Store dashboard gives installs, uninstalls, impressions and country. Don't rebuild this.
- **Site analytics:** a cookieless tool (Plausible or Umami) plus Google Search Console. Google Analytics only with a consent banner; many developers block it, so the numbers would be low anyway.
- **Supabase (when there is a question to answer):** newsletter/waitlist, feedback form, community theme submissions, and an *optional* anonymous counter (below). An admin panel comes after there are users; until then the dashboards above and the Supabase table viewer are enough.

**Extension telemetry rules (if we add any):**
- **Opt-in, off by default,** with plain wording and a "see exactly what is sent" view. The settings page currently promises nothing leaves the browser; that stays true unless the user opts in.
- Send only: random install id, extension version, theme id, event *type* counts. Never repo names, URLs, usernames or titles.
- No city-level location. Country already comes from the Web Store dashboard; store no IPs.
- Disclose it in the Chrome Web Store privacy section and the privacy page (store policy and GDPR both require this). Developers inspect network traffic; one undisclosed ping would damage trust permanently.

**Stage 4: launch.**
- Demo video: a real merge, then a fast cut through the themes (20 to 30 s).
- Channels: Product Hunt, Show HN, r/github and r/webdev, dev.to, LinkedIn (where this idea started).
- Consider open-sourcing the extension (or just the themes) once polished: for developer tools, a good public repo is itself marketing, and it invites community themes.

**Growth ideas worth building into the product:**
- **Shareable performance card:** after a celebration, one click renders the ticket stub ("Admit one, No. 214: PR merged") as an image for LinkedIn/X, with a small Footlit mark. Free distribution built into the feature.
- **Community themes:** a documented theme format (JSON + assets), a gallery on the site, "theme of the week".
- **Season-ticket stats:** local streaks and counts of performances, shown in the popup.
- **GitHub profile badge / README snippet** linking back to the site.
