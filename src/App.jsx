import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import {
  Wine, Plus, RotateCcw, Trophy, X, Check, Shuffle, ShieldX, Star, ChevronUp, ChevronLeft,
  Smartphone, Wifi, WifiOff, Loader2, Crown, Download, Eye, Share2, LogOut, Info, Users, MapPin, Clock, Undo2,
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import QRCode from 'qrcode';
import { DECKS, DECK_IDS, METERS, playerLimits } from './game/decks.js';
import {
  WIN_SCORE, TARGETS, targetOf, canAct, reduce, createLobby, startGame, cardView, currentChallenge, getStakes,
  isDrinkChallenge, plainChallengeText, isTrivia, isChupistica,
} from './game/engine.js';
import { hostRoom, joinRoom, normalizeCode } from './net/room.js';
import { getBackImageURL } from './scene/cardArt.js';
import { getClientId, saveSession, loadSession, clearSession } from './game/session.js';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  fade, item, Logo, Glass, Primary, Ghost, IconBtn, TargetPicker, Header, Title, TextInput, Option, spring,
} from './ui/components.jsx';
import { ScoreSheet, DeckInfoSheet, ConfirmSheet } from './ui/sheets.jsx';
import SceneBoundary from './ui/SceneBoundary.jsx';
import { useInstallPrompt, InstallBanner } from './ui/install.jsx';

const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
})();

const Scene = React.lazy(() => import('./scene/Scene.jsx'));

// El QR y el link de la sala apuntan al mismo sitio donde se está jugando
// (producción o una versión de prueba en Netlify); en local, a producción.
const APP_URL = /\.netlify\.app$/.test(window.location.hostname)
  ? window.location.origin
  : 'https://chuto15.netlify.app';

const initialJoinCode = (() => {
  try {
    return normalizeCode(new URLSearchParams(window.location.search).get('sala') || '');
  } catch {
    return '';
  }
})();

