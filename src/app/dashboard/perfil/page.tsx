'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/firebase';
import { BackHeader } from '@/components/BackHeader';
import { AvatarUpload } from '@/components/AvatarUpload';
import { AccessibilityControls } from '@/components/AccessibilityControls';

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
