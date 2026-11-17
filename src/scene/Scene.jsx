import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { easing } from 'maath';
import { CARD_W, CARD_H, CARD_R, ACCENTS, getBackTexture, makeFaceTexture } from './cardTextures.js';

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
// flipBack: gira el reverso 180° para que se lea derecho cuando la carta está tumbada
const CardMesh = ({ faceTexture, accent = '#ef4444', glow = 1.6, flipBack = false }) => {
  const back = getBackTexture();
  const edge = useMemo(() => new THREE.Color(accent).multiplyScalar(glow), [accent, glow]);
  return (
    <group>
      <RoundedBox args={[CARD_W - 0.01, CARD_H - 0.01, 0.03]} radius={CARD_R} smoothness={4}>
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
    </group>
  );
};

const setOpacity = (obj, o) => {
  obj.traverse((m) => {
    if (m.material) m.material.opacity = o;
  });
};

// ---------- Mazo flotante ----------
const Deck = ({ visible }) => {
  const g = useRef();
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    g.current.position.set(DECK_POS.x, DECK_POS.y + Math.sin(t * 0.8) * 0.05, DECK_POS.z);
    easing.damp(g.current.scale, 'x', visible ? DECK_SCALE : 0.001, 0.35, dt);
    g.current.scale.y = g.current.scale.z = g.current.scale.x;
  });
  return (
    <group ref={g} quaternion={DECK_QUAT} scale={DECK_SCALE}>
      {Array.from({ length: DECK_COUNT }).map((_, i) => (
        <group key={i} position={[Math.sin(i * 2.3) * 0.03, Math.cos(i * 1.7) * 0.03, -i * DECK_GAP]} rotation={[0, 0, Math.sin(i * 3.1) * 0.03]}>
          <CardMesh flipBack accent={i === DECK_COUNT - 1 ? '#ef4444' : '#7e22ce'} glow={i === DECK_COUNT - 1 ? 1.6 : 0.5} />
        </group>
      ))}
    </group>
  );
};

// ---------- Carta activa (sale del mazo, se da vuelta, y luego se va) ----------
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

const ActiveCard = ({ data, exit, delay, view, onGone }) => {
  const texture = useMemo(() => makeFaceTexture(data), [data]);
  useEffect(() => () => texture.dispose(), [texture]);
  const accent = data.negotiated ? ACCENTS.negotiated : ACCENTS[data.intensity];

  const g = useRef();
  const s = useRef({ start: null, exitStart: null, gone: false, shake: data.negotiated ? 1 : 0 });
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
    tmpE.set(
      -state.pointer.y * 0.18 + Math.sin(t * 0.7) * 0.03,
      state.pointer.x * 0.25 + Math.sin(t * 0.5) * 0.04,
      wob,
    );
    tmpQ.setFromEuler(tmpE);
    baseQuat.current.slerpQuaternions(DECK_QUAT, tmpQ, e);
    let scale = THREE.MathUtils.lerp(DECK_SCALE, view.scale, e);

    const obj = g.current;
    obj.visible = t >= st.start;

    if (!exit) {
      obj.position.copy(basePos.current);
      obj.quaternion.copy(baseQuat.current);
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
      <CardMesh flipBack faceTexture={texture} accent={accent} glow={2} />
    </group>
  );
};

// ---------- Anillo de cartas (inicio y ganador) ----------
const RING_COUNT = 12;
const CardRing = ({ mode, view }) => {
  const g = useRef();
  const speed = useRef(0.15);
  useFrame((state, dt) => {
    const show = mode !== 'playing';
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
            <CardMesh accent={i % 2 ? '#9333ea' : '#ef4444'} glow={1.2} />
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

const World = ({ mode, card, exitType }) => {
  const view = useCardView();
  const [cards, setCards] = useState([]);
  const exitRef = useRef(exitType);
  exitRef.current = exitType;

  useEffect(() => {
    const exit = exitRef.current || 'done';
    setCards((cs) => {
      const old = cs.map((c) => (c.exit ? c : { ...c, exit }));
      if (!card) return old;
      return [...old, { key: card.key, data: card, exit: null, delay: exit === 'swap' && cs.length ? 0.4 : 0.05 }];
    });
  }, [card ? card.key : null]);

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fog attach="fog" args={['#0a0a0a', 9, 22]} />
      <MovingLights />

      <Deck visible={mode === 'playing'} />
      <CardRing mode={mode} view={view} />
      {cards.map((c) => (
        <ActiveCard
          key={c.key}
          data={c.data}
          exit={c.exit}
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

      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.95} intensity={1.1} radius={0.75} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
};

const Scene = ({ mode, card, exitType }) => (
  <Canvas
    className="!fixed inset-0"
    dpr={[1, 2]}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    camera={{ position: [0, 0.4, 8], fov: 38 }}
  >
    <World mode={mode} card={card} exitType={exitType} />
  </Canvas>
);

export default Scene;
