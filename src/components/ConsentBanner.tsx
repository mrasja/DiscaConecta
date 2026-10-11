'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'discaconecta_consent_v1';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const essential = () => {
    localStorage.setItem(CONSENT_KEY, 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de privacidad"
      className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-gray-200 shadow-lg px-4 py-4 sm:px-6"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-600 leading-relaxed">
          <p>
            DiscaConecta recolecta datos personales, incluyendo datos sensibles de discapacidad (con tu consentimiento
            explícito), para conectarte con profesionales. Al continuar, aceptás nuestra{' '}
            <Link href="/privacidad" className="text-indigo-600 underline font-medium">Política de Privacidad</Link>{' '}
            y los{' '}
            <Link href="/terminos" className="text-indigo-600 underline font-medium">Términos y Condiciones</Link>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={essential}
            className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
