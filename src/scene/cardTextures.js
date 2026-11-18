// Envuelve los canvas de cardArt.js como texturas de Three.js
import * as THREE from 'three';
import { getBackCanvas, makeFaceCanvas, makeVerdictCanvas } from './cardArt.js';

export { CARD_W, CARD_H, CARD_R, THEMES, themeOf, VERDICT_COLORS } from './cardArt.js';

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

// Se guardan solo los últimos reversos usados; los más viejos se liberan de la memoria de video
const backTextures = new Map();
const MAX_BACKS = 3;
export function getBackTexture(deckId = 'chuto15') {
  if (backTextures.has(deckId)) {
    const t = backTextures.get(deckId);
    backTextures.delete(deckId);
    backTextures.set(deckId, t); // marcar como reciente
    return t;
  }
  const t = toTexture(getBackCanvas(deckId));
  backTextures.set(deckId, t);
  while (backTextures.size > MAX_BACKS) {
    const [oldId, oldTex] = backTextures.entries().next().value;
    if (oldId === deckId) break;
    backTextures.delete(oldId);
    oldTex.dispose();
  }
  return t;
}

export const makeFaceTexture = (card) => toTexture(makeFaceCanvas(card));
export const makeVerdictTexture = (v) => toTexture(makeVerdictCanvas(v));
