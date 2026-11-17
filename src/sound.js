// Sonidos sintetizados con Web Audio (sin archivos externos)
let ctx = null;
let muted = false;

const ac = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

export const setMuted = (m) => { muted = m; };
export const isMuted = () => muted;
export const unlock = () => { ac(); };

const tone = (freq, start, dur, { type = 'sine', vol = 0.18, slideTo = null } = {}) => {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
};

const noise = (start, dur, { vol = 0.12, from = 400, to = 4000 } = {}) => {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
};

const N = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319, G6: 1568 };

export const tap = () => tone(660, 0, 0.07, { type: 'triangle', vol: 0.12 });
export const join = () => { tone(520, 0, 0.09, { type: 'square', vol: 0.08 }); tone(780, 0.08, 0.12, { type: 'square', vol: 0.08 }); };
export const flip = () => { noise(0, 0.22, { vol: 0.1, from: 300, to: 5000 }); tone(300, 0, 0.18, { type: 'sine', vol: 0.08, slideTo: 900 }); };
export const success = () => {
  [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, i * 0.07, 0.22, { type: 'triangle', vol: 0.17 }));
  tone(N.G6, 0.38, 0.35, { type: 'sine', vol: 0.12 });
};
export const fail = () => {
  tone(330, 0, 0.22, { type: 'sawtooth', vol: 0.12, slideTo: 260 });
  tone(260, 0.2, 0.22, { type: 'sawtooth', vol: 0.12, slideTo: 200 });
  tone(200, 0.4, 0.4, { type: 'sawtooth', vol: 0.12, slideTo: 110 });
};
export const refuse = () => {
  tone(880, 0, 0.08, { type: 'square', vol: 0.09 });
  tone(440, 0.1, 0.18, { type: 'square', vol: 0.09, slideTo: 330 });
};
export const negotiate = () => {
  for (let i = 0; i < 6; i++) tone(300 + Math.random() * 700, i * 0.06, 0.06, { type: 'square', vol: 0.07 });
  tone(N.A5, 0.4, 0.15, { type: 'triangle', vol: 0.14 });
  tone(N.E6, 0.52, 0.3, { type: 'triangle', vol: 0.14 });
};
export const tick = () => tone(1000, 0, 0.05, { type: 'square', vol: 0.07 });
export const buzzer = () => tone(150, 0, 0.6, { type: 'sawtooth', vol: 0.18, slideTo: 90 });
export const win = () => {
  const seq = [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6, N.E6, N.G6];
  seq.forEach((f, i) => tone(f, i * 0.12, 0.25, { type: 'triangle', vol: 0.18 }));
  [N.C5, N.E5, N.G5, N.C6].forEach((f) => tone(f, 1.0, 0.9, { type: 'sine', vol: 0.1 }));
};
