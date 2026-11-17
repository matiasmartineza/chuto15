import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { easing } from 'maath';
import { CARD_W, CARD_H, CARD_R, VERDICT_COLORS, themeOf, getBackTexture, makeFaceTexture, makeVerdictTexture } from './cardTextures.js';

// ---------- Constantes de la escena ----------
const FLOOR_Y = -2.6;
const DECK_POS = new THREE.Vector3(0, -1.75, 0.4);
const DECK_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(2.24, 0, 0));
const DECK_SCALE = 0.42;
const DECK_COUNT = 9;
const DECK_GAP = 0.035;
// Pose (en el mundo) de la carta de arriba del mazo
const DECK_TOP = DECK_POS.clone().add(
  new THREE.Vector3(0, 0, -DECK_COUNT * DECK_GAP * DECK_SCALE).applyQuaternion(DECK_QUAT),
);

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

const EXITS = {
  done: { pos: (v) => new THREE.Vector3(v.width * 0.9, v.y + 4, -1.5), rot: new THREE.Euler(0.4, 1.4, -0.6), fade: true },
  fail: { pos: (v) => new THREE.Vector3(0.3, FLOOR_Y - 3, 1.2), rot: new THREE.Euler(1.4, 0.2, 0.3), fade: true },
  refuse: { pos: (v) => new THREE.Vector3(-v.width * 0.95, v.y + 1, -1), rot: new THREE.Euler(0, -1.4, 0.5), fade: true },
};

