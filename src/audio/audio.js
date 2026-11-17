// Audio del juego: efectos sintetizados en vivo con Web Audio al estilo Silent Hill 2
// (golpes sordos, metal, estática de radio, sirena). El juego no tiene música.

const KEY = 'chuto15:audio';
const DEFAULTS = { master: 0.8, sfx: 0.85, muted: false, vibration: true };

let settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
  if (saved) settings = { ...DEFAULTS, ...saved };
} catch {}

let ctx = null;
let master, sfxBus, comp;
let noiseBuf = null;
const listeners = new Set();

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// ---------------- infraestructura ----------------
function makeImpulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  comp.attack.value = 0.003;
  master = ctx.createGain();
  const makeup = ctx.createGain();
  makeup.gain.value = 1.5; // ganancia de compensación tras el compresor
  master.connect(comp).connect(makeup).connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.connect(master);

  const len = ctx.sampleRate;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const m = settings.muted ? 0 : settings.master;
  master.gain.setTargetAtTime(m, t, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx * 1.5, t, 0.05);
}

// ---------------- instrumentos ----------------
function env(g, t, a, peak, d, sustain = 0.0001) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}

// ---------------- efectos de sonido (estilo Silent Hill 2) ----------------
// Paleta: golpes sordos en un cuarto grande, resonancias metálicas inarmónicas,
// estática de radio, metal que raspa, barridos invertidos y una sirena lejana.

// Reverb oscura y larga, propia de los efectos
let darkVerb = null;
function dark() {
  if (darkVerb) return darkVerb;
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(4.5, 1.8);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  conv.connect(lp).connect(out).connect(sfxBus);
  darkVerb = conv;
  return conv;
}

// Ajuste de volumen del efecto que se está tocando (ver TRIM)
let trim = 1;

// Envía un nodo a la salida seca y a la reverb oscura
function out(node, wet = 0.6, dry = 1) {
  const d = ctx.createGain();
  d.gain.value = dry * trim;
  node.connect(d).connect(sfxBus);
  const w = ctx.createGain();
  w.gain.value = wet * trim;
  node.connect(w).connect(dark());
}

// Resonancia metálica: parciales inarmónicos (como una placa o una tubería golpeada)
function metal(t, base, dur, gain, wet = 0.7, ratios = [1, 2.76, 5.4, 8.93, 13.34]) {
  const g = ctx.createGain();
  g.gain.value = 1;
  out(g, wet);
  ratios.forEach((r, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = base * r * (1 + (Math.random() - 0.5) * 0.004);
    const e = ctx.createGain();
    const len = dur / (1 + i * 0.6);
    env(e, t, 0.002, gain / (1 + i * 0.8), len);
    o.connect(e).connect(g);
    o.start(t);
    o.stop(t + len + 0.1);
  });
}

// Golpe sordo y grave, como una puerta pesada en un pasillo
function thud(t, gain = 0.5, freq = 70) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq * 1.8, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
  const e = ctx.createGain();
  env(e, t, 0.002, gain, 0.35);
  o.connect(e);
  out(e, 0.5);
  o.start(t);
  o.stop(t + 0.5);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1100; // cuerpo audible también en parlantes de teléfono
  const n = ctx.createGain();
  env(n, t, 0.001, gain * 0.6, 0.12);
  src.connect(lp).connect(n);
  out(n, 0.7);
  src.start(t);
  src.stop(t + 0.2);
}

// Estática de radio: ruido filtrado con cortes y crujidos aleatorios
function staticNoise(t, dur, gain = 0.2, rising = false) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1700;
  bp.Q.value = 0.6;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 6); }
  shaper.curve = curve;
  const chop = ctx.createGain();
  const steps = Math.floor(dur / 0.03);
  for (let i = 0; i < steps; i++) {
    const tt = t + i * 0.03;
    const level = Math.random() < 0.25 ? 0.05 : 0.4 + Math.random() * 0.6;
    const ramp = rising ? 0.2 + 0.8 * (i / steps) : 1 - 0.6 * (i / steps);
    chop.gain.setValueAtTime(level * ramp * gain, tt);
  }
  chop.gain.setValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(shaper).connect(chop);
  out(chop, 0.35);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// Metal que raspa: ruido por un filtro de peine (resonancia metálica) con el tono deslizándose
function scrape(t, dur, gain = 0.15, from = 6, to = 3) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 1.5;
  const comb = ctx.createDelay(0.05);
  comb.delayTime.setValueAtTime(from / 1000, t);
  comb.delayTime.linearRampToValueAtTime(to / 1000, t + dur);
  const fb = ctx.createGain();
  fb.gain.value = 0.86;
  const e = ctx.createGain();
  e.gain.setValueAtTime(0.0001, t);
  e.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(comb);
  comb.connect(fb).connect(comb);
  comb.connect(e);
  out(e, 0.6);
  src.start(t);
  src.stop(t + dur + 0.1);
}

