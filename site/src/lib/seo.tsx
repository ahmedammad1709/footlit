import type { Metadata } from 'next';
import { site } from '@/site.config';

export const abs = (path: string) => `${site.url}${path.startsWith('/') ? path : `/${path}`}`;

interface PageMetaInput {
  /** page title without the brand; the layout adds " | Footlit" */
  title: string;
  description: string;
  /** canonical path with trailing slash, e.g. /themes/terminal/ */
  path: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  keywords?: string[];
}

/** One place that produces consistent title, description, canonical, Open Graph and Twitter metadata. */
export function pageMeta({ title, description, path, image = '/mock/og.png', imageWidth = 1200, imageHeight = 630, imageAlt, keywords }: PageMetaInput): Metadata {
  const full = `${title} | ${site.name}`;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, siteName: site.name, title: full, description, images: [{ url: image, width: imageWidth, height: imageHeight, alt: imageAlt ?? title }] },
    twitter: { card: 'summary_large_image', title: full, description, images: [image] },
  };
}

/** Renders a JSON-LD block. Content is built from our own data, never from user input. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function breadcrumbs(items: [name: string, path: string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  };
}

/** The author's public profiles, used by search engines to connect the site with its maker. */
export function authorSameAs(): string[] {
  return Object.values(site.social).filter(Boolean) as string[];
}
