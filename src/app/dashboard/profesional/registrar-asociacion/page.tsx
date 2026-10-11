'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BackHeader } from '@/components/BackHeader';
import { DISCIPLINA_OPTIONS } from '@/types';

const DISCAPACIDADES = [
  'TEA', 'Motriz', 'Intelectual', 'Visual', 'Auditiva', 'Múltiple', 'Down',
];

export default function RegistrarAsociacionPage() {
  const { token } = useAuth();
  const router    = useRouter();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    nombre:            '',
    descripcion:       '',
    domicilio:         '',
    barrio:            '',
    localidad:         '',
    provincia:         '',
    telefono:          '',
    email:             '',
    whatsapp:          '',
    website:           '',
    disciplinas:       [] as string[],
    tiposDiscapacidad: [] as string[],
  });

  const update = (key: string, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggle = (key: 'disciplinas' | 'tiposDiscapacidad', val: string) =>
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter(x => x !== val)
        : [...prev[key], val],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.domicilio || !form.localidad || !form.provincia) {
      setError('Completá los campos obligatorios marcados con *');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/asociaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar la asociación');
      }
      router.push('/dashboard/profesional');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BackHeader title="Registrar mi asociación" />
      <p className="text-gray-500 mb-8">
        Tu asociación aparecerá en el mapa para que las familias puedan encontrarla
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Nombre *
          </label>
          <input
            value={form.nombre}
            onChange={e => update('nombre', e.target.value)}
            placeholder="Nombre de la asociación"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={e => update('descripcion', e.target.value)}
            rows={3}
            placeholder="Describí las actividades que ofrecés..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Dirección *
          </label>
          <input
            value={form.domicilio}
            onChange={e => update('domicilio', e.target.value)}
            placeholder="Av. Corrientes 1234"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            value={form.barrio}
            onChange={e => update('barrio', e.target.value)}
            placeholder="Barrio"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            value={form.localidad}
            onChange={e => update('localidad', e.target.value)}
            placeholder="Localidad *"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            value={form.provincia}
            onChange={e => update('provincia', e.target.value)}
            placeholder="Provincia *"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-2 gap-4">
          <input
            value={form.telefono}
            onChange={e => update('telefono', e.target.value)}
            placeholder="Teléfono"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            value={form.whatsapp}
            onChange={e => update('whatsapp', e.target.value)}
            placeholder="WhatsApp"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="Email"
            type="email"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            value={form.website}
            onChange={e => update('website', e.target.value)}
            placeholder="Sitio web"
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Disciplinas */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Disciplinas / actividades
          </label>
          <div className="flex flex-wrap gap-2">
            {DISCIPLINA_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggle('disciplinas', d)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${form.disciplinas.includes(d)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Discapacidades */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Discapacidades que atienden
          </label>
          <div className="flex flex-wrap gap-2">
            {DISCAPACIDADES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggle('tiposDiscapacidad', d)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${form.tiposDiscapacidad.includes(d)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registrando...' : 'Registrar mi asociación'}
        </button>
      </form>
    </div>
  );
}
