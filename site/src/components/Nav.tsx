'use client';

import Link from 'next/link';
import { TicketButton } from './TicketButton';
import s from './Nav.module.css';

const LINKS = [
  ['Watch', '/#watch'],
  ['How it works', '/#how'],
  ['Events', '/#events'],
  ['Themes', '/#themes'],
  ['Privacy', '/privacy/'],
] as const;

export function Nav() {
  return (
    <header className={s.nav}>
      <div className={`wrap ${s.row}`}>
        <Link prefetch={false} href="/" className={s.brand} aria-label="Footlit home">
          <img src="/logo.svg" width={36} height={36} alt="" />
          <span className="display">Footlit</span>
        </Link>
        <nav className={s.links} aria-label="Primary">
          {LINKS.map(([label, href]) => (
            <Link prefetch={false} key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <details className={s.mobile} onKeyDown={(e) => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}><summary>Menu</summary><nav aria-label="Mobile navigation">{LINKS.map(([label, href]) => <Link key={href} href={href} prefetch={false} onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}>{label}</Link>)}</nav></details>
        <TicketButton href="/#install" title="Get Footlit" stub="Free" tone="ink" size="sm" />
      </div>
    </header>
  );
}
