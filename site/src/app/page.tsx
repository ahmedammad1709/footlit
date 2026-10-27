import { site } from '@/site.config';
import { DOWNLOADS, EVENTS, THEMES, VERSION } from '@/lib/data';
import { JsonLd, abs, authorSameAs } from '@/lib/seo';
import { Hero } from '@/components/Hero';
import { Showcase } from '@/components/Showcase';
import { VideoDemo } from '@/components/VideoDemo';
import { Story } from '@/components/Story';
import { Moments } from '@/components/Moments';
import { Trust } from '@/components/Trust';
import { Install } from '@/components/Install';
import { Faq, FAQ_ITEMS } from '@/components/Faq';
import releases from '@/data/changelog.json';

const LATEST = releases[0].date;

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
      browserRequirements: 'Requires Chrome 111 or later (or another Chromium browser) or Firefox 140 or later',
      softwareVersion: VERSION,
      datePublished: site.published,
      dateModified: LATEST,
      inLanguage: 'en',
      license: 'https://opensource.org/licenses/MIT',
      ...(site.repoUrl ? { sameAs: [site.repoUrl, site.chromeStoreUrl, site.firefoxStoreUrl].filter(Boolean) } : {}),
      isAccessibleForFree: true,
      ...(DOWNLOADS.chrome ? { downloadUrl: abs(DOWNLOADS.chrome.file), fileSize: `${DOWNLOADS.chrome.kb} KB` } : {}),
      ...(site.chromeStoreUrl ? { installUrl: site.chromeStoreUrl } : {}),
      featureList: [
        `${EVENTS.length} GitHub events: repositories, pull requests, checks, deploys, releases and issues`,
        `${THEMES.length} hand-built animation themes: ${THEMES.map((t) => t.name).join(', ')}`,
        'Per-event theme choice, quiet mode and reduced-motion support',
        'No accounts or telemetry; activity stored locally',
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      author: { '@id': abs('/#author') },
      publisher: { '@id': abs('/#author') },
    },
    ...(site.repoUrl
      ? [{
          '@type': 'SoftwareSourceCode',
          '@id': abs('/#source'),
          name: `${site.name} source code`,
          codeRepository: site.repoUrl,
          programmingLanguage: 'TypeScript',
          license: 'https://opensource.org/licenses/MIT',
          targetProduct: { '@id': abs('/#app') },
          author: { '@id': abs('/#author') },
        }]
      : []),
    {
      '@type': 'VideoObject',
      '@id': abs('/#film'),
      name: 'Footlit in 44 seconds',
      description: 'A 44-second film: what happens when you merge a pull request, then Footlit playing a themed full-screen show for repository, check, merge and release events across six themes.',
      thumbnailUrl: abs('/demo/poster-launch.jpg'),
      contentUrl: abs('/demo/footlit-marketing.mp4'),
      uploadDate: '2026-10-16',
      duration: 'PT44S',
      inLanguage: 'en',
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
      <VideoDemo />
      <Story />
      <Showcase />
      <Moments />
      <Trust />
      <Install />
      <Faq />
    </>
  );
}
