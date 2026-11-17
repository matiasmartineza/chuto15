// Salas online peer-to-peer con PeerJS (WebRTC).
// El anfitrión es la autoridad: recibe acciones, ejecuta el motor y reenvía el estado.
import Peer from 'peerjs';

const PREFIX = 'chuto15-sala-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin letras/números ambiguos

const makeCode = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

// Permite apuntar a un servidor PeerJS propio (?peer=host:puerto) — útil para pruebas.
const peerOptions = () => {
  const opt = { debug: 0 };
  try {
    const custom = new URLSearchParams(window.location.search).get('peer');
    if (custom) {
      const [host, port] = custom.split(':');
      Object.assign(opt, { host, port: Number(port) || 9000, path: '/', secure: window.location.protocol === 'https:' });
    }
  } catch {}
  return opt;
};

export const normalizeCode = (code) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

/*
  handlers: {
    onReady(code),
    onHello(name, peerId) -> { ok: true, name } | { ok: false, reason },
    onAction(name, action),
    onLeave(name),
    onError(message),
  }
*/
// fixedCode: para recuperar una sala propia (mismo código) después de que la app se cerró
export function hostRoom(handlers, fixedCode = null) {
  let peer = null;
  let destroyed = false;
  let code = fixedCode;
  const conns = new Map(); // peerId -> { conn, name }

  const open = (attempt = 0) => {
    if (destroyed) return;
    if (!code) code = makeCode();
    peer = new Peer(PREFIX + code, peerOptions());
    peer.on('open', () => handlers.onReady(code));
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id' && !destroyed) {
        peer.destroy();
        if (fixedCode && attempt < 12) {
          // el servidor todavía recuerda la sesión anterior: reintentar con el mismo código
          setTimeout(() => open(attempt + 1), 2500);
        } else if (!fixedCode && attempt < 5) {
          code = null;
          open(attempt + 1);
        } else {
          handlers.onError('No se pudo recuperar la sala. Crea una nueva.');
        }
      } else if (e.type !== 'peer-unavailable') {
        handlers.onError(describe(e));
      }
    });
    peer.on('disconnected', () => { if (!destroyed) peer.reconnect(); });
    peer.on('connection', (conn) => {
      conn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'hello') {
          const res = handlers.onHello(String(msg.name || '').slice(0, 16), conn.peer, String(msg.clientId || ''));
          if (res.ok) {
            // si el mismo jugador vuelve con una conexión nueva, se reemplaza la vieja
            for (const [id, c] of conns) {
              if (c.name === res.name && id !== conn.peer) {
                conns.delete(id);
                try { c.conn.close(); } catch {}
              }
            }
            conns.set(conn.peer, { conn, name: res.name });
            conn.send({ t: 'welcome', name: res.name });
          } else {
            conn.send({ t: 'reject', reason: res.reason });
            setTimeout(() => conn.close(), 400);
          }
        } else if (msg.t === 'action') {
          const c = conns.get(conn.peer);
          if (c) handlers.onAction(c.name, msg.action);
        }
      });
      conn.on('close', () => {
        const c = conns.get(conn.peer);
        conns.delete(conn.peer);
        if (c) handlers.onLeave(c.name);
      });
    });
  };
  open();

  return {
    broadcast(msg) {
      for (const { conn } of conns.values()) if (conn.open) conn.send(msg);
    },
    connectedNames() {
      return [...conns.values()].map((c) => c.name);
    },
    destroy() {
      destroyed = true;
      for (const { conn } of conns.values()) conn.close();
      if (peer) peer.destroy();
    },
    // Al volver a la app: reconecta con el servidor de salas o recrea la sala con el mismo código
    revive() {
      if (destroyed || !peer) return;
      if (peer.destroyed) open();
      else if (peer.disconnected) peer.reconnect();
    },
    code() {
      return code;
    },
    // Avisa a todos que la sala se cerró y luego corta la conexión
    close() {
      for (const { conn } of conns.values()) if (conn.open) conn.send({ t: 'closed' });
      setTimeout(() => this.destroy(), 300);
    },
  };
}

/*
  handlers: { onWelcome(name), onReject(reason), onState(state, connected), onClosed(), onClose(), onError(message) }
*/
export function joinRoom(code, name, handlers, clientId = '') {
  let destroyed = false;
  let conn = null;
  const peer = new Peer(peerOptions());
  peer.on('open', () => {
    conn = peer.connect(PREFIX + normalizeCode(code), { reliable: true });
    conn.on('open', () => conn.send({ t: 'hello', name, clientId }));
    conn.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'welcome') handlers.onWelcome(msg.name);
      else if (msg.t === 'reject') handlers.onReject(msg.reason);
      else if (msg.t === 'state') handlers.onState(msg.state, msg.connected || []);
      else if (msg.t === 'closed') {
        destroyed = true;
        handlers.onClosed();
        peer.destroy();
      }
    });
    conn.on('close', () => { if (!destroyed) handlers.onClose(); });
  });
  peer.on('error', (e) => handlers.onError(e.type === 'peer-unavailable' ? 'No existe una sala con ese código.' : describe(e)));
  return {
    send(action) {
      if (conn && conn.open) conn.send({ t: 'action', action });
    },
    destroy() {
      destroyed = true;
      peer.destroy();
    },
  };
}

function describe(e) {
  if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') return 'No se pudo conectar al servidor de salas. Revisa tu conexión.';
  if (e.type === 'browser-incompatible') return 'Este navegador no permite jugar online.';
  return 'Hubo un problema con la conexión.';
}
