// Motor del juego: estado serializable + reductor.
// En partida local lo usa el único teléfono; en online solo lo ejecuta el
// anfitrión y envía el estado resultante a los demás.
import { DECKS } from './decks.js';

export const WIN_SCORE = 400;
export const REPEAT_DECAY = 1 / 4; // cada vez que sale un reto, su probabilidad se multiplica por 1/4
export const LEVEL_LABELS = { soft: 'Para calentar', medium: 'Nivel medio', hard: 'Prueba extrema' };

// Sorbos según intensidad y puntos
export const calculateSips = (challenge) => {
  if (!challenge) return 0;
  if (challenge.intensity === 'soft') return challenge.points >= 25 ? 2 : 1;
  if (challenge.intensity === 'medium') return challenge.points >= 55 ? 3 : 2;
  if (challenge.points >= 95) return 5;
  if (challenge.points >= 80) return 4;
  return 3;
};

// Retos de tipo "bebe si..." / "todos los que..." (se cumplen bebiendo o no aplican)
export const isDrinkChallenge = (challenge) => !!challenge && /^(bebe si|todos los)/i.test(challenge.text);

const weightedPick = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
};

const pickPartnerIndex = (count, exclude) => {
  let idx;
  do idx = Math.floor(Math.random() * count);
  while (idx === exclude);
  return idx;
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const challengesOf = (state) => DECKS[state.deckId].challenges;
export const isTrivia = (state) => !!state && DECKS[state.deckId].kind === 'trivia';
const levelLabel = (deckId, intensity) => (DECKS[deckId].levelLabels || LEVEL_LABELS)[intensity];
export const currentChallenge = (state) =>
  state && state.challengeIdx != null ? challengesOf(state)[state.challengeIdx] : null;

export const getStakes = (state) => {
  const c = currentChallenge(state);
  if (!c) return { points: 0, sips: 0 };
  if (state.negotiated) return { points: Math.floor(c.points * 1.5), sips: calculateSips(c) * 2 };
  return { points: c.points, sips: calculateSips(c) };
};

// Saca una carta nueva para el jugador indicado
const draw = (state, playerIdx) => {
  const weights = state.weights.slice();
  const idx = weightedPick(weights);
  weights[idx] *= REPEAT_DECAY;
  const c = challengesOf(state)[idx];
  return {
    ...state,
    weights,
    current: playerIdx,
    challengeIdx: idx,
    partner: state.players.length > 1 && c.text.includes('{partner}') ? pickPartnerIndex(state.players.length, playerIdx) : null,
    negotiated: false,
    revealed: false,
    cardKey: state.cardKey + 1,
    verdict: null,
  };
};

export const createLobby = (deckId, names = []) => ({
  phase: 'lobby',
  deckId,
  players: names.map((name) => ({ name, score: 0, sips: 0 })),
});

export const startGame = (lobby) => {
  const base = {
    phase: 'playing',
    deckId: lobby.deckId,
    players: lobby.players.map((p) => ({ name: p.name, score: 0, sips: 0 })),
    weights: DECKS[lobby.deckId].challenges.map(() => 1),
    cardKey: 0,
    exitType: 'done',
    verdict: null,
    toast: null,
    current: 0,
    challengeIdx: null,
    partner: null,
    negotiated: false,
  };
  return draw(base, 0);
};

// ¿Quién puede hacer cada acción? (solo importa en online)
export const canAct = (state, action, actorName) => {
  if (!state || state.phase !== 'playing') return action.type === 'restart';
  const cur = state.players[state.current];
  const partner = state.partner != null ? state.players[state.partner] : null;
  switch (action.type) {
    case 'refuse':
      return !!partner && partner.name === actorName && !state.verdict;
    case 'done':
    case 'fail':
    case 'negotiate':
    case 'reveal':
      return cur.name === actorName && !state.verdict;
    case 'continue':
      return cur.name === actorName && !!state.verdict;
    default:
      return false;
  }
};

const pointsRow = (p, amount) => ({
  icon: 'star', name: p.name, amount: `+${amount} pts`, total: `${p.score} pts en total`, color: '#4ade80',
});
const sipsRow = (p, amount) => ({
  icon: 'wine', name: p.name, amount: `Bebe ${amount}`, total: `${plural(p.sips, 'sorbo', 'sorbos')} en total`, color: '#f87171',
});

const resolve = (state, players, kind, label, title, rows) => {
  const leaders = players.filter((p) => p.score >= WIN_SCORE).sort((a, b) => b.score - a.score);
  return {
    ...state,
    players,
    verdict: {
      key: state.cardKey,
      kind,
      label,
      title,
      rows,
      note: isTrivia(state)
        ? `Respuesta: ${currentChallenge(state).answer}`
        : state.negotiated ? 'Apuesta negociada · premio ×1.5 · castigo ×2' : null,
      winnerName: leaders.length ? leaders[0].name : null,
      gameOver: leaders.length > 0,
    },
  };
};

export const reduce = (state, action) => {
  if (action.type === 'restart') return createLobby(state.deckId, state.players.map((p) => p.name));
  if (state.phase !== 'playing') return state;

  const c = currentChallenge(state);
  const { points, sips } = getStakes(state);
  const cur = state.current;
  const partner = state.partner;

  const trivia = isTrivia(state);

  switch (action.type) {
    case 'reveal':
      return state.verdict ? state : { ...state, revealed: true };
    case 'done': {
      if (state.verdict) return state;
      const players = state.players.map((p, i) => {
        if (i === cur) return { ...p, score: p.score + points };
        if (i === partner) return { ...p, score: p.score + Math.floor(points / 2) };
        return p;
      });
      const me = players[cur];
      const rows = [pointsRow(me, points)];
      if (partner != null) rows.push(pointsRow(players[partner], Math.floor(points / 2)));
      const drink = isDrinkChallenge(c);
      if (trivia) return resolve(state, players, 'done', 'Respuesta correcta', `¡Bien, ${me.name}!`, rows);
      return resolve(state, players, 'done', 'Reto cumplido', drink ? `¡Salud, ${me.name}!` : `¡Bien hecho, ${me.name}!`, rows);
    }
    case 'fail': {
      if (state.verdict) return state;
      const players = state.players.map((p, i) => (i === cur ? { ...p, sips: p.sips + sips } : p));
      const me = players[cur];
      const drink = isDrinkChallenge(c);
      if (trivia) return resolve(state, players, 'fail', 'Incorrecto', `${me.name} no la sabía`, [sipsRow(me, sips)]);
      return resolve(state, players, 'fail', 'Castigo', drink ? `${me.name} se negó` : `${me.name} no se atrevió`, [sipsRow(me, sips)]);
    }
    case 'refuse': {
      if (state.verdict || partner == null) return state;
      const mine = Math.floor(points / 2);
      const theirs = Math.ceil(sips / 2);
      const players = state.players.map((p, i) => {
        if (i === cur) return { ...p, score: p.score + mine };
        if (i === partner) return { ...p, sips: p.sips + theirs };
        return p;
      });
      return resolve(state, players, 'refuse', 'Se opone', `${players[partner].name} dijo que no`, [
        pointsRow(players[cur], mine),
        sipsRow(players[partner], theirs),
      ]);
    }
    case 'negotiate': {
      if (state.verdict || state.negotiated) return state;
      // Pesos: Hard=5, Medium=3, Soft=1, multiplicados por el decaimiento de repetición
      const list = challengesOf(state);
      const weights = state.weights.slice();
      const w = list.map((ch, i) => {
        if (i === state.challengeIdx) return 0;
        const base = ch.intensity === 'hard' ? 5 : ch.intensity === 'medium' ? 3 : 1;
        return base * weights[i];
      });
      const idx = weightedPick(w);
      weights[idx] *= REPEAT_DECAY;
      const next = list[idx];
      let newPartner = partner;
      if (next.text.includes('{partner}')) {
        if (newPartner == null && state.players.length > 1) newPartner = pickPartnerIndex(state.players.length, cur);
      } else newPartner = null;
      return {
        ...state,
        weights,
        challengeIdx: idx,
        partner: newPartner,
        negotiated: true,
        revealed: false,
        exitType: 'swap',
        cardKey: state.cardKey + 1,
        toast: { id: state.cardKey + 1, text: 'Doble riesgo' },
      };
    }
    case 'skip': {
      // Solo el anfitrión (se valida en App): pasa al siguiente sin puntos ni sorbos
      if (state.verdict) return reduce(state, { type: 'continue' });
      const nextIdx = (cur + 1) % state.players.length;
      return draw({ ...state, exitType: 'fail', throwDir: null }, nextIdx);
    }
    case 'continue': {
      if (!state.verdict) return state;
      const exitType = action.exit || state.verdict.kind;
      if (state.verdict.gameOver) return { ...state, phase: 'winner', exitType, verdict: null, throwDir: action.dir || null };
      const nextIdx = (cur + 1) % state.players.length;
      return draw({ ...state, exitType, throwDir: action.dir || null }, nextIdx);
    }
    default:
      return state;
  }
};

// Datos de la carta que dibuja la escena 3D
export const cardView = (state) => {
  const c = currentChallenge(state);
  if (!c || state.phase !== 'playing') return null;
  const partner = state.partner != null ? state.players[state.partner] : null;
  const { points, sips } = getStakes(state);
  const tokens = [];
  const parts = c.text.split('{partner}');
  parts.forEach((part, i) => {
    part.split(' ').filter(Boolean).forEach((t) => tokens.push({ t }));
    if (i < parts.length - 1) tokens.push({ t: partner ? partner.name : 'alguien', partner: true });
  });
  return {
    key: state.cardKey,
    deckId: state.deckId,
    intensity: c.intensity,
    negotiated: state.negotiated,
    label: state.negotiated ? 'Negociado' : isDrinkChallenge(c) ? 'Bebe o no' : levelLabel(state.deckId, c.intensity),
    tokens,
    win: points,
    sips,
    partnerName: partner ? partner.name : null,
    partnerWin: Math.floor(points / 2),
    refuseSips: Math.ceil(sips / 2),
  };
};

export const plainChallengeText = (state) => {
  const c = currentChallenge(state);
  if (!c) return '';
  const partner = state.partner != null ? state.players[state.partner] : null;
  return c.text.split('{partner}').join(partner ? partner.name : 'alguien');
};
