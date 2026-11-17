// Dibujo de las cartas en canvas 2D (sin Three.js, se usa también en la interfaz)

// Proporción de naipe (2.5 x 3.5)
export const CARD_W = 2.5;
export const CARD_H = 3.5;
export const CARD_R = 0.14;

const W = 720;
const H = 1008;
const R = (CARD_R / CARD_W) * W;
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Paleta de cada mazo (el reverso es lo que lo identifica)
export const THEMES = {
  chuto15: {
    soft: '#ec4899', medium: '#a855f7', hard: '#ef4444', negotiated: '#f59e0b',
    face: '#0f0e12', ring: ['#ef4444', '#9333ea'], deck: ['#ef4444', '#7e22ce'],
  },
  sincensura: {
    soft: '#fb7185', medium: '#f43f5e', hard: '#dc2626', negotiated: '#fbbf24',
    face: '#120709', ring: ['#e11d48', '#d4a24c'], deck: ['#e11d48', '#7f1d1d'],
  },
  entredos: {
    soft: '#f9a8b4', medium: '#f472b6', hard: '#e11d48', negotiated: '#fbbf24',
    face: '#14080e', ring: ['#e8a598', '#be185d'], deck: ['#e8a598', '#831843'],
  },
  primeracita: {
    soft: '#fdba74', medium: '#fb923c', hard: '#f43f5e', negotiated: '#facc15',
    face: '#170d0b', ring: ['#fb923c', '#fda4af'], deck: ['#fb923c', '#9a3412'],
  },
  trivia: {
    soft: '#5eead4', medium: '#38bdf8', hard: '#818cf8', negotiated: '#facc15',
    face: '#0a1020', ring: ['#22d3ee', '#6366f1'], deck: ['#22d3ee', '#3730a3'],
  },
  carreteonline: {
    soft: '#a5b4fc', medium: '#818cf8', hard: '#c084fc', negotiated: '#facc15',
    face: '#0e0d1c', ring: ['#6366f1', '#22d3ee'], deck: ['#818cf8', '#3730a3'],
  },
  kawaiineko: {
    soft: '#f9a8d4', medium: '#c4b5fd', hard: '#fb7185', negotiated: '#fde68a',
    face: '#18121d', ring: ['#f9a8d4', '#a5f3fc'], deck: ['#f9a8d4', '#c4b5fd'],
  },
};
export const themeOf = (deckId) => THEMES[deckId] || THEMES.chuto15;
export const ACCENTS = THEMES.chuto15;

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeCanvas(scale) {
  const c = document.createElement('canvas');
  c.width = W * scale;
  c.height = H * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  roundRect(ctx, 0, 0, W, H, R);
  ctx.clip();
  return [c, ctx];
}


function spaced(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// ---------- Reversos (uno por mazo, compartido por todas sus cartas) ----------
const backCanvases = {};

export function getBackCanvas(deckId) {
  if (!backCanvases[deckId]) {
    const draw = {
      kawaiineko: drawKawaiiBack,
      sincensura: drawCensuraBack,
      entredos: drawEntreDosBack,
      primeracita: drawCitaBack,
      trivia: drawTriviaBack,
      carreteonline: drawOnlineBack,
    }[deckId] || drawChutoBack;
    backCanvases[deckId] = draw();
  }
  return backCanvases[deckId];
}

// Imagen del reverso para mostrarla en la interfaz (selección de mazo)
export function getBackImageURL(deckId) {
  return getBackCanvas(deckId).toDataURL('image/png');
}

function drawChutoBack() {
  const [c, ctx] = makeCanvas(1.5);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#16111a');
  bg.addColorStop(1, '#0b0a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // trama fina diagonal
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#ef4444');
  grad.addColorStop(1, '#9333ea');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  roundRect(ctx, 30, 30, W - 60, H - 60, R - 16);
  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 48, 48, W - 96, H - 96, R - 26);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // rombo central
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-150, -150, 300, 300);
  ctx.globalAlpha = 0.35;
  ctx.strokeRect(-172, -172, 344, 344);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grad;
  ctx.font = `italic 900 150px ${FONT}`;
  ctx.fillText('15', W / 2 - 4, H / 2 + 6);

  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = `700 24px ${FONT}`;
  spaced(ctx, 14);
  ctx.fillText('CHUTO', W / 2 + 7, H / 2 - 270);
  ctx.fillText('· · ·', W / 2 + 7, H / 2 + 270);

  return c;
}

