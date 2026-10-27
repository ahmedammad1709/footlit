import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { site } from '@/site.config';
import { FootlitProvider } from '@/lib/footlit';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import './globals.css';

const TITLE = 'Footlit: celebrate GitHub merges, checks and releases';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: TITLE, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: site.url }],
  creator: site.author,
  category: 'developer tools',
  keywords: ['GitHub extension', 'GitHub confetti', 'celebrate merged pull request', 'GitHub themes', 'GitHub animation', 'Chrome extension for GitHub', 'Firefox add-on for GitHub', 'pull request celebration', 'developer tools', 'open source GitHub extension'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: site.name,
    locale: 'en_US',
    title: TITLE,
    description: site.description,
    images: [{ url: '/mock/og.png', width: 1200, height: 630, alt: 'Footlit: a marquee sign reading BRAVO over a merged pull request' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: site.description, images: ['/mock/og.png'] },
  ...(site.googleVerification || site.bingVerification
    ? { verification: { ...(site.googleVerification ? { google: site.googleVerification } : {}), ...(site.bingVerification ? { other: { 'msvalidate.01': site.bingVerification } } : {}) } }
    : {}),
};

export const viewport: Viewport = { themeColor: '#1B1612' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/league-gothic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/newsreader.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <FootlitProvider>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </FootlitProvider>
        <Script src="/engine/footlit-engine.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
