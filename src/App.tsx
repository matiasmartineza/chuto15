import React, { useState, useEffect, useRef } from 'react';
import { Flame, Wine, UserPlus, Play, RotateCcw, Trophy, X, Check, Crown, Shuffle, AlertTriangle, ShieldX, Heart, Sparkles } from 'lucide-react';
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

// ---------- Estética original (negro + rojo/morado) con animaciones ----------
const PLAYER_COLORS = ['#ef4444', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#38bdf8'];

const LEVELS = {
  soft: { label: 'Para Calentar', Icon: Sparkles, chip: 'bg-pink-500/20 text-pink-500', flames: 1 },
  medium: { label: 'Nivel Medio', Icon: Heart, chip: 'bg-purple-500/20 text-purple-500', flames: 2 },
  hard: { label: 'Prueba Extrema', Icon: Flame, chip: 'bg-red-500/20 text-red-500', flames: 3 },
};

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
    <motion.div
      className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-900/30 rounded-full blur-[100px]"
      animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
      transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]"
      animate={{ x: [0, -60, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
    />
    {/* brasas que suben */}
    {Array.from({ length: 16 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute bottom-0 w-1 h-1 rounded-full"
        style={{ left: `${(i * 37) % 100}%`, background: i % 2 ? '#dc2626' : '#9333ea' }}
        animate={{ y: [0, -900], opacity: [0, 0.7, 0] }}
        transition={{ duration: 10 + (i % 5) * 3, repeat: Infinity, delay: -i * 1.6, ease: 'linear' }}
      />
    ))}
  </div>
);

const Logo = () => (
  <motion.h1
    initial={{ y: -50, opacity: 0, skewX: -6 }}
    animate={{ y: 0, opacity: 1, skewX: -6 }}
    transition={spring}
    className="text-5xl font-black tracking-tighter italic select-none"
    aria-label="Chuto 15"
  >
    <motion.span
      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      CHUTO<span className="text-white">15</span>
    </motion.span>
  </motion.h1>
);

const Btn = ({ className = '', children, ...rest }) => (
  <motion.button
    whileHover={rest.disabled ? undefined : { scale: 1.03 }}
    whileTap={rest.disabled ? undefined : { scale: 0.94 }}
    transition={spring}
    className={className}
    {...rest}
  >
    {children}
  </motion.button>
);

const screenVariants = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ...spring, staggerChildren: 0.08 } },
  exit: { opacity: 0, y: -30, scale: 0.97, transition: { duration: 0.2 } },
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
    addPop('DOBLE RIESGO', '#facc15');
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
    addPop(`${me.name} +${mine}`, '#4ade80', 250);
    addPop(`${partner.name} bebe ${theirs}`, '#f87171', 500);
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
      addPop(`+${points}`, '#4ade80');
      if (partnerPlayerIndex !== null) {
        addPop(`${players[partnerPlayerIndex].name} +${Math.floor(points / 2)}`, '#38bdf8', 250);
      }
    } else {
      addPop(`${me.name} bebe ${sips}`, '#f87171');
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
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500 selection:text-white overflow-x-hidden relative">
        <Background />

        {/* Banner de turno: barrido */}
        <AnimatePresence>
          {turnBanner && (
            <motion.div
              key={turnBanner.id}
              className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
              initial="in" animate="in" exit="out"
            >
              <motion.div
                className="absolute inset-x-0 h-28 bg-gradient-to-r from-transparent via-red-900/60 to-transparent backdrop-blur-sm"
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
                <div className="text-xs tracking-[0.5em] text-neutral-300 font-bold">TURNO DE</div>
                <div className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500 break-all px-4">
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
                className="font-black text-2xl px-5 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 shadow-2xl"
                style={{ color: p.color }}
              >
                {p.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-4">
          <header className="flex justify-center items-center py-4 mb-2">
            <Logo />
          </header>

          <AnimatePresence mode="wait">

            {/* AVISO +18 */}
            {gameState === 'consent' && (
              <motion.div key="consent" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col justify-center gap-6">
                <motion.div variants={itemVariants} className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl shadow-2xl text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="text-6xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]"
                  >+18</motion.div>
                  <h2 className="text-xl font-bold mt-1 mb-4 text-red-400">Contenido para adultos</h2>
                  <ul className="text-neutral-300 text-sm space-y-2 text-left">
                    {[
                      'Este juego contiene retos sexuales y de consumo de alcohol.',
                      'Solo para mayores de 18 años.',
                      'Todos los jugadores deben estar de acuerdo en participar.',
                      'Cualquiera puede negarse a un reto en cualquier momento. Nadie debe sentirse presionado.',
                      'Bebe con moderación y no conduzcas.',
                    ].map((t, i) => (
                      <motion.li key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.3 + i * 0.1 }} className="flex gap-2">
                        <span className="text-red-500">•</span> {t}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Btn onClick={() => setGameState('setup')} className="w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-500 hover:to-purple-600 text-white font-bold py-4 rounded-2xl text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                    Soy mayor de 18 y todos aceptamos jugar
                  </Btn>
                </motion.div>
              </motion.div>
            )}

            {/* SETUP */}
            {gameState === 'setup' && (
              <motion.div key="setup" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-6">
                <motion.div variants={itemVariants} className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl shadow-2xl">
                  <h2 className="text-xl font-bold mb-4 text-center text-red-400 flex items-center justify-center gap-2">
                    <Flame size={20} /> Registro de Jugadores
                  </h2>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Nombre..."
                      maxLength={16}
                      className="flex-1 min-w-0 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-lg"
                    />
                    <Btn onClick={addPlayer} aria-label="Añadir jugador" className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl">
                      <UserPlus size={24} />
                    </Btn>
                  </div>
                  {nameError && <p className="text-red-400 text-sm mb-2">{nameError}</p>}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar mt-4">
                    <AnimatePresence initial={false}>
                      {players.map((p, i) => (
                        <motion.div
                          key={p.name}
                          layout
                          initial={{ x: -60, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 60, opacity: 0 }}
                          transition={spring}
                          className="flex justify-between items-center bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50"
                        >
                          <span className="font-medium text-lg">{p.name}</span>
                          <button onClick={() => removePlayer(i)} aria-label={`Quitar a ${p.name}`} className="text-neutral-500 hover:text-red-500">
                            <X size={20} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {players.length === 0 && <p className="text-center text-neutral-600 italic">Añade jugadores para empezar...</p>}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  {players.length >= 2 ? (
                    <Btn onClick={startGame} className="w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-500 hover:to-purple-600 text-white font-bold py-4 rounded-2xl text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3">
                      <Play fill="currentColor" /> COMENZAR JUEGO
                    </Btn>
                  ) : (
                    <div className="text-center text-neutral-500 text-sm p-2">Necesitas al menos 2 jugadores para la tensión</div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* JUEGO */}
            {gameState === 'playing' && currentChallenge && me && (
              <motion.div key="playing" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col gap-3">

                {/* Barra superior: turno */}
                <motion.div variants={itemVariants} className="flex justify-between items-center bg-neutral-900/80 rounded-full px-4 py-2 border border-neutral-800">
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-400">Turno de:</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={me.name}
                        initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xl font-bold text-red-400 leading-none"
                      >{me.name}</motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300 block">Puntuación</span>
                    <span className="text-lg font-bold text-white"><AnimatedNumber value={me.score} /> pts</span>
                  </div>
                </motion.div>

                {/* Tarjeta del reto */}
                <motion.div variants={itemVariants} className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cardKey}
                      className="relative"
                      initial={{ y: 140, rotate: -7, opacity: 0, scale: 0.85 }}
                      animate={{ y: 0, rotate: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
                      exit={{ x: -320, rotate: -14, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                    >
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${isNegotiated ? 'from-yellow-600 to-orange-600' : 'from-red-600 to-purple-600'} rounded-3xl blur`}
                        animate={{ opacity: [0.2, 0.45, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                      />
                      <motion.div
                        animate={isNegotiated ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative bg-neutral-900/80 backdrop-blur-xl border border-red-500/30 p-5 rounded-3xl shadow-2xl text-center min-h-[220px] flex flex-col justify-center items-center gap-3"
                      >
                        <div className="flex items-center justify-between w-full">
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.25 }}
                            className={`p-2 rounded-full ${level.chip}`}
                          >
                            <level.Icon size={20} fill={currentChallenge.intensity === 'soft' ? 'none' : 'currentColor'} />
                          </motion.div>
                          {isNegotiated && (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}
                              className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50 animate-pulse"
                            >
                              <AlertTriangle size={12} /> RIESGO ACTIVO
                            </motion.div>
                          )}
                        </div>

                        <div className="w-full">
                          <span className="uppercase tracking-widest text-xs font-bold text-neutral-500 mb-2 block">
                            {isNegotiated ? '⚠️ REGLAS NEGOCIADAS ⚠️' : drinkType ? 'Bebe o no' : level.label}
                          </span>
                          <motion.h3
                            initial="hidden" animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } } }}
                            className="text-xl md:text-2xl font-bold leading-snug break-words"
                          >
                            {challengeTokens().map((tok, i) => (
                              <motion.span
                                key={i}
                                variants={{ hidden: { opacity: 0, y: 14, filter: 'blur(4px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)' } }}
                                className="inline-block mr-[0.3em]"
                              >
                                {tok.partner && partner ? (
                                  <span className="px-2 rounded-lg bg-red-500/25 text-red-300 border border-red-500/40">{partner.name}</span>
                                ) : tok.t}
                              </motion.span>
                            ))}
                          </motion.h3>
                        </div>

                        <div className="flex gap-4 w-full justify-center">
                          <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.5 }} className="flex-1 bg-neutral-950/50 py-2 rounded-lg border border-neutral-800 flex flex-col items-center">
                            <span className="text-[10px] uppercase text-neutral-500 font-bold">Premio</span>
                            <span className="text-green-400 font-bold text-lg">+{stakes.win} pts</span>
                            {isNegotiated && <span className="text-[9px] text-yellow-500 leading-none">(Fijo x1.5)</span>}
                            {partner && <span className="text-[9px] text-green-600 mt-0.5">Partner: +{Math.floor(stakes.win / 2)}</span>}
                          </motion.div>
                          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.55 }} className="flex-1 bg-neutral-950/50 py-2 rounded-lg border border-neutral-800 flex flex-col items-center">
                            <span className="text-[10px] uppercase text-neutral-500 font-bold">Castigo</span>
                            <span className="text-red-500 font-bold text-lg flex items-center gap-1">
                              <Wine size={14} /> {stakes.loseSips}
                            </span>
                            {isNegotiated && <span className="text-[9px] text-yellow-500 leading-none">(Fijo x2)</span>}
                            {partner && <span className="text-[9px] text-red-700 mt-0.5">Refusal: {Math.ceil(stakes.loseSips / 2)}</span>}
                          </motion.div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Acciones */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <Btn onClick={() => handleResult(true)} className="w-full bg-white text-black hover:bg-gray-100 py-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    <span className="flex items-center gap-2 text-lg"><Check className="text-green-600" strokeWidth={3} size={22} /> {drinkType ? 'Bebí / No aplica' : '¡Hecho!'}</span>
                    <span className="text-[10px] opacity-60">Ganar {stakes.win} pts</span>
                  </Btn>

                  <div className={`grid gap-2 ${partner ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <Btn onClick={() => handleResult(false)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 border border-neutral-700 h-[4.5rem]">
                      <Wine className="text-red-500" size={22} />
                      <span className="text-sm">{drinkType ? 'Me niego' : 'Castigo'}</span>
                      <span className="text-[10px] opacity-60 leading-tight">Beber {stakes.loseSips} sorbos</span>
                    </Btn>
                    {partner && (
                      <Btn onClick={handlePartnerRefusal} className="bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700/50 text-orange-200 p-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 h-[4.5rem]">
                        <ShieldX className="text-orange-500" size={22} />
                        <span className="text-sm">Se Opone</span>
                        <span className="text-[10px] opacity-60 leading-tight">{partner.name} toma {Math.ceil(stakes.loseSips / 2)}</span>
                      </Btn>
                    )}
                    <Btn
                      onClick={handleNegotiate}
                      disabled={isNegotiated}
                      className={`p-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 border h-[4.5rem] ${isNegotiated ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-indigo-900/40 hover:bg-indigo-900/60 border-indigo-500/30 text-indigo-200'}`}
                    >
                      <Shuffle size={22} className={isNegotiated ? 'text-neutral-600' : 'text-indigo-400'} />
                      <span className="text-sm">Negociar</span>
                      <span className="text-[10px] opacity-60 leading-tight">{isNegotiated ? 'Usado' : 'Más riesgo / Más puntos'}</span>
                    </Btn>
                  </div>
                </motion.div>

                {/* Ranking */}
                <motion.div variants={itemVariants} className="bg-black/40 rounded-xl p-3 border border-neutral-800/50">
                  <p className="text-xs text-neutral-500 uppercase font-bold mb-2 flex justify-between"><span>Ranking Actual</span><span>Sorbos</span></p>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {sorted.map((p, rank) => {
                      const active = p.name === me.name;
                      return (
                        <motion.div key={p.name} layout transition={spring} className="flex items-center gap-2">
                          <div className={`relative flex-1 h-6 rounded-full bg-neutral-800 overflow-hidden ${active ? 'ring-1 ring-red-500' : ''}`}>
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-700 to-purple-600"
                              initial={false}
                              animate={{ width: `${Math.max(3, Math.min(100, (p.score / WIN_SCORE) * 100))}%` }}
                              transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold">
                              <span className="truncate flex items-center gap-1.5">
                                {rank === 0 && p.score > 0 && <Crown size={12} className="text-yellow-400" />}
                                {p.name}
                              </span>
                              <span className="text-red-200 tabular-nums"><AnimatedNumber value={p.score} /></span>
                            </div>
                          </div>
                          <span className="w-7 text-right text-xs font-bold text-red-400 tabular-nums"><AnimatedNumber value={p.sips} /></span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* GANADOR */}
            {gameState === 'winner' && sorted.length > 0 && (
              <motion.div key="winner" variants={screenVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col items-center text-center gap-4 relative">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute bottom-24 w-1.5 h-1.5 rounded-full"
                    style={{ left: `${(i * 41) % 100}%`, background: ['#facc15', '#dc2626', '#9333ea'][i % 3] }}
                    animate={{ y: [0, -420 - (i % 5) * 60], opacity: [0, 1, 0] }}
                    transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, delay: (i % 9) * 0.25, ease: 'easeOut' }}
                  />
                ))}

                <motion.div variants={itemVariants} className="relative mt-2">
                  <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 animate-pulse" />
                  <motion.div animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                    <Trophy size={96} className="text-yellow-400 drop-shadow-2xl relative z-10" />
                  </motion.div>
                </motion.div>

                <motion.h2 variants={itemVariants} className="text-4xl font-black text-white">¡TENEMOS GANADOR!</motion.h2>
                <motion.p variants={itemVariants} className="text-lg text-neutral-400 -mt-2">El rey/reina de la fiesta es:</motion.p>

                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-10 py-3 rounded-full font-black text-3xl shadow-xl rotate-2"
                >
                  {sorted[0].name}
                </motion.div>

                {/* Podio */}
                <motion.div variants={itemVariants} className="flex items-end justify-center gap-2 h-32 w-full">
                  {[1, 0, 2].map((pos) => {
                    const p = sorted[pos];
                    if (!p) return null;
                    const h = [100, 76, 56][pos];
                    const tone = ['from-yellow-500 to-yellow-700', 'from-neutral-400 to-neutral-600', 'from-orange-600 to-orange-800'][pos];
                    return (
                      <div key={p.name} className="flex flex-col items-center w-24">
                        <span className="text-xs font-bold truncate max-w-full mb-1 text-neutral-300">{p.name}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.5 + pos * 0.2 }}
                          className={`w-full rounded-t-xl bg-gradient-to-b ${tone} flex items-start justify-center pt-2 font-black text-2xl text-black/80`}
                        >
                          {pos + 1}
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>

                <motion.div variants={itemVariants} className="w-full bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800">
                  <h3 className="text-lg font-bold mb-3 text-left flex items-center gap-2"><Wine size={18} /> Contador de Tragos (Castigos)</h3>
                  {sorted.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ ...spring, delay: 0.9 + i * 0.08 }}
                      className="flex justify-between py-2 border-b border-neutral-800 last:border-0"
                    >
                      <span>{p.name}</span>
                      <span className="text-red-400 font-bold">{p.sips} tragos · {p.score} pts</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Btn onClick={restartGame} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 flex items-center gap-2">
                    <RotateCcw size={20} /> Jugar de Nuevo
                  </Btn>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        `}</style>
      </div>
    </MotionConfig>
  );
};

export default App;