// ---------- Utilidades de los reversos ----------
function backBase(ctx, stops, frame, inner = 0.45) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  stops.forEach((col, i) => bg.addColorStop(i / (stops.length - 1), col));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = frame;
  ctx.lineWidth = 3.5;
  roundRect(ctx, 30, 30, W - 60, H - 60, R - 16);
  ctx.stroke();
  ctx.globalAlpha = inner;
  ctx.lineWidth = 1.2;
  roundRect(ctx, 46, 46, W - 92, H - 92, R - 24);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function backTitle(ctx, text, color, y = 176, size = 32) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px ${FONT}`;
  spaced(ctx, 12);
  ctx.fillText(text, W / 2 + 6, y);
  spaced(ctx, 0);
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.55, y - s * 1.05, x, y - s * 0.5);
  ctx.bezierCurveTo(x + s * 0.55, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}

// "Entre Dos": dos corazones entrelazados en oro rosa sobre vino profundo
function drawEntreDosBack() {
  const [c, ctx] = makeCanvas(1.5);
  const rose = '#e8a598';
  backBase(ctx, ['#2a0a1a', '#12050c', '#2a0715'], rose);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = rose;
  for (let y = 70; y < H; y += 56) for (let x = (y / 56) % 2 ? 60 : 88; x < W; x += 56) { heartPath(ctx, x, y, 7); ctx.fill(); }
  ctx.restore();

  const cx = W / 2;
  const cy = H / 2 + 20;
  const g = ctx.createLinearGradient(cx - 200, cy - 150, cx + 200, cy + 150);
  g.addColorStop(0, '#f6c1b4');
  g.addColorStop(0.5, '#e8a598');
  g.addColorStop(1, '#b76e79');
  ctx.lineWidth = 16;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = g;
  heartPath(ctx, cx - 62, cy - 10, 150);
  ctx.stroke();
  ctx.strokeStyle = '#be185d';
  heartPath(ctx, cx + 62, cy + 10, 150);
  ctx.stroke();
  // entrelazado: vuelve a pintar un tramo del primero por encima
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 10, cy - 40, 120, 160);
  ctx.clip();
  ctx.strokeStyle = g;
  heartPath(ctx, cx - 62, cy - 10, 150);
  ctx.stroke();
  ctx.restore();

  backTitle(ctx, 'ENTRE DOS', rose);
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = 'rgba(232,165,152,.75)';
  spaced(ctx, 8);
  ctx.fillText('SOLO PAREJAS · +18', W / 2 + 4, H - 170);
  spaced(ctx, 0);
  return c;
}

// "Primera Cita": burbujas de diálogo sobre un atardecer
function drawCitaBack() {
  const [c, ctx] = makeCanvas(1.5);
  const cream = '#fff4e6';
  backBase(ctx, ['#fb923c', '#f43f5e', '#7c2d12'], cream, 0.6);

  // sol
  const sun = ctx.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.62, 260);
  sun.addColorStop(0, 'rgba(255,237,213,.55)');
  sun.addColorStop(1, 'rgba(255,237,213,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  const bubble = (x, y, w, h, tail, fill, text, col) => {
    roundRect(ctx, x, y, w, h, h / 2.2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + (tail > 0 ? w - 70 : 70), y + h - 6);
    ctx.lineTo(x + (tail > 0 ? w - 30 : 30), y + h + 44);
    ctx.lineTo(x + (tail > 0 ? w - 120 : 120), y + h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = col;
    ctx.font = `900 96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 4);
  };
  bubble(110, H / 2 - 190, 330, 170, -1, cream, '¿y tú?', '#f43f5e');
  ctx.font = `900 72px ${FONT}`;
  bubble(W - 110 - 300, H / 2 + 40, 300, 160, 1, '#7c2d12', '♥', cream);

  backTitle(ctx, 'PRIMERA CITA', cream);
  return c;
}

