import type { MetadataRoute } from 'next';
import { site } from '@/site.config';
import { THEME_PAGES } from '@/data/content';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // a fixed date: it should only change when the content does, not on every build
  const lastModified = new Date(site.published);
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly') => ({ url: `${site.url}${path}`, lastModified, changeFrequency, priority });
  return [
    page('/', 1, 'weekly'),
    page('/themes/', 0.9, 'monthly'),
    ...THEME_PAGES.map((t) => page(`/themes/${t.slug}/`, 0.8, 'monthly')),
    page('/events/', 0.8, 'monthly'),
    page('/changelog/', 0.5, 'weekly'),
    page('/privacy/', 0.4, 'yearly'),
  ];
}