// ---------- Carta física ----------
// Grosor del canto luminoso que asoma alrededor de la carta
const RIM = 0.012;
// flipBack: gira el reverso 180° para que se lea derecho cuando la carta está tumbada
const CardMesh = ({ deckId = 'chuto15', faceTexture, verdictTexture = null, accent = '#ef4444', glow = 1.6, flipBack = false }) => {
  const back = getBackTexture(deckId);
  const edge = useMemo(() => new THREE.Color(accent).multiplyScalar(glow), [accent, glow]);
  return (
    <group>
      <RoundedBox args={[CARD_W + RIM * 2, CARD_H + RIM * 2, 0.03]} radius={CARD_R + RIM} smoothness={10}>
        <meshStandardMaterial color="#0b0b0d" emissive={edge} emissiveIntensity={1} toneMapped={false} transparent />
      </RoundedBox>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial map={faceTexture || back} color="#e2e2e2" toneMapped={false} transparent />
      </mesh>
      <mesh position={[0, 0, -0.017]} rotation={[0, Math.PI, flipBack ? Math.PI : 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial map={back} color="#e2e2e2" toneMapped={false} transparent />
      </mesh>
      {verdictTexture && (
        // Reverso con el veredicto (se lee derecho al girar la carta sobre el eje vertical)
        <mesh position={[0, 0, -0.0185]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial map={verdictTexture} color="#e2e2e2" toneMapped={false} transparent />
        </mesh>
      )}
    </group>
  );
};

const setOpacity = (obj, o) => {
  obj.traverse((m) => {
    if (m.material) m.material.opacity = o;
  });
};

// ---------- Mazo flotante ----------
// raised: el mazo sube solo mientras se saca una carta; el resto del tiempo
// se hunde bajo el piso para no quedar detrás de la carta que se está leyendo.
const DECK_HIDDEN_DROP = 2.8;
const Deck = ({ visible, raised, deckId }) => {
  const g = useRef();
  const drop = useRef({ current: DECK_HIDDEN_DROP });
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    easing.damp(drop.current, 'current', raised ? 0 : DECK_HIDDEN_DROP, raised ? 0.18 : 0.35, dt);
    g.current.position.set(DECK_POS.x, DECK_POS.y - drop.current.current + Math.sin(t * 0.8) * 0.05, DECK_POS.z);
    easing.damp(g.current.scale, 'x', visible ? DECK_SCALE : 0.001, 0.35, dt);
    g.current.scale.y = g.current.scale.z = g.current.scale.x;
  });
  return (
    <group ref={g} quaternion={DECK_QUAT} scale={DECK_SCALE}>
      {Array.from({ length: DECK_COUNT }).map((_, i) => (
        <group key={i} position={[Math.sin(i * 2.3) * 0.03, Math.cos(i * 1.7) * 0.03, -i * DECK_GAP]} rotation={[0, 0, Math.sin(i * 3.1) * 0.03]}>
          <CardMesh deckId={deckId} flipBack accent={i === DECK_COUNT - 1 ? themeOf(deckId).deck[0] : themeOf(deckId).deck[1]} glow={i === DECK_COUNT - 1 ? 1.6 : 0.5} />
        </group>
      ))}
    </group>
  );
};

// ---------- Carta activa (sale del mazo, se da vuelta, y luego se va) ----------
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

const ActiveCard = ({ data, verdict, exit, delay, view, drag, onGone }) => {
  const texture = useMemo(() => makeFaceTexture(data), [data]);
  useEffect(() => () => texture.dispose(), [texture]);
  const verdictTexture = useMemo(() => (verdict ? makeVerdictTexture(verdict) : null), [verdict]);
  useEffect(() => () => verdictTexture && verdictTexture.dispose(), [verdictTexture]);
  const accent = verdict
    ? VERDICT_COLORS[verdict.kind]
    : data.negotiated ? themeOf(data.deckId).negotiated : themeOf(data.deckId)[data.intensity];
  const flip = useRef({ current: 0 });

  const g = useRef();
  const s = useRef({ start: null, exitStart: null, gone: false, shake: data.negotiated ? 1 : 0, off: new THREE.Vector3(), throwDir: null, from: null, fromQ: null });
  const basePos = useRef(new THREE.Vector3());
  const baseQuat = useRef(new THREE.Quaternion());

  useFrame((state, dt) => {
    const st = s.current;
    const t = state.clock.elapsedTime;
    if (st.start === null) st.start = t + delay;

    // Entrada: del mazo al centro, dándose vuelta
    const p = clamp01((t - st.start) / 1.0);
    const e = easeInOut(p);
    const centerY = view.y + Math.sin(t * 1.1) * 0.04 * e;
    basePos.current.lerpVectors(DECK_TOP, tmpV.set(0, centerY, 0), e);
    basePos.current.z += Math.sin(Math.PI * e) * 1.6;
    basePos.current.y += Math.sin(Math.PI * e) * 0.4;

    // Inclinación siguiendo el puntero + leve respiración
    st.shake = Math.max(0, st.shake - dt * 1.4);
    const wob = Math.sin(t * 38) * 0.12 * st.shake;
    // Giro de 180° para mostrar el veredicto
    easing.damp(flip.current, 'current', verdict ? Math.PI : 0, 0.28, dt);
    const f = flip.current.current;
    tmpE.set(
      -state.pointer.y * 0.18 + Math.sin(t * 0.7) * 0.03,
      state.pointer.x * 0.25 + Math.sin(t * 0.5) * 0.04 + f,
      wob,
    );
    tmpQ.setFromEuler(tmpE);
    baseQuat.current.slerpQuaternions(DECK_QUAT, tmpQ, e);
    // pequeño "salto" hacia la cámara durante el giro
    let scale = THREE.MathUtils.lerp(DECK_SCALE, view.scale, e) * (1 + Math.sin(f) * 0.06);

    const obj = g.current;
    obj.visible = t >= st.start;

    if (!exit) {
      // Arrastre con el dedo: la carta sigue al puntero y vuelve si se suelta sin fuerza
      const d = drag.current;
      const k = view.width / window.innerWidth;
      tmpV.set(d.active ? d.x * k : 0, d.active ? -d.y * k : 0, 0);
      easing.damp3(st.off, tmpV, d.active ? 0.04 : 0.18, dt);
      obj.position.copy(basePos.current).add(st.off);
      tmpQ.setFromEuler(tmpE.set(st.off.y * 0.12, 0, -st.off.x * 0.12));
      obj.quaternion.copy(baseQuat.current).multiply(tmpQ);
      obj.scale.setScalar(scale);
      return;
    }

    // Salida
    if (st.exitStart === null) st.exitStart = t;
    if (exit === 'swap') {
      // Vuelve al mazo
      const q = easeInOut(clamp01((t - st.exitStart) / 0.55));
      obj.position.lerpVectors(basePos.current, DECK_TOP, q);
      obj.position.z += Math.sin(Math.PI * q) * 0.8;
      obj.quaternion.slerpQuaternions(baseQuat.current, DECK_QUAT, q);
      obj.scale.setScalar(THREE.MathUtils.lerp(scale, DECK_SCALE, q));
      setOpacity(obj, q > 0.85 ? 1 - (q - 0.85) / 0.15 : 1);
      if (q >= 1 && !st.gone) { st.gone = true; onGone(); }
      return;
    }
    if (exit === 'throw') {
      // Lanzada: sale en la dirección del gesto y se pierde hacia el fondo
      if (!st.throwDir) {
        const td = drag.current.throw || { x: 0, y: -1 };
        st.throwDir = new THREE.Vector3(td.x, -td.y, 0);
        if (st.throwDir.lengthSq() < 1e-6) st.throwDir.set(0, 1, 0);
        st.throwDir.normalize();
        st.from = obj.position.clone();
        st.fromQ = obj.quaternion.clone();
      }
      const q = clamp01((t - st.exitStart) / 0.75);
      const k = 1 - Math.pow(1 - q, 2);
      obj.position.copy(st.from).addScaledVector(st.throwDir, k * view.height * 1.3);
      obj.position.z -= k * 16;
      tmpQ.setFromEuler(tmpE.set(-k * 1.6 * st.throwDir.y, k * 1.6 * st.throwDir.x, -k * 2.4 * st.throwDir.x));
      obj.quaternion.copy(st.fromQ).multiply(tmpQ);
      obj.scale.setScalar(scale);
      setOpacity(obj, q > 0.55 ? 1 - (q - 0.55) / 0.45 : 1);
      if (q >= 1 && !st.gone) { st.gone = true; onGone(); }
      return;
    }
    const cfg = EXITS[exit] || EXITS.done;
    const q = clamp01((t - st.exitStart) / 0.8);
    const k = easeInCubic(q);
    obj.position.lerpVectors(basePos.current, cfg.pos(view), k);
    obj.quaternion.slerpQuaternions(baseQuat.current, tmpQ.setFromEuler(cfg.rot), k);
    obj.scale.setScalar(scale);
    setOpacity(obj, 1 - easeOutCubic(q) * 0.9);
    if (q >= 1 && !st.gone) { st.gone = true; onGone(); }
  });

  return (
    <group ref={g} visible={false}>
      <CardMesh deckId={data.deckId} flipBack faceTexture={texture} verdictTexture={verdictTexture} accent={accent} glow={2} />
    </group>
  );
};

// ---------- Anillo de cartas (inicio y ganador) ----------
// ---------- Vitrina: el reverso del mazo elegido, grande y flotando ----------
const Showcase = ({ active, deckId, view }) => {
  const g = useRef();
  const st = useRef({ spin: 0, vis: 0, deck: deckId });
  useFrame((state, dt) => {
    const s = st.current;
    if (s.deck !== deckId) {
      s.deck = deckId;
      s.spin = Math.PI * 2; // gira una vuelta completa al cambiar de mazo
    }
    easing.damp(s, 'spin', 0, 0.3, dt);
    easing.damp(s, 'vis', active ? 1 : 0, 0.3, dt);
    const t = state.clock.elapsedTime;
    const obj = g.current;
    obj.visible = s.vis > 0.01;
    // en pantallas más bajas (menos alargadas) la carta se achica para no tocar el título
    const frac = view.height / view.width > 1.9 ? 0.4 : 0.33;
    const fit = Math.min((view.height * frac) / CARD_H, (view.width * 0.62) / CARD_W, 1);
    obj.scale.setScalar(Math.max(0.0001, fit * (0.6 + 0.4 * s.vis) * (1 - Math.sin(s.spin / 2) * 0.12)));
    obj.position.set(0, view.height * (frac > 0.35 ? 0.075 : 0.055) + Math.sin(t * 1.1) * 0.05 - (1 - s.vis) * 0.6, 0.6);
    obj.rotation.set(
      -state.pointer.y * 0.16 + Math.sin(t * 0.6) * 0.04,
      s.spin + state.pointer.x * 0.32 + Math.sin(t * 0.45) * 0.09,
      Math.sin(t * 0.5) * 0.02,
    );
  });
  return (
    <group ref={g} visible={false}>
      <CardMesh deckId={deckId} accent={themeOf(deckId).ring[0]} glow={1.8} />
    </group>
  );
};

const RING_COUNT = 12;
const CardRing = ({ mode, view, deckId }) => {
  const g = useRef();
  const speed = useRef(0.15);
  useFrame((state, dt) => {
    const show = mode === 'intro' || mode === 'winner';
    const winner = mode === 'winner';
    easing.damp(g.current.scale, 'x', show ? 1 : 0.001, 0.4, dt);
    g.current.scale.y = g.current.scale.z = g.current.scale.x;
    easing.damp(speed, 'current', winner ? 0.55 : 0.15, 0.6, dt);
    g.current.rotation.y += dt * speed.current;
    easing.damp(g.current.position, 'y', winner ? view.y + 0.2 : view.height * 0.14, 0.5, dt);
    easing.damp(g.current.rotation, 'x', winner ? 0.5 : 0.38, 0.5, dt);
  });
  const radius = Math.min(3.4, view.width * 0.5 + 1.2);
  return (
    <group ref={g} scale={0.001} position-z={-1.2}>
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const a = (i / RING_COUNT) * Math.PI * 2;
        return (
          <group key={i} position={[Math.sin(a) * radius, Math.sin(i * 1.3) * 0.15, Math.cos(a) * radius]} rotation={[0, a, Math.sin(i) * 0.08]} scale={0.3}>
            <CardMesh deckId={deckId} accent={themeOf(deckId).ring[i % 2]} glow={1.2} />
          </group>
        );
      })}
    </group>
  );
};

