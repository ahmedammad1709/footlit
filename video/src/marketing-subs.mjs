// Subtitle timing for the marketing films, shared by the picture (burned-in captions) and the .srt export.
// Each voice line is shown from just before it starts to just after it ends; lines with several chunks split the time by length.
export function buildSubs(cues, durations) {
  const out = [];
  // order comes from the subtitle list (object keys like "10" would sort ahead of "01")
  for (const [i, sub] of cues.subs.entries()) {
    const at = cues.vo[sub.id];
    const dur = durations[sub.id];
    const next = cues.subs[i + 1];
    const nextAt = next ? cues.vo[next.id] : Infinity;
    const start = Math.max(0, at - 0.04);
    const end = Math.min(at + dur + 0.28, nextAt - 0.04);
    const total = sub.chunks.reduce((n, c) => n + c.text.length, 0);
    let cursor = start;
    sub.chunks.forEach((c, i) => {
      const last = i === sub.chunks.length - 1;
      const share = (c.text.length / total) * (at + dur - start);
      const t0 = cursor;
      const t1 = last ? end : Math.min(end, cursor + share);
      out.push({ id: sub.id, t0, t1, text: c.text, em: c.em ?? [] });
      cursor = t1;
    });
  }
  return out;
}

export function toSrt(subs) {
  const ts = (s) => {
    const ms = Math.round(s * 1000);
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`;
  };
  return subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${s.text}\n`).join('\n');
}
