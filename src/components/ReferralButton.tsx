'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Props {
  professionalId: string;
  professionalName: string;
}

export function ReferralButton({ professionalId, professionalName }: Props) {
  const { token, appUser } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  const send = async () => {
    if (!token || appUser?.role !== 'profesional') return;
    setSending(true);
    try {
      // Enviamos una derivación como mensaje especial al profesional
      const profileUrl = `${window.location.origin}/profesional/${professionalId}`;
      const text = `📋 Derivación de colega\n\nTe comparto el perfil de ${professionalName} como referencia para un paciente.\n${note ? `\nNota: ${note}\n` : ''}${profileUrl}`;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: (appUser as any).id, message: text }),
      });

      // Compartir via Web Share API como alternativa más simple
      if (navigator.share) {
        await navigator.share({
          title: `Derivación: ${professionalName}`,
          text: note || `Te derivo a ${professionalName} para este caso.`,
          url: profileUrl,
        });
        toast('Derivación compartida', 'success');
      } else {
        await navigator.clipboard.writeText(`Derivación a ${professionalName}: ${profileUrl}${note ? `\n${note}` : ''}`);
        toast('Enlace de derivación copiado al portapapeles', 'success');
      }
      setShowModal(false);
      setNote('');
    } catch {
      toast('No se pudo compartir la derivación', 'error');
    } finally {
      setSending(false);
    }
  };

  if (appUser?.role !== 'profesional') return null;

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
        🔀 Derivar colega
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Derivar a colega</h3>
            <p className="text-sm text-gray-500 mb-4">Compartí el perfil de <strong>{professionalName}</strong> con otro profesional o familia.</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={3} placeholder="Nota opcional sobre el caso..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={send} disabled={sending}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {sending ? 'Compartiendo…' : 'Compartir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