// "Sabelotodo": gran signo de interrogación sobre fondo tipo plano técnico
function drawTriviaBack() {
  const [c, ctx] = makeCanvas(1.5);
  const cyan = '#67e8f9';
  backBase(ctx, ['#0b1730', '#0a1020', '#1e1b4b'], cyan);

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 1;
  for (let x = 60; x < W - 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, H - 60); ctx.stroke(); }
  for (let y = 60; y < H - 40; y += 40) { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke(); }
  ctx.restore();

  const cx = W / 2;
  const cy = H / 2 + 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(103,232,249,.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([6, 14]);
  ctx.beginPath();
  ctx.arc(cx, cy, 236, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const g = ctx.createLinearGradient(cx, cy - 170, cx, cy + 170);
  g.addColorStop(0, '#67e8f9');
  g.addColorStop(1, '#818cf8');
  ctx.fillStyle = g;
  ctx.font = `900 330px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy + 14);

  backTitle(ctx, 'SABELOTODO', cyan);
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = 'rgba(103,232,249,.7)';
  spaced(ctx, 8);
  ctx.fillText('CULTURA GENERAL', W / 2 + 4, H - 170);
  spaced(ctx, 0);
  return c;
}

// "Carrete Online": audífonos con ondas, en tonos violeta y azul
function drawOnlineBack() {
  const [c, ctx] = makeCanvas(1.5);
  const light = '#c7d2fe';
  backBase(ctx, ['#312e81', '#1e1b4b', '#0e7490'], light);

  const cx = W / 2;
  const cy = H / 2 + 30;
  // ondas
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(103,232,249,${0.7 - i * 0.2})`;
    ctx.lineWidth = 8;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx, cy + 30, 230 + i * 44, dir < 0 ? Math.PI * 0.9 : -Math.PI * 0.1, dir < 0 ? Math.PI * 1.1 : Math.PI * 0.1);
      ctx.stroke();
    }
  }
  // arco de los audífonos
  ctx.strokeStyle = light;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, 150, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
  // almohadillas
  const pad = (x) => {
    roundRect(ctx, x - 44, cy - 20, 88, 150, 36);
    const g = ctx.createLinearGradient(x, cy - 20, x, cy + 130);
    g.addColorStop(0, '#a5b4fc');
    g.addColorStop(1, '#6366f1');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = light;
    ctx.stroke();
  };
  pad(cx - 150);
  pad(cx + 150);
  // copa al centro
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 46, cy + 10);
  ctx.lineTo(cx + 46, cy + 10);
  ctx.lineTo(cx, cy + 70);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 70);
  ctx.lineTo(cx, cy + 120);
  ctx.moveTo(cx - 28, cy + 122);
  ctx.lineTo(cx + 28, cy + 122);
  ctx.stroke();

  backTitle(ctx, 'CARRETE ONLINE', light, 176, 30);
  return c;
}

// Reverso "Sin Censura": negro y carmesí, labios rojos y detalles dorados
function drawCensuraBack() {
  const [c, ctx] = makeCanvas(1.5);
  const gold = '#d4a24c';

  const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H * 0.75);
  bg.addColorStop(0, '#3b0710');
  bg.addColorStop(0.6, '#16050a');
  bg.addColorStop(1, '#070304');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // trama de rombos tipo terciopelo
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#ff4d6d';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 34) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, H); ctx.lineTo(i + H, 0); ctx.stroke();
  }
  ctx.restore();

  // marco dorado doble
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  roundRect(ctx, 30, 30, W - 60, H - 60, R - 16);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.2;
  roundRect(ctx, 46, 46, W - 92, H - 92, R - 24);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Labios
  const cx = W / 2;
  const cy = H / 2 + 6;
  const lipW = 210;
  const lips = ctx.createLinearGradient(cx, cy - 90, cx, cy + 90);
  lips.addColorStop(0, '#ff2a4d');
  lips.addColorStop(0.5, '#c8102e');
  lips.addColorStop(1, '#7a0619');

  // labio superior (arco de cupido)
  ctx.beginPath();
  ctx.moveTo(cx - lipW, cy);
  ctx.bezierCurveTo(cx - lipW * 0.7, cy - 40, cx - lipW * 0.45, cy - 95, cx - lipW * 0.22, cy - 88);
  ctx.bezierCurveTo(cx - lipW * 0.08, cy - 84, cx - 6, cy - 62, cx, cy - 56);
  ctx.bezierCurveTo(cx + 6, cy - 62, cx + lipW * 0.08, cy - 84, cx + lipW * 0.22, cy - 88);
  ctx.bezierCurveTo(cx + lipW * 0.45, cy - 95, cx + lipW * 0.7, cy - 40, cx + lipW, cy);
  ctx.bezierCurveTo(cx + lipW * 0.55, cy - 6, cx + lipW * 0.25, cy - 14, cx, cy - 4);
  ctx.bezierCurveTo(cx - lipW * 0.25, cy - 14, cx - lipW * 0.55, cy - 6, cx - lipW, cy);
  ctx.closePath();
  ctx.fillStyle = lips;
  ctx.fill();

  // labio inferior
  ctx.beginPath();
  ctx.moveTo(cx - lipW, cy + 4);
  ctx.bezierCurveTo(cx - lipW * 0.55, cy + 2, cx - lipW * 0.25, cy + 10, cx, cy + 6);
  ctx.bezierCurveTo(cx + lipW * 0.25, cy + 10, cx + lipW * 0.55, cy + 2, cx + lipW, cy + 4);
  ctx.bezierCurveTo(cx + lipW * 0.7, cy + 70, cx + lipW * 0.35, cy + 110, cx, cy + 112);
  ctx.bezierCurveTo(cx - lipW * 0.35, cy + 110, cx - lipW * 0.7, cy + 70, cx - lipW, cy + 4);
  ctx.closePath();
  ctx.fillStyle = lips;
  ctx.fill();

  // brillo
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 50, cy + 52, 46, 12, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.ellipse(cx + 70, cy - 52, 30, 8, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // línea entre labios
  ctx.strokeStyle = '#4a0310';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - lipW + 6, cy + 2);
  ctx.bezierCurveTo(cx - lipW * 0.5, cy + 6, cx - lipW * 0.2, cy + 12, cx, cy + 5);
  ctx.bezierCurveTo(cx + lipW * 0.2, cy + 12, cx + lipW * 0.5, cy + 6, cx + lipW - 6, cy + 2);
  ctx.stroke();

  // Textos
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = gold;
  ctx.font = `800 34px ${FONT}`;
  spaced(ctx, 12);
  ctx.fillText('SIN CENSURA', W / 2 + 6, 178);
  spaced(ctx, 0);

  ctx.beginPath();
  ctx.arc(W / 2, H - 182, 44, 0, Math.PI * 2);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText('+18', W / 2, H - 180);
  return c;
}