// ---------- Luces que orbitan ----------
const MovingLights = () => {
  const red = useRef();
  const purple = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.35;
    red.current.position.set(Math.sin(t) * 5, 2.5 + Math.sin(t * 1.3), Math.cos(t) * 4);
    purple.current.position.set(Math.sin(t + Math.PI) * 5, 1.5 + Math.cos(t * 0.9), Math.cos(t + Math.PI) * 4);
  });
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight ref={red} color="#ff2a4d" intensity={40} distance={18} />
      <pointLight ref={purple} color="#9b30ff" intensity={40} distance={18} />
      <spotLight position={[0, 7, 4]} angle={0.5} penumbra={1} intensity={60} color="#ffffff" />
    </>
  );
};

// ---------- Layout responsivo ----------
const useCardView = () => {
  const { viewport, camera } = useThree();
  const v = viewport.getCurrentViewport(camera, [0, 0, 0]);
  const scale = Math.min((v.width * 0.8) / CARD_W, (v.height * 0.54) / CARD_H, 1.15);
  return { width: v.width, height: v.height, scale, y: v.height * 0.035 };
};

const World = ({ mode, deckId, card, verdict, exitType, drag }) => {
  const view = useCardView();
  const [cards, setCards] = useState([]);
  const [deckUp, setDeckUp] = useState(false);
  const exitRef = useRef(exitType);
  exitRef.current = exitType;
  // Último veredicto mostrado: la carta sigue dada vuelta mientras se va
  const lastVerdict = useRef(null);
  if (verdict) lastVerdict.current = verdict;

  useEffect(() => {
    const exit = exitRef.current || 'done';
    // El mazo sube primero; la carta sale cuando ya está arriba
    const delay = exit === 'swap' ? 0.65 : 0.4;
    setCards((cs) => {
      const lv = lastVerdict.current;
      const old = cs.map((c) => (c.exit ? c : { ...c, exit, verdict: lv && lv.key === c.key ? lv : null }));
      if (!card) return old;
      return [...old, { key: card.key, data: card, exit: null, delay }];
    });
    if (!card) {
      setDeckUp(false);
      return undefined;
    }
    setDeckUp(true);
    const id = setTimeout(() => setDeckUp(false), (delay + 0.75) * 1000);
    return () => clearTimeout(id);
  }, [card ? card.key : null]);

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 9, 22]} />
      <MovingLights />

      <Deck visible={mode === 'playing'} raised={deckUp} deckId={deckId} />
      <CardRing mode={mode} view={view} deckId={deckId} />
      <Showcase active={mode === 'showcase'} deckId={deckId} view={view} />
      {cards.map((c) => (
        <ActiveCard
          key={c.key}
          data={c.data}
          verdict={c.exit ? c.verdict : verdict && verdict.key === c.key ? verdict : null}
          exit={c.exit}
          drag={drag}
          delay={c.delay}
          view={view}
          onGone={() => setCards((cs) => cs.filter((x) => x.key !== c.key))}
        />
      ))}

      <Sparkles count={45} scale={[12, 8, 8]} size={2.2} speed={0.25} color="#ef4444" opacity={0.55} />
      <Sparkles count={45} scale={[12, 8, 8]} size={2.2} speed={0.2} color="#a855f7" opacity={0.55} />

      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[300, 90]}
          resolution={512}
          mixBlur={1}
          mixStrength={30}
          roughness={1}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#070707"
          metalness={0.6}
          mirror={0.6}
        />
      </mesh>

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.95} intensity={1.1} radius={0.75} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
};

const Scene = ({ mode, deckId = 'chuto15', card, verdict, exitType, drag }) => (
  <Canvas
    className="!fixed inset-0"
    dpr={[1, 2]}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    camera={{ position: [0, 0.4, 8], fov: 38 }}
  >
    <World mode={mode} deckId={deckId} card={card} verdict={verdict} exitType={exitType} drag={drag} />
  </Canvas>
);

export default Scene;
