// Invitación a instalar la app, como se estila en las apps web instalables (PWA):
// - Android / computador (Chrome, Edge…): botón "Instalar" que abre la ventana nativa.
// - iPhone / iPad: Apple no permite instalar con un botón, así que se muestra un instructivo.
// - Otros navegadores: instructivo genérico por el menú del navegador.
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, SquarePlus, EllipsisVertical, Check } from 'lucide-react';
import { IconBtn, Primary, Sheet } from './components.jsx';

const DISMISS_KEY = 'chuto15:install-dismissed';
const DISMISS_DAYS = 7;

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const IS_IOS = /iphone|ipad|ipod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /android/i.test(ua);

const isStandalone = () =>
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true);

const wasDismissed = () => {
  try {
    const t = Number(window.localStorage.getItem(DISMISS_KEY));
    return t && Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// Captura el evento de instalación del navegador (Chrome/Edge/Android)
export const useInstallPrompt = () => {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    setPrompt(null);
    if (choice && choice.outcome === 'accepted') setInstalled(true);
    return true;
  };
  return { prompt, installed, standalone: isStandalone(), install, clear: () => setPrompt(null) };
};

const Step = ({ n, icon: Icon, children }) => (
  <li className="flex items-start gap-3">
    <span className="w-7 h-7 shrink-0 rounded-full bg-white/10 text-sm font-bold flex items-center justify-center">{n}</span>
    <span className="pt-0.5 text-[15px] text-neutral-200 leading-snug">
      {children}
      {Icon && <Icon size={17} className="inline-block ml-1.5 -mt-0.5 text-sky-300" />}
    </span>
  </li>
);

// Instructivo según el dispositivo
export const InstallSheet = ({ open, onClose }) => (
  <Sheet open={open} onClose={onClose} label="Cómo instalar Chuto15">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold">Instala Chuto15</h2>
      <IconBtn onClick={onClose} aria-label="Cerrar"><X size={18} /></IconBtn>
    </div>
    <p className="text-sm text-neutral-400 mb-5">Queda con su ícono en tu pantalla de inicio, se abre en pantalla completa y carga más rápido. No ocupa casi espacio.</p>
    {IS_IOS ? (
      <ol className="space-y-4">
        <Step n={1} icon={Share}>Toca el botón <b>Compartir</b> de Safari (abajo en iPhone, arriba en iPad)</Step>
        <Step n={2} icon={SquarePlus}>Baja y elige <b>Agregar a pantalla de inicio</b></Step>
        <Step n={3}>Toca <b>Agregar</b>, arriba a la derecha</Step>
      </ol>
    ) : IS_ANDROID ? (
      <ol className="space-y-4">
        <Step n={1} icon={EllipsisVertical}>Abre el <b>menú del navegador</b> (los tres puntos)</Step>
        <Step n={2}>Elige <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b></Step>
        <Step n={3}>Confirma con <b>Instalar</b></Step>
      </ol>
    ) : (
      <ol className="space-y-4">
        <Step n={1} icon={Download}>En la barra de direcciones, toca el ícono de <b>instalar</b> (o abre el menú del navegador)</Step>
        <Step n={2}>Elige <b>Instalar Chuto15</b></Step>
        <Step n={3}>La app se abrirá en su propia ventana</Step>
      </ol>
    )}
    {IS_IOS && (
      <p className="text-xs text-neutral-500 mt-5">Si usas Chrome en iPhone, el botón Compartir está arriba a la derecha.</p>
    )}
    <div className="mt-6"><Primary onClick={onClose}>Entendido</Primary></div>
  </Sheet>
);

// Aviso compacto al entrar. Se oculta si la app ya está instalada o si se cerró hace menos de 7 días.
export const InstallBanner = ({ install }) => {
  const [hidden, setHidden] = useState(() => wasDismissed());
  const [sheet, setSheet] = useState(false);
  const show = !hidden && !install.installed && !install.standalone;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  };
  const onInstall = async () => {
    if (install.prompt) await install.install();
    else setSheet(true);
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, height: 0 }}
            className="pointer-events-auto mt-5 flex items-center gap-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-2.5 pl-3"
            role="region" aria-label="Instalar la app"
          >
            <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight whitespace-nowrap">Instala la app</span>
              <span className="block text-xs text-neutral-400 leading-tight truncate">Pantalla completa, abre al toque</span>
            </span>
            <button onClick={onInstall} className="shrink-0 rounded-full bg-white text-black text-sm font-bold px-4 py-2">
              {install.prompt ? 'Instalar' : 'Cómo instalar'}
            </button>
            <button onClick={dismiss} aria-label="Ahora no" className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-white">
              <X size={15} />
            </button>
          </motion.div>
        )}
        {install.installed && !install.standalone && !hidden && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 text-center text-xs text-green-400 flex items-center justify-center gap-1.5">
            <Check size={14} /> App instalada: ábrela desde tu pantalla de inicio
          </motion.p>
        )}
      </AnimatePresence>
      <InstallSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
};
