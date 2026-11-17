# CHUTO15

Juego de retos para fiestas (+18), en 3D, hecho con React, Three.js (React Three Fiber) y Tailwind.
Se puede jugar en un solo teléfono (local) o cada uno desde su teléfono (online, salas P2P con PeerJS).
Es una PWA: se puede instalar desde el navegador.

## Desarrollo

```bash
npm install
npm run dev
```

## Publicación (Netlify)

- `claude/intelligent-edison-2b7hxy`: rama de trabajo. Cada cambio se publica gratis como *branch deploy*
  en `https://claude-intelligent-edison-2b7hxy--chuto15.netlify.app` para probarlo.
- `main`: producción (`https://chuto15.netlify.app`). Cada publicación consume 15 créditos de Netlify,
  así que solo se actualiza cuando una tanda de cambios está lista.

## Estructura

- `src/game/decks.js`: mazos y retos.
- `src/game/engine.js`: reglas del juego (estado + reductor, compartido por local y online).
- `src/net/room.js`: salas online peer-to-peer.
- `src/scene/`: escena 3D y dibujo de las cartas.
- `src/App.tsx`: interfaz.
