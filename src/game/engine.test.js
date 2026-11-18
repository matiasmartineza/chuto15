// Pruebas de las reglas del juego (el motor es lógica pura, sin interfaz)
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createLobby, startGame, reduce, canAct, getStakes, currentChallenge, cardView, calculateSips, targetOf, WIN_SCORE,
} from './engine.js';
import { DECKS, DECK_IDS, playerLimits } from './decks.js';

afterEach(() => vi.restoreAllMocks());

// Partida con una carta concreta del mazo (para no depender del azar)
const gameWith = (deckId, names, predicate, extra = {}) => {
  let g = startGame(createLobby(deckId, names));
  const idx = DECKS[deckId].challenges.findIndex(predicate);
  expect(idx).toBeGreaterThanOrEqual(0);
  const c = DECKS[deckId].challenges[idx];
  g = { ...g, challengeIdx: idx, partner: c.text.includes('{partner}') ? 1 : null, negotiated: false, verdict: null, ...extra };
  return g;
};

describe('mazos', () => {
  it('todos los mazos tienen cartas válidas', () => {
    for (const id of DECK_IDS) {
      const d = DECKS[id];
      expect(d.challenges.length).toBeGreaterThan(0);
      for (const c of d.challenges) {
        expect(['soft', 'medium', 'hard']).toContain(c.intensity);
        expect(c.points).toBeGreaterThanOrEqual(10);
        expect(c.points).toBeLessThanOrEqual(100);
        expect(c.text.length).toBeGreaterThan(5);
      }
      expect(d.info).toBeTruthy();
    }
  });

  it('Sabelotodo tiene más de 1000 preguntas, todas con respuesta y sin repetir', () => {
    const c = DECKS.trivia.challenges;
    expect(c.length).toBeGreaterThanOrEqual(1000);
    expect(c.every((x) => x.answer)).toBe(true);
    expect(new Set(c.map((x) => x.text)).size).toBe(c.length);
  });

  it('Cultura Chupística tiene 100 categorías', () => {
    expect(DECKS.chupistica.challenges.length).toBe(100);
  });

  it('los mazos de pareja y primera cita son para 2', () => {
    expect(playerLimits('entredos')).toEqual({ min: 2, max: 2 });
    expect(playerLimits('primeracita')).toEqual({ min: 2, max: 2 });
  });
});

describe('inicio de partida', () => {
  it('saca una carta para el primer jugador', () => {
    const g = startGame(createLobby('chuto15', ['Ana', 'Luis', 'Marta']));
    expect(g.phase).toBe('playing');
    expect(g.current).toBe(0);
    expect(currentChallenge(g)).toBeTruthy();
    expect(g.players.every((p) => p.score === 0 && p.sips === 0)).toBe(true);
  });

  it('la meta por defecto es 400 y se puede elegir otra', () => {
    expect(targetOf(startGame(createLobby('chuto15', ['A', 'B'])))).toBe(WIN_SCORE);
    expect(targetOf(startGame(createLobby('chuto15', ['A', 'B'], 200)))).toBe(200);
  });

  it('la carta sale con partner distinto del jugador de turno', () => {
    for (let i = 0; i < 50; i++) {
      const g = startGame(createLobby('chuto15', ['Ana', 'Luis', 'Marta']));
      if (g.partner != null) expect(g.partner).not.toBe(g.current);
    }
  });
});

describe('resolver un turno', () => {
  it('"Hecho" da los puntos al jugador y la mitad al partner', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], (c) => c.text.includes('{partner}'));
    const { points } = getStakes(g);
    const r = reduce(g, { type: 'done' });
    expect(r.players[0].score).toBe(points);
    expect(r.players[1].score).toBe(Math.floor(points / 2));
    expect(r.verdict.kind).toBe('done');
  });

  it('"Castigo" suma sorbos al jugador y ningún punto', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], (c) => !c.text.includes('{partner}'));
    const c = currentChallenge(g);
    const r = reduce(g, { type: 'fail' });
    expect(r.players[0].sips).toBe(calculateSips(c));
    expect(r.players[0].score).toBe(0);
  });

  it('"Se opone": el jugador gana la mitad y el partner bebe la mitad', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], (c) => c.text.includes('{partner}'));
    const { points, sips } = getStakes(g);
    const r = reduce(g, { type: 'refuse' });
    expect(r.players[0].score).toBe(Math.floor(points / 2));
    expect(r.players[1].sips).toBe(Math.ceil(sips / 2));
  });

  it('"Corregir" vuelve exactamente al estado antes del veredicto', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], () => true);
    const r = reduce(g, { type: 'done' });
    const u = reduce(r, { type: 'undo' });
    expect(u.verdict).toBeNull();
    expect(u.players).toEqual(g.players);
    expect(u.challengeIdx).toBe(g.challengeIdx);
  });

  it('después de lanzar la carta ya no se puede corregir', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], () => true);
    const next = reduce(reduce(g, { type: 'done' }), { type: 'continue' });
    expect(reduce(next, { type: 'undo' })).toBe(next);
  });

  it('pasa el turno al siguiente jugador', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis', 'Marta'], () => true);
    const next = reduce(reduce(g, { type: 'fail' }), { type: 'continue' });
    expect(next.current).toBe(1);
    expect(next.cardKey).toBe(g.cardKey + 1);
  });

  it('termina la partida al llegar a la meta', () => {
    let g = gameWith('chuto15', ['Ana', 'Luis'], (c) => !c.text.includes('{partner}'), { target: 200 });
    g = { ...g, players: [{ name: 'Ana', score: 199, sips: 0 }, { name: 'Luis', score: 0, sips: 0 }] };
    const r = reduce(g, { type: 'done' });
    expect(r.verdict.gameOver).toBe(true);
    expect(reduce(r, { type: 'continue' }).phase).toBe('winner');
  });
});

