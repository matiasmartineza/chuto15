import React, { useState, useRef, useMemo, Suspense } from 'react';
import { Wine, Plus, RotateCcw, Trophy, X, Check, Shuffle, ShieldX, Star, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

const WIN_SCORE = 400;
const REPEAT_DECAY = 1 / 4; // cada vez que sale un reto, su probabilidad se multiplica por 1/4

// --- LISTA DE DESAFÍOS (CON PLACEHOLDER {partner}) ---
// Soft: 10-30 | Medium: 40-70 | Hard: 70-100
// TOTAL ACTUAL: ~200 Desafíos
const BASE_CHALLENGES = [
  // --- HARD (70 - 100 pts) ---
  { text: "Envía un mensaje de voz gimiendo a tu último contacto de WhatsApp.", intensity: "hard", points: 100 },
  { text: "Quítate la ropa interior y dásela a {partner} como trofeo.", intensity: "hard", points: 100 },
  { text: "Bebe un trago que haya sido escupido en el vaso por {partner}.", intensity: "hard", points: 95 },
  { text: "Besa la parte interna del muslo de {partner} (tan arriba como te permitan).", intensity: "hard", points: 90 },
  { text: "Deja que {partner} te desabroche el pantalón/falda con los dientes.", intensity: "hard", points: 90 },
  { text: "Muestra una nude tuya a {partner} por 2 segundos.", intensity: "hard", points: 85 },
  { text: "Intercambia tu parte de arriba (camisa/top) con {partner}.", intensity: "hard", points: 85 },
  { text: "Haz 'motorboat' en el pecho de {partner}.", intensity: "hard", points: 80 },
  { text: "Pasa un cubo de hielo desde tu boca a la boca de {partner}.", intensity: "hard", points: 80 },
  { text: "Quítate una prenda de ropa (que no sean zapatos ni accesorios).", intensity: "hard", points: 75 },
  { text: "Body Shot: Bebe un trago del ombligo de {partner}.", intensity: "hard", points: 80 },
  { text: "Besa a {partner} en la boca por 3 segundos.", intensity: "hard", points: 85 },
  { text: "Deja que {partner} te meta la mano bajo la camiseta por 7 seg.", intensity: "hard", points: 80 },
  { text: "Véndate los ojos. {partner} te tocará con una parte de su cuerpo. Adivina con qué te tocó o bebe.", intensity: "hard", points: 80 },
  { text: "Dale un beso apasionado en el cuello a {partner}.", intensity: "hard", points: 70 },
  { text: "Deja que el grupo te ponga en una posición sexual (con ropa) con {partner} por un turno.", intensity: "hard", points: 75 },
  { text: "Hazle un 'lap dance' de 30 segundos a {partner}.", intensity: "hard", points: 80 },
  { text: "Muerde suavemente el labio inferior de {partner}.", intensity: "hard", points: 70 },
  { text: "Deja que {partner} te dé una nalgada con la mano abierta (fuerte).", intensity: "hard", points: 70 },
  { text: "Lame el cuello de {partner} de abajo hacia arriba lentamente.", intensity: "hard", points: 75 },
  { text: "Chupa el dedo pulgar de {partner} mirándoles a los ojos por 5 seg.", intensity: "hard", points: 70 },
  { text: "Simula un orgasmo muy ruidoso y creíble durante 5 segundos.", intensity: "hard", points: 75 },
  { text: "Deja que {partner} te escriba una palabra obscena en el cuerpo con marcador.", intensity: "hard", points: 70 },
  { text: "Come una fruta (o snack) sostenida por la boca de {partner}.", intensity: "hard", points: 75 },
  { text: "Túmbate y deja que {partner} haga flexiones sobre ti (cuerpo a cuerpo).", intensity: "hard", points: 70 },
  { text: "Ponte los calcetines de {partner} en las manos y acaríciale la cara.", intensity: "hard", points: 70 },
  { text: "Confiesa si tendrías sexo con {partner} ahora mismo.", intensity: "hard", points: 85 },
  { text: "Haz un masaje erótico de 15 segundos a {partner}.", intensity: "hard", points: 75 },
  { text: "Ponte en cuatro patas y deja que {partner} te use de mesa para su bebida durante el siguiente turno.", intensity: "hard", points: 70 },
  { text: "Susurra tu fantasía sexual más oscura al oído de {partner}.", intensity: "hard", points: 80 },
  { text: "Deja que {partner} te muerda suave en el hombro.", intensity: "hard", points: 70 },
  { text: "Haz twerking contra la pared o contra {partner} por 5 segundos.", intensity: "hard", points: 75 },
  { text: "Permite que {partner} explore tu cuerpo con sus manos (sobre la ropa) por 7 seg.", intensity: "hard", points: 80 },
  { text: "Deja que {partner} te pinte los labios (o la cara) con algo comestible y luego lo quite lamiendo.", intensity: "hard", points: 90 },
  { text: "Muerde el lóbulo de la oreja de {partner} y gime.", intensity: "hard", points: 75 },
  { text: "Deja que {partner} te baje el cierre del pantalón lentamente.", intensity: "hard", points: 80 },
  { text: "Intercambia un beso con {partner} pasando un hielo de boca a boca.", intensity: "hard", points: 85 },
  { text: "Haz 5 sentadillas con {partner} en tu espalda (o inténtalo).", intensity: "hard", points: 70 },
  { text: "Deja que {partner} te lama el abdomen.", intensity: "hard", points: 80 },
  { text: "Deja que {partner} te lama el pecho.", intensity: "hard", points: 80 },
  { text: "Besa a {partner} en la comisura de los labios por 5 segundos sin tocar los labios.", intensity: "hard", points: 75 },
  { text: "Deja que {partner} te ponga la mano en la entrepierna (sobre la ropa) mientras bebes un shot.", intensity: "hard", points: 100 },
  { text: "Haz un striptease quitándote 2 prendas.", intensity: "hard", points: 90 },
  { text: "Lame el dedo de {partner} de forma sugestiva.", intensity: "hard", points: 70 },
  { text: "Deja que {partner} te escriba su número en el cuerpo con la lengua (simulado).", intensity: "hard", points: 85 },
  { text: "Besa la nuca de {partner}.", intensity: "hard", points: 70 },
  { text: "Deja que {partner} te de un masaje en los glúteos.", intensity: "hard", points: 85 },
  { text: "Hazle un chupetón a {partner} en una zona oculta.", intensity: "hard", points: 90 },
  { text: "Bebe un shot con limón y sal lamida del cuello de {partner}.", intensity: "hard", points: 85 },
  { text: "Deja que {partner} te muerda la nalga.", intensity: "hard", points: 80 },
  { text: "Cierra los ojos. {partner} te susurrará una fantasía. Si te ríes o te estremeces, pierdes.", intensity: "hard", points: 75 },
  { text: "Haz la posición del 'perrito' con {partner} (con ropa) y ladra.", intensity: "hard", points: 70 },
  { text: "Deja que {partner} te quite los calcetines con los dientes.", intensity: "hard", points: 80 },
  { text: "Besa a {partner} en el lugar que {partner} elija (mano, mejilla o cuello).", intensity: "hard", points: 85 },
  { text: "Haz un 'calvo' (mostrar el trasero) rápido al grupo.", intensity: "hard", points: 90 },
  { text: "Permite que {partner} revise tu galería de fotos por 10 segundos.", intensity: "hard", points: 95 },
  { text: "Siéntate sobre las manos de {partner} durante un turno.", intensity: "hard", points: 75 },
  { text: "Lame la mejilla de {partner} de abajo hacia arriba.", intensity: "hard", points: 70 },

  // --- MEDIUM (40 - 70 pts) ---
  { text: "Muestra tu historial de búsqueda de porno.", intensity: "medium", points: 70 },
  { text: "Di qué es lo que más te pone caliente de {partner}.", intensity: "medium", points: 65 },
  { text: "Deja que {partner} envíe un emoji de 🍆 o 🍑 a quien quiera desde tu móvil.", intensity: "medium", points: 60 },
  { text: "Acaricia el pelo de {partner} mientras le dices qué le harías en la cama.", intensity: "medium", points: 60 },
  { text: "Pasa la lengua por los labios de {partner} sin besarlo.", intensity: "medium", points: 60 },
  { text: "Cuenta tu experiencia sexual más vergonzosa.", intensity: "medium", points: 60 },
  { text: "Lame el lóbulo de la oreja de {partner}.", intensity: "medium", points: 55 },
  { text: "Deja que {partner} te ponga hielo dentro de la ropa por 10 segundos.", intensity: "medium", points: 55 },
  { text: "Susurra algo extremadamente sucio al oído de {partner}.", intensity: "medium", points: 50 },
  { text: "Siéntate en las piernas de {partner} durante los próximos dos turnos.", intensity: "medium", points: 50 },
  { text: "Simula tu mejor 'cara de placer' mirando a {partner}.", intensity: "medium", points: 50 },
  { text: "Baila pegadito/a (lambada style) con {partner} durante una canción.", intensity: "medium", points: 50 },
  { text: "Huele el cuello de {partner} y gime si huele bien.", intensity: "medium", points: 45 },
  { text: "Deja que {partner} te quite los zapatos y te haga cosquillas o masaje.", intensity: "medium", points: 45 },
  { text: "Describe qué ropa interior llevas puesta con todo detalle.", intensity: "medium", points: 45 },
  { text: "Elige a {partner} y dense un 'piquito'.", intensity: "medium", points: 45 },
  { text: "Haz 10 sentadillas mientras {partner} te mira el trasero descaradamente.", intensity: "medium", points: 45 },
  { text: "Bebe un trago del vaso de {partner} sin usar las manos.", intensity: "medium", points: 50 },
  { text: "Cierra los ojos. {partner} te tocará la cara con una parte de su cuerpo. Adivina cuál es.", intensity: "medium", points: 45 },
  { text: "Muerde una fruta de forma provocativa mirando a {partner}.", intensity: "medium", points: 40 },
  { text: "Juega a tocar palmas con {partner}, pero entrelazando los dedos sensualmente.", intensity: "medium", points: 40 },
  { text: "Di en voz alta tu posición sexual favorita y por qué.", intensity: "medium", points: 45 },
  { text: "Deja que {partner} te abroche o desabroche un botón de tu ropa.", intensity: "medium", points: 45 },
  { text: "Haz un gemido cada vez que bebas hasta tu próximo turno.", intensity: "medium", points: 40 },
  { text: "Ponte de rodillas y pide perdón por ser 'malo/a' a {partner}.", intensity: "medium", points: 40 },
  { text: "Intercambia un beso esquimal (nariz con nariz) con {partner}.", intensity: "medium", points: 40 },
  { text: "Besa la mano de {partner} mirándoles fijamente a los ojos.", intensity: "medium", points: 40 },
  { text: "Si tienes tatuajes ocultos, muestra uno o descríbelo sensualmente.", intensity: "medium", points: 50 },
  { text: "Permite que {partner} te revise los bolsillos (incluso los traseros).", intensity: "medium", points: 45 },
  { text: "Muestra tus abdominales (o panza) al grupo.", intensity: "medium", points: 40 },
  { text: "Bebe si alguna vez has tenido un sueño húmedo con {partner}.", intensity: "medium", points: 40 },
  { text: "Bebe si llevas ropa interior de encaje o boxer ajustado.", intensity: "medium", points: 40 },
  { text: "Bebe si te has liado con más de 2 personas esta semana.", intensity: "medium", points: 40 },
  { text: "Imita cómo crees que gime {partner}.", intensity: "medium", points: 55 },
  { text: "Bebe si alguna vez has enviado 'nudes'.", intensity: "medium", points: 40 },
  { text: "Bebe si has tenido sexo en un lugar público.", intensity: "medium", points: 50 },
  { text: "Bebe si te has liado con alguien del trabajo.", intensity: "medium", points: 45 },
  { text: "Bebe si te has grabado en la intimidad.", intensity: "medium", points: 50 },
  { text: "Deja que {partner} te haga cosquillas por 20 segundos.", intensity: "medium", points: 45 },
  { text: "Acaricia la espalda de {partner} por debajo de la camisa.", intensity: "medium", points: 60 },
  { text: "Mira fijamente a {partner} a los ojos y di 'Me pones nervioso/a'.", intensity: "medium", points: 45 },
  { text: "Bebe si has sido infiel alguna vez.", intensity: "medium", points: 60 },
  { text: "Bebe si te han sido infiel.", intensity: "medium", points: 40 },
  { text: "Hazle un masaje de hombros a {partner} mientras gimes suavemente.", intensity: "medium", points: 50 },
  { text: "Comparte un chisme picante sobre alguien que no está presente.", intensity: "medium", points: 45 },
  { text: "Bebe si has usado juguetes sexuales.", intensity: "medium", points: 40 },
  { text: "Bebe si prefieres las luces encendidas.", intensity: "medium", points: 40 },
  { text: "Dile a {partner} qué harías si estuvieran solos ahora mismo.", intensity: "medium", points: 65 },
  { text: "Bebe si has tenido un sueño erótico esta semana.", intensity: "medium", points: 40 },
  { text: "Deja que {partner} te huela el pelo y opine.", intensity: "medium", points: 40 },
  { text: "Posa para una foto sexy que tomará {partner}.", intensity: "medium", points: 50 },
  { text: "Bebe si te gusta el sexo oral.", intensity: "medium", points: 40 },
  { text: "Bebe si has hecho un trío.", intensity: "medium", points: 60 },
  { text: "Bebe si te has liado con la ex de un amigo.", intensity: "medium", points: 55 },
  { text: "Bebe si has tenido sexo en un coche.", intensity: "medium", points: 45 },
  { text: "Bebe si has tenido una aventura de una noche.", intensity: "medium", points: 40 },
  { text: "Muerde el dedo de {partner} sensualmente.", intensity: "medium", points: 50 },
  { text: "Besa la mejilla de {partner} muy cerca de los labios.", intensity: "medium", points: 55 },
  { text: "Deja que {partner} te despeine el pelo.", intensity: "medium", points: 40 },
  { text: "Bebe de tu vaso sin usar las manos, que {partner} te ayude.", intensity: "medium", points: 50 },

  // --- SOFT (10 - 30 pts) ---
  { text: "Manda un mensaje que diga 'Te deseo' a un número random.", intensity: "soft", points: 30 },
  { text: "Cierra los ojos e imagina a alguien desnudo. Di quién fue.", intensity: "soft", points: 30 },
  { text: "Guiña el ojo a {partner}.", intensity: "soft", points: 25 },
  { text: "Deja que {partner} te dé un masaje de hombros.", intensity: "soft", points: 25 },
  { text: "Haz tu mejor caminata de pasarela sexy.", intensity: "soft", points: 25 },
  { text: "Di tres características físicas que busques en una pareja.", intensity: "soft", points: 25 },
  { text: "Haz 10 sentadillas mirando a los ojos a {partner}.", intensity: "soft", points: 25 },
  { text: "Véndate los ojos. {partner} te tocará la mano con un objeto o parte del cuerpo. Adivina qué es.", intensity: "soft", points: 25 },
  { text: "Habla con voz ronca/sexy hasta tu próximo turno.", intensity: "soft", points: 25 },
  { text: "Dile un piropo sucio a {partner}.", intensity: "soft", points: 30 },
  { text: "El grupo decide un apodo sexy para ti por el resto del juego.", intensity: "soft", points: 20 },
  { text: "Pregunta: ¿Arriba o abajo? El grupo adivina tu preferencia.", intensity: "soft", points: 20 },
  { text: "Pregunta: ¿Luz prendida o apagada? Explica por qué.", intensity: "soft", points: 20 },
  { text: "Confiesa: ¿Mañanero o de noche?", intensity: "soft", points: 20 },
  { text: "Dale la mano a {partner} y no la sueltes hasta tu próximo turno.", intensity: "soft", points: 25 },
  { text: "Dile a {partner}: 'Tienes algo en la cara' y limpialo suavemente.", intensity: "soft", points: 25 },
  { text: "Baila sin música moviendo solo las caderas por 10 segundos.", intensity: "soft", points: 25 },
  { text: "Manda un beso volado a {partner}.", intensity: "soft", points: 15 },
  { text: "Sácate una selfie poniendo 'boquita de pato' o sexy con {partner}.", intensity: "soft", points: 15 },
  { text: "Toca tus propios labios sensualmente por 10 segundos.", intensity: "soft", points: 15 },
  { text: "Bebe si te has besado con alguien en este cuarto.", intensity: "soft", points: 15 },
  { text: "Bebe si no llevas ropa interior.", intensity: "soft", points: 25 },
  { text: "Bebe si te gusta que te dominen.", intensity: "soft", points: 15 },
  { text: "Bebe si prefieres dominar.", intensity: "soft", points: 15 },
  { text: "Haz un brindis por 'los malos pensamientos'.", intensity: "soft", points: 10 },
  { text: "Mírale el trasero a {partner} disimuladamente (te pillamos, bebe).", intensity: "soft", points: 10 },
  { text: "Intenta lamer tu propio codo (es sexy intentarlo).", intensity: "soft", points: 10 },
  { text: "Haz una pose de culturista o modelo de revista.", intensity: "soft", points: 15 },
  { text: "Siéntate con las piernas abiertas (manspreading) un turno.", intensity: "soft", points: 10 },
  { text: "Muerde el hielo de tu bebida ruidosamente.", intensity: "soft", points: 10 },
  { text: "Pasa la mano por tu pelo lentamente.", intensity: "soft", points: 10 },
  { text: "Todos los solteros beben.", intensity: "soft", points: 10 },
  { text: "Todos los que tienen pareja beben (y callan).", intensity: "soft", points: 10 },
  { text: "Di cuál es la parte del cuerpo que más miras primero.", intensity: "soft", points: 15 },
  { text: "Choca los cinco con {partner} y di 'Salud'.", intensity: "soft", points: 10 },
  { text: "Bebe si tienes tatuajes.", intensity: "soft", points: 15 },
  { text: "Bebe si tienes piercings.", intensity: "soft", points: 15 },
  { text: "Bebe si llevas ropa negra.", intensity: "soft", points: 10 },
  { text: "Bebe si eres el más alto del grupo.", intensity: "soft", points: 10 },
  { text: "Bebe si eres el más bajo del grupo.", intensity: "soft", points: 10 },
  { text: "Di el nombre completo de {partner}.", intensity: "soft", points: 10 },
  { text: "Haz una guerra de pulgares con {partner}.", intensity: "soft", points: 15 },
  { text: "Haz una competencia de miradas con {partner}. El que parpadea bebe.", intensity: "soft", points: 20 },
  { text: "Dile un cumplido a los ojos de {partner}.", intensity: "soft", points: 15 },
  { text: "Bebe si tienes los ojos marrones.", intensity: "soft", points: 10 },
  { text: "Bebe si te has teñido el pelo.", intensity: "soft", points: 10 },
  { text: "Saca la lengua a {partner}.", intensity: "soft", points: 10 },
  { text: "Bebe si nunca has fumado.", intensity: "soft", points: 10 },
  { text: "Bebe si tienes perro.", intensity: "soft", points: 10 },
  { text: "Bebe si tienes gato.", intensity: "soft", points: 10 },
  { text: "Bebe si sabes cocinar.", intensity: "soft", points: 15 },
  { text: "Bebe si vives solo/a.", intensity: "soft", points: 15 },
  { text: "Bebe si has viajado fuera del país este año.", intensity: "soft", points: 10 },
  { text: "Abraza a {partner} por 5 segundos.", intensity: "soft", points: 20 },
  { text: "Dile a {partner} algo que te guste de su personalidad.", intensity: "soft", points: 15 },
  { text: "Haz un baile gracioso de 5 segundos.", intensity: "soft", points: 15 },
  { text: "Bebe si usas gafas.", intensity: "soft", points: 10 },
  { text: "Bebe si eres zurdo.", intensity: "soft", points: 10 },
  { text: "Bebe si tienes hermanos.", intensity: "soft", points: 10 },
  { text: "Di una palabra y que {partner} diga una que rime. Si falla, bebe.", intensity: "soft", points: 20 }
];

// --- HELPER PARA CALCULAR SORBOS EQUILIBRADOS ---
const calculateSips = (challenge) => {
  if (!challenge) return 0;
  if (challenge.intensity === 'soft') {
    return challenge.points >= 25 ? 2 : 1; // 1-2 sorbos
  } else if (challenge.intensity === 'medium') {
    return challenge.points >= 55 ? 3 : 2; // 2-3 sorbos
  } else { // Hard
    if (challenge.points >= 95) return 5;
    if (challenge.points >= 80) return 4;
    return 3; // 3-5 sorbos
  }
};

// Retos de tipo "bebe si..." / "todos los que..." (se cumplen bebiendo o no aplican)
const isDrinkChallenge = (challenge) =>
  !!challenge && /^(bebe si|todos los)/i.test(challenge.text);

// Elige un índice al azar según pesos (los pesos pueden ser decimales)
const weightedPick = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
};

