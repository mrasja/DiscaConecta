'use client';
import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOffline(!navigator.onLine);

    const onOffline = () => { setOffline(true); setWasOffline(true); };
    const onOnline  = () => {
      setOffline(false);
      if (wasOffline) {
        setShowBack(true);
        setTimeout(() => setShowBack(false), 3000);
      }
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online',  onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online',  onOnline);
    };
  }, [wasOffline]);

  if (!offline && !showBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] text-center text-sm py-2 px-4 font-medium transition-colors"
      style={{ backgroundColor: offline ? '#f59e0b' : '#22c55e', color: 'white' }}>
      {offline
        ? '⚠️ Sin conexión — algunas funciones no están disponibles'
        : '✓ Conexión restaurada'}
    </div>
  );
}
