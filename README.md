# CHUTO15

Juego de retos para fiestas (+18), en 3D, hecho con React, Three.js (React Three Fiber) y Tailwind.
Se puede jugar en un solo teléfono (local) o cada uno desde su teléfono (online, salas P2P con PeerJS).
Es una PWA: se puede instalar desde el navegador.

## Desarrollo

```bash
npm install
npm run dev     # servidor de desarrollo
npm test        # pruebas de las reglas del juego (src/game/engine.test.js)
npm run build   # versión de producción en dist/
```

## Publicación (Netlify)

- `claude/intelligent-edison-2b7hxy`: rama de trabajo. Cada cambio se publica gratis como *branch deploy*
  en `https://claude-intelligent-edison-2b7hxy--chuto15.netlify.app` para probarlo.
- `main`: producción (`https://chuto15.netlify.app`). Cada publicación consume 15 créditos de Netlify,
  así que solo se actualiza cuando una tanda de cambios está lista.

## Estructura

- `src/game/decks.js`: mazos, cartas y fichas descriptivas.
- `src/game/trivia/`: banco de preguntas del mazo Sabelotodo (datos estructurados + preguntas sueltas).
- `src/game/engine.js`: reglas del juego (estado + reductor puro, compartido por local y online).
- `src/game/session.js`: partida guardada en el teléfono para retomarla.
- `src/net/room.js`: salas online peer-to-peer (PeerJS), con reconexión.
- `src/scene/`: escena 3D (Scene.jsx), reversos artísticos (backArt.js) y caras de las cartas (cardArt.js).
- `src/ui/`: componentes de interfaz y hojas inferiores (puntajes, ficha del mazo, confirmación).
- `src/App.jsx`: pantallas y flujo de la app.