const pickPartnerIndex = (playerCount, excludeIdx) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * playerCount);
  } while (idx === excludeIdx);
  return idx;
};

// ---------- Interfaz ----------
const LEVEL_LABELS = { soft: 'Para calentar', medium: 'Nivel medio', hard: 'Prueba extrema' };
const spring = { type: 'spring', stiffness: 380, damping: 30 };

const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
})();

const Logo = ({ small = false }) => (
  <motion.h1
    layout
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    className={`font-black tracking-tighter italic -skew-x-6 select-none text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 drop-shadow-[0_0_14px_rgba(220,38,38,0.45)] ${small ? 'text-2xl' : 'text-6xl'}`}
    aria-label="Chuto 15"
  >
    CHUTO<span className="text-white">15</span>
  </motion.h1>
);

const fade = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { ...spring, staggerChildren: 0.07 } },
  exit: { opacity: 0, y: 16, transition: { duration: 0.18 } },
};
const item = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: spring } };

const Glass = ({ className = '', children }) => (
  <motion.div variants={item} className={`rounded-3xl bg-black/45 backdrop-blur-xl border border-white/10 ${className}`}>
    {children}
  </motion.div>
);

const Primary = ({ className = '', children, ...rest }) => (
  <motion.button
    whileTap={rest.disabled ? undefined : { scale: 0.96 }}
    className={`w-full rounded-full py-4 font-bold text-white bg-gradient-to-r from-red-600 to-purple-700 shadow-[0_0_30px_rgba(220,38,38,0.35)] disabled:opacity-30 disabled:shadow-none transition-opacity ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

const Ghost = ({ className = '', children, ...rest }) => (
  <motion.button
    whileTap={rest.disabled ? undefined : { scale: 0.94 }}
    className={`rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-neutral-300 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-white/[0.08] transition-colors ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

const IconBtn = ({ children, ...rest }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
    {...rest}
  >
    {children}
  </motion.button>
);

const ScoreSheet = ({ open, onClose, players }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Puntajes"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative w-full max-w-md rounded-t-[2rem] bg-[#111014]/95 border-t border-white/10 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-white/15 mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Puntajes</h2>
              <IconBtn onClick={onClose} aria-label="Cerrar"><X size={18} /></IconBtn>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto">
              {sorted.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.05 * i }}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-baseline gap-3">
                      <span className="text-xs text-neutral-500 w-4 tabular-nums">{i + 1}</span>
                      <span className="font-semibold">{p.name}</span>
                    </span>
                    <span className="flex items-baseline gap-4 tabular-nums">
                      <span className="text-xs text-red-400 flex items-center gap-1"><Wine size={12} /> {p.sips}</span>
                      <span className="font-bold w-14 text-right">{p.score}</span>
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden ml-7">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (p.score / WIN_SCORE) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 + 0.05 * i }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs text-neutral-600 mt-6">Gana el primero en llegar a {WIN_SCORE} pts</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Scene = React.lazy(() => import('./scene/Scene.jsx'));

const App = () => {
  const [gameState, setGameState] = useState('consent');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [negotiatedStakes, setNegotiatedStakes] = useState(null);
  const [partnerPlayerIndex, setPartnerPlayerIndex] = useState(null);
  const [nameError, setNameError] = useState('');

  // Estado visual
  const [cardKey, setCardKey] = useState(0);
  const [exitType, setExitType] = useState('done');
  const [toast, setToast] = useState(null);
  const [scoresOpen, setScoresOpen] = useState(false);
  const [verdict, setVerdict] = useState(null);
  // Arrastre de la carta (compartido con la escena 3D sin re-renderizar)
  const drag = useRef({ active: false, x: 0, y: 0, throw: null });
  const dragStart = useRef(null);

  // Multiplicador de probabilidad por reto (baja a 1/4 cada vez que sale)
  const repeatMultipliers = useRef(BASE_CHALLENGES.map(() => 1));
  const toastId = useRef(0);

  const showToast = (text, tone = 'text-white') => {
    const id = ++toastId.current;
    setToast({ id, text, tone });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 1700);
  };

  // --- CONFIGURACIÓN ---
  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (name === '') return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setNameError('Ya hay un jugador con ese nombre.');
      return;
    }
    setNameError('');
    setPlayers([...players, { name, score: 0, sips: 0 }]);
    setNewPlayerName('');
  };

  const removePlayer = (index) => setPlayers(players.filter((_, i) => i !== index));

  const startGame = () => {
    if (players.length < 2) return;
    repeatMultipliers.current = BASE_CHALLENGES.map(() => 1);
    setCurrentPlayerIndex(0);
    setGameState('playing');
    pickChallenge(0, players);
  };

  // --- JUEGO ---
  const pickChallenge = (playerIdx, currentPlayers) => {
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
    setCardKey((k) => k + 1);

    const idx = weightedPick(repeatMultipliers.current);
    repeatMultipliers.current[idx] *= REPEAT_DECAY;
    const selected = BASE_CHALLENGES[idx];
    setCurrentChallenge(selected);

    if (currentPlayers.length > 1 && selected.text.includes('{partner}')) {
      setPartnerPlayerIndex(pickPartnerIndex(currentPlayers.length, playerIdx));
    }
  };

  const handleNegotiate = () => {
    if (!currentChallenge || isNegotiated) return;
    setNegotiatedStakes({
      points: Math.floor(currentChallenge.points * 1.5),
      sips: calculateSips(currentChallenge) * 2, // Doble castigo al negociar
    });

    // Pesos: Hard=5, Medium=3, Soft=1, multiplicados por el decaimiento de repetición
    const currentIdx = BASE_CHALLENGES.indexOf(currentChallenge);
    const weights = BASE_CHALLENGES.map((c, i) => {
      if (i === currentIdx) return 0;
      const base = c.intensity === 'hard' ? 5 : c.intensity === 'medium' ? 3 : 1;
      return base * repeatMultipliers.current[i];
    });
    const randomIndex = weightedPick(weights);
    repeatMultipliers.current[randomIndex] *= REPEAT_DECAY;
    const next = BASE_CHALLENGES[randomIndex];
    setCurrentChallenge(next);
    setIsNegotiated(true);
    setExitType('swap');
    setCardKey((k) => k + 1);

    if (players.length > 1 && next.text.includes('{partner}') && partnerPlayerIndex === null) {
      setPartnerPlayerIndex(pickPartnerIndex(players.length, currentPlayerIndex));
    } else if (!next.text.includes('{partner}')) {
      setPartnerPlayerIndex(null);
    }
    showToast('Doble riesgo', 'text-amber-400');
  };

  const getCurrentStakes = () =>
    isNegotiated && negotiatedStakes
      ? { points: negotiatedStakes.points, sips: negotiatedStakes.sips }
      : { points: currentChallenge.points, sips: calculateSips(currentChallenge) };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Resuelve el turno: actualiza puntajes y arma el veredicto que se muestra
  // en el reverso de la carta. El turno avanza recién con "Siguiente".
  const resolveTurn = (updated, kind, label, title, rows) => {
    const leaders = updated.filter((p) => p.score >= WIN_SCORE).sort((x, y) => y.score - x.score);
    setPlayers(updated);
    setVerdict({
      key: cardKey,
      kind,
      label,
      title,
      rows,
      note: isNegotiated ? 'Apuesta negociada · premio ×1.5 · castigo ×2' : null,
      winnerName: leaders.length ? leaders[0].name : null,
      gameOver: leaders.length > 0,
    });
  };

  const continueTurn = (exit) => {
    if (!verdict) return;
    const { kind, gameOver } = verdict;
    setVerdict(null);
    setExitType(exit || kind);
    if (gameOver) {
      setGameState('winner');
      return;
    }
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    pickChallenge(nextIndex, players);
  };

  // Lanzar la carta en una dirección (en píxeles de pantalla)
  const throwCard = (dir) => {
    drag.current.throw = dir;
    drag.current.active = false;
    continueTurn('throw');
  };

  const onDragStart = (e) => {
    if (!verdict) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
    drag.current.active = true;
    drag.current.x = 0;
    drag.current.y = 0;
  };
  const onDragMove = (e) => {
    const st = dragStart.current;
    if (!st) return;
    const now = performance.now();
    const dt = Math.max(1, now - st.lt);
    st.vx = (e.clientX - st.lx) / dt;
    st.vy = (e.clientY - st.ly) / dt;
    st.lx = e.clientX; st.ly = e.clientY; st.lt = now;
    drag.current.x = e.clientX - st.x;
    drag.current.y = e.clientY - st.y;
  };
  const onDragEnd = () => {
    const st = dragStart.current;
    if (!st) return;
    dragStart.current = null;
    const { x, y } = drag.current;
    const dist = Math.hypot(x, y);
    const speed = Math.hypot(st.vx, st.vy);
    if (dist > 90 || (speed > 0.6 && dist > 25)) {
      const dx = speed > 0.6 ? st.vx : x;
      const dy = speed > 0.6 ? st.vy : y;
      throwCard({ x: dx, y: dy });
    } else {
      drag.current.active = false; // vuelve a su lugar
    }
  };

  const pointsRow = (p, amount) => ({
    icon: 'star', name: p.name, amount: `+${amount} pts`, total: `${p.score} pts en total`, color: '#4ade80',
  });
  const sipsRow = (p, amount) => ({
    icon: 'wine', name: p.name, amount: `Bebe ${amount}`, total: `${plural(p.sips, 'sorbo', 'sorbos')} en total`, color: '#f87171',
  });

  const handlePartnerRefusal = () => {
    if (verdict) return;
    const { points, sips } = getCurrentStakes();
    const mine = Math.floor(points / 2);
    const theirs = Math.ceil(sips / 2);
    const updated = players.map((p, i) => {
      if (i === currentPlayerIndex) return { ...p, score: p.score + mine };
      if (i === partnerPlayerIndex) return { ...p, sips: p.sips + theirs };
      return p;
    });
    const me = updated[currentPlayerIndex];
    const partner = updated[partnerPlayerIndex];
    resolveTurn(updated, 'refuse', 'Se opone', `${partner.name} dijo que no`, [
      pointsRow(me, mine),
      sipsRow(partner, theirs),
    ]);
  };

  const handleResult = (success) => {
    if (verdict) return;
    const { points, sips } = getCurrentStakes();
    const updated = players.map((p, i) => {
      if (success) {
        if (i === currentPlayerIndex) return { ...p, score: p.score + points };
        if (i === partnerPlayerIndex) return { ...p, score: p.score + Math.floor(points / 2) };
      } else if (i === currentPlayerIndex) {
        return { ...p, sips: p.sips + sips };
      }
      return p;
    });
    const me = updated[currentPlayerIndex];
    const drink = isDrinkChallenge(currentChallenge);
    if (success) {
      const rows = [pointsRow(me, points)];
      if (partnerPlayerIndex !== null) rows.push(pointsRow(updated[partnerPlayerIndex], Math.floor(points / 2)));
      resolveTurn(updated, 'done', 'Reto cumplido', drink ? `¡Salud, ${me.name}!` : `¡Bien hecho, ${me.name}!`, rows);
    } else {
      resolveTurn(updated, 'fail', 'Castigo', drink ? `${me.name} se negó` : `${me.name} no se atrevió`, [sipsRow(me, sips)]);
    }
  };

  const restartGame = () => {
    setScoresOpen(false);
    setVerdict(null);
    setPlayers(players.map((p) => ({ ...p, score: 0, sips: 0 })));
    setGameState('setup');
    setCurrentPlayerIndex(0);
    setCurrentChallenge(null);
    repeatMultipliers.current = BASE_CHALLENGES.map(() => 1);
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
  };

  // --- Datos derivados ---
  const me = players[currentPlayerIndex];
  const partner = partnerPlayerIndex !== null ? players[partnerPlayerIndex] : null;
  const drinkType = isDrinkChallenge(currentChallenge);
  const stakes = currentChallenge
    ? isNegotiated && negotiatedStakes
      ? { win: negotiatedStakes.points, sips: negotiatedStakes.sips }
      : { win: currentChallenge.points, sips: calculateSips(currentChallenge) }
    : { win: 0, sips: 0 };

  const plainText = currentChallenge
    ? currentChallenge.text.split('{partner}').join(partner ? partner.name : 'alguien')
    : '';

  // Carta que se dibuja en 3D
  const card = useMemo(() => {
    if (gameState !== 'playing' || !currentChallenge) return null;
    const tokens = [];
    const parts = currentChallenge.text.split('{partner}');
    parts.forEach((part, i) => {
      part.split(' ').filter(Boolean).forEach((t) => tokens.push({ t }));
      if (i < parts.length - 1) tokens.push({ t: partner ? partner.name : 'alguien', partner: true });
    });
    return {
      key: cardKey,
      intensity: currentChallenge.intensity,
      negotiated: isNegotiated,
      label: isNegotiated ? 'Negociado' : drinkType ? 'Bebe o no' : LEVEL_LABELS[currentChallenge.intensity],
      tokens,
      win: stakes.win,
      sips: stakes.sips,
      partnerName: partner ? partner.name : null,
      partnerWin: Math.floor(stakes.win / 2),
      refuseSips: Math.ceil(stakes.sips / 2),
    };
  }, [cardKey, gameState]);

  const sceneMode = gameState === 'playing' ? 'playing' : gameState === 'winner' ? 'winner' : 'intro';
  const winner = [...players].sort((a, b) => b.score - a.score)[0];

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden">
        {hasWebGL && (
          <Suspense fallback={null}>
            <Scene mode={sceneMode} card={card} verdict={verdict} exitType={exitType} drag={drag} />
          </Suspense>
        )}

        <div className="relative z-10 h-[100dvh] max-w-md mx-auto flex flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)] pointer-events-none [&_button]:pointer-events-auto [&_input]:pointer-events-auto">
          <AnimatePresence mode="wait">

            {/* AVISO +18 */}
            {gameState === 'consent' && (
              <motion.div key="consent" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
                <motion.div variants={item} className="flex justify-center pt-6"><Logo /></motion.div>
                <div className="flex-1" />
                <Glass className="p-6 pointer-events-auto">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-red-400 border border-red-500/40 rounded-full px-2.5 py-0.5">+18</span>
                    <h2 className="font-bold text-lg">Solo para adultos</h2>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Retos sexuales y de alcohol. Todos deben estar de acuerdo en jugar y cualquiera puede negarse a un reto, sin presión. Bebe con moderación y no conduzcas.
                  </p>
                </Glass>
                <motion.div variants={item} className="mt-4">
                  <Primary onClick={() => setGameState('setup')}>Soy mayor de 18 · Entrar</Primary>
                </motion.div>
              </motion.div>
            )}

            {/* JUGADORES */}
            {gameState === 'setup' && (
              <motion.div key="setup" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
                <motion.div variants={item} className="flex justify-center pt-6"><Logo /></motion.div>
                <div className="flex-1" />
                <Glass className="p-5 pointer-events-auto">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500 mb-3">Jugadores</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Añade un nombre"
                      maxLength={16}
                      className="flex-1 min-w-0 rounded-full bg-white/[0.05] border border-white/10 px-5 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/60 transition-colors"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={addPlayer}
                      aria-label="Añadir jugador"
                      className="w-12 h-12 shrink-0 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <Plus size={22} />
                    </motion.button>
                  </div>
                  {nameError && <p className="text-red-400 text-xs mt-2 ml-2">{nameError}</p>}
                  <div className="flex flex-wrap gap-2 mt-4 min-h-[2.25rem]">
                    <AnimatePresence initial={false}>
                      {players.map((p, i) => (
                        <motion.span
                          key={p.name}
                          layout
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={spring}
                          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 pl-3.5 pr-1.5 py-1.5 text-sm"
                        >
                          {p.name}
                          <button onClick={() => removePlayer(i)} aria-label={`Quitar a ${p.name}`} className="w-5 h-5 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10">
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {players.length === 0 && <span className="text-sm text-neutral-600 py-1.5">Mínimo 2 para empezar</span>}
                  </div>
                </Glass>
                <motion.div variants={item} className="mt-4">
                  <Primary onClick={startGame} disabled={players.length < 2}>
                    {players.length < 2 ? 'Faltan jugadores' : 'Comenzar'}
                  </Primary>
                </motion.div>
              </motion.div>
            )}

            {/* JUEGO */}
            {gameState === 'playing' && currentChallenge && me && (
              <motion.div key="playing" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
                <motion.div variants={item} className="flex items-center justify-between">
                  <Logo small />
                  <IconBtn onClick={() => setScoresOpen(true)} aria-label="Ver puntajes"><Trophy size={18} /></IconBtn>
                </motion.div>

                <motion.div variants={item} className="text-center mt-5 h-16">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">Turno de</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={me.name}
                      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                      transition={{ type: 'tween', duration: 0.35 }}
                      className="text-3xl font-black tracking-tight"
                    >
                      {me.name}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                <div className="relative h-6 flex justify-center">
                  <AnimatePresence>
                    {toast && (
                      <motion.p
                        key={toast.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`absolute text-sm font-semibold ${toast.tone}`}
                      >
                        {toast.text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Zona de la carta (la carta vive en la escena 3D) */}
                <div className="flex-1 flex items-center justify-center relative">
                  {verdict && (
                    // Capa táctil para arrastrar y lanzar la carta
                    <div
                      className="absolute inset-0 pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
                      onPointerDown={onDragStart}
                      onPointerMove={onDragMove}
                      onPointerUp={onDragEnd}
                      onPointerCancel={onDragEnd}
                    />
                  )}
                  <p className="sr-only" aria-live="polite">
                    {verdict
                      ? `${verdict.title}. ${verdict.rows.map((r) => `${r.name}: ${r.amount}`).join('. ')}.`
                      : `${plainText}. Premio ${stakes.win} puntos, castigo ${stakes.sips} sorbos.`}
                  </p>
                  {!hasWebGL && verdict && (
                    <div className="w-full rounded-3xl bg-neutral-900/80 border border-white/10 p-6">
                      <p className="text-xs uppercase tracking-widest text-neutral-500 text-center mb-1">{verdict.label}</p>
                      <p className="text-xl font-bold text-center mb-4">{verdict.title}</p>
                      {verdict.rows.map((r) => (
                        <div key={r.name + r.amount} className="flex items-center justify-between py-2 border-t border-white/5">
                          <span className="flex items-center gap-2">
                            {r.icon === 'wine' ? <Wine size={16} className="text-red-400" /> : <Star size={16} className="text-green-400" />}
                            {r.name}
                          </span>
                          <span className="font-bold" style={{ color: r.color }}>{r.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!hasWebGL && !verdict && (
                    <div className="w-full rounded-3xl bg-neutral-900/80 border border-red-500/30 p-6 text-center">
                      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{card && card.label}</p>
                      <p className="text-xl font-bold leading-snug">{plainText}</p>
                      <p className="text-sm text-neutral-400 mt-4">+{stakes.win} pts · {stakes.sips} sorbos</p>
                    </div>
                  )}
                </div>

                <motion.div variants={item} className="relative">
                <AnimatePresence mode="wait" initial={false}>
                {verdict ? (
                  <motion.div key="next" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }}>
                    <button
                      onClick={() => throwCard({ x: 0, y: -1 })}
                      className="w-full h-[7.25rem] flex flex-col items-center justify-center gap-1.5 text-neutral-400"
                      aria-label={verdict.gameOver ? 'Lanzar la carta y ver al ganador' : 'Lanzar la carta y pasar al siguiente turno'}
                    >
                      <span className="flex flex-col items-center -space-y-2.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.15, 1, 0.15], y: [4, -4, 4] }}
                            transition={{ repeat: Infinity, duration: 1.4, delay: (2 - i) * 0.18, ease: 'easeInOut' }}
                          >
                            <ChevronUp size={22} className={verdict.gameOver ? 'text-yellow-400' : 'text-white'} />
                          </motion.span>
                        ))}
                      </span>
                      <span className="text-sm font-semibold text-white">Desliza la carta para lanzarla</span>
                      <span className="text-xs">
                        {verdict.gameOver ? 'y descubre al ganador' : `Sigue ${players[(currentPlayerIndex + 1) % players.length].name}`}
                      </span>
                    </button>
                  </motion.div>
                ) : (
                <motion.div key="actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }} className="space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleResult(true)}
                    className="w-full rounded-full bg-white text-black py-4 font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
                  >
                    <Check size={20} strokeWidth={3} /> {drinkType ? 'Bebí / no aplica' : 'Hecho'}
                  </motion.button>
                  <div className={`grid gap-2.5 ${partner ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <Ghost onClick={() => handleResult(false)} className="py-3">
                      <Wine size={16} className="text-red-400" /> {drinkType ? 'Me niego' : 'Castigo'}
                    </Ghost>
                    {partner && (
                      <Ghost onClick={handlePartnerRefusal} className="py-3">
                        <ShieldX size={16} className="text-orange-400" /> Se opone
                      </Ghost>
                    )}
                    <Ghost onClick={handleNegotiate} disabled={isNegotiated} className="py-3">
                      <Shuffle size={16} className="text-purple-400" /> Negociar
                    </Ghost>
                  </div>
                </motion.div>
                )}
                </AnimatePresence>
                </motion.div>
              </motion.div>
            )}

            {/* GANADOR */}
            {gameState === 'winner' && winner && (
              <motion.div key="winner" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
                <motion.div variants={item} className="flex justify-center"><Logo small /></motion.div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <motion.p variants={item} className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 mb-2">Ganador</motion.p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ scale: { type: 'spring', stiffness: 160, damping: 16, delay: 0.3 }, default: { type: 'tween', duration: 0.6, delay: 0.3 } }}
                    className="text-6xl font-black italic tracking-tighter -skew-x-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500 drop-shadow-[0_0_24px_rgba(220,38,38,0.5)] px-4 break-all"
                  >
                    {winner.name}
                  </motion.p>
                  <motion.p variants={item} className="text-sm text-neutral-400 mt-3">
                    {winner.score} pts · {winner.sips} {winner.sips === 1 ? 'trago' : 'tragos'}
                  </motion.p>
                </div>
                <motion.div variants={item} className="space-y-2.5">
                  <Ghost onClick={() => setScoresOpen(true)} className="w-full py-3.5">
                    <Trophy size={16} /> Ver puntajes
                  </Ghost>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={restartGame}
                    className="w-full rounded-full bg-white text-black py-4 font-bold flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} /> Jugar de nuevo
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ScoreSheet open={scoresOpen} onClose={() => setScoresOpen(false)} players={players} />
      </div>
    </MotionConfig>
  );
};

export default App;
