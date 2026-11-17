import React, { useState, useEffect, useRef } from 'react';
import { Flame, Wine, UserPlus, Play, RotateCcw, Trophy, X, Check, Crown, Shuffle, AlertTriangle, ShieldX } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig, animate, useMotionValue, useTransform } from 'framer-motion';

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

// ---------- Identidad visual ----------
const PLAYER_COLORS = ['#ff2e93', '#22e6ff', '#ffb020', '#9dff3a', '#a855ff', '#ff5a36', '#2effc0', '#ff6bd6'];

const LEVELS = {
  soft: { label: 'Para calentar', color: '#ff5ea8', flames: 1 },
  medium: { label: 'Nivel medio', color: '#b45cff', flames: 2 },
  hard: { label: 'Prueba extrema', color: '#ff2d3d', flames: 3 },
};
const NEGOTIATED_COLOR = '#ffc61a';

const spring = { type: 'spring', stiffness: 380, damping: 26 };

const AnimatedNumber = ({ value }) => {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' });
    return () => controls.stop();
  }, [value]);
  return <motion.span>{rounded}</motion.span>;
};

const Background = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="orb w-96 h-96 -top-24 -left-24" style={{ background: 'rgba(255,45,90,.35)' }} />
    <div className="orb w-[26rem] h-[26rem] top-1/3 -right-40" style={{ background: 'rgba(130,60,255,.32)', animationDelay: '-5s' }} />
    <div className="grid-floor" />
    {Array.from({ length: 22 }).map((_, i) => (
      <span
        key={i}
        className="spark"
        style={{
          left: `${(i * 37) % 100}%`,
          animationDuration: `${9 + (i % 6) * 3}s`,
          animationDelay: `${-i * 1.7}s`,
          background: i % 3 === 0 ? '#ff2e93' : i % 3 === 1 ? '#a855ff' : '#22e6ff',
          boxShadow: '0 0 8px currentColor',
        }}
      />
    ))}
  </div>
);

