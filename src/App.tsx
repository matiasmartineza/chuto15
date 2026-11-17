import React, { useState, useEffect, useRef } from 'react';
import { Wine, UserPlus, Play, RotateCcw, Trophy, X, Check, Shuffle, AlertTriangle, ShieldX, Volume2, VolumeX, Timer } from 'lucide-react';
import Confetti from './Confetti.jsx';
import * as sfx from './sound.js';

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

const AVATARS = ['🦊', '🐙', '🦄', '🐸', '🐼', '🦁', '🐲', '🦖', '🐵', '🦩', '🐝', '👾'];
const COLORS = ['#ff3d81', '#00d4ff', '#ffd60a', '#7cff4d', '#b44dff', '#ff7a00', '#00ffb3', '#ff5252'];
const FLOATIES = ['🔥', '💋', '🍹', '✨', '😈', '🎉', '🥂', '💃', '🌶️', '💥', '🎲', '🍑'];
const TIMER_SECONDS = 15;

const INTENSITY = {
  soft: { label: 'Para calentar', emoji: '😉', grad: 'from-sky-500 via-blue-600 to-indigo-700', glow: '#38bdf8' },
  medium: { label: 'Nivel medio', emoji: '😈', grad: 'from-orange-500 via-pink-600 to-purple-700', glow: '#fb7185' },
  hard: { label: 'Prueba extrema', emoji: '🔥', grad: 'from-rose-600 via-red-600 to-fuchsia-800', glow: '#ff3d3d' },
};

