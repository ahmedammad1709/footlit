// one-off: tighten the last act of the 60 s film (demo hold, trust beats, end card tail)
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8');
const rep = (s, a, b, label) => { if (!s.includes(a)) throw new Error('missing: ' + label); return s.split(a).join(b); };

// cues
const c = JSON.parse(rd('src/cues.json'));
c.duration = 56.4;
c.demo.end = 45.0;
c.trust = { start: 45.0, end: 49.9, nums: [45.15, 46.35, 47.55] };
c.end = { start: 49.9, end: 56.4 };
fs.writeFileSync('src/cues.json', JSON.stringify(c, null, 2) + '\n');

// voice placement
const v = JSON.parse(rd('src/vo.json'));
const at = { '09a': 45.15, '09b': 46.35, '09c': 47.55, '10': 50.3 };
for (const l of v.lines) if (at[l.id] !== undefined) l.at = at[l.id];
fs.writeFileSync('src/vo.json', JSON.stringify(v, null, 2) + '\n');

// picture: end card reveals arrive sooner (the voice now starts 0.4 s into the card, not 0.7 s)
let f = rd('src/film.ts');
f = rep(f, "}, start + 0.2, 0.5);\n  const word", "}, start + 0.1, 0.45);\n  const word", 'icon');
f = rep(f, "A(word, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], start + 0.3, 0.5);", "A(word, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], start + 0.2, 0.45);", 'word');
f = rep(f, "{ opacity: 1, transform: 'none' }], start + 0.9, 0.5);", "{ opacity: 1, transform: 'none' }], start + 0.95, 0.45);", 'free');
f = rep(f, "A(urlEl, [{ opacity: 0 }, { opacity: 1 }], start + 1.9, 0.5);", "A(urlEl, [{ opacity: 0 }, { opacity: 1 }], start + 1.6, 0.45);", 'url');
f = rep(f, "A(by, [{ opacity: 0 }, { opacity: 1 }], start + 2.6, 0.5);", "A(by, [{ opacity: 0 }, { opacity: 1 }], start + 2.3, 0.45);", 'by');
f = rep(f, "start + 3 + i * 0.12, 1.2, { easing: 'linear', fill: 'none' });", "start + 2.6 + i * 0.1, 1.0, { easing: 'linear', fill: 'none' });", 'blink');
fs.writeFileSync('src/film.ts', f);

// sound
let a = rd('scripts/make-audio.mjs');
a = rep(a, "for (let k = 0; k < 24; k += 2) {", "for (let k = 0; t0 + k < demo.end - 1; k += 2) {", 'pads loop');
a = rep(a, "  for (let k = 0; k < 10; k++) put(music, t0 + 0.3 + k * 0.5, hat(0.12), 0.7, k % 2 ? 0.3 : -0.3);",
`  // a pulse under the numbers, so the act keeps moving: kick on the beat, a plucked bass, eighth-note hats
  for (let t = t0 + 0.2, k = 0; t < trust.end - 0.3; t += 0.5, k++) {
    put(music, t, kick(0.5), 0.9);
    put(music, t, pluckBass(mtof(E1 + 12 + [0, 0, 5, 7][k % 4]), 0.34, 0.45), 0.8);
    put(music, t + 0.25, hat(0.16), 0.7, k % 2 ? 0.3 : -0.3);
  }`, 'trust pulse');
a = rep(a, "put(sfx, t0 + 3 + i * 0.12, click(0.14, 1.2 + (i % 5) * 0.08), 1, -0.8 + i * 0.11);", "put(sfx, t0 + 2.6 + i * 0.1, click(0.14, 1.2 + (i % 5) * 0.08), 1, -0.8 + i * 0.11);", 'end clicks');
fs.writeFileSync('scripts/make-audio.mjs', a);
console.log('tightened');
