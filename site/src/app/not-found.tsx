import type { Metadata } from 'next';
import Link from 'next/link';
import { TicketButton } from '@/components/TicketButton';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <section className="ink" style={{ minHeight: '70vh', display: 'grid', alignContent: 'center', padding: '80px 0' }}>
      <div className="wrap">
        <p className="eyebrow">Error 404</p>
        <h1 className="display" style={{ fontSize: 'clamp(80px, 12vw, 200px)', color: 'var(--lit)' }}>Not on<br />the bill.</h1>
        <p className="lede" style={{ margin: '20px 0 32px' }}>That page left the theatre before you arrived.</p>
        <TicketButton href="/" title="Back to the show" stub="Home" tone="tungsten" />
        <p style={{ marginTop: 28 }}><Link prefetch={false} href="/privacy/">Privacy policy</Link></p>
      </div>
    </section>
  );
}