const Btn = ({ c, d, t, className = '', children, ...rest }) => (
  <button
    {...rest}
    style={{ '--c': c, '--d': d, '--t': t }}
    className={`btn3d rounded-2xl flex flex-col items-center justify-center text-center ${className}`}
  >
    {children}
  </button>
);

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

  // ESTADOS VISUALES / SONIDO
  const [muted, setMuted] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [pops, setPops] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);

  // Multiplicador de probabilidad por reto (baja a 1/4 cada vez que sale)
  const repeatMultipliers = useRef(BASE_CHALLENGES.map(() => 1));
  const avatarSeed = useRef(0);
  const popId = useRef(0);
  const confettiRef = useRef(null);

  // --- EFECTOS VISUALES ---
  const addPop = (text, color, delay = 0) => {
    const id = popId.current++;
    setTimeout(() => {
      setPops((p) => [...p, { id, text, color }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1500);
    }, delay);
  };
  const vibrate = (pattern) => { if (!muted && navigator.vibrate) navigator.vibrate(pattern); };
  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 500); };
  const burstAt = (e, n = 80) => {
    const x = e && e.clientX ? e.clientX : window.innerWidth / 2;
    const y = e && e.clientY ? e.clientY : window.innerHeight / 2;
    confettiRef.current && confettiRef.current.burst(x, y, n);
  };
  const toggleMute = () => { sfx.setMuted(!muted); setMuted(!muted); if (muted) sfx.tap(); };

  // Temporizador de reto
  useEffect(() => { setTimerRunning(false); setTimeLeft(TIMER_SECONDS); }, [cardKey]);
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);
  useEffect(() => {
    if (!timerRunning) return;
    if (timeLeft <= 0) { setTimerRunning(false); sfx.buzzer(); vibrate([200, 80, 200]); shake(); }
    else if (timeLeft <= 5) sfx.tick();
  }, [timeLeft, timerRunning]);

  // Celebración al ganar
  useEffect(() => {
    if (gameState === 'winner') {
      sfx.win();
      confettiRef.current && confettiRef.current.rain(7000);
    }
  }, [gameState]);

  // --- LOGICA DE CONFIGURACIÓN ---
  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (name === '') return;
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setNameError('Ya hay un jugador con ese nombre.');
      sfx.refuse();
      return;
    }
    setNameError('');
    const seed = avatarSeed.current++;
    setPlayers([...players, {
      name, score: 0, sips: 0,
      emoji: AVATARS[seed % AVATARS.length],
      color: COLORS[seed % COLORS.length],
    }]);
    setNewPlayerName('');
    sfx.join();
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
    sfx.tap();
  };

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
    sfx.flip();

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

    sfx.negotiate();
    vibrate([60, 40, 60, 40, 120]);
    addPop('🎲 ¡DOBLE RIESGO!', '#ffd60a');
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
    sfx.refuse();
    vibrate([40, 30, 40]);
    addPop('🛡️ ¡SE OPONE!', '#ff9f1c');
    addPop(`${me.emoji} +${mine} ⭐`, '#7cff4d', 250);
    addPop(`${partner.emoji} bebe ${theirs} 🥃`, '#ff5c8a', 500);
    finishTurn(newPlayers);
  };

  const handleResult = (success, e) => {
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
      sfx.success();
      vibrate([30, 30, 80]);
      burstAt(e, 90);
      addPop(`${me.emoji} +${points} ⭐`, '#7cff4d');
      if (partnerPlayerIndex !== null) {
        addPop(`${players[partnerPlayerIndex].emoji} +${Math.floor(points / 2)} ⭐`, '#00d4ff', 300);
      }
    } else {
      sfx.fail();
      vibrate([200, 60, 200]);
      shake();
      addPop(`${me.emoji} bebe ${sips} 🥃`, '#ff5c8a');
    }
    finishTurn(newPlayers);
  };

  const nextTurn = (updatedPlayers) => {
    const nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
    setCurrentPlayerIndex(nextIndex);
    pickChallenge(nextIndex, updatedPlayers);
  };

  const restartGame = () => {
    sfx.tap();
    setPlayers(players.map((p) => ({ ...p, score: 0, sips: 0 })));
    setGameState('setup');
    setCurrentPlayerIndex(0);
    setCurrentChallenge(null);
    repeatMultipliers.current = BASE_CHALLENGES.map(() => 1);
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
  };

  const getDisplayStakes = () => {
    if (isNegotiated && negotiatedStakes) {
      return { win: negotiatedStakes.points, loseSips: negotiatedStakes.sips };
    }
    return {
      win: currentChallenge ? currentChallenge.points : 0,
      loseSips: calculateSips(currentChallenge),
    };
  };

  const stakes = getDisplayStakes();
  const drinkType = isDrinkChallenge(currentChallenge);
  const level = currentChallenge ? INTENSITY[currentChallenge.intensity] : INTENSITY.soft;
  const me = players[currentPlayerIndex];
  const partner = partnerPlayerIndex !== null ? players[partnerPlayerIndex] : null;

  // Texto del reto con el nombre del partner resaltado
  const renderChallengeText = () => {
    if (!currentChallenge) return null;
    const parts = currentChallenge.text.split('{partner}');
    if (!partner) return parts.join('');
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <span
            className="inline-block px-2 mx-0.5 rounded-lg text-black wobble"
            style={{ background: partner.color }}
          >
            {partner.emoji} {partner.name}
          </span>
        )}
      </React.Fragment>
    ));
  };

  const sorted = [...players].sort((a, b) => b.score - a.score);

  // --- RENDERIZADO ---
  return (
    <div className={`min-h-screen bg-live text-white overflow-x-hidden relative ${shaking ? 'shake' : ''}`}>
      <Confetti ref={confettiRef} />

      {/* Fondo vivo */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="blob w-80 h-80 bg-pink-500 -top-20 -left-20" />
        <div className="blob w-96 h-96 bg-cyan-400 top-1/3 -right-32" style={{ animationDelay: '-4s' }} />
        <div className="blob w-72 h-72 bg-yellow-400 bottom-0 left-1/4" style={{ animationDelay: '-8s' }} />
        {FLOATIES.map((f, i) => (
          <span
            key={i}
            className="floaty"
            style={{ left: `${(i * 8.7) % 96}%`, animationDuration: `${14 + (i % 5) * 4}s`, animationDelay: `${-i * 2.3}s` }}
          >{f}</span>
        ))}
      </div>

      {/* Popups flotantes */}
      <div className="fixed inset-x-0 top-[28%] z-40 flex flex-col items-center gap-2 pointer-events-none">
        {pops.map((p) => (
          <div
            key={p.id}
            className="pop-up font-display text-2xl sm:text-3xl px-4 py-1 rounded-full bg-black/70 border-2"
            style={{ color: p.color, borderColor: p.color, textShadow: `0 0 14px ${p.color}` }}
          >{p.text}</div>
        ))}
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-4">

        {/* HEADER */}
        <header className="flex justify-between items-center py-3 mb-2">
          <div className="w-10" />
          <h1 className="font-display text-4xl tracking-wide select-none" aria-label="Chuto 15">
            {'CHUTO'.split('').map((l, i) => (
              <span key={i} className="letter rainbow-text" style={{ animationDelay: `${i * 0.12}s` }}>{l}</span>
            ))}
            <span className="letter text-white text-outline wobble" style={{ animationDelay: '.7s' }}>15</span>
          </h1>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </header>

        {/* AVISO +18 */}
        {gameState === 'consent' && (
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="pop-in bg-black/40 backdrop-blur-md border-2 border-pink-400/60 rounded-3xl p-6 text-center shadow-[0_0_40px_rgba(255,61,129,.35)]">
              <div className="text-7xl wobble inline-block mb-2">🔞</div>
              <h2 className="font-display text-3xl text-pink-300 mb-4">Solo adultos</h2>
              <ul className="text-white/90 text-base space-y-2 text-left">
                <li>🍻 Retos sexuales y de beber alcohol.</li>
                <li>🪪 Solo para mayores de 18 años.</li>
                <li>🤝 Todos tienen que estar de acuerdo en jugar.</li>
                <li>🙅 Cualquiera puede negarse a un reto, sin presión.</li>
                <li>🚕 Toma con moderación y no conduzcas.</li>
              </ul>
            </div>
            <Btn
              c="#ff3d81" d="#a3004a"
              onClick={() => { sfx.unlock(); sfx.success(); setGameState('setup'); }}
              className="pulse-big w-full py-5 text-xl"
            >
              Soy mayor de 18 y todos aceptamos jugar
            </Btn>
          </div>
        )}

        {/* SETUP */}
        {gameState === 'setup' && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="pop-in bg-black/35 backdrop-blur-md border-2 border-cyan-300/50 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,212,255,.25)]">
              <h2 className="font-display text-2xl text-cyan-300 mb-4 text-center flex items-center justify-center gap-2">
                <span className="bounce-y inline-block">🎤</span> ¿Quiénes juegan?
              </h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Escribe un nombre…"
                  maxLength={16}
                  className="flex-1 min-w-0 bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-lg placeholder:text-white/40 focus:outline-none focus:border-cyan-300 transition-colors"
                />
                <Btn c="#00d4ff" d="#007a99" t="#00212b" onClick={addPlayer} aria-label="Añadir jugador" className="w-14">
                  <UserPlus size={26} />
                </Btn>
              </div>
              {nameError && <p className="text-pink-300 text-sm mb-2">{nameError}</p>}

              <div className="flex flex-wrap gap-2 mt-4 min-h-[56px]">
                {players.map((p, i) => (
                  <div
                    key={p.name}
                    className="pop-in flex items-center gap-2 pl-2 pr-1 py-1 rounded-full text-black font-bold"
                    style={{ background: p.color, animationDelay: `${i * 0.03}s` }}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-lg">{p.name}</span>
                    <button onClick={() => removePlayer(i)} aria-label={`Quitar a ${p.name}`} className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {players.length === 0 && <p className="text-white/50 italic m-auto">Añade jugadores para empezar…</p>}
              </div>
            </div>

            {players.length >= 2 ? (
              <Btn c="#7cff4d" d="#2f9a00" t="#10300a" onClick={() => { sfx.unlock(); startGame(); }} className="pulse-big w-full py-5 text-2xl font-display">
                <span className="flex items-center gap-3"><Play fill="currentColor" /> ¡A JUGAR!</span>
              </Btn>
            ) : (
              <div className="text-center text-white/60 text-sm p-2">Necesitas al menos 2 jugadores para la tensión 😏</div>
            )}
          </div>
        )}

        {/* JUEGO */}
        {gameState === 'playing' && currentChallenge && me && (
          <div className="flex-1 flex flex-col gap-2.5">

            {/* Carrera hacia 400 */}
            <div className="bg-black/35 backdrop-blur-sm rounded-2xl p-2 border border-white/15">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-white/60 px-1 mb-1">
                <span>🏁 Carrera a {WIN_SCORE}</span>
                <span>🥃 sorbos</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {players.map((p, i) => {
                  const pct = Math.min(100, (p.score / WIN_SCORE) * 100);
                  const active = i === currentPlayerIndex;
                  return (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className={`relative flex-1 h-7 rounded-full bg-white/10 overflow-hidden ${active ? 'ring-2 ring-white lane-active' : ''}`}>
                        <div
                          className="lane-fill absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-1"
                          style={{ width: `max(${pct}%, 2rem)`, background: `linear-gradient(90deg, ${p.color}55, ${p.color})` }}
                        >
                          <span className="text-lg leading-none">{p.emoji}</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-sm font-bold text-outline pointer-events-none">
                          <span className="truncate">{p.name}</span>
                          <span>{p.score}</span>
                        </div>
                      </div>
                      <span className="w-9 text-right text-sm font-bold text-pink-300">{p.sips}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turno */}
            <div key={`turn-${currentPlayerIndex}-${cardKey}`} className="slam flex items-center justify-center gap-3">
              <span className="text-4xl bounce-y">{me.emoji}</span>
              <div className="leading-none">
                <div className="text-xs uppercase tracking-[0.25em] text-white/70 font-bold">Turno de</div>
                <div className="font-display text-2xl text-outline" style={{ color: me.color }}>{me.name}</div>
              </div>
            </div>

            {/* Tarjeta del reto */}
            <div key={cardKey} className="card-flip">
              <div
                className="rounded-[2rem] p-[3px]"
                style={{
                  background: isNegotiated
                    ? 'linear-gradient(135deg,#fde047,#fb923c,#ef4444)'
                    : 'linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,.1))',
                  boxShadow: `0 0 45px ${isNegotiated ? '#fbbf24' : level.glow}99`,
                }}
              >
                <div className={`relative overflow-hidden shine rounded-[1.9rem] bg-gradient-to-br ${level.grad} ${isNegotiated ? 'hazard' : ''} px-5 py-5 min-h-[190px] flex flex-col items-center justify-center text-center gap-2`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-1 bg-black/35 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest">
                      {drinkType ? '🍻 Bebe o no' : `${level.emoji} ${level.label}`}
                    </span>
                    {isNegotiated && (
                      <span className="inline-flex items-center gap-1 bg-yellow-300 text-black rounded-full px-3 py-1 text-xs font-extrabold pulse-big">
                        <AlertTriangle size={13} /> RIESGO x2
                      </span>
                    )}
                  </div>

                  <div className="text-5xl wobble drop-shadow-lg leading-none">{drinkType ? '🍻' : level.emoji}</div>

                  <h3 className="text-xl sm:text-2xl font-bold leading-snug text-outline break-words">
                    {renderChallengeText()}
                  </h3>

                  <div className="flex gap-3 w-full justify-center mt-1">
                    <div className="flex-1 bg-black/40 rounded-2xl py-2 border border-lime-300/50">
                      <div className="text-[10px] uppercase font-bold text-lime-200/80">Premio</div>
                      <div className="font-display text-xl text-lime-300">⭐ +{stakes.win}</div>
                      {partner && <div className="text-[10px] text-lime-100/80">{partner.emoji} +{Math.floor(stakes.win / 2)}</div>}
                    </div>
                    <div className="flex-1 bg-black/40 rounded-2xl py-2 border border-pink-300/50">
                      <div className="text-[10px] uppercase font-bold text-pink-200/80">Castigo</div>
                      <div className="font-display text-xl text-pink-300">🥃 {stakes.loseSips}</div>
                      {partner && <div className="text-[10px] text-pink-100/80">si se opone: {Math.ceil(stakes.loseSips / 2)}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Temporizador */}
            <button
              onClick={() => { sfx.tap(); if (timerRunning) { setTimerRunning(false); setTimeLeft(TIMER_SECONDS); } else { setTimeLeft(TIMER_SECONDS); setTimerRunning(true); } }}
              className="relative h-9 rounded-full bg-white/10 border border-white/20 overflow-hidden font-bold text-sm"
            >
              <div
                className="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear"
                style={{
                  width: timerRunning ? `${(Math.max(timeLeft, 0) / TIMER_SECONDS) * 100}%` : '0%',
                  background: timeLeft <= 5 ? '#ff3d3d' : 'linear-gradient(90deg,#00d4ff,#7cff4d)',
                }}
              />
              <span className="relative flex items-center justify-center gap-2 text-outline">
                <Timer size={16} />
                {timerRunning ? `${Math.max(timeLeft, 0)} s (toca para parar)` : `¡Cuenta atrás de ${TIMER_SECONDS} s!`}
              </span>
            </button>

            {/* Acciones */}
            <div className="flex flex-col gap-3 mt-1 pb-2">
              <Btn c="#7cff4d" d="#2f9a00" t="#0d2b06" onClick={(e) => handleResult(true, e)} className="w-full py-3">
                <span className="flex items-center gap-2 font-display text-2xl"><Check strokeWidth={4} /> {drinkType ? 'BEBÍ / NO APLICA' : '¡HECHO!'}</span>
                <span className="text-xs opacity-80">Ganas {stakes.win} ⭐</span>
              </Btn>

              <div className={`grid gap-3 ${partner ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <Btn c="#ff3d81" d="#a3004a" onClick={(e) => handleResult(false, e)} className="h-20 px-1">
                  <Wine size={24} />
                  <span className="text-sm">{drinkType ? 'Me niego' : 'Castigo'}</span>
                  <span className="text-[10px] opacity-80 leading-tight">Bebes {stakes.loseSips} 🥃</span>
                </Btn>

                {partner && (
                  <Btn c="#ff9f1c" d="#a35a00" t="#2b1600" onClick={handlePartnerRefusal} className="h-20 px-1">
                    <ShieldX size={24} />
                    <span className="text-sm">Se opone</span>
                    <span className="text-[10px] opacity-80 leading-tight">{partner.name} bebe {Math.ceil(stakes.loseSips / 2)}</span>
                  </Btn>
                )}

                <Btn c="#8b5cf6" d="#4c1d95" onClick={handleNegotiate} disabled={isNegotiated} className="h-20 px-1">
                  <Shuffle size={24} />
                  <span className="text-sm">Negociar</span>
                  <span className="text-[10px] opacity-80 leading-tight">{isNegotiated ? 'Ya usado' : '¡Más riesgo, más puntos!'}</span>
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* GANADOR */}
        {gameState === 'winner' && sorted.length > 0 && (
          <div className="flex-1 flex flex-col items-center text-center gap-5 py-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl bg-yellow-300/50 pulse-big" />
              <Trophy size={110} className="relative text-yellow-300 bounce-y drop-shadow-[0_0_20px_rgba(253,224,71,.9)]" />
            </div>

            <h2 className="font-display text-4xl rainbow-text slam">¡TENEMOS GANADOR!</h2>

            <div
              className="pop-in font-display text-4xl px-8 py-3 rounded-full text-black shadow-2xl rotate-2 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, #fde047, ${sorted[0].color})` }}
            >
              <span className="text-5xl wobble">{sorted[0].emoji}</span> {sorted[0].name}
            </div>

            <div className="w-full bg-black/40 backdrop-blur-md rounded-3xl p-4 border-2 border-white/15">
              <h3 className="font-display text-xl mb-3 text-pink-300">🥇 Podio y tragos 🥃</h3>
              <div className="space-y-2">
                {sorted.map((p, i) => (
                  <div
                    key={p.name}
                    className="pop-in flex items-center justify-between rounded-2xl px-3 py-2 font-bold"
                    style={{ background: `${p.color}33`, border: `2px solid ${p.color}`, animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-7 text-xl">{['🥇', '🥈', '🥉'][i] || `${i + 1}º`}</span>
                      <span className="text-xl">{p.emoji}</span> {p.name}
                    </span>
                    <span className="text-right text-sm leading-tight">
                      <span className="block text-lime-300">⭐ {p.score}</span>
                      <span className="block text-pink-300">🥃 {p.sips}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Btn c="#00d4ff" d="#007a99" t="#00212b" onClick={restartGame} className="pulse-big w-full py-4 text-xl">
              <span className="flex items-center gap-2"><RotateCcw size={22} /> Jugar de nuevo</span>
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
