// Audio synthwave / outrun generado en vivo con Web Audio: efectos y música.
// No usa archivos: todo se sintetiza (osciladores, ruido, filtros, eco y reverb).

const KEY = 'chuto15:audio';
const DEFAULTS = { master: 0.8, music: 0.5, sfx: 0.85, muted: false, vibration: true };

let settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(window.localStorage.getItem(KEY) || 'null');
  if (saved) settings = { ...DEFAULTS, ...saved };
} catch {}

let ctx = null;
let master, musicBus, sfxBus, comp;
let musicFx, sfxFx; // { in, reverbSend, delaySend }
let noiseBuf = null;
let musicOn = false;
let schedTimer = null;
let nextTime = 0;
let step = 0;
let padDuck = null;
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

// Cadena de efectos (reverb amplia + eco con filtro) que termina en un bus
function makeFx(bus, delayTime) {
  const input = ctx.createGain();
  input.connect(bus);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(2.8, 2.6);
  const reverbSend = ctx.createGain();
  reverbSend.connect(reverb);
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  reverb.connect(reverbOut).connect(bus);

  const delay = ctx.createDelay(2);
  delay.delayTime.value = delayTime;
  const fb = ctx.createGain();
  fb.gain.value = 0.36;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  const delaySend = ctx.createGain();
  delaySend.connect(delay);
  delay.connect(tone).connect(fb).connect(delay);
  tone.connect(bus);
  tone.connect(reverbSend);

  return { in: input, reverbSend, delaySend };
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
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  musicFx = makeFx(musicBus, 0.45); // corchea con puntillo a 100 BPM
  sfxFx = makeFx(sfxBus, 0.3);
  padDuck = ctx.createGain();
  padDuck.connect(musicFx.in);
  padDuck.connect(musicFx.reverbSend);

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
  musicBus.gain.setTargetAtTime(settings.music * 1.3, t, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx * 1.5, t, 0.05);
}

// ---------------- instrumentos ----------------
function env(g, t, a, peak, d, sustain = 0.0001) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}

function noise(t, dur, { type = 'bandpass', freq = 2000, q = 0.8, gain = 0.3, to = null, dest, send = 0 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, 0.005, gain, dur);
  src.connect(f).connect(g).connect(dest.in);
  if (send) {
    const s = ctx.createGain();
    s.gain.value = send;
    g.connect(s).connect(dest.reverbSend);
  }
  src.start(t);
  src.stop(t + dur + 0.05);
}

// Sinte "sierra gorda": varias sierras desafinadas + filtro con envolvente
function synth(t, note, dur, {
  type = 'sawtooth', voices = 2, detune = 9, gain = 0.12, attack = 0.005, cutoff = 1800, cutoffEnv = 1.6,
  q = 4, dest, reverb = 0, delay = 0, glideFrom = null,
} = {}) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(cutoff * cutoffEnv, t);
  f.frequency.exponentialRampToValueAtTime(cutoff, t + Math.min(dur, 0.25));
  const g = ctx.createGain();
  env(g, t, attack, gain, dur);
  f.connect(g).connect(dest.in);
  if (reverb) { const s = ctx.createGain(); s.gain.value = reverb; g.connect(s).connect(dest.reverbSend); }
  if (delay) { const s = ctx.createGain(); s.gain.value = delay; g.connect(s).connect(dest.delaySend); }
  for (let v = 0; v < voices; v++) {
    const o = ctx.createOscillator();
    o.type = type;
    const fr = midi(note);
    if (glideFrom != null) {
      o.frequency.setValueAtTime(midi(glideFrom), t);
      o.frequency.exponentialRampToValueAtTime(fr, t + Math.min(0.12, dur));
    } else o.frequency.setValueAtTime(fr, t);
    o.detune.value = voices > 1 ? (v / (voices - 1) - 0.5) * 2 * detune : 0;
    o.connect(f);
    o.start(t);
    o.stop(t + attack + dur + 0.1);
  }
}

function kick(t, dest, gain = 0.9) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
  const g = ctx.createGain();
  env(g, t, 0.002, gain, 0.38);
  o.connect(g).connect(dest.in);
  o.start(t);
  o.stop(t + 0.45);
}

// Caja ochentera con "gated reverb"
function snare(t, dest, gain = 0.4) {
  noise(t, 0.2, { type: 'bandpass', freq: 1900, q: 0.7, gain, dest, send: 0.9 });
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.1);
  const g = ctx.createGain();
  env(g, t, 0.002, gain * 0.7, 0.12);
  o.connect(g).connect(dest.in);
  o.start(t);
  o.stop(t + 0.2);
}

