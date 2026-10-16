# Footlit website

The marketing site for the Footlit extension: Next.js (App Router), exported as static pages. It reuses the extension's own overlay engine and themes, so every demo on the page is the real thing.

## Run it

```
cd site
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into site/out
```

`npm run build` prints a short "Before you publish" list of anything still empty in `src/site.config.ts`.

## Things you must fill in

Everything is in **`src/site.config.ts`**:

| Setting | What it does |
|---|---|
| `social.instagram`, `social.facebook`, `social.whatsapp` | The footer's "Built by Ammad Ahmed" links. Empty ones are hidden on the live site (shown dashed in `npm run dev`). WhatsApp format: `https://wa.me/<country code and number, digits only>` |
| `chromeStoreUrl`, `firefoxStoreUrl` | Both official store listings are connected. Chrome and Firefox visitors can install directly from their store. |
| `NEXT_PUBLIC_SITE_URL` (environment variable) | The deployed address, used for canonical links, the sitemap and social cards. Set it in your host's settings, e.g. `https://footlit.example.com` |

## When the extension changes

The site takes the engine, themes, event list, fonts, version and download zips from the extension. After changing the extension:

```
# repo root
npm run build
npm run package        # fresh zips in release/
npm run site-assets    # re-render the mockup images from the real UI
# site
npm run prep           # re-bundle the engine, copy fonts/zips, regenerate src/data/footlit.json
```

All of that output is committed (`public/engine`, `public/fonts`, `public/mock`, `public/downloads`, `src/data`), so a host only needs to run `npm run build`. For an extension change, `npm run build:site` from the repository root packages both browser builds, prepares the site assets, then builds the site in order. This requires dependencies installed in both the root and `site` directories. A site-only hosting build does not need the root development dependencies.

## Structure

```
src/app/            layout, home page, /privacy, sitemap, robots, 404
src/components/     Hero (+ PrDemo, a clickable mock pull request), VideoDemo, Showcase,
                    Install, Faq, Nav, Footer, TicketButton, and detail-page previews
src/lib/footlit.tsx connects React to window.Footlit (the extension engine, public/engine/footlit-engine.js)
src/lib/data.ts     static data for server components
public/downloads/   the extension zips visitors download
public/demo/        click-to-play MP4 and its poster; no video request before playback
```

## Checking the redesign

After building, `npm run test:ui` checks the live demo, theme previews, video playback, mobile navigation, detail routes, browser errors, and horizontal overflow at 320–1440px. Screenshots are saved under `.shots/redesign/`. Set `CHROME_PATH` if Chrome is installed somewhere other than the default Windows location.

`npm run demo` prepares a silent 17-second web excerpt from `../video/out/footlit-launch-1920x1080.mp4`, using the existing video toolchain. The generated MP4 and poster are committed, so building or hosting the site does not require the original film or FFmpeg.

## Deploying

Any static host works. On Vercel: import the repo, set **Root Directory** to `site`, add `NEXT_PUBLIC_SITE_URL`, deploy. Netlify, Cloudflare Pages and GitHub Pages work with the `out/` folder.

## SEO

`npm run seo` (after `npm run build`) audits every page like a crawler: titles, descriptions, canonicals, one H1, structured data, image alt text, internal links, the sitemap. It fails on regressions. Set these in your host before the production build:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The real address (canonical links, sitemap, social cards, structured data) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console "HTML tag" token (the content value only) |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools token |

The full plan, keyword map and launch checklist are in `../docs/SEO.md`.

## Notes

- The site uses **no cookies and no analytics**, and the privacy page says so. If you add analytics later, update `src/app/privacy/page.tsx` ("About this website") in the same change.
- The footer disclaimer ("not affiliated with GitHub, Inc.") should stay.
- Design rules are the extension's (`../DESIGN.md`): paper, ink, tungsten, velvet; League Gothic, Newsreader, DM Mono; no gradients, no glass, no emoji.
