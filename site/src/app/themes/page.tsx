import type { Metadata } from 'next';
import Link from 'next/link';
import { THEMES } from '@/lib/data';
import { THEME_PAGES } from '@/data/content';
import { JsonLd, breadcrumbs, pageMeta } from '@/lib/seo';
import { PageShell } from '@/components/PageShell';
import { TicketButton } from '@/components/TicketButton';
import c from '@/components/Content.module.css';

export const metadata: Metadata = pageMeta({
  title: 'GitHub extension themes: six hand-built looks',
  description: 'Six hand-built Footlit themes for GitHub: Marquee, Terminal, Mission Control, Pixel Arcade, Web Crawler and Quiet. See each one play live.',
  path: '/themes/',
  imageAlt: 'The six Footlit themes',
  keywords: ['github extension themes', 'github animation themes', 'celebrate pull request merge', 'chrome extension themes for github'],
});

export default function Themes() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumbs([['Footlit', '/'], ['Themes', '/themes/']])] }} />
      <PageShell
        crumbs={[['Footlit', '/'], ['Themes']]}
        eyebrow="Six themes"
        title={<>Pick a look<br /><em style={{ fontStyle: 'normal', color: 'var(--lit)' }}>for every moment.</em></>}
        lede="Footlit’s themes are complete little productions, not colour swatches. Each has a celebration, a farewell and an alarm version for every GitHub event, and each one is written in its own voice."
        actions={<TicketButton href="/#install" title="Get Footlit" stub="Free" tone="tungsten" />}
      >
        <section className={`paper ${c.section}`}>
          <div className="wrap">
            <h2 className={`display ${c.h2}`}>Meet the themes</h2>
            <p className={`${c.p} ${c.muted}`}>Open any theme to see what it does for each event and play it live in your browser. You can set one default, or give every event its own theme in the extension’s settings.</p>
            <div className={c.cards}>
              {THEME_PAGES.map((p) => {
                const t = THEMES.find((x) => x.id === p.id)!;
                return (
                  <Link key={p.id} href={`/themes/${p.slug}/`} prefetch={false} className={c.card}>
                    <img src={`/mock/theme-${p.id}.png`} width={1280} height={720} alt={`The ${p.h1} theme playing over a GitHub profile page`} loading="lazy" />
                    <div>
                      <h3 className="display">{p.h1}</h3>
                      <p>{t.tagline}</p>
                      <span className={c.more}>See the theme →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className={`paper2 ${c.section}`}>
          <div className="wrap">
            <h2 className={`display ${c.h2}`}>Which one is for you?</h2>
            <div className={c.tablewrap}>
              <table>
                <thead><tr><th>Theme</th><th>Feels like</th><th>Best for</th><th>Length</th></tr></thead>
                <tbody>
                  {THEME_PAGES.map((p) => (
                    <tr key={p.id}>
                      <td><Link prefetch={false} href={`/themes/${p.slug}/`}>{p.h1}</Link></td>
                      <td>{p.eyebrowNote}</td>
                      <td>{p.bestFor}</td>
                      <td>about {p.seconds} seconds</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${c.p} ${c.muted}`} style={{ marginTop: 22 }}>Every theme honours your system’s reduced-motion setting by showing a calm still card, and pressing Esc skips any show.</p>
          </div>
        </section>
      </PageShell>
    </>
  );
}
