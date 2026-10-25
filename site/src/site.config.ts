/**
 * Everything you are likely to edit lives here.
 *
 * - `social`: fill in your real links. Empty ones are simply not shown on the live site
 *   (while running `npm run dev` they appear as dashed placeholders so you can see where they go).
 *   Filled-in links are also published to search engines as the author's profiles.
 * - `chromeStoreUrl` / `firefoxStoreUrl`: the store listings. With `chromeStoreUrl` set, the hero and the install
 *   section lead with "Add to Chrome" and the zip becomes the manual route. Empty means "coming soon" and the zip leads.
 *   Set `firefoxStoreUrl` once the Firefox listing is approved.
 * - `NEXT_PUBLIC_SITE_URL`: set to the deployed address (canonical links, sitemap, social cards, structured data).
 * - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION`: the verification tokens from
 *   Google Search Console and Bing Webmaster Tools (the "HTML tag" method; paste only the content value).
 */
export const site = {
  name: 'Footlit',
  tagline: 'GitHub, with stage lighting.',
  /** What search results show under the title: lead with what it is and what it does (<= 160 characters). */
  description: 'Free GitHub extension for Chrome and Firefox. Plays a themed full-screen animation when you merge a pull request, pass checks or publish a release.',
  longDescription: 'Footlit gives GitHub moments a proper entrance: themed full-screen animations for merged pull requests, green checks, releases, deploys and more. Free, private, six hand-built themes.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  author: 'Ammad Ahmed',
  /** the studio the product is built at; linked from the footer and published as the author's employer */
  agency: { name: 'Codeveil Studio', url: 'https://codeveilstudio.tech' },
  updated: 'October 12, 2026',
  /** ISO date of the first public release, used in structured data */
  published: '2026-10-12',
  social: {
    instagram: 'https://www.instagram.com/ammad_innovates/', // e.g. https://instagram.com/your_handle
    facebook: 'https://www.facebook.com/profile.php?id=100069493475592', // e.g. https://facebook.com/your.page
    whatsapp: 'https://wa.me/923141038814', // e.g. https://wa.me/923001234567  (country code, no + or spaces)
  },
  chromeStoreUrl: 'https://chromewebstore.google.com/detail/fkjnlcolffmaaneilmchdejmlkgnimlf',
  /** Chrome Web Store user count, shown as social proof. Use the dashboard's number, rounded down ("50+"). Leave empty to hide it. */
  chromeUsers: '50+',
  firefoxStoreUrl: 'https://addons.mozilla.org/en-US/firefox/addon/footlit/',
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  bingVerification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '',
} as const;

export const isDev = process.env.NODE_ENV !== 'production';