function drawKawaiiBack() {
  const [c, ctx] = makeCanvas(1.5);
  const CJK = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Noto Sans CJK JP", "Yu Gothic", "Meiryo", sans-serif';

  // Fondo pastel
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fbcfe8');
  bg.addColorStop(0.55, '#e9d5ff');
  bg.addColorStop(1, '#bae6fd');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Lunares
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  for (let y = 40; y < H; y += 64) {
    for (let x = (y / 64) % 2 ? 40 : 72; x < W; x += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Marco
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  roundRect(ctx, 30, 30, W - 60, H - 60, R - 16);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(236,72,153,.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 12]);
  roundRect(ctx, 50, 50, W - 100, H - 100, R - 26);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gato
  const cx = W / 2;
  const cy = H / 2 + 10;
  const ink = '#4a3348';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const ear = (dir) => {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 150, cy - 60);
    ctx.lineTo(cx + dir * 165, cy - 215);
    ctx.lineTo(cx + dir * 55, cy - 140);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dir * 140, cy - 95);
    ctx.lineTo(cx + dir * 150, cy - 180);
    ctx.lineTo(cx + dir * 88, cy - 135);
    ctx.closePath();
    ctx.fillStyle = '#f9a8d4';
    ctx.fill();
  };
  ear(-1);
  ear(1);

  ctx.beginPath();
  ctx.ellipse(cx, cy, 190, 160, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = ink;
  ctx.stroke();

  // Ojos con brillo
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + dir * 70, cy - 10, 24, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dir * 70 - 8, cy - 22, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dir * 70 + 9, cy - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    // mejillas
    ctx.beginPath();
    ctx.ellipse(cx + dir * 118, cy + 42, 28, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244,114,182,.55)';
    ctx.fill();
    // bigotes
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * 150, cy + 20 + k * 14);
      ctx.lineTo(cx + dir * 225, cy + 8 + k * 30);
      ctx.stroke();
    }
  }
  // Nariz y boca :3
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 26);
  ctx.lineTo(cx + 12, cy + 26);
  ctx.lineTo(cx, cy + 38);
  ctx.closePath();
  ctx.fillStyle = '#f472b6';
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx - 16, cy + 44, 16, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 16, cy + 44, 16, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Corazoncitos
  const heart = (x, y, s, col) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8);
    ctx.bezierCurveTo(8, -16, 14, -4, 0, 6);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.restore();
  };
  heart(cx - 230, cy - 200, 2.2, '#f472b6');
  heart(cx + 225, cy - 175, 1.6, '#a78bfa');
  heart(cx + 210, cy + 195, 2.4, '#f472b6');
  heart(cx - 215, cy + 180, 1.5, '#38bdf8');

  // Nombre en kana y kanji
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.font = `700 52px ${CJK}`;
  ctx.fillText('かわいいねこ', cx, 165);
  ctx.font = `700 40px ${CJK}`;
  ctx.fillStyle = '#db2777';
  ctx.fillText('可愛い猫', cx, H - 165);
  return c;
}

