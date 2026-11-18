// Reversos de las cartas: una pieza de arte por mazo, dibujada en canvas 2D.
// Los elementos "aleatorios" usan una semilla fija, así cada reverso es siempre igual.

// Mismas medidas que cardArt.js (naipe 2.5 x 3.5, radio de esquina 0.14)
const W = 720;
const H = 1008;
const R = (0.14 / 2.5) * W;
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif';
const CJK = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Noto Serif CJK JP", "Hiragino Sans", "Noto Sans JP", "Noto Sans CJK JP", serif';
const TAU = Math.PI * 2;

// ---------- utilidades ----------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeCanvas(scale = 1.5) {
  const c = document.createElement('canvas');
  c.width = W * scale;
  c.height = H * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  roundRect(ctx, 0, 0, W, H, R);
  ctx.clip();
  return [c, ctx];
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spaced(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

function grad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

const goldStops = ['#fbe9b7', '#d4a44f', '#fff1c4', '#a8742a', '#e9c27a'];

function title(ctx, text, y, color, size = 26, space = 12, font = SANS, weight = 700) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  spaced(ctx, space);
  ctx.fillText(text, W / 2 + space / 2, y);
  ctx.restore();
}

function grain(ctx, seed, count, light, dark, alpha = 0.05) {
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.4 + r());
    ctx.fillStyle = r() < 0.5 ? light : dark;
    ctx.fillRect(r() * W, r() * H, 1.2, 1.2);
  }
  ctx.restore();
}

