export interface Subject {
  /** "owner/repo", or "" when unknown */
  nwo: string;
  owner: string;
  repo: string;
  /** pull request number, or "" */
  num: string;
  /** shell-style path, e.g. ~/acme/widget-shop */
  path: string;
}

/** Split a subject like "acme/widget-shop #42" into its parts. Themes use this for command lines and readouts. */
export function parseSubject(raw: string): Subject {
  const m = raw.match(/^([^\s/]+)\/([^\s#]+)(?:\s+#(\d+))?/);
  if (!m) return { nwo: '', owner: '', repo: '', num: '', path: '~' };
  return { nwo: `${m[1]}/${m[2]}`, owner: m[1]!, repo: m[2]!, num: m[3] ?? '', path: `~/${m[1]}/${m[2]}` };
}