// ---------- Cara del reto ----------
function layoutTokens(ctx, tokens, maxW, size) {
  ctx.font = `700 ${size}px ${FONT}`;
  const space = ctx.measureText(' ').width;
  const pad = size * 0.28;
  const lines = [];
  let line = [];
  let w = 0;
  for (const tok of tokens) {
    const tw = ctx.measureText(tok.t).width + (tok.partner ? pad * 2 : 0);
    const add = (line.length ? space : 0) + tw;
    if (line.length && w + add > maxW) {
      lines.push({ items: line, w });
      line = [];
      w = 0;
    }
    line.push({ ...tok, tw });
    w += (line.length > 1 ? space : 0) + tw;
  }
  if (line.length) lines.push({ items: line, w });
  return { lines, space, pad };
}

export function makeFaceCanvas(card) {
  const [c, ctx] = makeCanvas(2);
  const theme = themeOf(card.deckId);
  const acc = card.negotiated ? theme.negotiated : theme[card.intensity];

  ctx.fillStyle = theme.face;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -80, 0, W / 2, -80, H * 0.85);
  glow.addColorStop(0, rgba(acc, 0.3));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  if (card.negotiated) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = acc;
    for (let i = -H; i < W + H; i += 44) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, 0);
      ctx.lineTo(i + 20 + H, H);
      ctx.lineTo(i + H, H);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.strokeStyle = rgba(acc, 0.65);
  ctx.lineWidth = 2.5;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 14);
  ctx.stroke();

  // Cabecera: nivel en puntos + etiqueta
  const level = { soft: 1, medium: 2, hard: 3 }[card.intensity];
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(76 + i * 26, 94, 7, 0, Math.PI * 2);
    if (i < level) {
      ctx.fillStyle = acc;
      ctx.fill();
    } else {
      ctx.strokeStyle = rgba(acc, 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = acc;
  ctx.font = `700 21px ${FONT}`;
  spaced(ctx, 5);
  ctx.fillText(card.label.toUpperCase(), 76 + 3 * 26 + 8, 95);
  if (card.negotiated) {
    ctx.textAlign = 'right';
    ctx.fillText('RIESGO ×2', W - 70, 95);
  }
  spaced(ctx, 0);

  // Texto del reto
  const maxW = W - 150;
  const top = 160;
  const bottom = H - 230;
  let size = 56;
  let lay = layoutTokens(ctx, card.tokens, maxW, size);
  while (size > 28 && lay.lines.length * size * 1.3 > bottom - top) {
    size -= 2;
    lay = layoutTokens(ctx, card.tokens, maxW, size);
  }
  const lh = size * 1.3;
  let y = top + (bottom - top - lay.lines.length * lh) / 2 + lh / 2;
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'left';
  for (const line of lay.lines) {
    let x = (W - line.w) / 2;
    for (const item of line.items) {
      if (item.partner) {
        ctx.fillStyle = rgba(acc, 0.2);
        roundRect(ctx, x, y - size * 0.62, item.tw, size * 1.24, size * 0.3);
        ctx.fill();
        ctx.strokeStyle = rgba(acc, 0.7);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.t, x + lay.pad, y + 2);
      } else {
        ctx.fillStyle = '#f4f4f5';
        ctx.fillText(item.t, x, y + 2);
      }
      x += item.tw + lay.space;
    }
    y += lh;
  }

  // Pie: premio y castigo
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, H - 196);
  ctx.lineTo(W - 70, H - 196);
  ctx.stroke();

  ctx.font = `600 18px ${FONT}`;
  spaced(ctx, 4);
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.textAlign = 'left';
  ctx.fillText('PREMIO', 72, H - 156);
  ctx.textAlign = 'right';
  ctx.fillText('CASTIGO', W - 72, H - 156);
  spaced(ctx, 0);

  ctx.font = `800 46px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`+${card.win} pts`, 70, H - 110);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f87171';
  ctx.fillText(`${card.sips} ${card.sips === 1 ? 'sorbo' : 'sorbos'}`, W - 70, H - 110);

  if (card.partnerName) {
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.textAlign = 'left';
    ctx.fillText(`${card.partnerName} +${card.partnerWin}`, 72, H - 66);
    ctx.textAlign = 'right';
    ctx.fillText(`Si se opone: ${card.refuseSips}`, W - 72, H - 66);
  }

  return c;
}

// ---------- Veredicto (reverso de la carta al resolver el turno) ----------
// Íconos en caja de 24x24 (mismo trazo que lucide)
const ICONS = {
  check: ['M20 6 9 17l-5-5'],
  wine: ['M8 22h8', 'M7 10h10', 'M12 15v7', 'M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z'],
  shield: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'm14.5 9.5-5 5',
    'm9.5 9.5 5 5',
  ],
  star: [(() => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 4.4 : 10;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? 'L' : 'M'}${(12 + r * Math.cos(a)).toFixed(2)} ${(12.6 + r * Math.sin(a)).toFixed(2)}`;
    }
    return `${d}Z`;
  })()],
  crown: ['M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z', 'M5 21h14'],
};