// Curva polar cerrada r(θ)
function polar(ctx, cx, cy, fn, steps = 720) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU;
    const r = fn(t);
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// Trazo suave que pasa por una lista de puntos
function smoothThrough(ctx, pts, start = true) {
  if (start) ctx.moveTo(pts[0][0], pts[0][1]);
  else ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

function lipsPath(ctx, cx, cy, w) {
  const upper = new Path2D();
  upper.moveTo(cx - w, cy);
  upper.bezierCurveTo(cx - w * 0.7, cy - w * 0.19, cx - w * 0.45, cy - w * 0.45, cx - w * 0.22, cy - w * 0.42);
  upper.bezierCurveTo(cx - w * 0.08, cy - w * 0.4, cx - 6, cy - w * 0.3, cx, cy - w * 0.27);
  upper.bezierCurveTo(cx + 6, cy - w * 0.3, cx + w * 0.08, cy - w * 0.4, cx + w * 0.22, cy - w * 0.42);
  upper.bezierCurveTo(cx + w * 0.45, cy - w * 0.45, cx + w * 0.7, cy - w * 0.19, cx + w, cy);
  upper.bezierCurveTo(cx + w * 0.55, cy - w * 0.03, cx + w * 0.25, cy - w * 0.07, cx, cy - w * 0.02);
  upper.bezierCurveTo(cx - w * 0.25, cy - w * 0.07, cx - w * 0.55, cy - w * 0.03, cx - w, cy);
  upper.closePath();
  const lower = new Path2D();
  lower.moveTo(cx - w, cy + 3);
  lower.bezierCurveTo(cx - w * 0.55, cy + 1, cx - w * 0.25, cy + w * 0.05, cx, cy + w * 0.03);
  lower.bezierCurveTo(cx + w * 0.25, cy + w * 0.05, cx + w * 0.55, cy + 1, cx + w, cy + 3);
  lower.bezierCurveTo(cx + w * 0.7, cy + w * 0.33, cx + w * 0.35, cy + w * 0.53, cx, cy + w * 0.54);
  lower.bezierCurveTo(cx - w * 0.35, cy + w * 0.53, cx - w * 0.7, cy + w * 0.33, cx - w, cy + 3);
  lower.closePath();
  return [upper, lower];
}

// =====================================================================
// CHUTO15 — Art déco con rosetón guilloché
// =====================================================================
function drawChuto() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const cy = H / 2 + 6;

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.72);
  bg.addColorStop(0, '#1f0c22');
  bg.addColorStop(0.55, '#0d0610');
  bg.addColorStop(1, '#040205');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Rayos de sol déco
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 144; i++) {
    ctx.rotate(TAU / 144);
    ctx.strokeStyle = i % 2 ? 'rgba(239,68,68,.09)' : 'rgba(168,85,247,.09)';
    ctx.lineWidth = i % 6 === 0 ? 1.6 : 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(0, 900);
    ctx.stroke();
  }
  ctx.restore();

  const rp = grad(ctx, cx - 260, cy - 260, cx + 260, cy + 260, ['#ff4d5e', '#c026d3', '#8b5cf6']);

  // Guilloché: anillos trenzados y un epitrocoide de encaje
  ctx.save();
  ctx.strokeStyle = rp;
  ctx.lineWidth = 0.9;
  for (let k = 0; k < 9; k++) {
    ctx.globalAlpha = 0.75;
    polar(ctx, cx, cy, (t) => 238 + 15 * Math.sin(40 * t + (k * Math.PI) / 9));
    ctx.stroke();
  }
  for (let k = 0; k < 7; k++) {
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    const Rr = 150, r = 25, d = 58, rot = (k * Math.PI) / 21;
    for (let i = 0; i <= 1440; i++) {
      const t = (i / 1440) * TAU;
      const x = (Rr + r) * Math.cos(t) - d * Math.cos(((Rr + r) / r) * t);
      const y = (Rr + r) * Math.sin(t) - d * Math.sin(((Rr + r) / r) * t);
      const xr = cx + x * Math.cos(rot) - y * Math.sin(rot);
      const yr = cy + x * Math.sin(rot) + y * Math.cos(rot);
      if (i) ctx.lineTo(xr, yr);
      else ctx.moveTo(xr, yr);
    }
    ctx.stroke();
  }
  for (let k = 0; k < 6; k++) {
    ctx.globalAlpha = 0.6;
    polar(ctx, cx, cy, (t) => 116 + 8 * Math.sin(24 * t + (k * Math.PI) / 6));
    ctx.stroke();
  }
  ctx.restore();

  // Medallón central
  ctx.beginPath();
  ctx.arc(cx, cy, 100, 0, TAU);
  ctx.fillStyle = '#0b050d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = rp;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, TAU);
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 100, cy + Math.sin(a) * 100);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = rp;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 900 104px ${SANS}`;
  ctx.fillStyle = grad(ctx, cx - 60, cy, cx + 60, cy, ['#ef4444', '#a855f7']);
  ctx.shadowColor = 'rgba(239,68,68,.6)';
  ctx.shadowBlur = 18;
  ctx.fillText('15', cx - 4, cy + 4);
  ctx.restore();

  // Marco déco con abanicos en las esquinas
  ctx.strokeStyle = rp;
  ctx.lineWidth = 3;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  roundRect(ctx, 44, 44, W - 88, H - 88, R - 22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const corners = [[44, 44, 0], [W - 44, 44, Math.PI / 2], [W - 44, H - 44, Math.PI], [44, H - 44, -Math.PI / 2]];
  for (const [x, y, a] of corners) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.strokeStyle = rp;
    for (let r = 22; r <= 92; r += 14) {
      ctx.globalAlpha = 1 - r / 130;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    for (let i = 1; i < 6; i++) {
      const t = (i / 6) * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(t) * 22, Math.sin(t) * 22);
      ctx.lineTo(Math.cos(t) * 92, Math.sin(t) * 92);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Remates superior e inferior
  title(ctx, 'CHUTO', 150, 'rgba(255,255,255,.62)', 22, 18);
  for (const y of [190, H - 168]) {
    ctx.save();
    ctx.strokeStyle = rp;
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 22 - 8, y - 8);
      ctx.lineTo(cx + i * 22, y);
      ctx.lineTo(cx + i * 22 + 8, y - 8);
      ctx.stroke();
    }
    ctx.restore();
  }
  title(ctx, '· +18 ·', H - 132, 'rgba(255,255,255,.45)', 16, 10);
  return c;
}

// =====================================================================
// SIN CENSURA — Barroco noir: damasco, volutas doradas, camafeo
// =====================================================================
function drawCensura() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const cy = H / 2 - 20;
  const gold = grad(ctx, 0, 0, W, H, goldStops);

  const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, H * 0.75);
  bg.addColorStop(0, '#4c0716');
  bg.addColorStop(0.55, '#1a040b');
  bg.addColorStop(1, '#050203');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Damasco
  ctx.save();
  ctx.fillStyle = 'rgba(255,70,100,.07)';
  for (let row = 0, y = 40; y < H + 60; y += 108, row++) {
    for (let x = row % 2 ? 0 : 60; x < W + 60; x += 120) {
      const s = 34;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 0.45, x + s * 0.35, y + s * 0.45, x, y + s * 0.9);
      ctx.bezierCurveTo(x - s * 0.35, y + s * 0.45, x - s * 0.7, y - s * 0.45, x, y - s);
      ctx.fill();
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(x + d * s * 0.95, y + s * 0.15, s * 0.32, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + d * s * 0.2, y + s * 0.6);
        ctx.quadraticCurveTo(x + d * s * 1.3, y + s * 0.9, x + d * s * 1.1, y - s * 0.3);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,70,100,.07)';
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  grain(ctx, 11, 9000, '#ffffff', '#000000', 0.05);

  // Marco dorado con volutas
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3.5;
  roundRect(ctx, 28, 28, W - 56, H - 56, R - 14);
  ctx.stroke();
  ctx.lineWidth = 1;
  roundRect(ctx, 44, 44, W - 88, H - 88, R - 22);
  ctx.stroke();
  const scroll = (x, y, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (const mirror of [false, true]) {
      ctx.save();
      if (mirror) ctx.transform(0, 1, 1, 0, 0, 0); // reflejo sobre la diagonal
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.quadraticCurveTo(46, 6, 74, 26);
      for (let i = 0; i <= 90; i++) {
        const t = (i / 90) * 2.6 * Math.PI;
        const rr = 14 - t * 1.6;
        ctx.lineTo(74 + Math.cos(t - Math.PI / 2) * -rr, 40 + Math.sin(t - Math.PI / 2) * -rr * -1 - 14 + 14);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(14, 14, 5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, 22);
    ctx.quadraticCurveTo(40, 40, 30, 58);
    ctx.quadraticCurveTo(40, 40, 58, 30);
    ctx.stroke();
    ctx.restore();
  };
  scroll(44, 44, 0);
  scroll(W - 44, 44, Math.PI / 2);
  scroll(W - 44, H - 44, Math.PI);
  scroll(44, H - 44, -Math.PI / 2);

  // Corona
  ctx.save();
  ctx.translate(cx, 128);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(-46, 22);
  ctx.lineTo(-52, -14);
  ctx.lineTo(-26, 6);
  ctx.lineTo(0, -26);
  ctx.lineTo(26, 6);
  ctx.lineTo(52, -14);
  ctx.lineTo(46, 22);
  ctx.closePath();
  ctx.fill();
  for (const [x, y] of [[-52, -18], [0, -30], [52, -18]]) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Camafeo con perlas
  const rx = 205;
  const ry = 250;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  const inner = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy, ry);
  inner.addColorStop(0, '#3a0610');
  inner.addColorStop(1, '#0c0205');
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.clip();
  // trama de semitono en el camafeo
  ctx.fillStyle = 'rgba(255,40,80,.12)';
  for (let y = cy - ry; y < cy + ry; y += 12) {
    for (let x = cx - rx; x < cx + rx; x += 12) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      const s = Math.max(0, 3.2 * (d - 0.35));
      if (s > 0.2) {
        ctx.beginPath();
        ctx.arc(x + ((y / 12) % 2 ? 6 : 0), y, s, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * TAU;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(t) * (rx + 14), cy + Math.sin(t) * (ry + 14), 4.2, 0, TAU);
    const pearl = ctx.createRadialGradient(cx + Math.cos(t) * (rx + 14) - 1.5, cy + Math.sin(t) * (ry + 14) - 1.5, 0.5, cx + Math.cos(t) * (rx + 14), cy + Math.sin(t) * (ry + 14), 4.2);
    pearl.addColorStop(0, '#fff8e6');
    pearl.addColorStop(1, '#b8893c');
    ctx.fillStyle = pearl;
    ctx.fill();
  }

  // Labios
  const [upper, lower] = lipsPath(ctx, cx, cy + 6, 150);
  const lipG = grad(ctx, cx, cy - 70, cx, cy + 90, ['#ff3355', '#c8102e', '#6e0418']);
  ctx.save();
  ctx.shadowColor = 'rgba(255,30,70,.45)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = lipG;
  ctx.fill(upper);
  ctx.fill(lower);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 40, cy + 50, 34, 9, -0.1, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(cx + 52, cy - 40, 22, 6, 0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#3d020c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 144, cy + 8);
  ctx.bezierCurveTo(cx - 75, cy + 12, cx - 30, cy + 18, cx, cy + 11);
  ctx.bezierCurveTo(cx + 30, cy + 18, cx + 75, cy + 12, cx + 144, cy + 8);
  ctx.stroke();

  // Cinta con el nombre
  const by = cy + ry + 50;
  const bw = 400;
  ctx.fillStyle = '#7a5418';
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + d * (bw / 2 - 30), by - 14);
    ctx.lineTo(cx + d * (bw / 2 + 40), by - 14);
    ctx.lineTo(cx + d * (bw / 2 + 22), by + 18);
    ctx.lineTo(cx + d * (bw / 2 + 40), by + 50);
    ctx.lineTo(cx + d * (bw / 2 - 30), by + 50);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = grad(ctx, cx - bw / 2, by, cx + bw / 2, by, goldStops);
  ctx.beginPath();
  ctx.moveTo(cx - bw / 2, by - 30);
  ctx.quadraticCurveTo(cx, by - 46, cx + bw / 2, by - 30);
  ctx.lineTo(cx + bw / 2, by + 30);
  ctx.quadraticCurveTo(cx, by + 14, cx - bw / 2, by + 30);
  ctx.closePath();
  ctx.fill();
  title(ctx, 'SIN CENSURA', by - 6, '#4a0712', 28, 10, SERIF, 800);
  title(ctx, '+18', H - 92, gold, 18, 8, SERIF, 700);
  return c;
}

// =====================================================================
// ENTRE DOS — Tarot celestial: el sol y la luna en eclipse (VI · Los Enamorados)
// =====================================================================
function drawEntreDos() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const rose = grad(ctx, 0, 0, W, H, ['#ffd9cc', '#e8a598', '#f6c1b4', '#b76e79', '#f2b8a6']);
  const r = rng(26);

  ctx.fillStyle = grad(ctx, 0, 0, 0, H, ['#1d0b33', '#2a0a26', '#0a0513']);
  ctx.fillRect(0, 0, W, H);

  // Estrellas
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = 0.25 + r() * 0.7;
    ctx.fillStyle = r() < 0.75 ? '#ffffff' : '#ffc2d4';
    ctx.beginPath();
    ctx.arc(r() * W, r() * H, 0.4 + r() * 1.5, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const sparkle = (x, y, s) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffe9f0';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rr = i % 2 ? s * 0.18 : s;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 14; i++) sparkle(60 + r() * (W - 120), 60 + r() * (H - 120), 5 + r() * 9);

  // Arco de tarot
  const arch = (inset) => {
    const left = 64 + inset;
    const right = W - 64 - inset;
    const bottom = H - 84 - inset;
    const rad = (right - left) / 2;
    const ay = 70 + inset + rad;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(left, ay);
    ctx.arc(cx, ay, rad, Math.PI, TAU);
    ctx.lineTo(right, bottom);
    ctx.closePath();
  };
  ctx.strokeStyle = rose;
  ctx.lineWidth = 3;
  arch(0);
  ctx.stroke();
  ctx.lineWidth = 1;
  arch(14);
  ctx.stroke();
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sol
  const sx = cx - 26;
  const sy = 470;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.strokeStyle = rose;
  ctx.lineCap = 'round';
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU;
    ctx.save();
    ctx.rotate(a);
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (i % 2) {
      ctx.moveTo(0, 132);
      for (let k = 0; k <= 20; k++) ctx.lineTo(Math.sin(k * 0.9) * 6, 132 + k * 3.6);
    } else {
      ctx.moveTo(0, 132);
      ctx.lineTo(0, 206);
    }
    ctx.stroke();
    ctx.restore();
  }
  const disk = ctx.createRadialGradient(-30, -30, 10, 0, 0, 120);
  disk.addColorStop(0, '#ffe3d6');
  disk.addColorStop(0.6, '#e8a598');
  disk.addColorStop(1, '#a35a6a');
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, TAU);
  ctx.fillStyle = disk;
  ctx.shadowColor = 'rgba(255,170,150,.55)';
  ctx.shadowBlur = 40;
  ctx.fill();
  ctx.restore();

  // Luna creciente abrazando al sol
  ctx.save();
  const mx = cx + 70;
  const my = 450;
  ctx.beginPath();
  ctx.arc(mx, my, 116, 0, TAU);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.arc(mx + 52, my - 36, 104, 0, TAU, true);
  ctx.fillStyle = grad(ctx, mx - 116, my - 116, mx + 116, my + 116, ['#fff0f6', '#e9b8cf', '#9d4f78']);
  ctx.shadowColor = 'rgba(255,190,220,.6)';
  ctx.shadowBlur = 24;
  ctx.fill('evenodd');
  ctx.restore();

  // Constelación en forma de corazón
  const heart = [];
  for (let i = 0; i < 9; i++) {
    const t = (i / 9) * TAU;
    heart.push([cx + 90 * Math.pow(Math.sin(t), 3) * 1.1, 760 - (70 * Math.cos(t) - 28 * Math.cos(2 * t) - 12 * Math.cos(3 * t) - 6 * Math.cos(4 * t)) * 0.9]);
  }
  ctx.strokeStyle = 'rgba(255,214,226,.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  heart.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  heart.forEach(([x, y]) => sparkle(x, y, 7));

  title(ctx, 'VI', 172, rose, 40, 6, SERIF, 400);
  title(ctx, 'ENTRE DOS', H - 140, rose, 28, 14, SERIF, 600);
  title(ctx, 'LOS ENAMORADOS', H - 106, 'rgba(246,193,180,.6)', 13, 8, SANS, 600);
  return c;
}

// =====================================================================
// PRIMERA CITA — Recortes a lo Matisse y el jarrón de Rubin (dos perfiles)
// =====================================================================
function drawCita() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const navy = '#1f2a44';
  const terracotta = '#c4532f';
  const r = rng(7);

  ctx.fillStyle = '#f4e7d3';
  ctx.fillRect(0, 0, W, H);
  grain(ctx, 3, 12000, '#ffffff', '#8a6a4a', 0.08);

  // Sol de papel recortado
  ctx.fillStyle = '#f2994a';
  polar(ctx, cx, 360, (t) => 128 + 3 * Math.sin(9 * t) + 2 * Math.sin(23 * t));
  ctx.fill();

  // Hojas de Matisse
  const leaf = (x, y, s, rot, col, lobes) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, 2.1);
    ctx.fillStyle = col;
    polar(ctx, 0, 0, (t) => s * (0.72 + 0.28 * Math.sin(lobes * t + 0.7)) * (0.75 + 0.25 * Math.cos(t)), 360);
    ctx.fill();
    ctx.restore();
  };
  leaf(110, 170, 46, -0.5, '#6b8f5e', 5);
  leaf(W - 112, H - 160, 50, 0.6, '#6b8f5e', 6);
  leaf(W - 120, 200, 30, 0.9, terracotta, 4);
  leaf(120, H - 200, 32, -0.8, '#e9b44c', 5);
  // confeti de papel, fuera de la zona de los perfiles
  for (let i = 0; i < 22; i++) {
    const x = 70 + r() * (W - 140);
    const y = 80 + r() * (H - 160);
    const size = 3 + r() * 5;
    if (y > 290 && y < 830) continue;
    ctx.fillStyle = ['#1f2a44', '#c4532f', '#6b8f5e', '#e9b44c'][i % 4];
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }

  // Dos perfiles mirándose (el espacio entre ellos forma un jarrón)
  const top = 300;
  const profile = [
    [-150, 0], [-140, 70], [-112, 120], [-98, 150], [-64, 190], [-58, 203], [-90, 214], [-84, 232],
    [-102, 246], [-82, 262], [-98, 282], [-112, 300], [-90, 330], [-122, 372], [-150, 420], [-150, 520],
  ];
  const face = (dir, color) => {
    const pts = profile.map(([x, y]) => [cx + dir * x, top + y]);
    ctx.beginPath();
    ctx.moveTo(cx + dir * -300, top);
    smoothThrough(ctx, pts, false);
    ctx.lineTo(cx + dir * -300, top + 520);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ctx.save();
  roundRect(ctx, 60, top, W - 120, 520, 4);
  ctx.clip();
  face(1, navy);
  face(-1, terracotta);
  ctx.restore();

  // Marco y textos
  ctx.strokeStyle = navy;
  ctx.lineWidth = 3;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.stroke();
  ctx.lineWidth = 1;
  roundRect(ctx, 40, 40, W - 80, H - 80, R - 20);
  ctx.stroke();
  title(ctx, 'PRIMERA CITA', 168, navy, 26, 14, SANS, 800);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = navy;
  ctx.font = `italic 400 40px ${SERIF}`;
  ctx.fillText('¿y tú?', cx, H - 118);
  ctx.restore();
  return c;
}

// =====================================================================
// SABELOTODO — Astrolabio grabado
// =====================================================================
function drawTrivia() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const cy = H / 2 + 26;
  const gold = grad(ctx, 0, 0, W, H, goldStops);
  const r = rng(42);

  const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, H * 0.75);
  bg.addColorStop(0, '#16285a');
  bg.addColorStop(1, '#060b1f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, 5, 7000, '#ffffff', '#000000', 0.05);

  // Estrellas de fondo
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.2 + r() * 0.5;
    ctx.fillStyle = '#dfe8ff';
    ctx.beginPath();
    ctx.arc(r() * W, r() * H, 0.4 + r() * 1.1, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const R0 = 286;
  ctx.strokeStyle = gold;
  ctx.fillStyle = gold;

  // Argolla superior
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy - R0 - 34, 20, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy - R0 - 8);
  ctx.quadraticCurveTo(cx, cy - R0 - 30, cx + 22, cy - R0 - 8);
  ctx.stroke();

  // Madre: anillos y graduación
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R0, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R0 - 16, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R0 - 50, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 360; i += 2) {
    const a = (i * Math.PI) / 180;
    const len = i % 30 === 0 ? 16 : i % 10 === 0 ? 11 : 6;
    ctx.lineWidth = i % 10 === 0 ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0);
    ctx.lineTo(cx + Math.cos(a) * (R0 - len), cy + Math.sin(a) * (R0 - len));
    ctx.stroke();
  }
  const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.font = `600 15px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  roman.forEach((n, i) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i / 12) * TAU);
    ctx.fillText(n, 0, -(R0 - 33));
    ctx.restore();
  });

  // Almucantarates (círculos descentrados de la lámina)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R0 - 50, 0, TAU);
  ctx.clip();
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy + 40 - i * 13, 228 - i * 21, 0, TAU);
    ctx.stroke();
  }
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, Math.abs(i) * 52 + 4, 236, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  // Red (eclíptica + punteros de estrellas)
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 44, 168, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy - 44, 156, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU;
    const d = 70 + r() * 150;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(6, -2, 0, 12);
    ctx.quadraticCurveTo(-6, -2, 0, -14);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, TAU);
    ctx.fillStyle = '#e8f3ff';
    ctx.fill();
    ctx.fillStyle = gold;
  }
  ctx.restore();

  // Alidada
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.62);
  ctx.fillStyle = 'rgba(8,14,36,.85)';
  ctx.beginPath();
  ctx.moveTo(-R0 + 6, -9);
  ctx.lineTo(R0 - 6, -2);
  ctx.lineTo(R0 - 6, 2);
  ctx.lineTo(-R0 + 6, 9);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.restore();

  // Signo de interrogación como gnomon
  ctx.save();
  ctx.font = `italic 700 190px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#081026';
  ctx.strokeText('?', cx + 6, cy + 8);
  ctx.fillStyle = gold;
  ctx.shadowColor = 'rgba(255,220,140,.5)';
  ctx.shadowBlur = 20;
  ctx.fillText('?', cx + 6, cy + 8);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, TAU);
  ctx.fillStyle = gold;
  ctx.fill();

  // Marco
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.stroke();
  ctx.lineWidth = 1;
  roundRect(ctx, 40, 40, W - 80, H - 80, R - 20);
  ctx.stroke();
  for (const [x, y] of [[96, 100], [W - 96, 100], [96, H - 100], [W - 96, H - 100]]) {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, TAU);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 22 * Math.cos(x + y), y + 22 * Math.sin(x + y), 4, 0, TAU);
    ctx.fill();
  }
  title(ctx, 'SABELOTODO', 120, gold, 24, 14, SERIF, 700);
  title(ctx, 'CULTURA · GENERAL', H - 112, 'rgba(233,200,140,.75)', 14, 9, SERIF, 600);
  return c;
}

// =====================================================================
// CARRETE ONLINE — Líneas de pulso (a lo "Unknown Pleasures")
// =====================================================================
function drawOnline() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const bgColor = '#07061a';
  const r = rng(1979);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(cx, 560, 10, cx, 560, 420);
  glow.addColorStop(0, 'rgba(124,58,237,.35)');
  glow.addColorStop(1, 'rgba(124,58,237,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const left = 112;
  const right = W - 112;
  const lines = 44;
  const top = 300;
  const step = 11.5;
  const mid = (left + right) / 2;
  const width = right - left;
  for (let i = 0; i < lines; i++) {
    const base = top + i * step;
    const bumps = Array.from({ length: 4 }, () => ({
      c: mid + (r() - 0.5) * width * 0.34,
      s: 8 + r() * 22,
      a: 18 + r() * 52,
    }));
    const pts = [];
    for (let x = left; x <= right; x += 3) {
      const env = Math.exp(-Math.pow((x - mid) / (width * 0.19), 2));
      let y = (r() - 0.5) * 2.2;
      for (const b of bumps) y += b.a * Math.exp(-Math.pow((x - b.c) / b.s, 2));
      pts.push([x, base - y * env - (r() - 0.5) * 1.5 * env]);
    }
    ctx.beginPath();
    // solo hace falta tapar hasta la línea base: las líneas de atrás quedan siempre más arriba
    ctx.moveTo(left, base + 2);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(right, base + 2);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
    const t = i / (lines - 1);
    const col = `rgb(${Math.round(34 + t * 134)}, ${Math.round(211 - t * 126)}, ${Math.round(238 + t * 9)})`;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = col;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
  }

  // "EN VIVO"
  ctx.save();
  ctx.font = `700 15px ${SANS}`;
  spaced(ctx, 4);
  const tw = ctx.measureText('EN VIVO').width;
  const pw = tw + 64;
  roundRect(ctx, cx - pw / 2, 214, pw, 36, 18);
  ctx.strokeStyle = 'rgba(199,210,254,.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#e0e7ff';
  ctx.textBaseline = 'middle';
  ctx.fillText('EN VIVO', cx - pw / 2 + 40, 233);
  ctx.beginPath();
  ctx.arc(cx - pw / 2 + 22, 232, 6, 0, TAU);
  ctx.fillStyle = '#ff3b5c';
  ctx.shadowColor = '#ff3b5c';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();

  // Marco
  const fr = grad(ctx, 0, 0, W, H, ['#22d3ee', '#8b5cf6', '#c084fc']);
  ctx.strokeStyle = fr;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  roundRect(ctx, 40, 40, W - 80, H - 80, R - 20);
  ctx.stroke();
  ctx.globalAlpha = 1;
  title(ctx, 'CARRETE ONLINE', 150, '#e0e7ff', 24, 14, SANS, 800);
  title(ctx, 'SEÑAL · DESDE · CASA', H - 120, 'rgba(199,210,254,.55)', 13, 8, SANS, 600);
  return c;
}

// =====================================================================
// KAWAII NEKO — Estampa japonesa: seigaiha, ensō, sakura y sello hanko
// =====================================================================
function drawKawaii() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const cy = H / 2 + 20;
  const ink = '#4a3348';
  const r = rng(88);

  ctx.fillStyle = grad(ctx, 0, 0, W, H, ['#fde2ec', '#f7d3e7', '#e4dcfb']);
  ctx.fillRect(0, 0, W, H);

  // Olas seigaiha
  const rad = 40;
  for (let row = 0, y = 0; y < H + rad; y += rad / 2, row++) {
    for (let x = row % 2 ? rad : 0; x < W + rad; x += rad * 2) {
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(x, y, rad - k * 9.5, Math.PI, TAU);
        ctx.closePath();
        ctx.fillStyle = k % 2 ? '#fbe3ef' : '#f6cfe2';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  }

  // Disco de luna y ensō
  ctx.beginPath();
  ctx.arc(cx, cy, 246, 0, TAU);
  ctx.fillStyle = '#fff8f1';
  ctx.fill();
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const start = -1.2 + r() * 0.15;
    const end = start + TAU * 0.86 + r() * 0.12;
    ctx.globalAlpha = 0.18 + r() * 0.3;
    ctx.strokeStyle = '#c81e4a';
    ctx.lineWidth = 2 + r() * 7;
    ctx.beginPath();
    ctx.arc(cx + (r() - 0.5) * 6, cy + (r() - 0.5) * 6, 246 + (r() - 0.5) * 14, start, end);
    ctx.stroke();
  }
  ctx.restore();

  // Gato
  const s = 0.86;
  ctx.save();
  ctx.translate(cx, cy + 10);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const ear = (dir) => {
    ctx.beginPath();
    ctx.moveTo(dir * 150, -60);
    ctx.lineTo(dir * 165, -215);
    ctx.lineTo(dir * 55, -140);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dir * 140, -95);
    ctx.lineTo(dir * 150, -180);
    ctx.lineTo(dir * 88, -135);
    ctx.closePath();
    ctx.fillStyle = '#f9a8d4';
    ctx.fill();
  };
  ear(-1);
  ear(1);
  // collar con cascabel
  ctx.beginPath();
  ctx.ellipse(0, 150, 130, 26, 0, 0, Math.PI);
  ctx.lineWidth = 20;
  ctx.strokeStyle = '#e11d48';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 190, 160, 0, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = ink;
  ctx.stroke();
  const bell = ctx.createRadialGradient(-8, 176, 2, 0, 184, 26);
  bell.addColorStop(0, '#fff3c4');
  bell.addColorStop(1, '#c99a2e');
  ctx.beginPath();
  ctx.arc(0, 186, 24, 0, TAU);
  ctx.fillStyle = bell;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8a6418';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-14, 190);
  ctx.lineTo(14, 190);
  ctx.moveTo(0, 190);
  ctx.lineTo(0, 204);
  ctx.stroke();
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(dir * 70, -10, 24, 30, 0, 0, TAU);
    ctx.fillStyle = ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dir * 70 - 8, -22, 9, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dir * 70 + 9, -2, 4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(dir * 118, 42, 28, 16, 0, 0, TAU);
    ctx.fillStyle = 'rgba(244,114,182,.55)';
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 150, 20 + k * 14);
      ctx.lineTo(dir * 225, 8 + k * 30);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-12, 26);
  ctx.lineTo(12, 26);
  ctx.lineTo(0, 38);
  ctx.closePath();
  ctx.fillStyle = '#f472b6';
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(-16, 44, 16, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(16, 44, 16, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Flores de sakura
  const flower = (x, y, size, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    for (let i = 0; i < 5; i++) {
      ctx.rotate(TAU / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(size * 0.6, -size * 0.2, size * 0.55, -size, size * 0.12, -size * 1.02);
      ctx.lineTo(0, -size * 0.86);
      ctx.lineTo(-size * 0.12, -size * 1.02);
      ctx.bezierCurveTo(-size * 0.55, -size, -size * 0.6, -size * 0.2, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#f9a8d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.18, 0, TAU);
    ctx.fillStyle = '#f472b6';
    ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 24; i++) {
    const a = r() * TAU;
    const d = 270 + r() * 220;
    const x = cx + Math.cos(a) * d * 0.9;
    const y = cy + Math.sin(a) * d * 1.1;
    if (x < 60 || x > W - 60 || y < 60 || y > H - 60) continue;
    flower(x, y, 10 + r() * 12, r() * TAU);
  }

  // Escritura vertical y sello hanko
  ctx.save();
  ctx.fillStyle = ink;
  ctx.font = `700 38px ${CJK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [...'かわいいねこ'].forEach((ch, i) => ctx.fillText(ch, 96, 150 + i * 48));
  ctx.font = `700 30px ${CJK}`;
  ctx.fillStyle = '#9d174d';
  [...'可愛い'].forEach((ch, i) => ctx.fillText(ch, W - 96, 150 + i * 42));
  ctx.restore();
  ctx.save();
  ctx.translate(W - 132, H - 150);
  ctx.rotate(-0.06);
  roundRect(ctx, -40, -40, 80, 80, 10);
  ctx.fillStyle = '#d7263d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff1f2';
  roundRect(ctx, -32, -32, 64, 64, 6);
  ctx.stroke();
  ctx.fillStyle = '#fff1f2';
  ctx.font = `700 46px ${CJK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('猫', 0, 2);
  ctx.restore();

  // Marco
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(219,39,119,.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 10]);
  roundRect(ctx, 44, 44, W - 88, H - 88, R - 22);
  ctx.stroke();
  ctx.setLineDash([]);
  return c;
}


// =====================================================================
// CULTURA CHUPÍSTICA — Cómic pop-art: rayos, semitono, schop espumoso y globo de diálogo
// =====================================================================
function drawChupistica() {
  const [c, ctx] = makeCanvas();
  const cx = W / 2;
  const cy = H / 2 + 60;
  const ink = '#1a0f06';

  // Rayos de sol alternados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 24; i++) {
    ctx.rotate(TAU / 24);
    if (i % 2) continue;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-90, -1100);
    ctx.lineTo(90, -1100);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();
  }
  ctx.restore();

  // Trama de semitono (puntos que crecen hacia los bordes)
  ctx.fillStyle = 'rgba(26,15,6,.16)';
  for (let y = 10; y < H; y += 16) {
    for (let x = ((y / 16) % 2) * 8; x < W; x += 16) {
      const d = Math.hypot(x - cx, y - cy) / 620;
      const r = Math.max(0, Math.min(5.5, d * 6.5 - 1.2));
      if (r > 0.3) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
    }
  }

  // Schop (jarra de cerveza)
  const gw = 250;
  const gh = 330;
  const gx = cx - gw / 2 - 30;
  const gy = cy - gh / 2 + 40;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // asa
  ctx.lineWidth = 34;
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.moveTo(gx + gw - 6, gy + 70);
  ctx.bezierCurveTo(gx + gw + 120, gy + 70, gx + gw + 120, gy + gh - 90, gx + gw - 6, gy + gh - 90);
  ctx.stroke();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#fde68a';
  ctx.stroke();
  // vaso
  roundRect(ctx, gx, gy, gw, gh, 26);
  const beer = ctx.createLinearGradient(gx, 0, gx + gw, 0);
  beer.addColorStop(0, '#f59e0b');
  beer.addColorStop(0.5, '#fbbf24');
  beer.addColorStop(1, '#d97706');
  ctx.fillStyle = beer;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = ink;
  ctx.stroke();
  // burbujas
  const r = rng(12);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    ctx.arc(gx + 26 + r() * (gw - 52), gy + 70 + r() * (gh - 100), 3 + r() * 7, 0, TAU);
    ctx.fill();
  }
  // brillo del vidrio
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  roundRect(ctx, gx + 22, gy + 60, 22, gh - 90, 11);
  ctx.fill();
  // espuma: nube de círculos (primero el contorno de todos, luego el relleno, así queda una sola silueta)
  const foamY = gy + 10;
  const puffs = [
    [gx + 6, foamY + 14, 40], [gx + 58, foamY - 18, 50], [gx + 128, foamY - 30, 56], [gx + 196, foamY - 14, 48],
    [gx + gw + 2, foamY + 12, 38], [gx + 40, foamY + 34, 36], [gx + 110, foamY + 30, 40], [gx + 180, foamY + 32, 38],
  ];
  ctx.fillStyle = ink;
  puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr + 9, 0, TAU); ctx.fill(); });
  ctx.fillStyle = '#fffbeb';
  puffs.forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); });
  ctx.fillStyle = 'rgba(253,230,138,.55)';
  puffs.slice(5).forEach(([px, py, pr]) => { ctx.beginPath(); ctx.arc(px + 6, py + 10, pr * 0.6, 0, TAU); ctx.fill(); });
  ctx.strokeStyle = ink;
  // gota que cae
  ctx.beginPath();
  ctx.moveTo(gx + gw - 30, foamY + 52);
  ctx.quadraticCurveTo(gx + gw - 12, foamY + 100, gx + gw - 30, foamY + 112);
  ctx.quadraticCurveTo(gx + gw - 48, foamY + 100, gx + gw - 30, foamY + 52);
  ctx.fillStyle = '#fffbeb';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.stroke();

  // Globo de diálogo con el nombre
  const bx = 70;
  const by = 120;
  const bw = W - 140;
  const bh = 170;
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, TAU);
  ctx.moveTo(bx + bw * 0.62, by + bh - 10);
  ctx.lineTo(bx + bw * 0.7, by + bh + 70);
  ctx.lineTo(bx + bw * 0.5, by + bh - 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2 - 5, bh / 2 - 5, 0, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.font = `italic 900 50px ${SANS}`;
  ctx.fillText('¡CULTURA', bx + bw / 2, by + bh / 2 - 28);
  ctx.fillStyle = '#ea580c';
  ctx.font = `italic 900 56px ${SANS}`;
  ctx.fillText('CHUPÍSTICA!', bx + bw / 2, by + bh / 2 + 30);
  ctx.restore();

  // Cinta inferior
  ctx.save();
  ctx.translate(cx, H - 128);
  ctx.rotate(-0.04);
  roundRect(ctx, -250, -34, 500, 68, 10);
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = `italic 900 28px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  spaced(ctx, 3);
  ctx.fillText('¡EL QUE PIERDE, TOMA!', 3, 2);
  ctx.restore();

  // Marco
  ctx.lineWidth = 10;
  ctx.strokeStyle = ink;
  roundRect(ctx, 22, 22, W - 44, H - 44, R - 10);
  ctx.stroke();
  return c;
}

const DRAWERS = {
  chuto15: drawChuto,
  sincensura: drawCensura,
  entredos: drawEntreDos,
  primeracita: drawCita,
  trivia: drawTrivia,
  carreteonline: drawOnline,
  chupistica: drawChupistica,
  kawaiineko: drawKawaii,
};

export function drawBackArt(deckId) {
  return (DRAWERS[deckId] || drawChuto)();
}
