// Piezas de interfaz reutilizables
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { TARGETS } from '../game/engine.js';

// ---------- Interfaz ----------
const spring = { type: 'spring', stiffness: 380, damping: 30 };

const Logo = ({ small = false }) => (
  <motion.h1
    layout
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={spring}
    className={`font-black tracking-tighter italic -skew-x-6 select-none text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 drop-shadow-[0_0_14px_rgba(220,38,38,0.45)] ${small ? 'text-2xl' : 'text-6xl'}`}
    aria-label="Chuto 15"
  >
    CHUTO<span className="text-white">15</span>
  </motion.h1>
);

const fade = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { ...spring, staggerChildren: 0.07 } },
  exit: { opacity: 0, y: 16, transition: { duration: 0.18 } },
};

const item = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: spring } };

const Glass = ({ className = '', children }) => (
  <motion.div variants={item} className={`rounded-3xl bg-black/45 backdrop-blur-xl border border-white/10 ${className}`}>
    {children}
  </motion.div>
);

const Primary = ({ className = '', children, ...rest }) => (
  <motion.button
    whileTap={rest.disabled ? undefined : { scale: 0.96 }}
    className={`w-full rounded-full py-4 font-bold text-white bg-gradient-to-r from-red-600 to-purple-700 shadow-[0_0_30px_rgba(220,38,38,0.35)] disabled:opacity-30 disabled:shadow-none transition-opacity ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

const Ghost = ({ className = '', children, ...rest }) => (
  <motion.button
    whileTap={rest.disabled ? undefined : { scale: 0.94 }}
    className={`rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-neutral-300 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-white/[0.08] transition-colors ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

const IconBtn = ({ children, ...rest }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
    {...rest}
  >
    {children}
  </motion.button>
);

// Selector de meta (200 / 400 / 600 pts)
const TargetPicker = ({ value, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Meta</span>
    <div className="flex gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10">
      {TARGETS.map((t) => (
        <button
          key={t}
          disabled={disabled}
          onClick={() => onChange(t)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${value === t ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'} disabled:hover:text-neutral-400`}
        >
          {t} pts
        </button>
      ))}
    </div>
  </div>
);

const Header = ({ onBack, right }) => (
  <motion.div variants={item} className="relative flex items-center justify-between h-10">
    {onBack ? <IconBtn onClick={onBack} aria-label="Volver"><ChevronLeft size={18} /></IconBtn> : <span className="w-10" />}
    <span className="absolute left-1/2 -translate-x-1/2"><Logo small /></span>
    <span className="flex items-center gap-2">{right || <span className="w-10" />}</span>
  </motion.div>
);

const Title = ({ kicker, children }) => (
  <motion.div variants={item} className="text-center mt-6">
    {kicker && <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-1">{kicker}</p>}
    <h2 className="text-2xl font-black tracking-tight">{children}</h2>
  </motion.div>
);

const TextInput = (props) => (
  <input
    type="text"
    maxLength={16}
    className="w-full min-w-0 rounded-full bg-white/[0.05] border border-white/10 px-5 py-3 placeholder:text-neutral-600 focus:outline-none focus:border-red-500/60 transition-colors"
    {...props}
  />
);

const Option = ({ active, onClick, children, className = '' }) => (
  <motion.button
    variants={item}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-full text-left rounded-3xl border backdrop-blur-xl transition-colors ${active ? 'border-red-500/60 bg-red-500/[0.08]' : 'border-white/10 bg-black/45 hover:bg-white/[0.05]'} ${className}`}
  >
    {children}
  </motion.button>
);

// Hoja que sube desde abajo (puntajes, ficha del mazo, confirmaciones)
const Sheet = ({ open, onClose, label, role = 'dialog', className = '', children }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          role={role}
          aria-label={label}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className={`relative w-full max-w-md rounded-t-[2rem] bg-[#111014]/95 border-t border-white/10 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] ${className}`}
        >
          <div className="mx-auto w-10 h-1 rounded-full bg-white/15 mb-5" />
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export { spring, fade, item, Logo, Glass, Primary, Ghost, IconBtn, TargetPicker, Header, Title, TextInput, Option, Sheet };