function hat(t, dest, gain = 0.07, open = false) {
  noise(t, open ? 0.18 : 0.04, { type: 'highpass', freq: 8500, q: 0.5, gain, dest });
}

// ---------------- música ----------------
// Progresión en La menor: Am – F – C – G (i – VI – III – VII), un compás cada uno
const BPM = 100;
const SIXTEENTH = 60 / BPM / 4;
const CHORDS = [
  { root: 33, pad: [57, 60, 64], arp: [69, 72, 76, 81] }, // Am
  { root: 29, pad: [53, 57, 60], arp: [65, 69, 72, 77] }, // F
  { root: 36, pad: [55, 60, 64], arp: [67, 72, 76, 79] }, // C
  { root: 31, pad: [55, 59, 62], arp: [67, 71, 74, 79] }, // G
];
const BARS = 8;
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 1, 0, 1, 2, 3];

function scheduleStep(s, t) {
  const bar = Math.floor(s / 16);
  const i = s % 16;
  const chord = CHORDS[bar % 4];
  const dest = musicFx;

  // Batería
  if (i % 4 === 0) {
    kick(t, dest, 0.85);
    // "sidechain": el pad baja un instante con cada bombo
    padDuck.gain.cancelScheduledValues(t);
    padDuck.gain.setValueAtTime(0.35, t);
    padDuck.gain.linearRampToValueAtTime(1, t + 0.22);
  }
  if (bar >= 1 && (i === 4 || i === 12)) snare(t, dest, 0.32);
  if (i % 2 === 0) hat(t, dest, i % 4 === 2 ? 0.06 : 0.035);
  if (i === 14 && bar % 2 === 1) hat(t, dest, 0.05, true);

  // Bajo pulsante en semicorcheas (raíz y octava)
  synth(t, chord.root + (i % 2 ? 12 : 0), SIXTEENTH * 0.9, {
    voices: 2, detune: 6, gain: 0.11, cutoff: 380, cutoffEnv: 3, q: 6, dest,
  });

  // Pad: un acorde largo por compás, ataque suave
  if (i === 0) {
    for (const n of chord.pad) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.5);
      g.gain.setValueAtTime(0.03, t + SIXTEENTH * 14);
      g.gain.exponentialRampToValueAtTime(0.0001, t + SIXTEENTH * 17);
      f.connect(g).connect(padDuck);
      for (const d of [-11, 0, 11]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = d;
        o.connect(f);
        o.start(t);
        o.stop(t + SIXTEENTH * 18);
      }
    }
  }

  // Arpegio con eco (segunda mitad del loop)
  if (bar >= 4) {
    synth(t, chord.arp[ARP_PATTERN[i]], SIXTEENTH * 0.8, {
      type: 'square', voices: 1, gain: 0.035, cutoff: 2400, cutoffEnv: 1.4, q: 2, dest, delay: 0.45, reverb: 0.25,
    });
  }
  // Pequeña melodía en el último compás
  if (bar === 7 && i % 4 === 0) {
    synth(t, chord.arp[3 - i / 4] + 12, SIXTEENTH * 3, {
      voices: 2, detune: 12, gain: 0.04, cutoff: 3000, attack: 0.02, dest, delay: 0.5, reverb: 0.5,
    });
  }
}

function tick() {
  if (!ctx || !musicOn) return;
  while (nextTime < ctx.currentTime + 0.15) {
    scheduleStep(step, nextTime);
    nextTime += SIXTEENTH;
    step = (step + 1) % (16 * BARS);
  }
}

function startMusic() {
  if (!ensure() || musicOn || settings.music <= 0 || settings.muted) return;
  musicOn = true;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  schedTimer = setInterval(tick, 25);
}

function stopMusic() {
  musicOn = false;
  clearInterval(schedTimer);
  schedTimer = null;
}