// Barrido invertido: crece hacia el final y corta en seco (como un sonido al revés)
function reverseSwell(t, dur, gain = 0.25, freq = 900) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(freq * 0.4, t);
  bp.frequency.exponentialRampToValueAtTime(freq * 2, t + dur);
  bp.Q.value = 1.2;
  const e = ctx.createGain();
  e.gain.setValueAtTime(0.0001, t);
  e.gain.exponentialRampToValueAtTime(gain, t + dur);
  e.gain.setValueAtTime(0.0001, t + dur + 0.005);
  src.connect(bp).connect(e);
  out(e, 0.8, 0.7);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// Sirena lejana que sube (la del "otro mundo")
function siren(t, dur, gain = 0.06) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  g.connect(lp);
  out(lp, 0.9, 0.5);
  for (const det of [-14, 0, 9]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(520, t + dur * 0.7);
    o.detune.value = det;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

// Zumbido grave y desafinado (tensión)
function drone(t, dur, gain = 0.08, note = 33) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  g.connect(lp);
  out(lp, 0.7);
  for (const [n, d] of [[note, -20], [note, 17], [note + 1, 0], [note + 12, 6]]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midi(n);
    o.detune.value = d;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

// Nivelación medida: cada efecto suena a un volumen parecido (el ganador, algo más fuerte)
const TRIM = {
  tap: 2.6, swoosh: 1.4, draw: 0.32, done: 0.6, fail: 0.36, refuse: 1,
  negotiate: 0.55, throw: 0.7, reveal: 0.95, join: 1.4, win: 0.55,
};

const SFX = {
  // toque de interfaz: golpe sordo y apagado, con cola de reverb
  tap(t) {
    thud(t, 0.55, 150);
    metal(t, 520, 0.25, 0.018, 0.5, [1, 2.76]);
  },
  // cambiar de mazo: metal que raspa, corto
  swoosh(t) {
    scrape(t, 0.5, 0.16, 5, 2.5);
  },
  // sacar carta: barrido invertido que termina en un golpe metálico grave
  draw(t) {
    reverseSwell(t, 0.45, 0.07, 700);
    metal(t + 0.45, 116, 2.2, 0.03, 0.8);
    thud(t + 0.45, 0.25, 110);
  },
  // cumplido: campana metálica que resuena (como recoger un objeto)
  done(t) {
    metal(t, 220, 2.6, 0.07, 0.85, [1, 2.0, 2.76, 4.07, 5.4]);
    metal(t + 0.12, 330, 2.2, 0.045, 0.9, [1, 2.0, 2.76, 4.07]);
  },
  // castigo: estática de radio + caída grave
  fail(t) {
    staticNoise(t, 0.7, 0.16);
    drone(t, 1.6, 0.06, 28);
    thud(t, 0.4, 55);
  },
  // se opone: dos golpes secos en una puerta de metal
  refuse(t) {
    thud(t, 0.7, 165);
    metal(t, 140, 0.5, 0.1, 0.6);
    thud(t + 0.28, 0.75, 155);
    metal(t + 0.28, 132, 0.6, 0.11, 0.7);
  },
  // negociar: sirena lejana + estática creciente + tensión
  negotiate(t) {
    siren(t, 2.2, 0.05);
    staticNoise(t + 0.2, 1.0, 0.14, true);
    drone(t, 2.0, 0.05, 35);
  },
  // lanzar la carta: metal que raspa largo, bajando
  throw(t) {
    scrape(t, 0.7, 0.14, 3, 7);
    reverseSwell(t, 0.25, 0.08, 1800);
  },
  // ver la respuesta (trivia): nota de vidrio con mucha reverb
  reveal(t) {
    metal(t, 880, 2.5, 0.07, 0.95, [1, 2.0, 3.01]);
  },
  // alguien entró a la sala: chasquido de radio
  join(t) {
    staticNoise(t, 0.18, 0.18);
    metal(t + 0.12, 440, 0.9, 0.04, 0.8, [1, 2.76]);
  },
  // ganador: gong profundo con zumbido que crece y sirena de fondo
  win(t) {
    reverseSwell(t, 1.2, 0.07, 400);
    metal(t + 1.2, 90, 5, 0.045, 0.9);
    thud(t + 1.2, 0.35, 80);
    drone(t + 1.2, 4, 0.035, 33);
    metal(t + 1.5, 180, 3.5, 0.03, 0.9, [1, 2.0, 2.76, 4.07]);
  },
};

// ---------------- API ----------------
export const audio = {
  // Debe llamarse dentro de un toque del usuario (los navegadores lo exigen)
  unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
  },
  play(name) {
    if (!ctx || settings.muted || settings.sfx <= 0 || ctx.state !== 'running') return;
    const fn = SFX[name];
    if (!fn) return;
    trim = TRIM[name] || 1;
    fn(ctx.currentTime + 0.01);
    trim = 1;
  },
  vibrate(pattern) {
    if (settings.vibration && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch {}
    }
  },
  // Pausa al minimizar (ahorra batería) y vuelve al regresar
  setHidden(hidden) {
    if (!ctx) return;
    if (hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  },
  get() {
    return { ...settings };
  },
  update(partial) {
    settings = { ...settings, ...partial };
    try { window.localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
    applyVolumes();
    listeners.forEach((l) => l(settings));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

