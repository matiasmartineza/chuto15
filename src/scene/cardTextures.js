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

const backTextures = {};
export function getBackTexture(deckId = 'chuto15') {
  if (!backTextures[deckId]) backTextures[deckId] = toTexture(getBackCanvas(deckId));
  return backTextures[deckId];
}

export const makeFaceTexture = (card) => toTexture(makeFaceCanvas(card));
export const makeVerdictTexture = (v) => toTexture(makeVerdictCanvas(v));
