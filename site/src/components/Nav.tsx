import Link from 'next/link';
import { TicketButton } from './TicketButton';
import s from './Nav.module.css';

const LINKS = [
  ['Themes', '/#themes'],
  ['Events', '/#events'],
  ['Inside', '/#inside'],
  ['Privacy', '/privacy/'],
  ['Install', '/#install'],
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
        <TicketButton href="/#install" title="Download" stub="Free" tone="ink" size="sm" />
      </div>
    </header>
  );
}