function drawIcon(ctx, name, cx, cy, size, color, width = 2) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of ICONS[name]) ctx.stroke(new Path2D(d));
  ctx.restore();
}

function fitText(ctx, text, maxW, weight, size) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > 18 && ctx.measureText(text).width > maxW) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

export const VERDICT_COLORS = { done: '#4ade80', fail: '#f87171', refuse: '#fb923c' };

/*
  v = {
    kind: 'done' | 'fail' | 'refuse',
    label, title,
    rows: [{ icon: 'star' | 'wine', name, amount, total, color }],
    note,            // texto pequeño opcional (p. ej. apuesta negociada)
    winnerName,      // si alguien llegó a la meta
  }
*/
export function makeVerdictCanvas(v) {
  const [c, ctx] = makeCanvas(2);
  const acc = VERDICT_COLORS[v.kind];

  ctx.fillStyle = '#0f0e12';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 170, 0, W / 2, 170, H * 0.75);
  glow.addColorStop(0, rgba(acc, 0.22));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = rgba(acc, 0.6);
  ctx.lineWidth = 2.5;
  roundRect(ctx, 26, 26, W - 52, H - 52, R - 14);
  ctx.stroke();

  // Ícono principal
  const iconName = v.kind === 'done' ? 'check' : v.kind === 'fail' ? 'wine' : 'shield';
  ctx.beginPath();
  ctx.arc(W / 2, 170, 66, 0, Math.PI * 2);
  ctx.fillStyle = rgba(acc, 0.12);
  ctx.fill();
  ctx.strokeStyle = rgba(acc, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawIcon(ctx, iconName, W / 2, 170, 64, acc, 2.2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = acc;
  ctx.font = `700 21px ${FONT}`;
  spaced(ctx, 6);
  ctx.fillText(v.label.toUpperCase(), W / 2 + 3, 278);
  spaced(ctx, 0);

  ctx.fillStyle = '#ffffff';
  fitText(ctx, v.title, W - 140, 800, 50);
  ctx.fillText(v.title, W / 2, 332);

  // Filas: quién gana y quién bebe
  const rowH = 128;
  const startY = 420 + Math.max(0, (3 - v.rows.length) * rowH) / 2;
  v.rows.forEach((row, i) => {
    const y = startY + i * rowH;
    const col = row.color;

    ctx.fillStyle = 'rgba(255,255,255,.035)';
    roundRect(ctx, 56, y, W - 112, rowH - 20, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const cy = y + (rowH - 20) / 2;
    ctx.beginPath();
    ctx.arc(116, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, 0.14);
    ctx.fill();
    drawIcon(ctx, row.icon, 116, cy, 34, col, 2.2);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    fitText(ctx, row.name, 250, 700, 36);
    ctx.fillText(row.name, 168, cy - 15);
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.fillText(row.total, 168, cy + 22);

    ctx.textAlign = 'right';
    ctx.fillStyle = col;
    fitText(ctx, row.amount, 190, 800, 40);
    ctx.fillText(row.amount, W - 88, cy + 1);
  });

  // Pie
  ctx.textAlign = 'center';
  if (v.winnerName) {
    drawIcon(ctx, 'crown', W / 2, H - 132, 34, '#facc15', 2);
    ctx.fillStyle = '#facc15';
    fitText(ctx, `${v.winnerName} llegó a la meta`, W - 160, 700, 26);
    ctx.fillText(`${v.winnerName} llegó a la meta`, W / 2, H - 88);
  } else if (v.note) {
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText(v.note, W / 2, H - 88);
  }

  return c;
}
