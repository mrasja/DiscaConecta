'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PROFESIONES = [
  { value: 'acompanante_terapeutico', label: 'Acompañante Terapéutico (AT)' },
  { value: 'enfermera',               label: 'Enfermera/o' },
  { value: 'docente_especial',        label: 'Docente de Educación Especial' },
  { value: 'psicologo',               label: 'Psicólogo/a' },
  { value: 'fonoaudiologo',           label: 'Fonoaudiólogo/a' },
  { value: 'otro',                    label: 'Otro' },
];

const ESPECIALIDADES = [
  'tea', 'visual', 'auditiva', 'motriz', 'intelectual',
  'multiple', 'down', 'paralisis cerebral', 'hidrocefalia',
];

export default function RegistrarseProPage() {
  const { token } = useAuth();
  const router    = useRouter();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    profession:      '',
    licenseNumber:   '',
    bio:             '',
    specialties:     [] as string[],
    workZones:       '',
    city:            '',
    province:        '',
    address:         '',
    contactPhone:    '',
    contactWhatsapp: '',
    isAvailable:     true,
  });

  const update = (key: string, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleSpec = (s: string) =>
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profession || !form.city || !form.province) {
      setError('Completá profesión, ciudad y provincia');
      return;
    }
    if (form.specialties.length === 0) {
      setError('Seleccioná al menos una especialidad');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          workZones: form.workZones
            .split(',')
            .map(z => z.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar');
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Registrarse como Profesional
      </h1>
      <p className="text-gray-500 mb-8">
        Completá tu perfil para aparecer en las búsquedas
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Profesión */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Profesión *
          </label>
          <select
            value={form.profession}
            onChange={e => update('profession', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Seleccioná tu profesión</option>
            {PROFESIONES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Matrícula */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Matrícula / Nº de Registro
          </label>
          <input
            value={form.licenseNumber}
            onChange={e => update('licenseNumber', e.target.value)}
            placeholder="Ej: AT-12345"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Tu matrícula será verificada por el equipo de Discapp
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Descripción / Bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => update('bio', e.target.value)}
            rows={3}
            placeholder="Contá tu experiencia y enfoque de trabajo..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Especialidades */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Especialidades *
          </label>
          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors
                  ${form.specialties.includes(s)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Zonas */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Zonas donde trabajás *
          </label>
          <input
            value={form.workZones}
            onChange={e => update('workZones', e.target.value)}
            placeholder="Ej: Palermo, Recoleta, Belgrano"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">Separadas por coma</p>
        </div>

        {/* Ciudad y Provincia */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Ciudad *
            </label>
            <input
              value={form.city}
              onChange={e => update('city', e.target.value)}
              placeholder="Buenos Aires"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Provincia *
            </label>
            <input
              value={form.province}
              onChange={e => update('province', e.target.value)}
              placeholder="Buenos Aires"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Dirección
          </label>
          <input
            value={form.address}
            onChange={e => update('address', e.target.value)}
            placeholder="Av. Corrientes 1234"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Teléfono
            </label>
            <input
              value={form.contactPhone}
              onChange={e => update('contactPhone', e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              WhatsApp
            </label>
            <input
              value={form.contactWhatsapp}
              onChange={e => update('contactWhatsapp', e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Registrarme como profesional'}
        </button>
      </form>
    </div>
  );
}
