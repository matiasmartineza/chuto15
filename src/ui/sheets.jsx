// Hojas que suben desde abajo: puntajes, ficha del mazo y confirmación
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wine, X, Plus, Check, Users, MapPin, Clock } from 'lucide-react';
import { DECKS, METERS, playerLimits } from '../game/decks.js';
import { WIN_SCORE } from '../game/engine.js';
import { spring, Primary, Ghost, IconBtn, TextInput, Sheet } from './components.jsx';

// editable: en partida local se pueden sumar o quitar jugadores (locked = los que están en juego ahora)
const ScoreSheet = ({ open, onClose, players, target = WIN_SCORE, editable = false, locked = [], onAdd, onRemove, maxPlayers = 12, minPlayers = 2 }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const [newName, setNewName] = useState('');
  const add = () => {
    const n = newName.trim();
    if (!n || players.some((p) => p.name.toLowerCase() === n.toLowerCase())) return;
    onAdd(n);
    setNewName('');
  };
  return (
    <Sheet open={open} onClose={onClose} label="Puntajes">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Puntajes</h2>
              <IconBtn onClick={onClose} aria-label="Cerrar"><X size={18} /></IconBtn>
            </div>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto">
              {sorted.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.05 * i }}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-baseline gap-3">
                      <span className="text-xs text-neutral-500 w-4 tabular-nums">{i + 1}</span>
                      <span className="font-semibold">{p.name}</span>
                    </span>
                    <span className="flex items-baseline gap-4 tabular-nums">
                      <span className="text-xs text-red-400 flex items-center gap-1"><Wine size={12} /> {p.sips}</span>
                      <span className="font-bold w-14 text-right">{p.score}</span>
                      {editable && (
                        <button
                          onClick={() => onRemove(p.name)}
                          disabled={locked.includes(p.name) || players.length <= minPlayers}
                          aria-label={`Quitar a ${p.name}`}
                          className="self-center w-6 h-6 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 disabled:opacity-20"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden ml-7">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (p.score / target) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 + 0.05 * i }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            {editable && players.length < maxPlayers && (
              <div className="flex gap-2 mt-5">
                <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Sumar a alguien que llegó" />
                <IconBtn onClick={add} aria-label="Sumar jugador"><Plus size={18} /></IconBtn>
              </div>
            )}
            {editable && <p className="text-[11px] text-neutral-600 mt-2">No se puede quitar a quien está jugando la carta actual.</p>}
            <p className="text-center text-xs text-neutral-600 mt-5">Gana el primero en llegar a {target} pts</p>
    </Sheet>
  );
};

// Ficha del mazo: en qué consiste, para quién, y medidores para ayudar a elegir
const Meter = ({ label, hint, value }) => (
  <div className="flex items-center justify-between gap-3 py-1.5" title={hint}>
    <span className="text-sm text-neutral-300">{label}</span>
    <span className="flex gap-1" aria-label={`${label}: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-5 h-1.5 rounded-full ${n <= value ? 'bg-gradient-to-r from-red-500 to-purple-500' : 'bg-white/10'}`} />
      ))}
    </span>
  </div>
);

const DeckInfoSheet = ({ deckId, image, selected, onClose, onChoose }) => {
  const d = deckId ? DECKS[deckId] : null;
  const info = d && d.info;
  const lim = deckId ? playerLimits(deckId) : null;
  const counts = d ? d.challenges.reduce((acc, c) => ({ ...acc, [c.intensity]: (acc[c.intensity] || 0) + 1 }), {}) : {};
  const lvl = d && d.levelLabels ? d.levelLabels : { soft: 'suaves', medium: 'medias', hard: 'fuertes' };
  return (
    <Sheet open={!!(d && info)} onClose={onClose} label={d ? `Detalles del mazo ${d.name}` : ''} className="max-h-[88dvh] overflow-y-auto">
      {d && info && (<>
            <div className="flex gap-4 items-start">
              <img src={image} alt="" className="w-20 h-28 rounded-lg object-cover shadow-2xl shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black tracking-tight leading-tight">{d.name}</h2>
                {d.kana && <p className="text-xs text-pink-200/90">{d.kana} · {d.kanji}</p>}
                <p className="text-sm text-neutral-400 mt-1">{d.subtitle}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {d.challenges.length} cartas · {counts.soft || 0} {lvl.soft.toLowerCase()} · {counts.medium || 0} {lvl.medium.toLowerCase()} · {counts.hard || 0} {lvl.hard.toLowerCase()}
                </p>
              </div>
              <IconBtn onClick={onClose} aria-label="Cerrar"><X size={18} /></IconBtn>
            </div>

            <p className="text-[15px] text-neutral-200 leading-relaxed mt-5">{info.description}</p>
            <p className="text-sm text-neutral-400 mt-3"><span className="text-neutral-500">Ideal para: </span>{info.idealFor}</p>

            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                [Users, 'Jugadores', lim.min === lim.max ? `${lim.min}` : `${lim.min}–${lim.max}`],
                [MapPin, 'Dónde', info.where],
                [Clock, 'Duración', info.duration],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                  <Icon size={15} className="text-neutral-500" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-1.5">{label}</p>
                  <p className="text-sm font-semibold leading-tight mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-2">
              {METERS.map((m) => <Meter key={m.key} label={m.label} hint={m.hint} value={info.meters[m.key]} />)}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {info.tags.map((t) => (
                <span key={t} className="text-xs rounded-full border border-white/10 bg-white/[0.04] text-neutral-300 px-2.5 py-1">{t}</span>
              ))}
            </div>

            <div className="mt-6">
              {selected ? (
                <Ghost onClick={onClose} className="w-full py-3.5"><Check size={16} className="text-green-400" /> Mazo elegido</Ghost>
              ) : (
                <Primary onClick={onChoose}>Elegir este mazo</Primary>
              )}
            </div>
      </>)}
    </Sheet>
  );
};

// Confirmación (salir de la partida, cerrar sala…)
const ConfirmSheet = ({ confirm, onClose }) => (
  <Sheet open={!!confirm} onClose={onClose} role="alertdialog" label={confirm ? confirm.title : ''}>
    {confirm && (
      <>
        <h2 className="text-lg font-bold">{confirm.title}</h2>
        <p className="text-sm text-neutral-400 mt-1 mb-6">{confirm.text}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Ghost onClick={onClose} className="py-3.5">Cancelar</Ghost>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { const run = confirm.run; onClose(); run(); }}
            className="rounded-full bg-red-600 hover:bg-red-500 text-white py-3.5 font-bold transition-colors"
          >
            {confirm.ok}
          </motion.button>
        </div>
      </>
    )}
  </Sheet>
);

export { ScoreSheet, DeckInfoSheet, ConfirmSheet };
