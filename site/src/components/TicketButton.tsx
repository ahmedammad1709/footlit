import type { ReactNode } from 'react';
import s from './TicketButton.module.css';

interface Props {
  href: string;
  /** big line, e.g. "Download for Chrome" */
  title: string;
  /** small line under it */
  sub?: string;
  /** the stub on the left: a short word, e.g. "Free" */
  stub?: string;
  stubSmall?: string;
  /** colour treatment: "tungsten" for dark sections, "ink" for light ones */
  tone?: 'tungsten' | 'ink';
  download?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'md' | 'sm';
}

/** A theatre ticket as a button: notched sides, a dashed tear line, a stub. */
export function TicketButton({ href, title, sub, stub = 'Free', stubSmall = 'Admit one', tone = 'tungsten', download, disabled, icon, size = 'md' }: Props) {
  const cls = `${s.ticket} ${s[tone]} ${size === 'sm' ? s.sm : ''} ${disabled ? s.disabled : ''}`;
  const inner = (
    <>
      <span className={s.stub}>
        <span className={s.small}>{stubSmall}</span>
        <b>{stub}</b>
      </span>
      <span className={s.main}>
        <strong>{title}</strong>
        {sub ? <span className={s.sub}>{sub}</span> : null}
      </span>
      {icon ? <span className={s.icon}>{icon}</span> : null}
    </>
  );
  if (disabled) return <span className={cls} aria-disabled="true">{inner}</span>;
  return (
    <a className={cls} href={href} {...(download ? { download: true } : {})}>
      {inner}
    </a>
  );
}
