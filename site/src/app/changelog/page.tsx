import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import releases from '@/data/changelog.json';
import { JsonLd, breadcrumbs, pageMeta } from '@/lib/seo';
import { PageShell } from '@/components/PageShell';
import { TicketButton } from '@/components/TicketButton';
import c from '@/components/Content.module.css';

export const metadata: Metadata = pageMeta({
  title: 'Changelog: what’s new in Footlit',
  description: 'Every release of Footlit, the GitHub extension that celebrates merges, checks and releases: new events, themes and fixes, newest first.',
  path: '/changelog/',
  imageAlt: 'Footlit changelog',
});

/** Turn **bold** and `code` in a changelog line into elements. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

export default function Changelog() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumbs([['Footlit', '/'], ['Changelog', '/changelog/']])] }} />
      <PageShell
        crumbs={[['Footlit', '/'], ['Changelog']]}
        eyebrow="Release notes"
        title={<>What’s new<br /><em style={{ fontStyle: 'normal', color: 'var(--lit)' }}>in Footlit.</em></>}
        lede="Every release, newest first. Installed from the store, you get these automatically. Installed from a zip? Download the latest version from the install section."
        actions={<TicketButton href="/#install" title="Get the latest" stub="Free" tone="tungsten" />}
      >
        <section className={`paper ${c.section}`}>
          <div className="wrap">
            {releases.map((r) => (
              <div key={r.version} className={c.release}>
                <div>
                  <h2 className="display">v{r.version}</h2>
                  <time dateTime={r.date}>{r.date}</time>
                </div>
                <div>
                  <ul>{r.bullets.map((b) => <li key={b}>{inline(b)}</li>)}</ul>
                  {r.notes.map((n) => <p key={n}>{inline(n)}</p>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
