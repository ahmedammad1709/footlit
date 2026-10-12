# Footlit SEO playbook

What is built into the site, what you must do once, and what grows traffic over time. Nobody can guarantee a ranking; this maximises the odds and tells you how to measure.

## 1. What the site already does (technical SEO)

Verified by `npm run seo` in `site/` (it crawls the built site and fails on any of these):

- Unique `<title>` (<= 65 characters) and meta description (<= 160) on every page; one `<h1>` per page; `<html lang>`; viewport meta.
- A canonical link on every page, Open Graph and Twitter cards with real preview images (the home card is `og.png`; each theme page uses that theme's own screenshot).
- **Structured data (JSON-LD):** `SoftwareApplication` (free, version, download URL, screenshots, feature list), `WebSite`, `Person` (the author, with social profiles once you add them), `FAQPage` with the full answers, and `BreadcrumbList` on inner pages. No fake ratings or reviews, on purpose: search engines penalise invented ones.
- `sitemap.xml` listing every page, `robots.txt` pointing to it, `llms.txt` for AI assistants, `noindex` on the 404 page only.
- Eleven indexable pages: Home, Themes, six theme pages (each with a live demo), Events, Changelog, Privacy.
- Internal links between all of them, descriptive image `alt` text, image dimensions set (no layout shift), fonts preloaded, a 72 KB engine loaded after the page is interactive, fully static HTML (fast, crawlable without JavaScript).

## 2. Do these once, before launch

1. **Domain.** Buy it, then set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` in your host, and rebuild. Until you do, canonical links, the sitemap and social cards point at localhost.
2. **Search Console.** Add the domain at search.google.com/search-console, choose the *HTML tag* method, and put the token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (just the `content` value). Rebuild, verify, then **submit `https://yourdomain.com/sitemap.xml`**. Use *URL inspection -> Request indexing* on the home page and the Themes page.
3. **Bing Webmaster Tools.** Same idea (`NEXT_PUBLIC_BING_SITE_VERIFICATION`); you can import the site from Search Console. Bing also feeds DuckDuckGo and several AI assistants.
4. **Check the output:** Google's Rich Results Test on the home page (it should see `SoftwareApplication` and `FAQPage`), PageSpeed Insights, and a social-card preview of the home and a theme page.
5. **Fill in `site/src/site.config.ts`:** your three social links (they also become the author's profiles in structured data) and the store URLs when live.

## 3. Keyword map (one main idea per page)

| Page | Main searches it should win | Why this page |
|---|---|---|
| `/` | github extension, celebrate github merges, github confetti extension | Brand and the broad idea |
| `/themes/` | github extension themes, github animation themes | The comparison page |
| `/themes/marquee/` | github confetti, celebrate merged pull request | Confetti is the most-searched version of the idea |
| `/themes/terminal/` | github terminal theme, git merge graph animation | Developer-flavoured long tail |
| `/themes/mission-control/` | github release celebration, deploy countdown | Release/deploy moments |
| `/themes/pixel-arcade/` | github pixel art theme, 8-bit github | Retro/gaming crowd |
| `/themes/web-crawler/` | github halloween extension, bug squashed | Seasonal and novelty |
| `/themes/quiet/` | minimal github extension, github notification toast | People who want less |
| `/events/` | github pages deploy notification, github checks passed animation | Questions about specific events |
| `/changelog/` | (freshness signal) | Shows the project is alive |

Write naturally for people; the page copy already contains these phrases in context. Do not stuff keywords.

## 4. Store listings are part of SEO

Most installs come from the Chrome Web Store, so its search matters more than Google at first.

- Keep the extension name **Footlit** (using "GitHub" in the name risks a trademark complaint). Put "GitHub" and the key phrases in the **summary** and the **first paragraph** of the description (already done in `docs/STORE_LISTING.md`).
- Fill every field: website (your domain), support/contact, privacy-policy URL (`/privacy/`), category *Developer Tools*, all seven screenshots, both promo tiles, and a short demo video if you can.
- **Reviews drive ranking.** Ask your first real users for an honest rating; a handful in the first weeks matters a lot.
- Link the same site from the Firefox listing; consistent links help the site's authority too.

## 5. Off-site: how people actually find it

Search engines rank sites other sites link to. In rough order of effort and payoff:

1. **Your own profiles:** put the site in your Instagram and Facebook bios and WhatsApp business description.
2. **Launch posts:** Product Hunt, Show HN ("Show HN: Footlit, a GitHub extension that gives merges a proper entrance"), r/github, r/webdev, r/chrome_extensions, dev.to, LinkedIn.
3. **A 20-second video** (the hero demo, then a quick cut through the themes). Post it natively on LinkedIn and X, and embed it on the site and store listing.
4. **Directories:** AlternativeTo, Chrome extension roundups, "awesome" lists for GitHub tools (open a PR adding Footlit where it fits).
5. **Articles that earn links** (write one at a time, genuinely useful): *"Why celebrating merged PRs helps a team"*, *"How we made our deploys feel like launches"*, *"Building a browser extension with a Shadow DOM overlay"* (a technical write-up with the engine ideas). Link each to the relevant theme page.
6. **Press kit:** the `store/` folder already has screenshots and promo tiles.

## 6. Measuring

- Search Console -> Performance: which queries show the site, which pages get clicks. Check weekly for the first two months.
- The Chrome Web Store dashboard shows impressions, installs and where people arrive from.
- If you later add analytics, use a cookieless tool and **update the privacy page in the same change** (the page currently, and truthfully, says there is none).

## 7. Keep it healthy

- After any content change: `npm run build` then `npm run seo` in `site/` (it fails on regressions such as a missing title or a broken link).
- When the extension changes: follow `site/README.md` ("When the extension changes"). The changelog page is generated from `CHANGELOG.md`, so a release note is also fresh content for search engines.
