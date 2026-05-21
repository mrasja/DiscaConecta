'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Appointment {
  id: string;
  date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  professional_id: string;
  student_id: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmada', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-50 text-red-600 border-red-200' },
  completed: { label: 'Completada', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

interface Props {
  role: 'professional' | 'student';
}

export function AppointmentsList({ role }: Props) {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    const res = await fetch(`/api/appointments?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled');
  const past     = appointments.filter(a => new Date(a.date) < new Date()  || a.status === 'cancelled');

  if (loading) return <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto my-4" />;
  if (!appointments.length) return (
    <p className="text-sm text-gray-400 text-center py-4">No tenés citas agendadas.</p>
  );

  return (
    <div className="space-y-3">
      {upcoming.map(a => {
        const d = new Date(a.date);
        const s = STATUS[a.status] ?? STATUS.pending;
        return (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' · '}
                  {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{a.duration_minutes} minutos{a.notes ? ` · ${a.notes}` : ''}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${s.color}`}>
                {s.label}
              </span>
            </div>
            {role === 'professional' && a.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => updateStatus(a.id, 'confirmed')}
                  className="flex-1 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => updateStatus(a.id, 'cancelled')}
                  className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Rechazar
                </button>
              </div>
            )}
            {role === 'professional' && a.status === 'confirmed' && (
              <button onClick={() => updateStatus(a.id, 'completed')}
                className="mt-3 w-full py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                Marcar como completada
              </button>
            )}
          </div>
        );
      })}
      {past.length > 0 && (
        <p className="text-xs text-gray-400 pt-2 text-center">{past.length} cita{past.length !== 1 ? 's' : ''} pasada{past.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
