'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastCtx { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

const BG: Record<ToastType, string> = {
  success: '#22c55e',
  error:   '#ef4444',
  info:    '#4f46e5',
};
const ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    // Contador propio en vez de Date.now(): dos toasts en el mismo milisegundo
    // (llamadas seguidas, gestos repetidos) compartirían id y se borrarían entre sí.
    const id = ++nextIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            style={{ backgroundColor: BG[t.type] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs w-full animate-fade-in">
            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {ICON[t.type]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