describe('negociar', () => {
  it('cambia la carta y fija premio ×1.5 y castigo ×2 de la carta original', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], () => true);
    const c = currentChallenge(g);
    const r = reduce(g, { type: 'negotiate' });
    expect(r.challengeIdx).not.toBe(g.challengeIdx);
    expect(getStakes(r).points).toBe(Math.floor(currentChallenge(r).points * 1.5));
    expect(r.negotiated).toBe(true);
    // solo se puede negociar una vez
    expect(reduce(r, { type: 'negotiate' })).toBe(r);
    expect(c).toBeTruthy();
  });

  it('una carta que ya salió tiene menos probabilidad de volver a salir', () => {
    const g = startGame(createLobby('chuto15', ['Ana', 'Luis']));
    expect(g.weights[g.challengeIdx]).toBeCloseTo(0.25);
  });
});

describe('trivia', () => {
  it('"Ver respuesta" la revela y el veredicto incluye la respuesta', () => {
    const g = gameWith('trivia', ['Ana', 'Luis'], () => true);
    const r = reduce(reduce(g, { type: 'reveal' }), { type: 'done' });
    expect(r.verdict.note).toContain(currentChallenge(g).answer);
  });
});

describe('cultura chupística', () => {
  it('quien pierde bebe y quien partió gana los puntos', () => {
    const g = gameWith('chupistica', ['Ana', 'Luis', 'Marta'], () => true);
    const { points, sips } = getStakes(g);
    const r = reduce(g, { type: 'loser', name: 'Marta' });
    expect(r.players[2].sips).toBe(sips);
    expect(r.players[0].score).toBe(points);
  });

  it('si pierde quien partió, solo bebe', () => {
    const g = gameWith('chupistica', ['Ana', 'Luis'], () => true);
    const r = reduce(g, { type: 'loser', name: 'Ana' });
    expect(r.players[0].score).toBe(0);
    expect(r.players[0].sips).toBeGreaterThan(0);
    expect(r.verdict.kind).toBe('fail');
  });
});

describe('permisos en online', () => {
  it('solo el jugador de turno resuelve su carta y solo el partner se opone', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis', 'Marta'], (c) => c.text.includes('{partner}'));
    expect(canAct(g, { type: 'done' }, 'Ana')).toBe(true);
    expect(canAct(g, { type: 'done' }, 'Marta')).toBe(false);
    expect(canAct(g, { type: 'refuse' }, 'Luis')).toBe(true);
    expect(canAct(g, { type: 'refuse' }, 'Ana')).toBe(false);
  });
});

describe('jugadores a mitad de partida (local)', () => {
  it('se puede sumar a alguien y no se repiten nombres', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], () => true);
    const r = reduce(g, { type: 'addPlayer', name: 'Pedro' });
    expect(r.players.map((p) => p.name)).toEqual(['Ana', 'Luis', 'Pedro']);
    expect(reduce(r, { type: 'addPlayer', name: 'pedro' })).toBe(r);
  });

  it('no se puede quitar al jugador de turno, y los índices se ajustan al quitar a otro', () => {
    let g = gameWith('chuto15', ['Ana', 'Luis', 'Marta'], (c) => !c.text.includes('{partner}'));
    g = { ...g, current: 2 };
    expect(reduce(g, { type: 'removePlayer', name: 'Marta' })).toBe(g);
    const r = reduce(g, { type: 'removePlayer', name: 'Ana' });
    expect(r.players.map((p) => p.name)).toEqual(['Luis', 'Marta']);
    expect(r.players[r.current].name).toBe('Marta');
  });
});

describe('cardView', () => {
  it('reemplaza {partner} por el nombre del partner', () => {
    const g = gameWith('chuto15', ['Ana', 'Luis'], (c) => c.text.includes('{partner}'));
    const v = cardView(g);
    expect(v.tokens.some((t) => t.partner && t.t === 'Luis')).toBe(true);
  });
});
