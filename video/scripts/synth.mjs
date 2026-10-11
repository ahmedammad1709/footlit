// Shared synthesis kit for the film scores: oscillators, filters, instruments, reverb. No samples, everything is generated.
export const SR = 48000;
// ---------- deterministic noise ----------
let seed = 20240611;
export const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const noise = (n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = rnd() * 2 - 1; return a; };

// ---------- buses ----------
export const makeBus = (N) => ({ L: new Float32Array(N), R: new Float32Array(N) });
/** mix a mono array into a bus at time t, with pan -1..1 */
export function put(b, t, x, gain = 1, pan = 0) {
  const N = b.L.length;
  const start = Math.round(t * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < x.length; i++) {
    const j = start + i;
    if (j < 0 || j >= N) continue;
    b.L[j] += x[i] * gl * 1.4142;
    b.R[j] += x[i] * gr * 1.4142;
  }
}
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const len = (sec) => Math.max(1, Math.round(sec * SR));

// ---------- DSP bits ----------
/** state variable filter. fc: number or (i)=>Hz. mode: 'lp' | 'bp' | 'hp' */
export function svf(x, fc, q = 0.7, mode = 'lp') {
  const out = new Float32Array(x.length);
  let low = 0, band = 0;
  const qi = 1 / q;
  const fn = typeof fc === 'function' ? fc : () => fc;
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin((Math.PI * Math.min(fn(i), SR * 0.24)) / SR);
    low += f * band;
    const high = x[i] - low - qi * band;
    band += f * high;
    out[i] = mode === 'lp' ? low : mode === 'bp' ? band : high;
  }
  return out;
}
export const expo = (a, b, u) => a * Math.pow(b / a, u);
export const sat = (x, drive) => { for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * drive) / Math.tanh(drive); return x; };
/** attack/decay-exponential envelope applied in place */
export function env(x, a, decay, hold = 0) {
  const na = Math.round(a * SR), nh = Math.round(hold * SR);
  for (let i = 0; i < x.length; i++) {
    const g = i < na ? i / na : Math.exp(-(i - na - nh > 0 ? i - na - nh : 0) / SR / decay);
    x[i] *= g;
  }
  return x;
}
/** attack / sustain / release envelope over the whole array */
export function asr(x, a, r) {
  const na = Math.round(a * SR), nr = Math.round(r * SR);
  for (let i = 0; i < x.length; i++) {
    let g = 1;
    if (i < na) g = i / na; g = g * g * (3 - 2 * g);
    const left = x.length - i;
    if (left < nr) { const u = left / nr; g *= u * u * (3 - 2 * u); }
    x[i] *= g;
  }
  return x;
}
export function osc(type, freq, n, phase = 0) {
  const out = new Float32Array(n);
  let ph = phase;
  const fn = typeof freq === 'function' ? freq : () => freq;
  for (let i = 0; i < n; i++) {
    ph += fn(i) / SR; ph -= Math.floor(ph);
    out[i] = type === 'sine' ? Math.sin(2 * Math.PI * ph) : type === 'saw' ? 2 * ph - 1 : type === 'square' ? (ph < 0.5 ? 1 : -1) : 4 * Math.abs(ph - 0.5) - 1;
  }
  return out;
}
export const sum = (...arrs) => { const n = Math.max(...arrs.map((a) => a.length)); const o = new Float32Array(n); for (const a of arrs) for (let i = 0; i < a.length; i++) o[i] += a[i]; return o; };
export const scale = (x, g) => { for (let i = 0; i < x.length; i++) x[i] *= g; return x; };

