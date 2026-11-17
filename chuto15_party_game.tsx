import React, { useState, useEffect, useRef } from 'react';
import { Flame, Wine, UserPlus, Play, RotateCcw, Trophy, X, Check, Heart, Crown, Sparkles, Shuffle, AlertTriangle, ShieldX } from 'lucide-react';

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
  { text: "Besa a {partner} donde él/ella elija.", intensity: "hard", points: 85 },
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

const App = () => {
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  
  // ESTADOS DE NEGOCIACIÓN Y PARTNER
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [negotiatedStakes, setNegotiatedStakes] = useState(null); 
  const [partnerPlayerIndex, setPartnerPlayerIndex] = useState(null); // Índice del partner aleatorio

  // --- LOGICA DE CONFIGURACIÓN ---
  const addPlayer = () => {
    if (newPlayerName.trim() !== '') {
      setPlayers([...players, { name: newPlayerName, score: 0, sips: 0 }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (index) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const startGame = () => {
    if (players.length < 2) return;
    setGameState('playing');
    // Para iniciar el juego, usamos el índice 0 y seleccionamos un reto y partner
    pickChallenge(0, players);
  };

  // --- LOGICA DE JUEGO ---
  const pickChallenge = (playerIdx, currentPlayers) => {
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null); // Resetear partner

    // 1. Elegir Reto
    const random = Math.floor(Math.random() * BASE_CHALLENGES.length);
    const selectedChallenge = BASE_CHALLENGES[random];
    setCurrentChallenge(selectedChallenge);

    // 2. Elegir Partner (Solo si el reto tiene el placeholder {partner})
    if (currentPlayers.length > 1 && selectedChallenge.text.includes("{partner}")) {
        let partnerIdx;
        do {
            partnerIdx = Math.floor(Math.random() * currentPlayers.length);
        } while (partnerIdx === playerIdx);
        setPartnerPlayerIndex(partnerIdx);
    }
  };

  // --- LÓGICA DE NEGOCIACIÓN ---
  const handleNegotiate = () => {
    if (!currentChallenge) return;

    // 1. STAKES FIJOS BASADOS EN LA PREGUNTA ORIGINAL
    const fixedPoints = Math.floor(currentChallenge.points * 1.5);
    
    // USAR NUEVA FUNCIÓN DE CÁLCULO DE SORBOS
    const currentSips = calculateSips(currentChallenge);
    const fixedSips = currentSips * 2; // Doble castigo al negociar

    setNegotiatedStakes({
      points: fixedPoints,
      sips: fixedSips
    });

    // 2. SELECCIONAR NUEVA PREGUNTA (CON PROBABILIDAD PONDERADA)
    const weightedIndices = [];
    BASE_CHALLENGES.forEach((challenge, index) => {
        if (challenge.text === currentChallenge.text) return;

        // Pesos: Hard=5, Medium=3, Soft=1
        let weight = 1;
        if (challenge.intensity === 'hard') weight = 5;
        else if (challenge.intensity === 'medium') weight = 3;
        else if (challenge.intensity === 'soft') weight = 1;

        for(let i = 0; i < weight; i++) {
            weightedIndices.push(index);
        }
    });

    const randomIndex = weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
    const newChallenge = BASE_CHALLENGES[randomIndex];
    setCurrentChallenge(newChallenge);
    setIsNegotiated(true);

    // Re-evaluar Partner si la nueva pregunta lo requiere y no tenemos uno
    if (players.length > 1 && newChallenge.text.includes("{partner}") && partnerPlayerIndex === null) {
        let partnerIdx;
        do {
            partnerIdx = Math.floor(Math.random() * players.length);
        } while (partnerIdx === currentPlayerIndex);
        setPartnerPlayerIndex(partnerIdx);
    } else if (!newChallenge.text.includes("{partner}")) {
        // Si la nueva no requiere partner, limpiamos
        setPartnerPlayerIndex(null);
    }
  };

  // --- NUEVA LÓGICA: PARTNER REFUSAL ---
  const handlePartnerRefusal = () => {
      const newPlayers = [...players];
      const player = newPlayers[currentPlayerIndex];
      const partner = newPlayers[partnerPlayerIndex];

      // Calcular stakes actuales (negociados o normales)
      let pointsTotal = 0;
      let sipsTotal = 0;

      if (isNegotiated && negotiatedStakes) {
        pointsTotal = negotiatedStakes.points;
        sipsTotal = negotiatedStakes.sips;
      } else {
        pointsTotal = currentChallenge.points;
        // USAR NUEVA FUNCIÓN
        sipsTotal = calculateSips(currentChallenge);
      }

      // Jugador gana mitad de puntos
      player.score += Math.floor(pointsTotal / 2);
      
      // Partner recibe mitad de sorbos
      partner.sips += Math.ceil(sipsTotal / 2);

      setPlayers(newPlayers);
      checkWinner(player);
      nextTurn(newPlayers);
  };

  const handleResult = (success) => {
    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIndex];
    
    let pointsToWin = 0;
    let sipsToLose = 0;

    if (isNegotiated && negotiatedStakes) {
      pointsToWin = negotiatedStakes.points;
      sipsToLose = negotiatedStakes.sips;
    } else {
      pointsToWin = currentChallenge.points;
      // USAR NUEVA FUNCIÓN
      sipsToLose = calculateSips(currentChallenge);
    }

    if (success) {
      player.score += pointsToWin;
      // NUEVO: Partner gana mitad de puntos si el reto fue exitoso
      if (partnerPlayerIndex !== null) {
          const partner = newPlayers[partnerPlayerIndex];
          partner.score += Math.floor(pointsToWin / 2);
      }
    } else {
      // CORRECCIÓN: ELIMINADA LA PENALIZACIÓN DE PUNTOS
      // player.score = Math.max(0, player.score - 10);
      player.sips += sipsToLose;
    }
    
    setPlayers(newPlayers);
    checkWinner(player);
    nextTurn(newPlayers);
  };

  const checkWinner = (player) => {
     if (player.score >= 400) {
        setGameState('winner');
     }
  };

  const nextTurn = (updatedPlayers) => {
    if (gameState === 'winner') return;
    const nextIndex = (currentPlayerIndex + 1) % updatedPlayers.length;
    setCurrentPlayerIndex(nextIndex);
    pickChallenge(nextIndex, updatedPlayers);
  };

  const restartGame = () => {
    setPlayers(players.map(p => ({ ...p, score: 0, sips: 0 })));
    setGameState('setup');
    setCurrentPlayerIndex(0);
    setIsNegotiated(false);
    setNegotiatedStakes(null);
    setPartnerPlayerIndex(null);
  };

  const getDisplayStakes = () => {
    if (isNegotiated && negotiatedStakes) {
      return {
        win: negotiatedStakes.points,
        loseSips: negotiatedStakes.sips,
        label: "DOBLE RIESGO (FIJO)"
      };
    }
    // USAR NUEVA FUNCIÓN PARA DISPLAY
    const normalSips = calculateSips(currentChallenge);
    return {
      win: currentChallenge ? currentChallenge.points : 0,
      loseSips: normalSips,
      label: "NORMAL"
    };
  };

  const stakes = getDisplayStakes();

  // Helper para renderizar el texto del reto con el nombre del partner
  const getChallengeText = () => {
    if (!currentChallenge) return "";
    
    // Si hay partner y el texto tiene el placeholder, lo reemplazamos
    if (partnerPlayerIndex !== null && currentChallenge.text.includes("{partner}")) {
        const partnerName = players[partnerPlayerIndex].name;
        return currentChallenge.text.replace("{partner}", partnerName);
    }
    
    return currentChallenge.text;
  };

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500 selection:text-white overflow-x-hidden">
      {/* Fondo Dinámico */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-900/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-4">
        
        {/* HEADER */}
        <header className="flex justify-center items-center py-6 mb-4">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] italic transform -skew-x-6">
            CHUTO<span className="text-white">15</span>
          </h1>
        </header>

        {/* PANTALLA DE SETUP */}
        {gameState === 'setup' && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-center text-red-400 flex items-center justify-center gap-2">
                <Flame size={20} /> Registro de Jugadores
              </h2>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Nombre..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors text-lg"
                />
                <button 
                  onClick={addPlayer}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-all active:scale-95"
                >
                  <UserPlus size={24} />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {players.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-neutral-800/50 p-3 rounded-lg border border-neutral-700/50">
                    <span className="font-medium text-lg">{p.name}</span>
                    <button onClick={() => removePlayer(i)} className="text-neutral-500 hover:text-red-500">
                      <X size={20} />
                    </button>
                  </div>
                ))}
                {players.length === 0 && <p className="text-center text-neutral-600 italic">Añade jugadores para empezar...</p>}
              </div>
            </div>

            {players.length >= 2 ? (
              <button 
                onClick={startGame}
                className="w-full bg-gradient-to-r from-red-600 to-purple-700 hover:from-red-500 hover:to-purple-600 text-white font-bold py-4 rounded-2xl text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 transition-all transform hover:scale-105"
              >
                <Play fill="currentColor" /> COMENZAR JUEGO
              </button>
            ) : (
                 <div className="text-center text-neutral-500 text-sm p-2">
                    Necesitas al menos 2 jugadores para la tensión
                 </div>
            )}
          </div>
        )}

        {/* PANTALLA DE JUEGO */}
        {gameState === 'playing' && currentChallenge && (
          <div className="flex-1 flex flex-col justify-between animate-in slide-in-from-bottom duration-500">
            
            {/* Barra Superior */}
            <div className="flex justify-between items-center bg-neutral-900/80 rounded-full px-4 py-2 border border-neutral-800 mb-6">
              <div className="flex flex-col">
                 <span className="text-sm text-neutral-400">Turno de:</span>
                 <span className="text-xl font-bold text-red-400 leading-none">{players[currentPlayerIndex].name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300 block">
                    Puntuación
                </span>
                <span className="text-lg font-bold text-white">{players[currentPlayerIndex].score} pts</span>
              </div>
            </div>

            {/* Tarjeta de Desafío */}
            <div className="relative group perspective mb-4">
              <div className={`absolute inset-0 bg-gradient-to-br ${
                  isNegotiated ? 'from-yellow-600 to-orange-600' :
                  'from-red-600 to-purple-600'
                } rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
              
              <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-red-500/30 p-6 md:p-8 rounded-3xl shadow-2xl text-center min-h-[280px] flex flex-col justify-center items-center gap-4">
                
                {/* Header de la Tarjeta */}
                <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-full ${
                        currentChallenge.intensity === 'hard' ? 'bg-red-500/20 text-red-500' : 
                        currentChallenge.intensity === 'medium' ? 'bg-purple-500/20 text-purple-500' : 
                        'bg-pink-500/20 text-pink-500'
                        }`}>
                        {currentChallenge.intensity === 'hard' ? <Flame size={20} fill="currentColor" /> : 
                        currentChallenge.intensity === 'medium' ? <Heart size={20} fill="currentColor" /> : 
                        <Sparkles size={20} />}
                        </div>
                        
                        {isNegotiated && (
                            <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50 animate-pulse">
                                <AlertTriangle size={12} /> RIESGO ACTIVO
                            </div>
                        )}
                </div>

                <div className="w-full">
                    <span className="uppercase tracking-widest text-xs font-bold text-neutral-500 mb-2 block">
                    {isNegotiated ? '⚠️ REGLAS NEGOCIADAS ⚠️' :
                        currentChallenge.intensity === 'hard' ? 'Prueba Extrema' : 
                        currentChallenge.intensity === 'medium' ? 'Nivel Medio' : 
                        'Para Calentar'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold leading-snug break-words">
                    {getChallengeText()}
                    </h3>
                </div>
                
                {/* STAKES DISPLAY */}
                <div className="flex gap-4 mt-2 w-full justify-center">
                    <div className="flex-1 bg-neutral-950/50 py-2 rounded-lg border border-neutral-800 flex flex-col items-center">
                        <span className="text-[10px] uppercase text-neutral-500 font-bold">Premio</span>
                        <div className="flex flex-col items-center">
                            <span className="text-green-400 font-bold text-lg">+{stakes.win} pts</span>
                            {isNegotiated && <span className="text-[9px] text-yellow-500 leading-none">(Fijo x1.5)</span>}
                            {partnerPlayerIndex !== null && <span className="text-[9px] text-green-600 mt-1">Partner: +{Math.floor(stakes.win/2)}</span>}
                        </div>
                    </div>
                    <div className="flex-1 bg-neutral-950/50 py-2 rounded-lg border border-neutral-800 flex flex-col items-center">
                        <span className="text-[10px] uppercase text-neutral-500 font-bold">Castigo</span>
                        <div className="flex flex-col items-center">
                            <span className="text-red-500 font-bold text-lg flex items-center gap-1">
                                <Wine size={14} /> {stakes.loseSips}
                            </span>
                            {isNegotiated && <span className="text-[9px] text-yellow-500 leading-none">(Fijo x2)</span>}
                            {partnerPlayerIndex !== null && <span className="text-[9px] text-red-700 mt-1">Refusal: {Math.ceil(stakes.loseSips/2)}</span>}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Acciones Principales */}
            <div className={`grid gap-2 mb-4 ${partnerPlayerIndex !== null ? 'grid-cols-2' : 'grid-cols-3'}`}>
            
                {/* BOTÓN CASTIGO (Acción directa) */}
                <button 
                    onClick={() => handleResult(false)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border border-neutral-700 transition-colors h-24"
                >
                    <Wine className="text-red-500" size={24} />
                    <span className="text-sm">Castigo</span>
                    <span className="text-[10px] opacity-60 text-center leading-tight">
                        Beber {stakes.loseSips} sorbos
                    </span>
                </button>

                {/* BOTÓN PARTNER REFUSAL (Solo si hay partner) */}
                {partnerPlayerIndex !== null && (
                    <button 
                        onClick={handlePartnerRefusal}
                        className="bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700/50 text-orange-200 p-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors h-24"
                    >
                        <ShieldX className="text-orange-500" size={24} />
                        <span className="text-sm">Se Opone</span>
                        <span className="text-[10px] opacity-60 text-center leading-tight">
                            {players[partnerPlayerIndex].name} tomará {Math.ceil(stakes.loseSips / 2)} sorbos
                        </span>
                    </button>
                )}

                {/* BOTÓN NEGOCIAR (REROLL) */}
                <button 
                    onClick={handleNegotiate}
                    disabled={isNegotiated} // Desactivado si ya se negoció
                    className={`p-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-colors h-24 ${
                        isNegotiated 
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                        : 'bg-indigo-900/40 hover:bg-indigo-900/60 border-indigo-500/30 text-indigo-200'
                    }`}
                >
                    <Shuffle size={24} className={isNegotiated ? "text-neutral-600" : "text-indigo-400"} />
                    <span className="text-sm">Negociar</span>
                    <span className="text-[10px] opacity-60 text-center leading-tight">
                        {isNegotiated ? "Usado" : "Más riesgo / Más puntos"}
                    </span>
                </button>

                {/* BOTÓN HECHO */}
                <button 
                    onClick={() => handleResult(true)}
                    className="bg-white text-black hover:bg-gray-100 p-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform active:scale-95 h-24"
                >
                    <Check className="text-green-600" strokeWidth={3} size={24} />
                    <span className="text-sm">¡Hecho!</span>
                    <span className="text-[10px] opacity-60 text-center leading-tight">
                        Ganar {stakes.win} pts
                    </span>
                </button>
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-black/40 rounded-xl p-4 border border-neutral-800/50">
              <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Ranking Actual</p>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center min-w-[60px]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i===0 ? 'bg-yellow-500 text-black' : 'bg-neutral-700'}`}>
                      {i === 0 ? <Crown size={14} /> : i+1}
                    </div>
                    <span className="text-xs truncate w-full text-center">{p.name}</span>
                    <span className="text-xs text-red-400 font-bold">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA DE GANADOR */}
        {gameState === 'winner' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-700">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-20 animate-pulse"></div>
              <Trophy size={100} className="text-yellow-400 drop-shadow-2xl relative z-10" />
            </div>
            
            <h2 className="text-4xl font-black text-white mb-2">¡TENEMOS GANADOR!</h2>
            <p className="text-xl text-neutral-400 mb-8">El rey/reina de la fiesta es:</p>
            
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-10 py-4 rounded-full font-black text-3xl shadow-xl transform scale-110 rotate-2 mb-12">
              {[...players].sort((a, b) => b.score - a.score)[0].name}
            </div>

            <div className="w-full bg-neutral-900/80 rounded-2xl p-6 mb-8 border border-neutral-800">
              <h3 className="text-lg font-bold mb-4 text-left flex items-center gap-2">
                <Wine size={18} /> Contador de Tragos (Castigos)
              </h3>
              {players.map((p, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-neutral-800 last:border-0">
                  <span>{p.name}</span>
                  <span className="text-red-400 font-bold">{p.sips} tragos</span>
                </div>
              ))}
            </div>

            <button 
              onClick={restartGame}
              className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={20} /> Jugar de Nuevo
            </button>
          </div>
        )}

      </div>
      
      {/* Estilos extra para scrollbar oculta pero funcional */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;