// ---------------- efectos de sonido ----------------
const SFX = {
  // toque de interfaz: blip corto con caída de tono
  tap(t) {
    synth(t, 84, 0.05, { type: 'square', voices: 1, gain: 0.05, cutoff: 3000, glideFrom: 91, dest: sfxFx });
  },
  // cambiar de mazo: barrido corto
  swoosh(t) {
    noise(t, 0.28, { type: 'bandpass', freq: 600, to: 4000, q: 1.2, gain: 0.12, dest: sfxFx, send: 0.4 });
  },
  // sacar carta: barrido de ruido + sierra que sube
  draw(t) {
    noise(t, 0.4, { type: 'bandpass', freq: 400, to: 5000, q: 1, gain: 0.14, dest: sfxFx, send: 0.5 });
    synth(t + 0.05, 57, 0.35, { voices: 3, detune: 14, gain: 0.05, cutoff: 900, cutoffEnv: 3, glideFrom: 45, dest: sfxFx, delay: 0.3 });
  },
  // cumplido: arpegio mayor brillante con eco
  done(t) {
    [69, 73, 76, 81, 85].forEach((n, k) => synth(t + k * 0.075, n, 0.22, {
      voices: 2, detune: 10, gain: 0.07, cutoff: 3200, dest: sfxFx, delay: 0.35, reverb: 0.4,
    }));
  },
  // castigo: sierra desafinada que cae + golpe grave
  fail(t) {
    synth(t, 52, 0.6, { voices: 3, detune: 25, gain: 0.09, cutoff: 1400, cutoffEnv: 0.4, glideFrom: 60, dest: sfxFx, reverb: 0.4 });
    kick(t, sfxFx, 0.6);
  },
  // se opone: "denegado" de dos tonos
  refuse(t) {
    synth(t, 64, 0.12, { type: 'square', voices: 1, gain: 0.06, cutoff: 2000, dest: sfxFx });
    synth(t + 0.14, 58, 0.22, { type: 'square', voices: 1, gain: 0.06, cutoff: 1500, dest: sfxFx, reverb: 0.3 });
  },
  // negociar: blips aleatorios + subida
  negotiate(t) {
    for (let k = 0; k < 7; k++) {
      synth(t + k * 0.05, 60 + Math.floor(Math.random() * 24), 0.04, { type: 'square', voices: 1, gain: 0.04, cutoff: 4000, dest: sfxFx });
    }
    noise(t + 0.2, 0.5, { type: 'bandpass', freq: 300, to: 6000, q: 2, gain: 0.1, dest: sfxFx, send: 0.6 });
    synth(t + 0.4, 81, 0.3, { voices: 2, detune: 12, gain: 0.06, cutoff: 3500, dest: sfxFx, delay: 0.4 });
  },
  // lanzar la carta: barrido descendente
  throw(t) {
    noise(t, 0.45, { type: 'bandpass', freq: 5000, to: 300, q: 1.4, gain: 0.16, dest: sfxFx, send: 0.4 });
  },
  // ver la respuesta (trivia)
  reveal(t) {
    [76, 83, 88].forEach((n, k) => synth(t + k * 0.06, n, 0.25, { type: 'triangle', voices: 1, gain: 0.06, cutoff: 6000, dest: sfxFx, delay: 0.4, reverb: 0.5 }));
  },
  // alguien entró a la sala
  join(t) {
    synth(t, 76, 0.1, { type: 'square', voices: 1, gain: 0.05, cutoff: 3000, dest: sfxFx });
    synth(t + 0.09, 83, 0.18, { type: 'square', voices: 1, gain: 0.05, cutoff: 3000, dest: sfxFx, delay: 0.3 });
  },
  // ganador: fanfarria con acordes y caja con reverb
  win(t) {
    const chords = [[57, 64, 69, 73], [53, 60, 65, 69], [55, 62, 67, 71], [57, 64, 69, 76]];
    chords.forEach((c, k) => {
      c.forEach((n) => synth(t + k * 0.32, n, k === 3 ? 1.6 : 0.28, {
        voices: 2, detune: 12, gain: 0.045, cutoff: 2600, attack: 0.01, dest: sfxFx, reverb: 0.6, delay: 0.2,
      }));
      snare(t + k * 0.32, sfxFx, 0.25);
    });
    kick(t, sfxFx, 0.7);
    kick(t + 0.96, sfxFx, 0.7);
  },
};

// ---------------- API ----------------
export const audio = {
  // Debe llamarse dentro de un toque del usuario (los navegadores lo exigen)
  unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (settings.music > 0 && !settings.muted) startMusic();
  },
  play(name) {
    if (!ctx || settings.muted || settings.sfx <= 0 || ctx.state !== 'running') return;
    const fn = SFX[name];
    if (fn) fn(ctx.currentTime + 0.01);
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
    if (ctx) {
      if (settings.music > 0 && !settings.muted) startMusic();
      else stopMusic();
    }
    listeners.forEach((l) => l(settings));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
