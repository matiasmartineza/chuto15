// Guarda la partida en el teléfono para retomarla si la app se cierra o se recarga.
const KEY = 'chuto15:partida';
const ID_KEY = 'chuto15:id';
const MAX_AGE = 12 * 60 * 60 * 1000; // 12 horas

const store = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// Identificador estable de este teléfono (para volver a tomar tu lugar en una sala)
export const getClientId = () => {
  const s = store();
  let id = null;
  try { id = s && s.getItem(ID_KEY); } catch {}
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { if (s) s.setItem(ID_KEY, id); } catch {}
  }
  return id;
};

export const saveSession = (data) => {
  try { store().setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
};

export const loadSession = () => {
  try {
    const raw = store().getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || Date.now() - data.savedAt > MAX_AGE) return null;
    return data;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  try { store().removeItem(KEY); } catch {}
};
