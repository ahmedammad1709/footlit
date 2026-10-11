import Link from 'next/link';
import type { ReactNode } from 'react';
import s from './PageShell.module.css';

interface Props {
  crumbs: [label: string, href?: string][];
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** The common frame for content pages: breadcrumb trail, one H1, a short intro, then the page body. */
export function PageShell({ crumbs, eyebrow, title, lede, actions, children }: Props) {
  return (
    <article className={s.page}>
      <header className={`ink ${s.hero}`}>
        <div className="wrap">
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <ol>
              {crumbs.map(([label, href], i) => (
                <li key={label}>
                  {href && i < crumbs.length - 1 ? <Link prefetch={false} href={href}>{label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{label}</span>}
                </li>
              ))}
            </ol>
          </nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={`display ${s.h1}`}>{title}</h1>
          {lede ? <p className={`lede ${s.lede}`}>{lede}</p> : null}
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </div>
      </header>
      {children}
    </article>
  );
}