// ---------- instruments ----------
export function kick(vol = 1) {
  const n = len(0.45);
  const body = osc('sine', (i) => 44 + 120 * Math.exp(-i / SR / 0.035), n);
  env(body, 0.002, 0.16);
  const click = svf(noise(len(0.02)), 3000, 0.7, 'hp'); env(click, 0.0005, 0.004);
  return scale(sum(body, scale(click, 0.35)), vol);
}
export function clap(vol = 1) {
  const n = len(0.3);
  const out = new Float32Array(n);
  for (const off of [0, 0.011, 0.023]) {
    const b = svf(noise(len(0.2)), 1700, 1.4, 'bp'); env(b, 0.0005, 0.03);
    for (let i = 0; i < b.length; i++) out[i + Math.round(off * SR)] += b[i] * 1.6;
  }
  const tail = svf(noise(n), 1500, 1, 'bp'); env(tail, 0.002, 0.11);
  return scale(sum(out, scale(tail, 0.5)), vol);
}
export function hat(vol = 1, open = false) {
  const b = svf(noise(len(open ? 0.3 : 0.07)), 7500, 0.8, 'hp'); env(b, 0.0005, open ? 0.09 : 0.016);
  return scale(b, vol);
}
export function impact(vol = 1) {
  const n = len(1.6);
  const boom = osc('sine', (i) => 34 + 60 * Math.exp(-i / SR / 0.12), n); env(boom, 0.002, 0.55);
  const rumble = svf(noise(n), (i) => 40 + 900 * Math.exp(-i / SR / 0.2), 0.8); env(rumble, 0.002, 0.35);
  const crack = svf(noise(len(0.06)), 2500, 0.7, 'hp'); env(crack, 0.0003, 0.012);
  return scale(sum(boom, scale(rumble, 2.2), scale(crack, 0.6)), vol);
}
export function hit(vol = 1) { // short, tight version for fast cuts
  const n = len(0.5);
  const boom = osc('sine', (i) => 48 + 90 * Math.exp(-i / SR / 0.05), n); env(boom, 0.001, 0.14);
  const crack = svf(noise(len(0.05)), 3500, 0.7, 'hp'); env(crack, 0.0003, 0.01);
  return scale(sum(boom, scale(crack, 0.5)), vol);
}
export function riser(sec, vol = 1, f0 = 300, f1 = 9000) {
  const n = len(sec);
  const x = svf(noise(n), (i) => expo(f0, f1, i / n), 2.2, 'bp');
  for (let i = 0; i < n; i++) { const u = i / n; x[i] *= u * u * 3; }
  return scale(x, vol);
}
export function siren(sec, f0, f1, vol = 1) {
  const n = len(sec);
  const x = osc('saw', (i) => expo(f0, f1, i / n) * (1 + 0.004 * Math.sin((2 * Math.PI * 6 * i) / SR)), n);
  const y = svf(x, (i) => expo(600, 3500, i / n), 1.2);
  for (let i = 0; i < n; i++) { const u = i / n; y[i] *= u * u; }
  return scale(y, vol);
}
export function bass(freq, sec, cut0, cut1, vol = 1) {
  const n = len(sec);
  const s = sum(osc('saw', freq, n), osc('saw', freq * 1.006, n), scale(osc('sine', freq / 2, n), 1.2));
  const f = svf(s, (i) => expo(cut0, cut1, Math.min(1, i / (SR * 0.12))), 1.3);
  sat(f, 2.2);
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = f[i] * Math.min(1, i / (SR * 0.004)) * Math.exp(-i / SR / (sec * 0.7));
  return scale(g, vol);
}
export function pluckBass(freq, sec, vol = 1) {
  const n = len(sec);
  const s = sum(osc('square', freq, n), scale(osc('sine', freq, n), 1.4));
  const f = svf(s, (i) => 300 + 1800 * Math.exp(-i / SR / 0.06), 1.1);
  env(f, 0.003, sec * 0.35);
  return scale(f, vol);
}
export function pad(freqs, sec, attack, release, cutoff, vol = 1) {
  const n = len(sec);
  let s = new Float32Array(n);
  for (const f of freqs) for (const det of [-9, 0, 8]) s = sum(s, osc('saw', f * Math.pow(2, det / 1200), n, rnd()));
  const out = svf(s, cutoff, 0.9);
  asr(out, attack, release);
  return scale(out, vol / (freqs.length * 1.6));
}
export function bell(freq, sec, vol = 1) {
  const n = len(sec);
  const parts = [[1, 1, 1.0], [2.01, 0.55, 0.7], [2.76, 0.35, 0.5], [4.2, 0.2, 0.3], [5.4, 0.1, 0.2]];
  const out = new Float32Array(n);
  for (const [r, a, d] of parts) { const o = osc('sine', freq * r, n); env(o, 0.001, sec * 0.28 * d); for (let i = 0; i < n; i++) out[i] += o[i] * a; }
  return scale(out, vol * 0.5);
}
export function pluck(freq, sec, vol = 1) {
  const n = len(sec);
  const s = sum(osc('tri', freq, n), scale(osc('sine', freq * 2, n), 0.4));
  const f = svf(s, (i) => 600 + 4000 * Math.exp(-i / SR / 0.05), 0.9);
  env(f, 0.002, sec * 0.3);
  return scale(f, vol);
}
export function brass(freqs, sec, vol = 1) {
  const n = len(sec);
  let s = new Float32Array(n);
  for (const f of freqs) for (const det of [-6, 6]) s = sum(s, osc('saw', f * Math.pow(2, det / 1200), n, rnd()));
  const f = svf(s, (i) => 400 + 3800 * (1 - Math.exp(-i / SR / 0.09)) * Math.exp(-i / SR / (sec * 0.8)), 1.0);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.min(1, i / (SR * 0.018)); const r = Math.min(1, (n - i) / (SR * 0.35)); out[i] = f[i] * a * r; }
  return scale(out, vol / (freqs.length * 1.5));
}
export function timpani(freq, vol = 1) {
  const n = len(1.4);
  const body = osc('sine', (i) => freq * (1 + 0.5 * Math.exp(-i / SR / 0.03)), n); env(body, 0.002, 0.5);
  const skin = svf(noise(n), 500, 1, 'bp'); env(skin, 0.001, 0.05);
  return scale(sum(body, scale(skin, 0.6)), vol);
}
export function cymbal(sec, vol = 1) {
  const n = len(sec);
  const x = svf(noise(n), 6000, 0.7, 'hp');
  for (let i = 0; i < n; i++) { const u = i / SR; x[i] *= Math.min(1, u / 0.5) * Math.exp(-u / (sec * 0.35)); }
  return scale(x, vol);
}
export function whoosh(sec, up, vol = 1) {
  const n = len(sec);
  const x = svf(noise(n), (i) => (up ? expo(250, 6000, i / n) : expo(6000, 250, i / n)), 1.6, 'bp');
  for (let i = 0; i < n; i++) { const u = i / n; x[i] *= Math.sin(Math.PI * u) ** 1.6; }
  return scale(x, vol * 1.6);
}
export function click(vol = 1, pitch = 1) {
  const n = len(0.05);
  const t = osc('sine', 2100 * pitch, n); env(t, 0.0005, 0.006);
  const nz = svf(noise(n), 4500, 0.7, 'hp'); env(nz, 0.0002, 0.003);
  return scale(sum(t, scale(nz, 0.8)), vol);
}
export function key(vol = 1) {
  const n = len(0.04);
  const t = osc('sine', 900 + rnd() * 250, n); env(t, 0.0003, 0.006);
  const nz = svf(noise(n), 2800, 0.8); env(nz, 0.0002, 0.004);
  return scale(sum(t, scale(nz, 1.2)), vol * 0.7);
}
export function applause(sec, vol = 1, density = 90) {
  const n = len(sec);
  const outL = new Float32Array(n), outR = new Float32Array(n);
  const total = Math.round(sec * density);
  for (let k = 0; k < total; k++) {
    // claps swell in, then fade out
    const u = Math.pow(rnd(), 0.8);
    const t = u * sec;
    const env2 = Math.min(1, t / 0.5) * Math.min(1, (sec - t) / 1.2);
    if (rnd() > env2) continue;
    const c = svf(noise(len(0.03)), 1400 + rnd() * 2600, 1.2, 'bp'); env(c, 0.0005, 0.006 + rnd() * 0.008);
    const pan = rnd() * 2 - 1, g = (0.4 + rnd() * 0.6) * 2.4;
    const s0 = Math.round(t * SR);
    for (let i = 0; i < c.length && s0 + i < n; i++) { outL[s0 + i] += c[i] * g * (1 - pan) / 2; outR[s0 + i] += c[i] * g * (1 + pan) / 2; }
  }
  const bed = svf(noise(n), 3200, 0.7); for (let i = 0; i < n; i++) { const t = i / SR; bed[i] *= 0.05 * Math.min(1, t / 0.8) * Math.min(1, (sec - t) / 1.4); }
  return { L: sum(outL, bed).map((v) => v * vol), R: sum(outR, bed).map((v) => v * vol) };
}
export function putStereo(b, t, st) {
  const N = b.L.length;
  const start = Math.round(t * SR);
  for (let i = 0; i < st.L.length; i++) { const j = start + i; if (j >= N) break; b.L[j] += st.L[i]; b.R[j] += st.R[i]; }
}

// ---------- reverb (Freeverb layout) ----------
export function reverb(b, wet = 0.3, room = 0.82, damp = 0.35) {
  const N = b.L.length;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((v) => Math.round((v * SR) / 44100));
  const apT = [556, 441, 341, 225].map((v) => Math.round((v * SR) / 44100));
  const run = (inp, spread) => {
    const out = new Float32Array(N);
    for (const ct of combT) {
      const T = ct + spread, buf = new Float32Array(T); let idx = 0, store = 0;
      for (let i = 0; i < N; i++) { const o = buf[idx]; store = o * (1 - damp) + store * damp; buf[idx] = inp[i] * 0.015 + store * room; if (++idx >= T) idx = 0; out[i] += o; }
    }
    for (const at of apT) {
      const T = at + spread, buf = new Float32Array(T); let idx = 0;
      for (let i = 0; i < N; i++) { const bo = buf[idx]; const v = out[i]; out[i] = -v + bo; buf[idx] = v + bo * 0.5; if (++idx >= T) idx = 0; }
    }
    return out;
  };
  const wl = run(b.L, 0), wr = run(b.R, 23);
  for (let i = 0; i < N; i++) { b.L[i] += wl[i] * wet * 12; b.R[i] += wr[i] * wet * 12; }
}

