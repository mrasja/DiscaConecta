'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/firebase';

const ADMIN_EMAILS = ['m_rasja@hotmail.com', 'mrasja@gmail.com'];

const TABS = [
  { id: 'metrics'       as const, label: 'Métricas' },
  { id: 'usuarios'      as const, label: 'Usuarios' },
  { id: 'profesionales' as const, label: 'Profesionales pendientes' },
  { id: 'centros'       as const, label: 'Centros pendientes' },
];

export default function AdminDashboard() {
  const { appUser, token, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'metrics' | 'usuarios' | 'profesionales' | 'centros'>('metrics');
  const [metrics,       setMetrics]       = useState<any>(null);
  const [users,         setUsers]         = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [centros,       setCentros]       = useState<any[]>([]);
  const [loadingData, setLoadingData]     = useState(false);
  const [msg, setMsg]                     = useState('');

  const isAdmin = !loading && !!appUser &&
    (appUser.role === 'admin' || ADMIN_EMAILS.includes((appUser as any).email));

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoadingData(true);
    setMsg('');

    const headers = { Authorization: `Bearer ${token}` };

    if (tab === 'metrics') {
      fetch('/api/admin/metrics', { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setMetrics(data); })
        .finally(() => setLoadingData(false));
    } else if (tab === 'usuarios') {
      fetch('/api/admin/users', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setUsers)
        .finally(() => setLoadingData(false));
    } else if (tab === 'profesionales') {
      fetch('/api/admin/professionals?pending=true', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setProfessionals)
        .finally(() => setLoadingData(false));
    } else {
      fetch('/api/admin/centros?pending=true', { headers })
        .then(r => r.ok ? r.json() : [])
        .then(setCentros)
        .finally(() => setLoadingData(false));
    }
  }, [tab, token, isAdmin]);

  const verifyCentro = async (id: string, verified: boolean) => {
    if (!token) return;
    const res = await fetch('/api/admin/centros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_verified: verified }),
    });
    if (res.ok) {
      setCentros(prev => prev.filter(c => c.id !== id));
      setMsg(verified ? '✓ Centro verificado' : '✗ Centro rechazado');
    }
  };

  const verifyProfessional = async (id: string, verified: boolean) => {
    if (!token) return;
    const res = await fetch('/api/admin/professionals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_verified: verified }),
    });
    if (res.ok) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
      setMsg(verified ? '✓ Profesional verificado' : '✗ Profesional rechazado');
    }
  };

  const toggleUserStatus = async (id: string, is_active: boolean) => {
    if (!token) return;
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_active }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active } : u));
      setMsg(is_active ? '✓ Usuario activado' : '✓ Usuario desactivado');
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = appUser as any;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <span className="text-base font-bold text-gray-900">Panel Admin</span>
              <span className="ml-2 text-xs text-gray-400">Discapp</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/dashboard/alumno')}
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
              🎓 Ver Alumno
            </button>
            <button onClick={() => router.push('/dashboard/profesional')}
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
              👩‍⚕️ Ver Profesional
            </button>
            <button onClick={() => router.push('/dashboard')}
              className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              ← Inicio
            </button>
            <button onClick={async () => { await logout(); router.push('/login'); }}
              className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
              Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Secciones del panel admin" className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1">
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                style={isActive ? { backgroundColor: '#dc2626', color: 'white', fontWeight: 600 } : {}}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 text-center
                  ${isActive ? '' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}>
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-6">

        {msg && (
          <div role="status" aria-live="polite" className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
            {msg}
          </div>
        )}

        {loadingData && (
          <div className="flex justify-center py-16" role="status" aria-label="Cargando datos">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── MÉTRICAS ───────────────────────────── */}
        {!loadingData && tab === 'metrics' && (
          <div role="tabpanel" id="panel-metrics" aria-labelledby="tab-metrics" className="space-y-6">
            {!metrics ? (
              <p className="text-center text-gray-400 py-12">Sin datos disponibles</p>
            ) : (
              <>
                {/* Tarjetas de métricas — grid uniforme */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Usuarios',          value: metrics.totalUsers,          bg: 'bg-indigo-50',  text: 'text-indigo-700' },
                    { label: 'Alumnos',            value: metrics.totalStudents,       bg: 'bg-blue-50',    text: 'text-blue-700'   },
                    { label: 'Profesionales',      value: metrics.totalProfessionals,  bg: 'bg-green-50',   text: 'text-green-700'  },
                    { label: 'Centros',            value: metrics.totalCentros,        bg: 'bg-orange-50',  text: 'text-orange-700' },
                    { label: 'Escuelas',           value: metrics.totalEscuelas,       bg: 'bg-purple-50',  text: 'text-purple-700' },
                    { label: 'Pend. verificar',    value: metrics.pendingVerifications,bg: 'bg-red-50',     text: 'text-red-700'    },
                    { label: 'Activos esta semana',value: metrics.activeThisWeek,      bg: 'bg-teal-50',    text: 'text-teal-700'   },
                    { label: 'Búsquedas hoy',      value: metrics.searchesToday,       bg: 'bg-pink-50',    text: 'text-pink-700'   },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-5`}>
                      <p className={`text-3xl font-bold ${stat.text}`}>{stat.value ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top jurisdicciones */}
                {metrics.topCities?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Top jurisdicciones — escuelas</h3>
                    <div className="space-y-3">
                      {metrics.topCities.slice(0, 8).map((c: any) => (
                        <div key={c.city} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 w-32 truncate">{c.city}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (c.count / metrics.topCities[0].count) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-12 text-right">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── USUARIOS ───────────────────────────── */}
        {!loadingData && tab === 'usuarios' && (
          <div role="tabpanel" id="panel-usuarios" aria-labelledby="tab-usuarios" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Usuarios registrados ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No hay usuarios</td>
                    </tr>
                  )}
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{u.full_name}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                          ${u.role === 'profesional' ? 'bg-green-50 text-green-700'
                          : u.role === 'admin'       ? 'bg-red-50 text-red-700'
                          : 'bg-blue-50 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                          ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {!ADMIN_EMAILS.includes(u.email) && (
                          <button onClick={() => toggleUserStatus(u.id, !u.is_active)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                              ${u.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PROFESIONALES PENDIENTES ────────────── */}
        {!loadingData && tab === 'profesionales' && (
          <div role="tabpanel" id="panel-profesionales" aria-labelledby="tab-profesionales" className="space-y-3">
            {professionals.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                <p className="text-4xl mb-3">✓</p>
                <p className="font-semibold text-gray-700">Todo al día</p>
                <p className="text-sm text-gray-400 mt-1">No hay profesionales pendientes de verificación</p>
              </div>
            )}
            {professionals.map((p: any) => (
              <div key={p.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-lg">
                      {(p.user?.full_name || 'P')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{p.user?.full_name}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                    <p className="text-xs text-indigo-600 capitalize mt-0.5">
                      {p.profession?.replace(/_/g, ' ')}
                      {p.license_number && <span className="text-gray-400"> · Mat. {p.license_number}</span>}
                    </p>
                    {(p.city || p.province) && (
                      <p className="text-xs text-gray-400">{[p.city, p.province].filter(Boolean).join(', ')}</p>
                    )}
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${p.verification_status === 'documentos_enviados' ? 'bg-amber-50 text-amber-700'
                      : p.verification_status === 'aprobado'            ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'}`}>
                      {p.verification_status === 'documentos_enviados' ? '📄 Docs enviados'
                      : p.verification_status === 'aprobado'            ? '✓ Aprobado'
                      : 'Sin documentos'}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => verifyProfessional(p.id, true)}
                      className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      Aprobar
                    </button>
                    <button onClick={() => verifyProfessional(p.id, false)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                      Rechazar
                    </button>
                  </div>
                </div>
                {/* Documentos de verificación */}
                {(p.dni_front_url || p.dni_back_url || p.selfie_url) && (
                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    {[
                      { url: p.dni_front_url, label: 'DNI Frente' },
                      { url: p.dni_back_url,  label: 'DNI Dorso' },
                      { url: p.selfie_url,    label: 'Selfie' },
                    ].filter(d => d.url).map(doc => (
                      <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 aspect-video rounded-lg overflow-hidden bg-gray-100 relative block hover:opacity-90 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                          {doc.label}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CENTROS PENDIENTES ───────────────────── */}
        {!loadingData && tab === 'centros' && (
          <div role="tabpanel" id="panel-centros" aria-labelledby="tab-centros" className="space-y-3">
            {centros.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
                <p className="text-4xl mb-3">✓</p>
                <p className="font-semibold text-gray-700">Todo al día</p>
                <p className="text-sm text-gray-400 mt-1">No hay centros pendientes de verificación</p>
              </div>
            )}
            {centros.map((c: any) => (
              <div key={c.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-xl">
                  🏥
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{c.nombre}</p>
                  <p className="text-xs text-orange-600 capitalize mt-0.5">{c.tipo?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{c.localidad}, {c.provincia}</p>
                  {c.owner && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Registrado por: {c.owner.full_name} · {c.owner.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => verifyCentro(c.id, true)}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    Aprobar
                  </button>
                  <button onClick={() => verifyCentro(c.id, false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    Rechazar
                  </button>
                  <a href={`/centro/${c.id}`} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors">
                    Ver →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
