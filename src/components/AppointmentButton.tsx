'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Props {
  professionalId: string;
  professionalName: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmada', color: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-50 text-red-600' },
  completed: { label: 'Completada', color: 'bg-gray-100 text-gray-600' },
};

export function AppointmentButton({ professionalId, professionalName }: Props) {
  const { token, appUser } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', time: '10:00', duration: 60, notes: '' });

  const handleSubmit = async () => {
    if (!token) { toast('Iniciá sesión para solicitar una cita', 'error'); return; }
    if (!form.date) { toast('Seleccioná una fecha', 'error'); return; }

    setSaving(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}:00`);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          professionalId,
          date:            dateTime.toISOString(),
          durationMinutes: form.duration,
          notes:           form.notes || null,
        }),
      });
      if (res.ok) {
        toast(`Cita solicitada a ${professionalName}. Te confirmará a la brevedad.`, 'success');
        setShowModal(false);
        setForm({ date: '', time: '10:00', duration: 60, notes: '' });
      } else {
        toast('No se pudo solicitar la cita', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
        📅 Solicitar cita
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Solicitar cita</h3>
            <p className="text-sm text-gray-500 mb-5">con {professionalName}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Fecha</label>
                <input type="date" min={minDateStr} value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Horario</label>
                <input type="time" value={form.time}
                  onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Duración</label>
                <select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1 hora 30 min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Notas (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Descripción breve del motivo..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={saving || !form.date}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Enviando…' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