// Logo estilo letrero de neón
const Logo = ({ big = false }) => (
  <motion.h1
    initial={{ y: -40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={spring}
    className={`font-neon select-none flex items-center justify-center gap-2 ${big ? 'text-6xl' : 'text-4xl'}`}
    aria-label="Chuto 15"
  >
    <span className="neon-text" style={{ '--glow': '#ff2d5a' }}>
      CHU<span className="flicker-fast inline-block">T</span>O
    </span>
    <motion.span
      animate={{ rotate: [-4, 4, -4] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      className="neon-box neon-text rounded-xl px-2 leading-tight flicker"
      style={{ '--glow': '#a855ff' }}
    >
      15
    </motion.span>
  </motion.h1>
);

const NeonBtn = ({ color, fill = false, sweep = false, className = '', children, ...rest }) => (
  <motion.button
    whileHover={rest.disabled ? undefined : { scale: 1.03 }}
    whileTap={rest.disabled ? undefined : { scale: 0.94 }}
    transition={spring}
    style={{ '--c': color }}
    className={`btn-n ${fill ? 'btn-fill' : ''} ${sweep ? 'btn-sweep' : ''} rounded-2xl flex flex-col items-center justify-center text-center ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

const screenVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ...spring, staggerChildren: 0.08 } },
  exit: { opacity: 0, y: -30, scale: 0.96, transition: { duration: 0.2 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0, transition: spring },
};

const App = () => {
  const [gameState, setGameState] = useState('consent');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);

  // ESTADOS DE NEGOCIACIÓN Y PARTNER
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [negotiatedStakes, setNegotiatedStakes] = useState(null);
  const [partnerPlayerIndex, setPartnerPlayerIndex] = useState(null);
  const [nameError, setNameError] = useState('');

  // ESTADOS VISUALES
  const [cardKey, setCardKey] = useState(0);
  const [pops, setPops] = useState([]);
  const [turnBanner, setTurnBanner] = useState(null);

  // Multiplicador de probabilidad por reto (baja a 1/4 cada vez que sale)
  const repeatMultipliers = useRef(BASE_CHALLENGES.map(() => 1));
  const colorSeed = useRef(0);
  const popId = useRef(0);

  // --- EFECTOS VISUALES ---
  const addPop = (text, color, delay = 0) => {
    const id = popId.current++;
    setTimeout(() => {
      setPops((p) => [...p, { id, text, color }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1600);
    }, delay);
  };
  const showTurn = (player) => {
    const id = popId.current++;
    setTurnBanner({ id, name: player.name, color: player.color });
    setTimeout(() => setTurnBanner((b) => (b && b.id === id ? null : b)), 1200);
  };

  // --- LOGICA DE CONFIGURACIÓN ---
  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (name === '') return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setNameError('Ya hay un jugador con ese nombre.');
      return;
    }
    setNameError('');
    const color = PLAYER_COLORS[colorSeed.current++ % PLAYER_COLORS.length];
    setPlayers([...players, { name, score: 0, sips: 0, color }]);
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

  // --- LOGICA DE JUEGO ---
  const pickChallenge = (playerIdx, currentPlayers) => {
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
    setCardKey((k) => k + 1);
    showTurn(currentPlayers[playerIdx]);

    // Los ya salidos pesan 1/4 cada vez que aparecen
    const idx = weightedPick(repeatMultipliers.current);
    repeatMultipliers.current[idx] *= REPEAT_DECAY;
    const selectedChallenge = BASE_CHALLENGES[idx];
    setCurrentChallenge(selectedChallenge);

    if (currentPlayers.length > 1 && selectedChallenge.text.includes('{partner}')) {
      setPartnerPlayerIndex(pickPartnerIndex(currentPlayers.length, playerIdx));
    }
  };

  // --- LÓGICA DE NEGOCIACIÓN ---
  const handleNegotiate = () => {
    if (!currentChallenge) return;

    const fixedPoints = Math.floor(currentChallenge.points * 1.5);
    const fixedSips = calculateSips(currentChallenge) * 2; // Doble castigo al negociar
    setNegotiatedStakes({ points: fixedPoints, sips: fixedSips });

    // Pesos: Hard=5, Medium=3, Soft=1, multiplicados por el decaimiento de repetición
    const currentIdx = BASE_CHALLENGES.indexOf(currentChallenge);
    const weights = BASE_CHALLENGES.map((challenge, index) => {
      if (index === currentIdx) return 0;
      const base = challenge.intensity === 'hard' ? 5 : challenge.intensity === 'medium' ? 3 : 1;
      return base * repeatMultipliers.current[index];
    });
    const randomIndex = weightedPick(weights);
    repeatMultipliers.current[randomIndex] *= REPEAT_DECAY;
    const newChallenge = BASE_CHALLENGES[randomIndex];
    setCurrentChallenge(newChallenge);
    setIsNegotiated(true);
    setCardKey((k) => k + 1);

    if (players.length > 1 && newChallenge.text.includes('{partner}') && partnerPlayerIndex === null) {
      setPartnerPlayerIndex(pickPartnerIndex(players.length, currentPlayerIndex));
    } else if (!newChallenge.text.includes('{partner}')) {
      setPartnerPlayerIndex(null);
    }
    addPop('DOBLE RIESGO', NEGOTIATED_COLOR);
  };

  // Stakes actuales (negociados o normales)
  const getCurrentStakes = () => {
    if (isNegotiated && negotiatedStakes) {
      return { points: negotiatedStakes.points, sips: negotiatedStakes.sips };
    }
    return { points: currentChallenge.points, sips: calculateSips(currentChallenge) };
  };

  // Guarda los jugadores actualizados y, o termina la partida, o pasa el turno
  const finishTurn = (updatedPlayers) => {
    setPlayers(updatedPlayers);
    if (updatedPlayers.some((p) => p.score >= WIN_SCORE)) {
      setGameState('winner');
      return;
    }
    nextTurn(updatedPlayers);
  };

  // --- PARTNER REFUSAL ---
  const handlePartnerRefusal = () => {
    const { points, sips } = getCurrentStakes();
    const mine = Math.floor(points / 2);
    const theirs = Math.ceil(sips / 2);
    const me = players[currentPlayerIndex];
    const partner = players[partnerPlayerIndex];
    const newPlayers = players.map((p, i) => {
      if (i === currentPlayerIndex) return { ...p, score: p.score + mine };
      if (i === partnerPlayerIndex) return { ...p, sips: p.sips + theirs };
      return p;
    });
    addPop('SE OPONE', '#ff9f1c');
    addPop(`${me.name} +${mine}`, '#9dff3a', 250);
    addPop(`${partner.name} bebe ${theirs}`, '#ff2e93', 500);
    finishTurn(newPlayers);
  };

  const handleResult = (success) => {
    const { points, sips } = getCurrentStakes();
    const me = players[currentPlayerIndex];
    const newPlayers = players.map((p, i) => {
      if (success) {
        if (i === currentPlayerIndex) return { ...p, score: p.score + points };
        if (i === partnerPlayerIndex) return { ...p, score: p.score + Math.floor(points / 2) };
      } else if (i === currentPlayerIndex) {
        return { ...p, sips: p.sips + sips };
      }
      return p;
    });
    if (success) {
      addPop(`+${points}`, '#9dff3a');
      if (partnerPlayerIndex !== null) {
        addPop(`${players[partnerPlayerIndex].name} +${Math.floor(points / 2)}`, '#22e6ff', 250);
      }
    } else {
      addPop(`${me.name} bebe ${sips}`, '#ff2e93');
    }
    finishTurn(newPlayers);
  };

  const nextTurn = (updatedPlayers) => {
    const nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
    setCurrentPlayerIndex(nextIndex);
    pickChallenge(nextIndex, updatedPlayers);
  };

  const restartGame = () => {
    setPlayers(players.map((p) => ({ ...p, score: 0, sips: 0 })));
    setGameState('setup');
    setCurrentPlayerIndex(0);
    setCurrentChallenge(null);
    repeatMultipliers.current = BASE_CHALLENGES.map(() => 1);
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
  };

  const stakes = currentChallenge
    ? (isNegotiated && negotiatedStakes
        ? { win: negotiatedStakes.points, loseSips: negotiatedStakes.sips }
        : { win: currentChallenge.points, loseSips: calculateSips(currentChallenge) })
    : { win: 0, loseSips: 0 };
  const drinkType = isDrinkChallenge(currentChallenge);
  const level = currentChallenge ? LEVELS[currentChallenge.intensity] : LEVELS.soft;
  const glow = isNegotiated ? NEGOTIATED_COLOR : level.color;
  const me = players[currentPlayerIndex];
  const partner = partnerPlayerIndex !== null ? players[partnerPlayerIndex] : null;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  // Texto del reto, palabra por palabra (con el partner resaltado)
  const challengeTokens = () => {
    if (!currentChallenge) return [];
    const tokens = [];
    const parts = currentChallenge.text.split('{partner}');
    parts.forEach((part, i) => {
      part.split(' ').filter(Boolean).forEach((w) => tokens.push({ t: w }));
      if (i < parts.length - 1) tokens.push({ partner: true });
    });
    return tokens;
  };

  // --- RENDERIZADO ---
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen text-white overflow-x-hidden relative scanlines" style={{ background: 'var(--bg)' }}>
        <Background />
        <div className="vignette" />

        {/* Banner de turno: barrido a pantalla completa */}
        <AnimatePresence>
          {turnBanner && (
            <motion.div
              key={turnBanner.id}
              className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
              initial="in" animate="in" exit="out"
            >
              <motion.div
                className="absolute inset-x-0 h-28"
                style={{ background: `linear-gradient(90deg, transparent, ${turnBanner.color}55, transparent)`, backdropFilter: 'blur(3px)' }}
                variants={{ in: { scaleY: 1, opacity: 1 }, out: { scaleY: 0, opacity: 0 } }}
                initial={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
              <motion.div
                className="relative text-center"
                initial={{ x: '-110vw', skewX: -18 }}
                animate={{ x: 0, skewX: -8, transition: { type: 'spring', stiffness: 220, damping: 20 } }}
                exit={{ x: '110vw', skewX: -18, transition: { duration: 0.28, ease: 'easeIn' } }}
              >
                <div className="text-xs tracking-[0.5em] text-white/70 font-bold">TURNO DE</div>
                <div className="font-neon text-6xl neon-text break-all" style={{ '--glow': turnBanner.color }}>
                  {turnBanner.name}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textos flotantes de resultado */}
        <div className="fixed inset-x-0 top-[26%] z-30 flex flex-col items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {pops.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 1.1 }}
                transition={spring}
                className="font-neon text-3xl px-5 py-1 rounded-full bg-black/70 neon-box neon-soft"
                style={{ '--glow': p.color, color: p.color }}
              >
                {p.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-4">
          <header className="py-3 mb-1">
            <Logo big={gameState === 'consent' || gameState === 'setup'} />
          </header>

          <AnimatePresence mode="wait">

            {/* AVISO +18 */}
            {gameState === 'consent' && (
              <motion.div key="consent" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col justify-center gap-6">
                <motion.div variants={itemVariants} className="neon-box rounded-3xl p-6 bg-black/50 backdrop-blur-md text-center" style={{ '--glow': '#ff2d5a' }}>
                  <div className="font-neon text-6xl neon-text flicker" style={{ '--glow': '#ff2d5a' }}>+18</div>
                  <h2 className="font-neon text-2xl text-pink-300 mt-1 mb-4">Solo adultos</h2>
                  <ul className="text-white/85 text-left space-y-2">
                    {[
                      'Retos sexuales y de beber alcohol.',
                      'Solo para mayores de 18 años.',
                      'Todos tienen que estar de acuerdo en jugar.',
                      'Cualquiera puede negarse a un reto, sin presión.',
                      'Toma con moderación y no conduzcas.',
                    ].map((t, i) => (
                      <motion.li key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.3 + i * 0.1 }} className="flex gap-2">
                        <span className="text-pink-400">▸</span> {t}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <NeonBtn color="#ff2d5a" fill sweep onClick={() => setGameState('setup')} className="w-full py-5 text-lg">
                    Soy mayor de 18 y todos aceptamos jugar
                  </NeonBtn>
                </motion.div>
              </motion.div>
            )}

            {/* SETUP */}
            {gameState === 'setup' && (
              <motion.div key="setup" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-5">
                <motion.div variants={itemVariants} className="text-center font-neon tracking-[0.35em] text-sm text-white/60">
                  RETA · SEDUCE · BEBE
                </motion.div>
                <motion.div variants={itemVariants} className="neon-box rounded-3xl p-5 bg-black/50 backdrop-blur-md" style={{ '--glow': '#a855ff' }}>
                  <h2 className="font-neon text-2xl neon-soft text-center mb-4" style={{ '--glow': '#a855ff', color: '#d9b8ff' }}>
                    ¿Quiénes juegan?
                  </h2>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Nombre…"
                      maxLength={16}
                      className="flex-1 min-w-0 bg-black/60 border-2 border-white/15 rounded-2xl px-4 py-3 text-lg placeholder:text-white/30 focus:outline-none focus:border-[#a855ff] focus:shadow-[0_0_18px_rgba(168,85,255,.6)] transition-all"
                    />
                    <NeonBtn color="#22e6ff" onClick={addPlayer} aria-label="Añadir jugador" className="w-14">
                      <UserPlus size={24} />
                    </NeonBtn>
                  </div>
                  {nameError && <p className="text-pink-300 text-sm">{nameError}</p>}

                  <div className="flex flex-wrap gap-2 mt-4 min-h-[48px]">
                    <AnimatePresence>
                      {players.map((p, i) => (
                        <motion.div
                          key={p.name}
                          layout
                          initial={{ scale: 0, rotate: -15, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={spring}
                          className="neon-box flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-black/60"
                          style={{ '--glow': p.color }}
                        >
                          <span className="font-bold neon-soft" style={{ color: p.color, '--glow': p.color }}>{p.name}</span>
                          <button onClick={() => removePlayer(i)} aria-label={`Quitar a ${p.name}`} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center">
                            <X size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {players.length === 0 && <p className="text-white/40 italic m-auto">Añade jugadores para empezar…</p>}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  {players.length >= 2 ? (
                    <NeonBtn color="#ff2d5a" fill sweep onClick={startGame} className="w-full py-5 text-2xl font-neon">
                      <span className="flex items-center gap-3"><Play fill="currentColor" /> COMENZAR</span>
                    </NeonBtn>
                  ) : (
                    <div className="text-center text-white/45 text-sm p-2">Necesitas al menos 2 jugadores para la tensión</div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* JUEGO */}
            {gameState === 'playing' && currentChallenge && me && (
              <motion.div key="playing" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-3">

                {/* Ranking en carrera hacia 400 */}
                <motion.div variants={itemVariants} className="rounded-2xl bg-black/50 backdrop-blur-sm border border-white/10 p-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 px-1 mb-1">
                    <span>Carrera a {WIN_SCORE}</span><span>Sorbos</span>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {sorted.map((p, rank) => {
                      const active = p.name === me.name;
                      return (
                        <motion.div key={p.name} layout transition={spring} className="flex items-center gap-2">
                          <div
                            className="relative flex-1 h-7 rounded-full bg-white/[0.07] overflow-hidden"
                            style={active ? { boxShadow: `0 0 0 2px ${p.color}, 0 0 16px ${p.color}` } : undefined}
                          >
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              initial={false}
                              animate={{ width: `${Math.max(3, Math.min(100, (p.score / WIN_SCORE) * 100))}%` }}
                              transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                              style={{ background: `linear-gradient(90deg, ${p.color}22, ${p.color}cc)` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-3 text-sm font-bold">
                              <span className="truncate flex items-center gap-1.5">
                                {rank === 0 && p.score > 0 && <Crown size={13} className="text-yellow-300" />}
                                {p.name}
                              </span>
                              <span className="tabular-nums"><AnimatedNumber value={p.score} /></span>
                            </div>
                          </div>
                          <span className="w-8 text-right text-sm font-bold text-pink-300 tabular-nums"><AnimatedNumber value={p.sips} /></span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Tarjeta del reto */}
                <motion.div variants={itemVariants} className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cardKey}
                      initial={{ y: 140, rotate: -7, opacity: 0, scale: 0.85 }}
                      animate={{ y: 0, rotate: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
                      exit={{ x: -320, rotate: -14, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                    >
                      <motion.div
                        animate={isNegotiated ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="tube rounded-[1.7rem] p-[3px]"
                        style={{ '--glow': glow }}
                      >
                        <div
                          className={`relative overflow-hidden rounded-[1.55rem] px-5 py-4 min-h-[210px] flex flex-col items-center justify-center text-center gap-3 ${isNegotiated ? 'hazard' : ''}`}
                          style={{ background: `radial-gradient(ellipse at top, ${glow}2e, #0b0912 70%)` }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1" style={{ color: glow }}>
                              {[1, 2, 3].map((n) => (
                                <motion.span
                                  key={n}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ ...spring, delay: 0.35 + n * 0.08 }}
                                  style={{ opacity: n <= level.flames ? 1 : 0.2, filter: n <= level.flames ? `drop-shadow(0 0 6px ${glow})` : 'none' }}
                                >
                                  <Flame size={18} fill={n <= level.flames ? 'currentColor' : 'none'} />
                                </motion.span>
                              ))}
                              <span className="ml-1 text-[11px] uppercase tracking-[0.2em] font-bold">
                                {drinkType ? 'Bebe o no' : level.label}
                              </span>
                            </div>
                            {isNegotiated && (
                              <motion.span
                                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={spring}
                                className="flex items-center gap-1 bg-yellow-300 text-black rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
                              >
                                <AlertTriangle size={12} /> RIESGO ×2
                              </motion.span>
                            )}
                          </div>

                          <motion.h3
                            initial="hidden" animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } } }}
                            className="text-[1.45rem] leading-snug font-extrabold break-words"
                          >
                            {challengeTokens().map((tok, i) => (
                              <motion.span
                                key={i}
                                variants={{ hidden: { opacity: 0, y: 14, filter: 'blur(4px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)' } }}
                                className="inline-block mr-[0.3em]"
                              >
                                {tok.partner && partner ? (
                                  <span className="px-2 rounded-lg text-black" style={{ background: partner.color, boxShadow: `0 0 16px ${partner.color}` }}>
                                    {partner.name}
                                  </span>
                                ) : tok.t}
                              </motion.span>
                            ))}
                          </motion.h3>

                          <div className="flex gap-3 w-full">
                            <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.5 }} className="flex-1 rounded-xl py-1.5 bg-black/50 border border-lime-300/40">
                              <div className="text-[9px] tracking-[0.2em] uppercase text-lime-200/70 font-bold">Premio</div>
                              <div className="font-neon text-xl text-lime-300 neon-soft" style={{ '--glow': '#9dff3a' }}>+{stakes.win}</div>
                              {partner && <div className="text-[10px] text-lime-100/70">{partner.name} +{Math.floor(stakes.win / 2)}</div>}
                            </motion.div>
                            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.55 }} className="flex-1 rounded-xl py-1.5 bg-black/50 border border-pink-400/40">
                              <div className="text-[9px] tracking-[0.2em] uppercase text-pink-200/70 font-bold">Castigo</div>
                              <div className="flex justify-center items-center gap-0.5 h-7 text-pink-300">
                                {Array.from({ length: stakes.loseSips }).map((_, i) => (
                                  <motion.span key={i} initial={{ scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} transition={{ ...spring, delay: 0.6 + i * 0.07 }}>
                                    <Wine size={stakes.loseSips > 6 ? 13 : 17} style={{ filter: 'drop-shadow(0 0 5px #ff2e93)' }} />
                                  </motion.span>
                                ))}
                              </div>
                              {partner && <div className="text-[10px] text-pink-100/70">si se opone: {Math.ceil(stakes.loseSips / 2)}</div>}
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Acciones */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
                  <NeonBtn color="#9dff3a" fill sweep onClick={() => handleResult(true)} className="w-full py-3">
                    <span className="flex items-center gap-2 font-neon text-2xl">
                      <Check strokeWidth={4} /> {drinkType ? 'BEBÍ / NO APLICA' : '¡HECHO!'}
                    </span>
                    <span className="text-xs opacity-75">Ganas {stakes.win} pts</span>
                  </NeonBtn>

                  <div className={`grid gap-2.5 ${partner ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <NeonBtn color="#ff2e93" onClick={() => handleResult(false)} className="h-[4.5rem] px-1">
                      <Wine size={22} />
                      <span className="text-sm">{drinkType ? 'Me niego' : 'Castigo'}</span>
                      <span className="text-[10px] opacity-70 leading-tight">Bebes {stakes.loseSips}</span>
                    </NeonBtn>
                    {partner && (
                      <NeonBtn color="#ff9f1c" onClick={handlePartnerRefusal} className="h-[4.5rem] px-1">
                        <ShieldX size={22} />
                        <span className="text-sm">Se opone</span>
                        <span className="text-[10px] opacity-70 leading-tight">{partner.name} bebe {Math.ceil(stakes.loseSips / 2)}</span>
                      </NeonBtn>
                    )}
                    <NeonBtn color="#a855ff" onClick={handleNegotiate} disabled={isNegotiated} className="h-[4.5rem] px-1">
                      <Shuffle size={22} />
                      <span className="text-sm">Negociar</span>
                      <span className="text-[10px] opacity-70 leading-tight">{isNegotiated ? 'Ya usado' : 'Más riesgo, más puntos'}</span>
                    </NeonBtn>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* GANADOR */}
            {gameState === 'winner' && sorted.length > 0 && (
              <motion.div key="winner" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col items-center text-center gap-4 relative">
                {/* chispas que suben */}
                {Array.from({ length: 26 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute bottom-24 w-1.5 h-1.5 rounded-full"
                    style={{ left: `${(i * 41) % 100}%`, background: PLAYER_COLORS[i % PLAYER_COLORS.length], boxShadow: `0 0 10px ${PLAYER_COLORS[i % PLAYER_COLORS.length]}` }}
                    animate={{ y: [0, -420 - (i % 5) * 60], opacity: [0, 1, 0] }}
                    transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, delay: (i % 9) * 0.25, ease: 'easeOut' }}
                  />
                ))}

                <motion.div variants={itemVariants} className="relative">
                  <motion.div animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                    <Trophy size={96} className="text-yellow-300" style={{ filter: 'drop-shadow(0 0 18px #ffc61a)' }} />
                  </motion.div>
                </motion.div>

                <motion.h2 variants={itemVariants} className="font-neon text-4xl neon-text flicker" style={{ '--glow': '#ffc61a' }}>
                  ¡GANADOR!
                </motion.h2>

                <motion.div
                  variants={itemVariants}
                  className="neon-box rounded-full px-8 py-2 font-neon text-4xl bg-black/60 -rotate-2"
                  style={{ '--glow': sorted[0].color, color: sorted[0].color }}
                >
                  {sorted[0].name}
                </motion.div>

                {/* Podio */}
                <motion.div variants={itemVariants} className="flex items-end justify-center gap-2 h-36 w-full">
                  {[1, 0, 2].map((pos) => {
                    const p = sorted[pos];
                    if (!p) return null;
                    const h = [112, 84, 62][pos];
                    return (
                      <div key={p.name} className="flex flex-col items-center w-24">
                        <span className="text-xs font-bold truncate max-w-full mb-1" style={{ color: p.color }}>{p.name}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.5 + pos * 0.2 }}
                          className="w-full rounded-t-xl neon-box flex items-start justify-center pt-2 font-neon text-2xl"
                          style={{ '--glow': p.color, background: `${p.color}22`, color: p.color }}
                        >
                          {pos + 1}
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>

                <motion.div variants={itemVariants} className="w-full rounded-2xl bg-black/50 border border-white/10 p-3">
                  <h3 className="font-neon text-lg text-pink-300 mb-2 flex items-center justify-center gap-2"><Wine size={16} /> Contador de tragos</h3>
                  {sorted.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ ...spring, delay: 0.9 + i * 0.08 }}
                      className="flex justify-between py-1.5 border-b border-white/10 last:border-0"
                    >
                      <span style={{ color: p.color }} className="font-bold">{p.name}</span>
                      <span className="text-pink-300 font-bold">{p.sips} tragos · {p.score} pts</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={itemVariants} className="w-full">
                  <NeonBtn color="#22e6ff" onClick={restartGame} className="w-full py-3.5 text-lg">
                    <span className="flex items-center gap-2"><RotateCcw size={20} /> Jugar de nuevo</span>
                  </NeonBtn>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
};

export default App;
