import type { Metadata } from 'next';
import Link from 'next/link';
import { EVENT_BY_ID, GROUPS, MOODS } from '@/lib/data';
import { EVENT_DETAILS } from '@/data/content';
import { JsonLd, breadcrumbs, pageMeta } from '@/lib/seo';
import { PageShell } from '@/components/PageShell';
import { TicketButton } from '@/components/TicketButton';
import c from '@/components/Content.module.css';

export const metadata: Metadata = pageMeta({
  title: '11 GitHub events Footlit celebrates',
  description: 'The 11 GitHub moments Footlit reacts to: repos created or forked, pull requests, passing checks, Pages deploys, releases and closed issues.',
  path: '/events/',
  imageAlt: 'Footlit celebrates eleven GitHub events',
  keywords: ['celebrate merged pull request', 'github pages deploy notification', 'github release celebration', 'github checks passed animation'],
});

export default function Events() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumbs([['Footlit', '/'], ['Events', '/events/']])] }} />
      <PageShell
        crumbs={[['Footlit', '/'], ['Events']]}
        eyebrow="Eleven moments"
        title={<>Every GitHub moment<br /><em style={{ fontStyle: 'normal', color: 'var(--lit)' }}>worth a show.</em></>}
        lede="Footlit watches the GitHub tab you have open and reacts to eleven things: repositories, pull requests, checks and deploys, releases and issues. Here is exactly what each one is and how Footlit knows it happened."
        actions={<TicketButton href="/#install" title="Get Footlit" stub="Free" tone="tungsten" />}
      >
        <section className={`paper ${c.section}`}>
          <div className="wrap">
            {GROUPS.map((g) => (
              <div key={g.id} className={c.group}>
                <h2 className="display">{g.label}</h2>
                {g.events.map((id) => {
                  const e = EVENT_BY_ID[id]!;
                  const d = EVENT_DETAILS[id]!;
                  return (
                    <div key={id} className={c.event}>
                      <div>
                        <h3>{e.label} <span className={`${c.stamp} ${c[e.mood as 'applause']}`}>{MOODS[e.mood as 'applause']?.label}</span></h3>
                        <p className={`${c.p} ${c.muted}`} style={{ margin: '6px 0 0' }}><em>{e.blurb}</em></p>
                      </div>
                      <dl>
                        <div><dt>What happens</dt><dd>{d.trigger}</dd></div>
                        <div><dt>How Footlit knows</dt><dd>{d.how}</dd></div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className={c.note}>
              <b>Only what you watch happen</b>
              Footlit reacts to a change it sees while the tab is open. Opening a pull request that was merged last week, an issue that is already closed, or checks that are already green plays nothing. It also does not react to anything that happens when GitHub is not open in a tab you are looking at.
            </div>
            <p className={`${c.p} ${c.muted}`} style={{ marginTop: 26 }}>Every event can be switched off, or given its own theme, in the extension. Browse the <Link prefetch={false} href="/themes/">six themes</Link>, or read about <Link prefetch={false} href="/privacy/">what Footlit reads and stores</Link>.</p>
          </div>
        </section>
      </PageShell>
    </>
  );
}
