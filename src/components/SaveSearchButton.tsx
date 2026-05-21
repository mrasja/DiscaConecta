'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Props {
  filters: Record<string, any>;
}

export function SaveSearchButton({ filters }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alertPush, setAlertPush] = useState(true);
  const [isUrgent, setIsUrgent]   = useState(false);

  const save = async () => {
    if (!token) { toast('Iniciá sesión para guardar búsquedas', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filters, alertPush, isUrgent }),
      });
      if (res.ok) {
        setSaved(true);
        setShowModal(false);
        toast('Búsqueda guardada. Te avisaremos si aparecen nuevos resultados.', 'success');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => saved ? toast('Esta búsqueda ya está guardada', 'info') : setShowModal(true)}
        aria-label="Guardar búsqueda"
        title={saved ? 'Búsqueda guardada' : 'Guardar esta búsqueda'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
          ${saved
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
        {saved ? '✓ Guardada' : '🔔 Guardar búsqueda'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Guardar esta búsqueda</h3>
            <p className="text-sm text-gray-500 mb-4">
              Te notificamos cuando aparezcan nuevos profesionales que coincidan con tus filtros actuales.
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={alertPush}
                    onChange={e => setAlertPush(e.target.checked)} />
                  <div className={`w-10 h-5 rounded-full transition-colors ${alertPush ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${alertPush ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Recibir notificaciones push</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isUrgent}
                    onChange={e => setIsUrgent(e.target.checked)} />
                  <div className={`w-10 h-5 rounded-full transition-colors ${isUrgent ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${isUrgent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <span className="text-sm text-gray-700">Búsqueda urgente 🚨</span>
                  <p className="text-xs text-gray-400">Notifica a profesionales disponibles de inmediato</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
