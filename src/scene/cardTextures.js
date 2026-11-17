import * as THREE from 'three';

// Proporción de naipe (2.5 x 3.5)
export const CARD_W = 2.5;
export const CARD_H = 3.5;
export const CARD_R = 0.14;

const W = 720;
const H = 1008;
const R = (CARD_R / CARD_W) * W;
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const ACCENTS = {
  soft: '#ec4899',
  medium: '#a855f7',
  hard: '#ef4444',
  negotiated: '#f59e0b',
};

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

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function spaced(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

// ---------- Reverso (compartido por todas las cartas) ----------
let backTexture = null;
export function getBackTexture() {
  if (backTexture) return backTexture;
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

  backTexture = toTexture(c);
  return backTexture;
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

export function makeFaceTexture(card) {
  const [c, ctx] = makeCanvas(2);
  const acc = card.negotiated ? ACCENTS.negotiated : ACCENTS[card.intensity];

  ctx.fillStyle = '#0f0e12';
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

  return toTexture(c);
}
