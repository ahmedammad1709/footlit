import { site } from '@/site.config';
import { DOWNLOADS, EVENTS, THEMES, VERSION } from '@/lib/data';
import { JsonLd, abs, authorSameAs } from '@/lib/seo';
import { Hero } from '@/components/Hero';
import { Ticker } from '@/components/Ticker';
import { ThemeLab } from '@/components/ThemeLab';
import { Programme } from '@/components/Programme';
import { HowItWorks } from '@/components/HowItWorks';
import { Inside } from '@/components/Inside';
import { Trust } from '@/components/Trust';
import { Install } from '@/components/Install';
import { Faq, FAQ_ITEMS } from '@/components/Faq';

export default function Home() {
  const studio = { '@type': 'Organization', '@id': abs('/#studio'), name: site.agency.name, url: site.agency.url };
  const author = { '@type': 'Person', '@id': abs('/#author'), name: site.author, url: site.url, worksFor: { '@id': abs('/#studio') }, ...(authorSameAs().length ? { sameAs: authorSameAs() } : {}) };
  const graph = [
    studio,
    author,
    {
      '@type': 'WebSite',
      '@id': abs('/#website'),
      url: site.url,
      name: site.name,
      description: site.longDescription,
      inLanguage: 'en',
      publisher: { '@id': abs('/#author') },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': abs('/#app'),
      name: site.name,
      alternateName: 'Footlit for GitHub',
      description: site.longDescription,
      url: site.url,
      image: abs('/mock/og.png'),
      screenshot: [abs('/mock/settings.png'), abs('/mock/popup.png')],
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'Browser extension',
      operatingSystem: 'Windows, macOS, Linux',
      browserRequirements: 'Requires Chrome 111 or later, Microsoft Edge, Brave or Firefox 140 or later',
      softwareVersion: VERSION,
      datePublished: site.published,
      dateModified: site.published,
      inLanguage: 'en',
      isAccessibleForFree: true,
      ...(DOWNLOADS.chrome ? { downloadUrl: abs(DOWNLOADS.chrome.file), fileSize: `${DOWNLOADS.chrome.kb} KB` } : {}),
      featureList: [
        `${EVENTS.length} GitHub events: repositories, pull requests, checks, deploys, releases and issues`,
        `${THEMES.length} hand-built animation themes: ${THEMES.map((t) => t.name).join(', ')}`,
        'Per-event theme choice, quiet mode and reduced-motion support',
        'No network requests, no accounts, no analytics',
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      author: { '@id': abs('/#author') },
      publisher: { '@id': abs('/#author') },
    },
    {
      '@type': 'FAQPage',
      '@id': abs('/#faq'),
      mainEntity: FAQ_ITEMS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.text } })),
    },
  ];
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': graph }} />
      <Hero />
      <Ticker />
      <ThemeLab />
      <Programme />
      <HowItWorks />
      <Inside />
      <Trust />
      <Install />
      <Faq />
    </>
  );
}
