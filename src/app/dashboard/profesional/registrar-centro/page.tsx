'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const TIPOS = [
  { value: 'centro_terapeutico',    label: 'Centro Terapéutico' },
  { value: 'centro_rehabilitacion', label: 'Centro de Rehabilitación' },
  { value: 'centro_integracion',    label: 'Centro de Integración' },
  { value: 'consultorio',           label: 'Consultorio' },
  { value: 'otro',                  label: 'Otro' },
];

const SERVICIOS_OPTS = [
  'Fonoaudiología', 'Psicología', 'Terapia Ocupacional', 'Kinesiología',
  'Estimulación Temprana', 'Integración Escolar', 'Centro de Día',
  'Rehabilitación Motriz', 'Apoyo Escolar', 'Natación Terapéutica',
];

const DISCAPACIDADES = [
  'TEA', 'Motriz', 'Intelectual', 'Visual', 'Auditiva', 'Múltiple', 'Down',
];

export default function RegistrarCentroPage() {
  const { token } = useAuth();
  const router    = useRouter();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    nombre:            '',
    tipo:              '',
    descripcion:       '',
    domicilio:         '',
    barrio:            '',
    localidad:         '',
    provincia:         '',
    telefono:          '',
    email:             '',
    whatsapp:          '',
    website:           '',
    servicios:         [] as string[],
    tiposDiscapacidad: [] as string[],
  });

  const update = (key: string, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggle = (key: 'servicios' | 'tiposDiscapacidad', val: string) =>
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter(x => x !== val)
        : [...prev[key], val],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo || !form.domicilio || !form.localidad || !form.provincia) {
      setError('Completá los campos obligatorios marcados con *');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/centros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar el centro');
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
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 block"
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrar Centro</h1>
      <p className="text-gray-500 mb-8">
        Tu centro aparecerá en el mapa para que las familias puedan encontrarte
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Nombre y tipo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Nombre *
            </label>
            <input
              value={form.nombre}
              onChange={e => update('nombre', e.target.value)}
              placeholder="Nombre del centro"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Tipo *
            </label>
            <select
              value={form.tipo}
              onChange={e => update('tipo', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Seleccioná el tipo</option>
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
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
            placeholder="Describí los servicios que ofrecés..."
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

        {/* Servicios */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Servicios que ofrecés
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICIOS_OPTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggle('servicios', s)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors
                  ${form.servicios.includes(s)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
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
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registrando...' : 'Registrar mi centro'}
        </button>
      </form>
    </div>
  );
}
