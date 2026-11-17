import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const sequence = useRef(0);
  const removeToast = useCallback(id => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(current => current.filter(t => t.id !== id));
  }, []);
  const addToast = useCallback((message, type = 'success') => {
    const id = ++sequence.current;
    setToasts(current => [...current, { id, message, type }]);
    timers.current.set(id, setTimeout(() => removeToast(id), 5000));
  }, [removeToast]);
  useEffect(() => () => { for (const timer of timers.current.values()) clearTimeout(timer); }, []);
  return <ToastContext.Provider value={{ addToast }}>{children}<div aria-live="polite" aria-atomic="false" className="toast-stack">{toasts.map(t => <div className={`toast ${t.type === 'error' ? 'toast-error' : ''}`} key={t.id}><span>{t.message}</span><button type="button" onClick={() => removeToast(t.id)} aria-label="Fermer la notification">×</button></div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
