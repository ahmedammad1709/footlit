import type { MetadataRoute } from 'next';
import { site } from '@/site.config';
import { THEME_PAGES } from '@/data/content';
import releases from '@/data/changelog.json';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // a fixed date: it should only change when the content does, not on every build
  const lastModified = new Date(site.published);
  const latest = new Date(releases[0].date);
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly', modified = lastModified) => ({ url: `${site.url}${path}`, lastModified: modified, changeFrequency, priority });
  return [
    page('/', 1, 'weekly', latest),
    page('/themes/', 0.9, 'monthly'),
    ...THEME_PAGES.map((t) => page(`/themes/${t.slug}/`, 0.8, 'monthly')),
    page('/events/', 0.8, 'monthly'),
    page('/changelog/', 0.5, 'weekly', latest),
    page('/privacy/', 0.4, 'yearly'),
  ];
}
