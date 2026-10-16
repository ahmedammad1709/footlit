'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFootlit } from '@/lib/footlit';
import s from './PrDemo.module.css';

type Pr = 'open' | 'merged' | 'closed';
type Ci = 'passed' | 'failed' | 'pending';

/**
 * A mock pull request you can actually use. Merge it, close it or break the build: the real Footlit engine plays
 * the selected theme right inside the frame, exactly as the extension does on github.com.
 */
export function PrDemo() {
  const { play, ready, stop } = useFootlit();
  const stage = useRef<HTMLDivElement>(null);
  const [pr, setPr] = useState<Pr>('open');
  const [ci, setCi] = useState<Ci>('passed');
  const [nextFails, setNextFails] = useState(true);
  const [touched, setTouched] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((event: string) => void play(event, { container: stage.current }), [play]);

  const merge = () => {
    if (pr !== 'open' || !ready || ci === 'pending') return;
    setTouched(true);
    setPr('merged');
    show('pr.merged');
  };
  const close = () => {
    if (pr !== 'open' || !ready) return;
    clearTimeout(timer.current);
    setTouched(true);
    setPr('closed');
    show('pr.closed');
  };
  const rerun = () => {
    if (pr !== 'open' || ci === 'pending' || !ready) return;
    setTouched(true);
    setCi('pending');
    timer.current = window.setTimeout(() => {
      const result: Ci = nextFails ? 'failed' : 'passed';
      setCi(result);
      setNextFails(!nextFails);
      show(result === 'passed' ? 'ci.passed' : 'ci.failed');
    }, 1100);
  };
  const reset = () => {
    clearTimeout(timer.current);
    stop();
    setPr('open');
    setCi('passed');
    setNextFails(true);
  };

  return (
    <figure className={s.wrap}>
      <div className={s.frame} role="group" aria-label="Interactive demo: a mock pull request">
        <div className={s.chrome}>
          <span className={s.sq}><i /><i /><i /></span>
          <span className={s.url}>github.com/acme/widget-shop/pull/42</span>
        </div>

        <div className={s.viewport}>
          <div className={s.page}>
            <div className={s.top}>
              <span className={s.burger} />
              <span className={s.mark} />
              <b>acme / widget-shop</b>
              <span className={s.search}>Type / to search</span>
            </div>
            <div className={s.body}>
              <h3 className={s.title}>Fix flaky login redirect on Safari <em>#42</em></h3>
              <p className={s.meta}>
                <span className={`${s.badge} ${s[pr]}`}>{pr === 'open' ? 'Open' : pr === 'merged' ? 'Merged' : 'Closed'}</span>
                <span>ada-codes wants to merge 1 commit into <code>main</code></span>
              </p>
              <div className={s.convo}>
                <i style={{ width: '88%' }} /><i style={{ width: '64%' }} /><i style={{ width: '78%' }} />
              </div>

              <div className={s.merge}>
                {pr === 'open' ? (
                  <>
                    <p className={`${s.checks} ${s[`ci_${ci}`]}`}>
                      <span className={s.dot} aria-hidden="true" />
                      {ci === 'passed' ? 'All checks have passed' : ci === 'failed' ? 'Some checks were not successful' : 'Some checks haven’t completed yet'}
                    </p>
                    <div className={s.actions}>
                      <button className={s.go} onClick={merge} disabled={!ready || ci === 'pending'}>
                        Merge pull request
                      </button>
                      <button className={s.ghost} onClick={close} disabled={!ready}>Close pull request</button>
                      <button className={s.ghost} onClick={rerun} disabled={!ready || ci === 'pending'}>Re-run checks</button>
                    </div>
                  </>
                ) : (
                  <div className={s.done}>
                    <p className={`${s.checks} ${pr === 'merged' ? s.ci_merged : s.ci_failed}`}>
                      <span className={s.dot} aria-hidden="true" />
                      {pr === 'merged' ? 'Pull request successfully merged and closed' : 'Closed with unmerged commits'}
                    </p>
                    <button className={s.ghost} onClick={reset}>Reopen the demo</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={s.stage} ref={stage} aria-hidden="true" />
        </div>
      </div>

      <figcaption className={s.cap}>
        <span className={s.hint}>{ready ? (touched ? 'The real engine, playing inside this frame.' : 'Press “Merge pull request”.') : 'Warming up the lights…'}</span>
        <a href="#themes" className={s.themeLink}>Find your theme</a>
      </figcaption>
    </figure>
  );
}
