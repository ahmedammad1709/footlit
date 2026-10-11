import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { THEMES } from '@/lib/data';
import { THEME_PAGES } from '@/data/content';
import { JsonLd, breadcrumbs, pageMeta } from '@/lib/seo';
import { PageShell } from '@/components/PageShell';
import { TicketButton } from '@/components/TicketButton';
import { ThemeDemo } from '@/components/ThemeDemo';
import c from '@/components/Content.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return THEME_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = THEME_PAGES.find((t) => t.slug === slug);
  if (!p) return {};
  return pageMeta({ title: p.seoTitle, description: p.description, path: `/themes/${p.slug}/`, image: `/mock/theme-${p.id}.png`, imageWidth: 1280, imageHeight: 720, imageAlt: `The ${p.h1} theme playing over a GitHub profile page`, keywords: p.keywords });
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = THEME_PAGES.find((t) => t.slug === slug);
  const meta = THEMES.find((t) => t.id === p?.id);
  if (!p || !meta) notFound();
  const n = THEME_PAGES.findIndex((t) => t.id === p.id) + 1;
  const others = THEME_PAGES.filter((t) => t.id !== p.id);

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumbs([['Footlit', '/'], ['Themes', '/themes/'], [p.h1, `/themes/${p.slug}/`]])] }} />
      <PageShell
        crumbs={[['Footlit', '/'], ['Themes', '/themes/'], [p.h1]]}
        eyebrow={`Theme ${String(n).padStart(2, '0')} of ${String(THEME_PAGES.length).padStart(2, '0')} / ${p.eyebrowNote}`}
        title={<>{p.h1} <span style={{ color: 'var(--lit)' }}>theme</span></>}
        lede={p.intro}
        actions={<TicketButton href="/#install" title="Get Footlit" sub={`Free · ${p.h1} included`} stub="Free" tone="tungsten" />}
      >
        <section className={`paper ${c.section}`} aria-labelledby="h-try">
          <div className="wrap">
            <h2 id="h-try" className={`display ${c.h2}`}>Try it, right here</h2>
            <p className={`${c.p} ${c.muted}`}>This is the real engine from the extension. Pick an event and a mood and the {p.h1} theme plays over a mock GitHub profile.</p>
            <ThemeDemo themeId={p.id} themeName={p.h1} />
          </div>
        </section>

        <section className={`paper ${c.section}`} aria-labelledby="h-see">
          <div className="wrap">
            <h2 id="h-see" className={`display ${c.h2}`}>What you’ll see</h2>
            <p className={`${c.p} ${c.muted}`}>Every GitHub event maps to one of three moods, and the {p.h1} theme has its own take on each.</p>
            <div className={c.cols}>
              <div className={`${c.col} ${c.applause}`}>
                <h3 className="display">Applause <small>Something went right</small></h3>
                <ul>{p.applause.map(([e, d]) => <li key={e}><b>{e}</b><span>{d}</span></li>)}</ul>
              </div>
              <div className={c.col}>
                <h3 className="display">Farewell <small>Something ended</small></h3>
                <ul>{p.farewell.map(([e, d]) => <li key={e}><b>{e}</b><span>{d}</span></li>)}</ul>
              </div>
              <div className={`${c.col} ${c.alarm}`}>
                <h3 className="display">Alarm <small>Something broke</small></h3>
                <ul>{p.alarm.map(([e, d]) => <li key={e}><b>{e}</b><span>{d}</span></li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <section className={`paper2 ${c.section}`} aria-labelledby="h-details">
          <div className="wrap">
            <h2 id="h-details" className={`display ${c.h2}`}>The details</h2>
            <dl className={c.facts}>
              <div><dt>Palette</dt><dd><span className={c.sw}>{meta.swatch.map((x) => <i key={x} style={{ background: x }} />)}</span>{p.look}</dd></div>
              <div><dt>Typography</dt><dd>{p.fonts}</dd></div>
              <div><dt>Length</dt><dd>About {p.seconds} seconds; shorter or longer in settings</dd></div>
              <div><dt>Best for</dt><dd>{p.bestFor}</dd></div>
              <div><dt>Reduced motion</dt><dd>Shows a calm still card instead of moving</dd></div>
              <div><dt>Skipping</dt><dd>Press Esc at any time</dd></div>
            </dl>
            <figure className={c.shot}>
              <img src={`/mock/theme-${p.id}.png`} width={1280} height={720} alt={`The ${p.h1} theme in Footlit playing over a GitHub profile page, a still from the animation`} loading="lazy" />
              <figcaption>{p.h1}: a still from the animation</figcaption>
            </figure>
          </div>
        </section>

        <section className={`paper ${c.section}`} aria-labelledby="h-more">
          <div className="wrap">
            <h2 id="h-more" className={`display ${c.h2}`}>The other themes</h2>
            <div className={`${c.cards} ${c.small}`}>
              {others.map((o) => (
                <Link key={o.id} href={`/themes/${o.slug}/`} prefetch={false} className={c.card}>
                  <img src={`/mock/theme-${o.id}.png`} width={1280} height={720} alt={`The ${o.h1} theme`} loading="lazy" />
                  <div><h3 className="display">{o.h1}</h3></div>
                </Link>
              ))}
            </div>
            <p className={`${c.p} ${c.muted}`} style={{ marginTop: 26 }}>See all of them on the <Link prefetch={false} href="/themes/">themes page</Link>, or read <Link prefetch={false} href="/events/">which GitHub events Footlit reacts to</Link>.</p>
          </div>
        </section>

        <section className={c.cta}>
          <div className="wrap">
            <h2 className={`display ${c.h2}`}>Give your merges an entrance.</h2>
            <p>Footlit is free, runs only on github.com and sends nothing anywhere. Install it in about a minute.</p>
            <TicketButton href="/#install" title="Get Footlit" stub="Free" tone="tungsten" />
          </div>
        </section>
      </PageShell>
    </>
  );
}
