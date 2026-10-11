'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/Logo';

const CONTACT_EMAIL = 'm_rasja@hotmail.com';

// Página pública de solicitud de borrado de cuenta/datos — accesible sin tener
// la app instalada ni logueado (requisito de Google Play). El borrado en sí
// requiere sesión para evitar que cualquiera pida borrar la cuenta de otra
// persona con solo saber su email; quien no pueda loguearse tiene la vía email.
export default function EliminarCuentaPage() {
  const { appUser, token, loading } = useAuth();
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!token || !confirm || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/users/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError('No se pudo enviar la solicitud. Probá de nuevo o escribinos por email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LogoMark className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">DiscaConecta</span>
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 text-sm">Eliminar cuenta y datos</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Eliminar tu cuenta y tus datos</h1>
        <p className="text-gray-500 text-sm mb-8">
          Esta página funciona sin necesidad de tener la app instalada, conforme a las políticas de Google Play.
        </p>

        <section className="mb-8 space-y-3 text-gray-600 leading-relaxed">
          <p>Al solicitar la eliminación de tu cuenta:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Se eliminan tu perfil, datos de contacto y <strong>todos los datos sensibles de discapacidad</strong> que hayas cargado.</li>
            <li>Se eliminan tus reseñas, favoritos, búsquedas guardadas y mensajes.</li>
            <li>El proceso se completa en un <strong>plazo máximo de 30 días hábiles</strong>.</li>
            <li>Algunos datos pueden conservarse más tiempo solo si existe una obligación legal de hacerlo.</li>
          </ul>
          <p>
            Para más detalle sobre qué datos tratamos y tus derechos, consultá nuestra{' '}
            <Link href="/privacidad" className="text-indigo-600 underline">Política de Privacidad</Link>.
          </p>
        </section>

        <section className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">✓</p>
              <p className="font-semibold text-gray-900">Solicitud enviada</p>
              <p className="text-sm text-gray-500 mt-1">
                Procesaremos la eliminación en un plazo máximo de 30 días hábiles.
              </p>
            </div>
          ) : !appUser ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-4">
                Para identificar cuál es tu cuenta, primero iniciá sesión. Después volvé a esta misma página
                (<code className="bg-gray-100 px-1 rounded">/eliminar-cuenta</code>) para confirmar el borrado.
              </p>
              <Link href="/login"
                className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Vas a solicitar la eliminación de la cuenta <strong>{(appUser as any).email}</strong>.
              </p>
              <div>
                <label htmlFor="reason" className="block text-xs font-medium text-gray-500 mb-1">
                  Motivo (opcional)
                </label>
                <textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)}
                  className="mt-0.5 rounded accent-indigo-600 w-4 h-4 flex-shrink-0" />
                Entiendo que esta acción eliminará mi cuenta y mis datos de forma permanente.
              </label>
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button onClick={submit} disabled={!confirm || sending}
                className="w-full bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {sending ? 'Enviando…' : 'Solicitar eliminación de mi cuenta'}
              </button>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-400 mt-8 text-center">
          ¿No podés iniciar sesión? Escribinos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>{' '}
          desde el email de tu cuenta y procesamos el pedido manualmente.
        </p>
      </main>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terminos" className="hover:text-gray-600">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-gray-600">Política de Privacidad</Link>
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
        </div>
        <p>© {new Date().getFullYear()} DiscaConecta</p>
      </footer>
    </div>
  );
}
