'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function TermsAcceptModal() {
  const { appUser, token, refreshUser } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  // Solo mostrar si hay usuario logueado sin términos aceptados
  const needsAcceptance = appUser && !(appUser as any).terms_accepted_at;
  if (!needsAcceptance) return null;

  const handleAccept = async () => {
    if (!acceptedTerms || !ageConfirmed) {
      setError('Debés marcar ambas casillas para continuar.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ terms_accepted_at: new Date().toISOString() }),
      });
      await refreshUser();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="w-14 h-14 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-5">
          <span className="text-white text-2xl font-bold">D</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Antes de continuar
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Actualizamos nuestros términos. Necesitamos tu confirmación para seguir usando DiscaConecta.
        </p>

        <div className="space-y-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              Acepto los{' '}
              <Link href="/terminos" target="_blank" className="text-indigo-600 underline font-medium">
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" target="_blank" className="text-indigo-600 underline font-medium">
                Política de Privacidad
              </Link>{' '}
              de DiscaConecta, incluyendo el tratamiento de datos personales y sensibles.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={e => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              Soy mayor de 13 años o actúo como representante legal de un menor.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={loading || !acceptedTerms || !ageConfirmed}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Aceptar y continuar'}
        </button>
      </div>
    </div>
  );
}
