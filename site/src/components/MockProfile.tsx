import s from './MockProfile.module.css';

/** Tiny deterministic generator so the contribution graph is identical on server and client. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const repos = [
  ['widget-shop', 'A tiny storefront with a very opinionated cart.', 'TypeScript', '#3178c6', '412'],
  ['login-redirect', 'Fixes the thing Safari does to cookies.', 'JavaScript', '#f1e05a', '96'],
  ['dotfiles', 'Shell, editor and far too many aliases.', 'Shell', '#89e051', '58'],
  ['pocket-cli', 'Save links from the terminal.', 'Go', '#00add8', '33'],
] as const;

/** A generic profile page (no GitHub marks) for the preview stage to play over. */
export function MockProfile() {
  const r = rng(7);
  const cells = Array.from({ length: 26 * 7 }, (_, i) => {
    const v = r() * (0.35 + (Math.floor(i / 7) / 26) * 0.9);
    return v > 0.95 ? 'l4' : v > 0.75 ? 'l3' : v > 0.55 ? 'l2' : v > 0.35 ? 'l1' : '';
  });
  return (
    <div className={s.mock} aria-hidden="true">
      <div className={s.top}>
        <span className={s.burger} /><span className={s.mark} /><b>acme</b>
        <span className={s.search}>Type / to search</span><span className={s.dot} /><span className={s.dot} /><span className={s.av} />
      </div>
      <div className={s.tabs}>
        <span className={s.on}>Overview</span>
        <span>Repositories <b>24</b></span><span>Projects</span><span>Packages</span><span>Stars <b>311</b></span>
      </div>
      <div className={s.body}>
        <div>
          <div className={s.avatar}>A</div>
          <div className={s.name}>Acme Labs</div>
          <div className={s.handle}>acme</div>
          <div className={s.bio}>Small tools for slow Mondays.</div>
          <div className={s.follow}>Follow</div>
          <div className={s.stats}><b>128</b> followers · <b>41</b> following</div>
        </div>
        <div>
          <h4>Popular repositories</h4>
          <div className={s.repos}>
            {repos.map(([n, d, l, c, st]) => (
              <div key={n} className={s.repo}>
                <div><a>{n}</a><i>Public</i></div>
                <p>{d}</p>
                <div className={s.lang}><u style={{ background: c }} />{l}<span>★ {st}</span></div>
              </div>
            ))}
          </div>
          <div className={s.graph}>
            <h4>184 contributions in the last year</h4>
            <div className={s.cells}>{cells.map((c, i) => <b key={i} className={c ? s[c] : ''} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