const App = () => {
  const [screen, setScreen] = useState('consent');
  const [target, setTarget] = useState(WIN_SCORE);
  // Nueva versión publicada: se avisa en vez de actualizar en silencio
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ immediate: true });
  // false si no hay WebGL o si el 3D falla: el juego sigue con cartas simples
  const [glOk, setGlOk] = useState(hasWebGL);
  const [deckId, setDeckId] = useState('chuto15');

  const [localNames, setLocalNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [nameError, setNameError] = useState('');

  // Estado del juego (motor). En online lo calcula el anfitrión.
  const [game, setGame] = useState(null);
  const gameRef = useRef(null);
  const [mode, setMode] = useState('local'); // 'local' | 'online'

  // Red
  const [net, setNet] = useState(null); // { role, code, myName, status, error }
  const [connected, setConnected] = useState([]);
  const hostRef = useRef(null);
  const guestRef = useRef(null);
  const hostClients = useRef({}); // nombre -> id del teléfono (para reconexiones)
  const reconnectTimer = useRef(null);
  const reconnectUntil = useRef(0);
  const [resume, setResume] = useState(() => loadSession());
  const netRef = useRef(null);
  netRef.current = net;

  // Formularios online
  const [onlineTab, setOnlineTab] = useState(initialJoinCode ? 'join' : 'create');
  const [onlineName, setOnlineName] = useState('');
  const [joinCode, setJoinCode] = useState(initialJoinCode);

  const [scoresOpen, setScoresOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [qrURL, setQrURL] = useState('');
  const install = useInstallPrompt();

  // Arrastre de la carta (compartido con la escena 3D sin re-renderizar)
  const drag = useRef({ active: false, x: 0, y: 0, throw: null });
  const dragStart = useRef(null);

  // Cambiar de mazo con flechas o deslizando sobre la carta
  const deckSwipe = useRef(null);
  const [infoDeck, setInfoDeck] = useState(null);
  const deckRows = useRef({});
  const showcaseZone = useRef(null);
  const [showcaseBox, setShowcaseBox] = useState(null);
  useEffect(() => {
    if (screen !== 'deck') return undefined;
    const measure = () => {
      const el = showcaseZone.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setShowcaseBox({ top: r.top, bottom: r.bottom, vh: window.innerHeight });
    };
    measure();
    const t = setTimeout(measure, 400); // tras la animación de entrada
    const ro = typeof ResizeObserver !== 'undefined' && showcaseZone.current ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(showcaseZone.current);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [screen]);
  // al cambiar de mazo deslizando, la lista muestra el elegido
  useEffect(() => {
    const el = deckRows.current[deckId];
    const row = el && el.parentElement;
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [deckId]);
  const stepDeck = (dir) => {
    const i = DECK_IDS.indexOf(deckId);
    setDeckId(DECK_IDS[(i + dir + DECK_IDS.length) % DECK_IDS.length]);
  };

  const deckImages = useMemo(() => Object.fromEntries(DECK_IDS.map((id) => [id, getBackImageURL(id)])), []);

  // ---------- Núcleo: aplicar estado ----------
  const commit = (next) => {
    gameRef.current = next;
    setGame(next);
    if (hostRef.current) {
      const names = [netRef.current.myName, ...hostRef.current.connectedNames()];
      setConnected(names);
      hostRef.current.broadcast({ t: 'state', state: next, connected: names });
    }
  };

  const hostAct = (actor, action) => {
    const g = gameRef.current;
    if (!g) return;
    const hostOnly = action.type === 'restart' || action.type === 'skip' || action.type === 'setTarget';
    if (hostOnly && actor !== netRef.current.myName) return;
    if (!hostOnly && !canAct(g, action, actor)) return;
    commit(reduce(g, action));
  };

  // Acción del jugador de este teléfono
  const act = (action) => {
    if (mode === 'local') commit(reduce(gameRef.current, action));
    else if (net && net.role === 'host') hostAct(net.myName, action);
    else if (guestRef.current) guestRef.current.send(action);
  };

  // ---------- Local ----------
  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (localNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setNameError('Ya hay un jugador con ese nombre.');
      return;
    }
    if (localNames.length >= playerLimits(deckId).max) {
      setNameError(`Este mazo es para ${playerLimits(deckId).max} jugadores.`);
      return;
    }
    setNameError('');
    setLocalNames([...localNames, name]);
    setNewPlayerName('');
  };

  const startLocal = () => {
    const lim = playerLimits(deckId);
    if (localNames.length < lim.min || localNames.length > lim.max) return;
    setMode('local');
    commit(startGame(createLobby(deckId, localNames, target)));
    setScreen('game');
  };

  // ---------- Online: anfitrión ----------
  const leaveRoom = () => {
    stopRetries();
    if (hostRef.current) hostRef.current.destroy();
    if (guestRef.current) guestRef.current.destroy();
    hostRef.current = null;
    guestRef.current = null;
    setNet(null);
    setConnected([]);
    gameRef.current = null;
    setGame(null);
    setScoresOpen(false);
  };

  // restore: { name, code, game } para recuperar tu propia sala después de cerrar la app
  const createRoom = (restore = null) => {
    const name = (restore ? restore.name : onlineName).trim();
    if (!name) return;
    leaveRoom();
    setMode('online');
    setNet({ role: 'host', myName: name, code: restore ? restore.code : null, status: 'connecting', error: null });
    setConnected([name]);
    commit(restore ? restore.game : createLobby(deckId, [name], target));
    hostClients.current = {};
    hostRef.current = hostRoom({
      onReady: (code) => setNet((n) => n && { ...n, code, status: 'ready' }),
      onHello: (requested, peerId, clientId) => {
        const nm = requested.trim();
        const g = gameRef.current;
        if (!nm) return { ok: false, reason: 'Falta tu nombre.' };
        const online = [netRef.current.myName, ...hostRef.current.connectedNames()].map((x) => x.toLowerCase());
        const existing = g.players.find((p) => p.name.toLowerCase() === nm.toLowerCase());
        if (existing) {
          const sameDevice = clientId && hostClients.current[existing.name] === clientId;
          if (existing.name === netRef.current.myName) return { ok: false, reason: 'Ese nombre ya está en la sala.' };
          if (online.includes(existing.name.toLowerCase()) && !sameDevice) return { ok: false, reason: 'Ese nombre ya está en la sala.' };
          if (clientId) hostClients.current[existing.name] = clientId;
          setTimeout(() => commit(gameRef.current), 0); // vuelve a entrar a su lugar
          return { ok: true, name: existing.name };
        }
        if (g.phase !== 'lobby') return { ok: false, reason: 'La partida ya comenzó.' };
        if (g.players.length >= playerLimits(g.deckId).max) {
          return { ok: false, reason: playerLimits(g.deckId).max === 2 ? 'Este mazo es para 2 personas y la sala ya está completa.' : 'La sala está llena.' };
        }
        if (clientId) hostClients.current[nm] = clientId;
        setTimeout(() => {
          const cur = gameRef.current;
          commit({ ...cur, players: [...cur.players, { name: nm, score: 0, sips: 0 }] });
        }, 0);
        return { ok: true, name: nm };
      },
      onAction: (actor, action) => hostAct(actor, action),
      onLeave: (nm) => {
        const g = gameRef.current;
        if (g && g.phase === 'lobby') commit({ ...g, players: g.players.filter((p) => p.name !== nm) });
        else if (g) commit(g); // solo actualiza quién está conectado
      },
      onError: (msg) => setNet((n) => n && { ...n, status: 'error', error: msg }),
    }, restore ? restore.code : null);
    setScreen('game');
  };

  // ---------- Online: invitado (con reconexión automática) ----------
  const stopRetries = () => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    reconnectUntil.current = 0;
  };

  const scheduleRetry = (code, name) => {
    if (!reconnectUntil.current) reconnectUntil.current = Date.now() + 3 * 60 * 1000;
    if (Date.now() > reconnectUntil.current) {
      stopRetries();
      setNet((n) => n && { ...n, status: 'error', error: 'Se perdió la conexión con el anfitrión.' });
      return;
    }
    setNet((n) => n && { ...n, status: 'reconnecting' });
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => connectGuest(code, name), 3000);
  };

  const connectGuest = (code, name) => {
    if (guestRef.current) guestRef.current.destroy();
    guestRef.current = joinRoom(code, name, {
      onWelcome: (nm) => {
        stopRetries();
        setNet((n) => n && { ...n, myName: nm, status: 'ready', error: null });
      },
      onReject: (reason) => {
        stopRetries();
        setNet((n) => n && { ...n, status: 'error', error: reason });
        if (guestRef.current) guestRef.current.destroy();
      },
      onState: (st, conn) => {
        gameRef.current = st;
        setGame(st);
        setConnected(conn);
      },
      onClosed: () => {
        stopRetries();
        clearSession();
        setNet((n) => n && { ...n, status: 'error', error: 'El anfitrión cerró la sala.' });
      },
      // conexión perdida (por ejemplo, el anfitrión minimizó la app): se reintenta solo
      onClose: () => scheduleRetry(code, name),
      onError: (msg) => {
        if (reconnectUntil.current) scheduleRetry(code, name);
        else setNet((n) => n && { ...n, status: 'error', error: msg });
      },
    }, getClientId());
  };

  // restore: { name, code } para volver a una sala después de cerrar la app
  const joinRoomAs = (restore = null) => {
    const name = (restore ? restore.name : onlineName).trim();
    const code = normalizeCode(restore ? restore.code : joinCode);
    if (!name || code.length !== 4) return;
    leaveRoom();
    setMode('online');
    setNet({ role: 'guest', myName: name, code, status: restore ? 'reconnecting' : 'connecting', error: null });
    if (restore) reconnectUntil.current = Date.now() + 3 * 60 * 1000;
    connectGuest(code, name);
    setScreen('game');
  };

  useEffect(() => () => leaveRoom(), []);

  // Vibración (Android) en los momentos clave: resultado del turno y ganador
  const prevGame = useRef(null);
  useEffect(() => {
    const prev = prevGame.current;
    prevGame.current = game;
    if (!game || !prev || !navigator.vibrate) return;
    try {
      if (game.phase === 'winner' && prev.phase !== 'winner') navigator.vibrate([60, 40, 60, 40, 220]);
      else if (game.verdict && (!prev.verdict || prev.verdict.key !== game.verdict.key)) {
        navigator.vibrate(game.verdict.kind === 'done' ? [30, 30, 80] : game.verdict.kind === 'fail' ? [200, 60, 200] : [40, 30, 40]);
      }
    } catch {}
  }, [game]);

  // Guardar la partida en el teléfono (para retomarla si la app se cierra)
  useEffect(() => {
    if (screen !== 'game' || !game) return;
    if (mode === 'local') {
      if (game.phase === 'playing') saveSession({ kind: 'local', game });
    } else if (net && net.code && net.status !== 'error') {
      if (net.role === 'host') saveSession({ kind: 'host', code: net.code, name: net.myName, game });
      else saveSession({ kind: 'guest', code: net.code, name: net.myName, deckId: game.deckId });
    }
  }, [game, net && net.code, net && net.status, mode, screen]);

  // Pantalla siempre encendida durante la partida + al volver a la app, reconectar la sala
  const wakeLock = useRef(null);
  useEffect(() => {
    const want = screen === 'game';
    const acquire = async () => {
      try {
        if (want && 'wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock.current) {
          wakeLock.current = await navigator.wakeLock.request('screen');
          wakeLock.current.addEventListener('release', () => { wakeLock.current = null; });
        }
      } catch {}
    };
    if (want) acquire();
    else if (wakeLock.current) {
      wakeLock.current.release().catch(() => {});
      wakeLock.current = null;
    }
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      acquire();
      if (hostRef.current) hostRef.current.revive();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [screen]);

  // Retomar una partida guardada
  const resumeSession = () => {
    const r = resume;
    setResume(null);
    if (!r) return;
    if (r.kind === 'local') {
      setMode('local');
      setDeckId(r.game.deckId);
      setLocalNames(r.game.players.map((p) => p.name));
      commit(r.game);
      setScreen('game');
    } else if (r.kind === 'host') {
      setDeckId(r.game.deckId);
      setOnlineName(r.name);
      createRoom({ name: r.name, code: r.code, game: r.game });
    } else if (r.kind === 'guest') {
      if (r.deckId) setDeckId(r.deckId);
      setOnlineName(r.name);
      setJoinCode(r.code);
      joinRoomAs({ name: r.name, code: r.code });
    }
  };
  const resumeLabel = resume
    ? resume.kind === 'local'
      ? `${resume.game.players.map((p) => p.name).join(', ')} · ${DECKS[resume.game.deckId] ? DECKS[resume.game.deckId].name : ''}`
      : resume.kind === 'host'
        ? `Tu sala ${resume.code}`
        : `Sala ${resume.code} como ${resume.name}`
    : '';

  // QR de la sala
  useEffect(() => {
    if (!net || !net.code) return;
    QRCode.toDataURL(`${APP_URL}/?sala=${net.code}`, { margin: 2, width: 360, errorCorrectionLevel: 'M', color: { dark: '#0a0a0a', light: '#ffffff' } })
      .then(setQrURL)
      .catch(() => setQrURL(''));
  }, [net && net.code]);

  // Aviso "Doble riesgo"
  useEffect(() => {
    if (!game || !game.toast || game.toast.id !== game.cardKey) return undefined;
    setToast(game.toast);
    const id = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(id);
  }, [game && game.toast && game.toast.id]);

  // ---------- Lanzar la carta ----------
  const me = net ? net.myName : null;
  const canDo = (action) => game && (mode === 'local' || canAct(game, action, me));

  const throwCard = (dir) => {
    drag.current.throw = dir;
    drag.current.active = false;
    act({ type: 'continue', exit: 'throw', dir });
  };
  const onDragStart = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragStart.current = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: now, vx: 0, vy: 0 };
    Object.assign(drag.current, { active: true, x: 0, y: 0 });
  };
  const onDragMove = (e) => {
    const st = dragStart.current;
    if (!st) return;
    const now = performance.now();
    const dt = Math.max(1, now - st.lt);
    st.vx = (e.clientX - st.lx) / dt;
    st.vy = (e.clientY - st.ly) / dt;
    Object.assign(st, { lx: e.clientX, ly: e.clientY, lt: now });
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
      throwCard(speed > 0.6 ? { x: st.vx, y: st.vy } : { x, y });
    } else {
      drag.current.active = false; // vuelve a su lugar
    }
  };

  // Los demás teléfonos ven la carta salir en la misma dirección
  if (game && game.throwDir && !drag.current.active) drag.current.throw = game.throwDir;

  // ---------- Datos derivados ----------
  const phase = game ? game.phase : null;
  const playing = phase === 'playing';
  const curPlayer = playing ? game.players[game.current] : null;
  const partner = playing && game.partner != null ? game.players[game.partner] : null;
  const verdict = playing ? game.verdict : null;
  const challenge = playing ? currentChallenge(game) : null;
  const drinkType = isDrinkChallenge(challenge);
  const trivia = playing && isTrivia(game);
  const chupi = playing && isChupistica(game);
  // El anfitrión puede saltar el turno de alguien que se desconectó
  const canSkip = playing && mode === 'online' && net && net.role === 'host' && curPlayer && curPlayer.name !== net.myName && !connected.includes(curPlayer.name);
  const limits = playerLimits(game ? game.deckId : deckId);
  const [copied, setCopied] = useState(false);
  const shareLink = async () => {
    if (!net || !net.code) return;
    const url = `${APP_URL}/?sala=${net.code}`;
    const text = `Únete a mi sala de Chuto15 (código ${net.code})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Chuto15', text, url });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const stakes = playing ? getStakes(game) : { points: 0, sips: 0 };
  const plainText = playing ? plainChallengeText(game) : '';
  const card = useMemo(() => (game ? cardView(game) : null), [game && game.cardKey, phase, game && game.deckId]);
  const myTurn = playing && (mode === 'local' || curPlayer.name === me);
  const iAmPartner = playing && mode === 'online' && partner && partner.name === me;
  const isHost = mode === 'local' || (net && net.role === 'host');
  const winner = game && game.players.length ? [...game.players].sort((a, b) => b.score - a.score)[0] : null;
  const nextName = playing ? game.players[(game.current + 1) % game.players.length].name : '';

  const sceneDeck = game ? game.deckId : deckId;
  const netError = !!(net && net.status === 'error');
  const sceneMode = screen === 'deck' ? 'showcase' : screen === 'game' && !netError && phase === 'playing' ? 'playing' : screen === 'game' && !netError && phase === 'winner' ? 'winner' : 'intro';

  const backToSetup = () => {
    clearSession();
    if (mode === 'local') {
      gameRef.current = null;
      setGame(null);
      setScreen('setup');
    } else act({ type: 'restart' });
    setScoresOpen(false);
  };

  const exitToMenu = () => {
    clearSession();
    if (hostRef.current) {
      // Cerrar sala: avisa a los invitados antes de cortar
      const h = hostRef.current;
      hostRef.current = null;
      h.close();
    }
    leaveRoom();
    setScreen('mode');
  };

  // Confirmación para salir / cerrar sala
  const [confirm, setConfirm] = useState(null);
  const askExit = () => {
    if (mode === 'local') {
      setConfirm({
        title: '¿Salir de la partida?',
        text: 'Se perderán los puntajes de esta partida.',
        ok: 'Salir',
        run: () => { clearSession(); gameRef.current = null; setGame(null); setScreen('setup'); },
      });
    } else if (net && net.role === 'host') {
      setConfirm({
        title: '¿Cerrar la sala?',
        text: 'La partida terminará para todos los jugadores.',
        ok: 'Cerrar sala',
        run: exitToMenu,
      });
    } else {
      setConfirm({
        title: '¿Salir de la sala?',
        text: 'Puedes volver a entrar con el mismo código y tu mismo nombre.',
        ok: 'Salir',
        run: () => { clearSession(); leaveRoom(); setScreen('online'); },
      });
    }
  };

  const fadeKey = screen === 'game' ? `game-${phase || 'connecting'}` : screen;

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden">
        {glOk && (
          <SceneBoundary onError={() => setGlOk(false)}>
          <Suspense fallback={null}>
            <Scene onLost={() => setGlOk(false)} mode={sceneMode} showcaseBox={showcaseBox} deckId={sceneDeck} card={screen === 'game' && !netError ? card : null} verdict={netError ? null : verdict} exitType={game ? game.exitType : 'done'} drag={drag} />
          </Suspense>
          </SceneBoundary>
        )}

        <div className="relative z-10 h-[100dvh] max-w-md mx-auto flex flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)] pointer-events-none [&_button]:pointer-events-auto [&_input]:pointer-events-auto">
          <AnimatePresence mode="wait">

            {/* AVISO +18 */}
            {screen === 'consent' && (
              <motion.div key="consent" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <motion.div variants={item} className="flex justify-center pt-6"><Logo /></motion.div>
                <InstallBanner install={install} />
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
                <motion.div variants={item} className="mt-4 space-y-2.5">
                  <Primary onClick={() => setScreen(initialJoinCode ? 'online' : 'deck')}>Soy mayor de 18 · Entrar</Primary>
                  {resume && !initialJoinCode && (
                    <div className="flex items-center gap-2">
                      <Ghost onClick={resumeSession} className="flex-1 py-3.5 min-w-0">
                        <RotateCcw size={16} className="shrink-0" />
                        <span className="truncate">Retomar partida · {resumeLabel}</span>
                      </Ghost>
                      <IconBtn onClick={() => { clearSession(); setResume(null); }} aria-label="Descartar partida guardada"><X size={16} /></IconBtn>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* MAZO */}
            {screen === 'deck' && (
              <motion.div key="deck" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <Header
                  right={install.prompt && !install.standalone ? (
                    <IconBtn aria-label="Instalar app" onClick={() => install.install()}><Download size={17} /></IconBtn>
                  ) : null}
                />
                <Title kicker="Paso 1">Elige un mazo</Title>

                {/* Espacio libre arriba: ahí la escena 3D muestra el reverso del mazo elegido.
                    Deslizar sobre la carta también cambia de mazo. */}
                <div
                  ref={showcaseZone}
                  className="flex-1 min-h-[6rem] pointer-events-auto touch-pan-y"
                  onPointerDown={(e) => { deckSwipe.current = e.clientX; }}
                  onPointerUp={(e) => {
                    if (deckSwipe.current == null) return;
                    const dx = e.clientX - deckSwipe.current;
                    deckSwipe.current = null;
                    if (Math.abs(dx) > 45) stepDeck(dx < 0 ? 1 : -1);
                    else if (Math.abs(dx) < 8) setInfoDeck(deckId);
                  }}
                />

                {/* Lista de mazos abajo: se ven 3-4 y el resto con scroll */}
                <div
                  className="max-h-[min(19.5rem,38vh)] overflow-y-auto overscroll-contain space-y-2 pointer-events-auto -mx-1 px-1 py-1 mt-3 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]"
                >
                  {DECK_IDS.map((id) => {
                    const d = DECKS[id];
                    const lim = playerLimits(id);
                    return (
                      <div key={id} className="flex items-stretch gap-2">
                      <Option active={deckId === id} onClick={() => setDeckId(id)} className="flex-1 min-w-0 p-2.5 flex items-center gap-3.5">
                        <span ref={(el) => { deckRows.current[id] = el; }} className="contents" />
                        <img src={deckImages[id]} alt="" className="w-11 h-[3.85rem] rounded-md object-cover shadow-lg shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold leading-tight">{d.name}</span>
                          {d.kana && <span className="block text-[11px] leading-tight text-pink-200/90">{d.kana} · {d.kanji}</span>}
                          <span className="block text-xs text-neutral-500 mt-0.5 truncate">
                            {d.subtitle} · {d.challenges.length} cartas{lim.max === 2 ? ' · para 2' : ''}
                          </span>
                        </span>
                      </Option>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setInfoDeck(id)}
                        aria-label={`Ver detalles del mazo ${d.name}`}
                        className="w-11 shrink-0 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Info size={18} />
                      </motion.button>
                      </div>
                    );
                  })}
                  <div className="h-6" />
                </div>
                <motion.div variants={item} className="mt-4">
                  <Primary onClick={() => setScreen('mode')}>Continuar</Primary>
                </motion.div>
              </motion.div>
            )}

            {/* MODO */}
            {screen === 'mode' && (
              <motion.div key="mode" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <Header onBack={() => setScreen('deck')} />
                <Title kicker={`Mazo ${DECKS[deckId].name}`}>¿Cómo quieren jugar?</Title>
                <div className="flex-1" />
                <div className="space-y-3">
                  <Option onClick={() => { setMode('local'); setScreen('setup'); }} className="p-5 flex items-center gap-4">
                    <span className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0"><Smartphone size={22} className="text-red-400" /></span>
                    <span>
                      <span className="block font-bold text-lg">Local</span>
                      <span className="block text-sm text-neutral-400">Un solo teléfono que se van pasando.</span>
                    </span>
                  </Option>
                  <Option onClick={() => { setMode('online'); setScreen('online'); }} className="p-5 flex items-center gap-4">
                    <span className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0"><Wifi size={22} className="text-purple-400" /></span>
                    <span>
                      <span className="block font-bold text-lg">Online</span>
                      <span className="block text-sm text-neutral-400">Cada uno juega desde su teléfono.</span>
                    </span>
                  </Option>
                </div>
              </motion.div>
            )}

            {/* JUGADORES (LOCAL) */}
            {screen === 'setup' && (
              <motion.div key="setup" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <Header onBack={() => setScreen('mode')} />
                <Title kicker="Partida local">¿Quiénes juegan?</Title>
                <div className="flex-1" />
                <Glass className="p-5 pointer-events-auto">
                  <div className="flex gap-2">
                    <TextInput
                      value={newPlayerName}
                      onChange={(e) => { setNewPlayerName(e.target.value); setNameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                      placeholder="Añade un nombre"
                    />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={addPlayer} aria-label="Añadir jugador" className="w-12 h-12 shrink-0 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors">
                      <Plus size={22} />
                    </motion.button>
                  </div>
                  {nameError && <p className="text-red-400 text-xs mt-2 ml-2">{nameError}</p>}
                  <div className="mt-4 pt-4 border-t border-white/5"><TargetPicker value={target} onChange={setTarget} /></div>
                  <div className="flex flex-wrap gap-2 mt-4 min-h-[2.25rem]">
                    <AnimatePresence initial={false}>
                      {localNames.map((n, i) => (
                        <motion.span key={n} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring}
                          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 pl-3.5 pr-1.5 py-1.5 text-sm">
                          {n}
                          <button onClick={() => setLocalNames(localNames.filter((_, j) => j !== i))} aria-label={`Quitar a ${n}`} className="w-5 h-5 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10">
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {localNames.length === 0 && (
                      <span className="text-sm text-neutral-600 py-1.5">{limits.max === 2 ? 'Este mazo es para 2 personas' : 'Mínimo 2 para empezar'}</span>
                    )}
                  </div>
                </Glass>
                <motion.div variants={item} className="mt-4">
                  <Primary onClick={startLocal} disabled={localNames.length < limits.min || localNames.length > limits.max}>
                    {localNames.length < limits.min ? 'Faltan jugadores' : 'Comenzar'}
                  </Primary>
                </motion.div>
              </motion.div>
            )}

            {/* ONLINE: CREAR O UNIRSE */}
            {screen === 'online' && (
              <motion.div key="online" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <Header onBack={() => setScreen(initialJoinCode ? 'deck' : 'mode')} />
                <Title kicker="Online">{onlineTab === 'create' ? 'Crea una sala' : 'Únete a una sala'}</Title>
                <div className="flex-1" />
                <Glass className="p-5 pointer-events-auto">
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 mb-5">
                    {[['create', 'Crear sala'], ['join', 'Unirme']].map(([id, label]) => (
                      <button key={id} onClick={() => setOnlineTab(id)} className={`rounded-full py-2 text-sm font-semibold transition-colors ${onlineTab === id ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {onlineTab === 'join' && (
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
                        placeholder="CÓDIGO"
                        inputMode="text"
                        autoCapitalize="characters"
                        className="w-full rounded-full bg-white/[0.05] border border-white/10 px-5 py-3 text-center text-2xl font-black tracking-[0.5em] placeholder:text-neutral-700 placeholder:tracking-[0.3em] placeholder:text-base focus:outline-none focus:border-purple-500/60"
                      />
                    )}
                    <TextInput
                      value={onlineName}
                      onChange={(e) => setOnlineName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (onlineTab === 'create' ? createRoom() : joinRoomAs())}
                      placeholder="Tu nombre"
                    />
                  </div>
                  {onlineTab === 'create' && (
                    <p className="text-xs text-neutral-500 mt-3 ml-1">Mazo: {DECKS[deckId].name}. Tu teléfono será el anfitrión: mantenlo con la app abierta.</p>
                  )}
                </Glass>
                <motion.div variants={item} className="mt-4">
                  {onlineTab === 'create' ? (
                    <Primary onClick={() => createRoom()} disabled={!onlineName.trim()}>Crear sala</Primary>
                  ) : (
                    <Primary onClick={() => joinRoomAs()} disabled={!onlineName.trim() || joinCode.length !== 4}>Entrar</Primary>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* SALA ONLINE: conectando / error / lobby */}
            {screen === 'game' && mode === 'online' && (!game || phase === 'lobby' || (net && net.status === 'error')) && (
              <motion.div key={`room-${net && net.status === 'error' ? 'error' : phase || 'connecting'}`} variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <Header
                  onBack={() => (net && net.status !== 'error' && game && (net.role === 'guest' || game.players.length > 1) ? askExit() : exitToMenu())}
                  right={net && net.status !== 'error' && game ? (
                    <IconBtn onClick={askExit} aria-label={net.role === 'host' ? 'Cerrar sala' : 'Salir de la sala'}><LogOut size={17} /></IconBtn>
                  ) : null}
                />
                {net && net.status === 'error' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <WifiOff size={36} className="text-red-400" />
                    <p className="text-lg font-bold">{net.error}</p>
                    <Ghost onClick={() => { leaveRoom(); setScreen('online'); }} className="px-6 py-3">Volver a intentar</Ghost>
                  </div>
                ) : !game || !net || (net.role === 'host' && !net.code) ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={28} /></motion.span>
                    <p className="text-sm">{net && net.role === 'guest' ? 'Entrando a la sala…' : 'Creando la sala…'}</p>
                  </div>
                ) : (
                  <>
                    <motion.div variants={item} className="text-center mt-6">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">Sala · Mazo {DECKS[game.deckId].name}</p>
                      <p className="text-5xl font-black tracking-[0.25em] ml-[0.25em] mt-1">{net.code}</p>
                    </motion.div>
                    {net.role === 'host' && qrURL && (
                      <motion.div variants={item} className="flex flex-col items-center mt-4">
                        <div className="pointer-events-auto rounded-3xl bg-[#111014] border border-white/10 p-3 pb-2.5 shadow-[0_10px_40px_rgba(0,0,0,.7)] flex flex-col items-center">
                          <img src={qrURL} alt={`Código QR para unirse a la sala ${net.code}`} className="w-36 h-36 rounded-xl bg-white" />
                          <p className="text-[11px] text-neutral-400 mt-2 text-center leading-snug">Escanea para abrir la app y unirte<br /><span className="text-neutral-500">{APP_URL.replace('https://', '')}</span></p>
                        </div>
                      </motion.div>
                    )}
                    <motion.div variants={item} className="flex justify-center mt-3">
                      <Ghost onClick={shareLink} className="px-4 py-2 text-xs">
                        {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                        {copied ? 'Link copiado' : 'Compartir link (Discord, WhatsApp…)'}
                      </Ghost>
                    </motion.div>
                    <div className="flex-1" />
                    <Glass className="p-5 pointer-events-auto">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500 mb-3">
                        Jugadores · {game.players.length}{limits.max === 2 ? ' de 2' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence initial={false}>
                          {game.players.map((p, i) => (
                            <motion.span key={p.name} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={spring}
                              className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3.5 py-1.5 text-sm">
                              <span className={`w-1.5 h-1.5 rounded-full ${connected.includes(p.name) ? 'bg-green-400' : 'bg-neutral-600'}`} />
                              {p.name}
                              {i === 0 && <Crown size={12} className="text-yellow-400" />}
                              {p.name === me && <span className="text-neutral-500 text-xs">(tú)</span>}
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <TargetPicker value={targetOf(game)} disabled={net.role !== 'host'} onChange={(t) => act({ type: 'setTarget', target: t })} />
                      </div>
                    </Glass>
                    <motion.div variants={item} className="mt-4">
                      {net.role === 'host' ? (
                        <Primary onClick={() => commit(startGame(gameRef.current))} disabled={game.players.length < limits.min || game.players.length > limits.max}>
                          {game.players.length < limits.min ? 'Esperando jugadores…' : 'Comenzar'}
                        </Primary>
                      ) : (
                        <p className="text-center text-sm text-neutral-400 py-4">Esperando que {game.players[0].name} comience…</p>
                      )}
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}

            {/* JUEGO */}
            {screen === 'game' && playing && curPlayer && !(net && net.status === 'error') && (
              <motion.div key="playing" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <motion.div variants={item} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <IconBtn onClick={askExit} aria-label={mode === 'local' ? 'Salir de la partida' : net && net.role === 'host' ? 'Cerrar sala' : 'Salir de la sala'}>
                      <LogOut size={17} />
                    </IconBtn>
                    <Logo small />
                  </div>
                  <div className="flex items-center gap-2">
                    {net && net.code && <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 border border-white/10 rounded-full px-3 py-1.5">{net.code}</span>}
                    <IconBtn onClick={() => setScoresOpen(true)} aria-label="Ver puntajes"><Trophy size={18} /></IconBtn>
                  </div>
                </motion.div>

                <motion.div variants={item} className="text-center mt-5 h-16">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">{mode === 'online' && curPlayer.name === me ? 'Tu turno' : 'Turno de'}</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={curPlayer.name} initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ type: 'tween', duration: 0.35 }}
                      className="text-3xl font-black tracking-tight">
                      {curPlayer.name}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                <div className="relative h-6 flex justify-center">
                  <AnimatePresence>
                    {toast && (
                      <motion.p key={toast.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute text-sm font-semibold text-amber-400">
                        {toast.text}
                      </motion.p>
                    )}
                    {!toast && chupi && !verdict && (
                      <motion.p key="chupi-rule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute text-xs text-neutral-400 text-center whitespace-nowrap">
                        En ronda desde {curPlayer.name} · quien falla o repite, toma
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Zona de la carta (la carta vive en la escena 3D) */}
                <div className="flex-1 flex items-center justify-center relative">
                  {verdict && canDo({ type: 'continue' }) && (
                    <div className="absolute inset-0 pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
                      onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} />
                  )}
                  <p className="sr-only" aria-live="polite">
                    {verdict
                      ? `${verdict.title}. ${verdict.rows.map((r) => `${r.name}: ${r.amount}`).join('. ')}.`
                      : `${plainText}. Premio ${stakes.points} puntos, castigo ${stakes.sips} sorbos.`}
                  </p>
                  {!glOk && (
                    <div className="w-full rounded-3xl bg-neutral-900/80 border border-white/10 p-6">
                      {verdict ? (
                        <>
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
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{card && card.label}</p>
                          <p className="text-xl font-bold leading-snug">{plainText}</p>
                          <p className="text-sm text-neutral-400 mt-4">+{stakes.points} pts · {stakes.sips} sorbos</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative min-h-[7.25rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    {verdict ? (
                      <motion.div key="next" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }}>
                        {canDo({ type: 'continue' }) ? (
                          <>
                          <button onClick={() => throwCard({ x: 0, y: -1 })} className="w-full h-[5.5rem] flex flex-col items-center justify-center gap-1.5 text-neutral-400"
                            aria-label={verdict.gameOver ? 'Lanzar la carta y ver al ganador' : 'Lanzar la carta y pasar al siguiente turno'}>
                            <span className="flex flex-col items-center -space-y-2.5">
                              {[0, 1, 2].map((i) => (
                                <motion.span key={i} animate={{ opacity: [0.15, 1, 0.15], y: [4, -4, 4] }} transition={{ repeat: Infinity, duration: 1.4, delay: (2 - i) * 0.18, ease: 'easeInOut' }}>
                                  <ChevronUp size={22} className={verdict.gameOver ? 'text-yellow-400' : 'text-white'} />
                                </motion.span>
                              ))}
                            </span>
                            <span className="text-sm font-semibold text-white">Desliza la carta para lanzarla</span>
                            <span className="text-xs">{verdict.gameOver ? 'y descubre al ganador' : `Sigue ${nextName}`}</span>
                          </button>
                          <div className="h-[1.75rem] flex justify-center">
                            <button onClick={() => act({ type: 'undo' })} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white px-3 rounded-full">
                              <Undo2 size={13} /> Corregir (me equivoqué de botón)
                            </button>
                          </div>
                          </>
                        ) : (
                          <div className="h-[7.25rem] flex flex-col items-center justify-center gap-2 text-sm text-neutral-400">
                            Esperando que {curPlayer.name} lance la carta…
                            {canSkip && (
                              <Ghost onClick={() => act({ type: 'skip' })} className="px-4 py-2 text-xs">
                                {curPlayer.name} se desconectó · continuar
                              </Ghost>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ) : myTurn && chupi ? (
                      <motion.div key="chupi" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }} className="space-y-2.5">
                        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-neutral-500">¿Quién perdió la ronda?</p>
                        <div className="flex flex-wrap justify-center gap-2 max-h-[5.5rem] overflow-y-auto">
                          {game.players.map((p) => (
                            <motion.button
                              key={p.name}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => act({ type: 'loser', name: p.name })}
                              className={`rounded-full px-4 py-2.5 text-sm font-semibold border transition-colors ${p.name === curPlayer.name ? 'bg-white text-black border-white' : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12]'}`}
                            >
                              {p.name === curPlayer.name ? `${p.name} (yo)` : p.name}
                            </motion.button>
                          ))}
                        </div>
                        <Ghost onClick={() => act({ type: 'negotiate' })} disabled={game.negotiated} className="w-full py-2.5">
                          <Shuffle size={15} className="text-purple-400" /> Otra categoría (apuesta doble)
                        </Ghost>
                      </motion.div>
                    ) : myTurn && trivia ? (
                      <motion.div key={game.revealed ? 'trivia-answer' : 'trivia-ask'} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }} className="space-y-2.5">
                        {game.revealed ? (
                          <>
                            <p className="text-center leading-tight">
                              <span className="block text-[10px] uppercase tracking-[0.4em] text-neutral-500">Respuesta</span>
                              <span className="text-xl font-bold text-cyan-300">{challenge.answer}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                              <motion.button whileTap={{ scale: 0.96 }} onClick={() => act({ type: 'done' })}
                                className="rounded-full bg-white text-black py-3.5 font-bold flex items-center justify-center gap-2">
                                <Check size={18} strokeWidth={3} /> Acerté
                              </motion.button>
                              <Ghost onClick={() => act({ type: 'fail' })} className="py-3.5">
                                <X size={16} className="text-red-400" /> Fallé
                              </Ghost>
                            </div>
                          </>
                        ) : (
                          <>
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => act({ type: 'reveal' })}
                              className="w-full rounded-full bg-white text-black py-4 font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
                              <Eye size={20} /> Ver respuesta
                            </motion.button>
                            <div className="grid grid-cols-2 gap-2.5">
                              <Ghost onClick={() => act({ type: 'fail' })} className="py-3">
                                <Wine size={16} className="text-red-400" /> Paso, bebo
                              </Ghost>
                              <Ghost onClick={() => act({ type: 'negotiate' })} disabled={game.negotiated} className="py-3">
                                <Shuffle size={16} className="text-purple-400" /> Más difícil
                              </Ghost>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : myTurn ? (
                      <motion.div key="actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }} className="space-y-2.5">
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => act({ type: 'done' })}
                          className="w-full rounded-full bg-white text-black py-4 font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
                          <Check size={20} strokeWidth={3} /> {drinkType ? 'Bebí / no aplica' : 'Hecho'}
                        </motion.button>
                        <div className={`grid gap-2.5 ${partner && mode === 'local' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          <Ghost onClick={() => act({ type: 'fail' })} className="py-3">
                            <Wine size={16} className="text-red-400" /> {drinkType ? 'Me niego' : 'Castigo'}
                          </Ghost>
                          {partner && mode === 'local' && (
                            <Ghost onClick={() => act({ type: 'refuse' })} className="py-3">
                              <ShieldX size={16} className="text-orange-400" /> Se opone
                            </Ghost>
                          )}
                          <Ghost onClick={() => act({ type: 'negotiate' })} disabled={game.negotiated} className="py-3">
                            <Shuffle size={16} className="text-purple-400" /> Negociar
                          </Ghost>
                        </div>
                      </motion.div>
                    ) : iAmPartner ? (
                      <motion.div key="partner" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ type: 'tween', duration: 0.2 }} className="space-y-2.5">
                        <p className="text-center text-sm text-neutral-400">El reto de {curPlayer.name} es contigo</p>
                        <Ghost onClick={() => act({ type: 'refuse' })} className="w-full py-4">
                          <ShieldX size={18} className="text-orange-400" /> Me opongo
                        </Ghost>
                      </motion.div>
                    ) : (
                      <motion.div key={`wait-${trivia && game.revealed ? 'r' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[7.25rem] flex flex-col items-center justify-center gap-2 text-sm text-neutral-400">
                        {trivia && game.revealed && (
                          <p className="text-center leading-tight">
                            <span className="block text-[10px] uppercase tracking-[0.4em] text-neutral-500">Respuesta</span>
                            <span className="text-xl font-bold text-cyan-300">{challenge.answer}</span>
                          </p>
                        )}
                        Esperando a {curPlayer.name}…
                        {canSkip && (
                          <Ghost onClick={() => act({ type: 'skip' })} className="px-4 py-2 text-xs mt-1">
                            {curPlayer.name} se desconectó · saltar turno
                          </Ghost>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* GANADOR */}
            {screen === 'game' && phase === 'winner' && winner && !(net && net.status === 'error') && (
              <motion.div key="winner" variants={fade} initial="initial" animate="animate" exit="exit" className="flex-1 min-h-0 flex flex-col">
                <motion.div variants={item} className="flex justify-center"><Logo small /></motion.div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <motion.p variants={item} className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 mb-2">Ganador</motion.p>
                  <motion.p initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ scale: { type: 'spring', stiffness: 160, damping: 16, delay: 0.3 }, default: { type: 'tween', duration: 0.6, delay: 0.3 } }}
                    className="text-6xl font-black italic tracking-tighter -skew-x-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500 drop-shadow-[0_0_24px_rgba(220,38,38,0.5)] px-4 break-all">
                    {winner.name}
                  </motion.p>
                  <motion.p variants={item} className="text-sm text-neutral-400 mt-3">
                    {winner.score} pts · {winner.sips} {winner.sips === 1 ? 'trago' : 'tragos'}
                  </motion.p>
                </div>
                <motion.div variants={item} className="space-y-2.5">
                  <Ghost onClick={() => setScoresOpen(true)} className="w-full py-3.5"><Trophy size={16} /> Ver puntajes</Ghost>
                  {isHost ? (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={backToSetup} className="w-full rounded-full bg-white text-black py-4 font-bold flex items-center justify-center gap-2">
                      <RotateCcw size={18} /> Jugar de nuevo
                    </motion.button>
                  ) : (
                    <p className="text-center text-sm text-neutral-400 py-4">Esperando que {game.players[0].name} inicie otra partida…</p>
                  )}
                  <button onClick={mode === 'online' ? askExit : exitToMenu} className="w-full text-xs text-neutral-500 hover:text-white py-1">
                    {mode === 'online' ? (net && net.role === 'host' ? 'Cerrar sala' : 'Salir de la sala') : 'Salir al menú'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ScoreSheet
          open={scoresOpen}
          onClose={() => setScoresOpen(false)}
          players={game ? game.players : []}
          target={targetOf(game)}
          editable={mode === 'local' && playing}
          locked={playing ? [curPlayer && curPlayer.name, partner && partner.name].filter(Boolean) : []}
          onAdd={(name) => act({ type: 'addPlayer', name })}
          onRemove={(name) => act({ type: 'removePlayer', name })}
          minPlayers={limits.min}
          maxPlayers={limits.max}
        />

        {/* Aviso de nueva versión (fuera de una partida en curso) */}
        <AnimatePresence>
          {needRefresh && !(screen === 'game' && phase === 'playing') && (
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-[max(env(safe-area-inset-bottom),1rem)] inset-x-0 z-40 flex justify-center px-5"
              role="status"
            >
              <div className="flex items-center gap-3 rounded-full bg-[#111014]/95 border border-white/15 pl-5 pr-1.5 py-1.5 shadow-2xl text-sm">
                <span>Hay una versión nueva</span>
                <button onClick={() => updateServiceWorker(true)} className="rounded-full bg-white text-black font-semibold px-4 py-2">Actualizar</button>
                <button onClick={() => setNeedRefresh(false)} aria-label="Ahora no" className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white"><X size={15} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aviso de reconexión */}
        <AnimatePresence>
          {screen === 'game' && net && net.status === 'reconnecting' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-[max(env(safe-area-inset-top),0.75rem)] inset-x-0 z-40 flex justify-center pointer-events-none"
              role="status"
            >
              <span className="flex items-center gap-2 rounded-full bg-[#111014]/95 border border-amber-400/40 text-amber-200 text-xs font-semibold px-4 py-2 shadow-2xl">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={14} /></motion.span>
                Reconectando con la sala…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <DeckInfoSheet
          deckId={infoDeck}
          image={infoDeck ? deckImages[infoDeck] : null}
          selected={infoDeck === deckId}
          onClose={() => setInfoDeck(null)}
          onChoose={() => { setDeckId(infoDeck); setInfoDeck(null); }}
        />

        <ConfirmSheet confirm={confirm} onClose={() => setConfirm(null)} />
      </div>
    </MotionConfig>
  );
};

export default App;
