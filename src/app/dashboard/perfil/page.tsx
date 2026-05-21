'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/firebase';
import { BackHeader } from '@/components/BackHeader';
import { AvatarUpload } from '@/components/AvatarUpload';
import { AccessibilityControls } from '@/components/AccessibilityControls';

const DISABILITY_OPTIONS = [
  { value: 'visual',      label: 'Visual' },
  { value: 'auditiva',    label: 'Auditiva' },
  { value: 'motriz',      label: 'Motriz' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'tea',         label: 'TEA' },
  { value: 'multiple',    label: 'Múltiple' },
];

const ROLE_LABEL: Record<string, string> = {
  alumno:      'Alumno / Familia',
  profesional: 'Profesional',
  admin:       'Administrador',
  sin_rol:     'Sin definir',
};

export default function PerfilPage() {
  const { appUser, token, refreshUser } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [nombre, setNombre]   = useState((appUser as any)?.full_name || appUser?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  // Perfil alumno
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    disabilityTypes: [] as string[],
    city: '', province: '', contactPhone: '', description: '',
    needsCompanion: false, needsNurse: false, isVisible: true,
  });
  const [savingStudent, setSavingStudent] = useState(false);

  useEffect(() => {
    if (appUser?.role !== 'alumno' || !token) return;
    fetch('/api/students/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setStudentProfile(data);
          setStudentForm({
            disabilityTypes: data.disability_types || [],
            city:            data.city || '',
            province:        data.province || '',
            contactPhone:    data.contact_phone || '',
            description:     data.description || '',
            needsCompanion:  data.needs_companion || false,
            needsNurse:      data.needs_nurse || false,
            isVisible:       data.is_visible ?? true,
          });
        }
      });
  }, [appUser?.role, token]);

  const saveStudentProfile = async () => {
    if (!token) return;
    setSavingStudent(true);
    try {
      const res = await fetch('/api/students/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(studentForm),
      });
      if (res.ok) {
        setStudentProfile(await res.json());
        setEditingStudent(false);
        setSuccess('Perfil actualizado');
      }
    } finally {
      setSavingStudent(false);
    }
  };

  const toggleDisability = (val: string) =>
    setStudentForm(prev => ({
      ...prev,
      disabilityTypes: prev.disabilityTypes.includes(val)
        ? prev.disabilityTypes.filter(d => d !== val)
        : [...prev.disabilityTypes, val],
    }));

  const user = appUser as any;

  const handleSave = async () => {
    if (!token || !nombre.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: nombre }),
      });
      if (!res.ok) throw new Error();
      await refreshUser();
      setSuccess('Datos actualizados correctamente');
      setEditing(false);
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!token) return;
    await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar_url: url }),
    });
    await refreshUser();
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const backTo = appUser?.role === 'profesional'
    ? '/dashboard/profesional'
    : appUser?.role === 'admin'
    ? '/dashboard/admin'
    : '/dashboard/alumno';

  return (
    <div className="min-h-screen bg-gray-50">
      <BackHeader title="Mi perfil" fallback={backTo} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Avatar y nombre */}
        <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-sm border border-gray-100">
          <AvatarUpload
            current={user?.avatar_url || appUser?.avatarUrl}
            name={user?.full_name || appUser?.fullName}
            onUpload={handleAvatarUpload}
          />
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.full_name || appUser?.fullName}</p>
            <p className="text-sm text-gray-500">{user?.email || appUser?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
              {ROLE_LABEL[appUser?.role || 'sin_rol'] || appUser?.role}
            </span>
          </div>
        </div>

        {/* Editar nombre */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Datos personales</h2>
            {!editing && (
              <button onClick={() => { setEditing(true); setSuccess(''); setError(''); }}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 no-min">
                Editar
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Nombre completo</label>
              {editing
                ? <input value={nombre} onChange={e => setNombre(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                : <p className="mt-1 text-gray-800 text-sm">{user?.full_name || appUser?.fullName}</p>
              }
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
              <p className="mt-1 text-gray-800 text-sm">{user?.email || appUser?.email}</p>
            </div>
          </div>
          {editing && (
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditing(false); setNombre(user?.full_name || appUser?.fullName || ''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          )}
          {success && <p className="mt-3 text-green-600 text-sm">{success}</p>}
          {error   && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        </div>

        {/* Perfil familia/alumno — solo para rol alumno */}
        {appUser?.role === 'alumno' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Perfil familiar</h2>
              {!editingStudent && (
                <button onClick={() => setEditingStudent(true)}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800 no-min">
                  {studentProfile ? 'Editar' : 'Completar perfil'}
                </button>
              )}
            </div>

            {!editingStudent ? (
              studentProfile ? (
                <div className="space-y-2 text-sm text-gray-700">
                  {studentProfile.disability_types?.length > 0 && (
                    <p><span className="font-medium">Discapacidades:</span> {studentProfile.disability_types.join(', ')}</p>
                  )}
                  {studentProfile.city && <p><span className="font-medium">Ciudad:</span> {studentProfile.city}{studentProfile.province ? `, ${studentProfile.province}` : ''}</p>}
                  {studentProfile.contact_phone && <p><span className="font-medium">Teléfono:</span> {studentProfile.contact_phone}</p>}
                  {studentProfile.description && <p className="text-gray-500 italic">"{studentProfile.description}"</p>}
                  <div className="flex gap-3 pt-1">
                    {studentProfile.needs_companion && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">Necesita AT</span>}
                    {studentProfile.needs_nurse     && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">Necesita enfermero/a</span>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Completá tu perfil para que los profesionales puedan encontrarte.</p>
              )
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tipo de discapacidad</p>
                  <div className="flex flex-wrap gap-2">
                    {DISABILITY_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => toggleDisability(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors no-min
                          ${studentForm.disabilityTypes.includes(opt.value)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Ciudad</label>
                    <input value={studentForm.city} onChange={e => setStudentForm(p => ({ ...p, city: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Provincia</label>
                    <input value={studentForm.province} onChange={e => setStudentForm(p => ({ ...p, province: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Teléfono de contacto</label>
                  <input value={studentForm.contactPhone} onChange={e => setStudentForm(p => ({ ...p, contactPhone: e.target.value }))}
                    type="tel" className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Descripción breve</label>
                  <textarea value={studentForm.description} onChange={e => setStudentForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Contanos brevemente sobre el familiar y sus necesidades..."
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={studentForm.needsCompanion}
                      onChange={e => setStudentForm(p => ({ ...p, needsCompanion: e.target.checked }))}
                      className="rounded accent-indigo-600 w-4 h-4" />
                    Necesita AT
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={studentForm.needsNurse}
                      onChange={e => setStudentForm(p => ({ ...p, needsNurse: e.target.checked }))}
                      className="rounded accent-indigo-600 w-4 h-4" />
                    Necesita enfermero/a
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveStudentProfile} disabled={savingStudent}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {savingStudent ? 'Guardando…' : 'Guardar perfil'}
                  </button>
                  <button onClick={() => setEditingStudent(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accesibilidad */}
        <AccessibilityControls />

        {/* Seguridad */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Seguridad</h2>
          <div className="space-y-3">
            {[
              { label: 'Doble factor (2FA)', desc: 'Google Authenticator, etc.' },
              { label: 'Huella / Face ID', desc: 'Biometría del dispositivo (WebAuthn)' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium no-min">
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={handleLogout}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-100">
          Cerrar sesión
        </button>

        <div className="h-6" />
      </main>
    </div>
  );
}
