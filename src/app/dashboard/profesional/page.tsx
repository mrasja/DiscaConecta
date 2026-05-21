'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { setAvailabilityNow, subscribeAvailability } from '@/lib/firebase-rtdb';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { OnboardingModal } from '@/components/OnboardingModal';
import { AppointmentsList } from '@/components/AppointmentsList';

const ADMIN_EMAILS = ['m_rasja@hotmail.com', 'mrasja@gmail.com'];

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { appUser, token, firebaseUser } = useAuth();
  const isAdmin = !!appUser && (appUser.role === 'admin' || ADMIN_EMAILS.includes((appUser as any).email));

  useAndroidBackButton();

  const [hasPerfil,  setHasPerfil]  = useState<boolean | null>(null);
  const [hasCentro,  setHasCentro]  = useState<boolean | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [available,  setAvailable]    = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    avgRating: number | null;
    reviewCount: number;
    favoriteCount: number;
    conversationCount: number;
  } | null>(null);

  // Suscribirse a disponibilidad en tiempo real
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    return subscribeAvailability(firebaseUser.uid, setAvailable);
  }, [firebaseUser?.uid]);

  const toggleAvailability = async () => {
    if (!firebaseUser?.uid || togglingAvail) return;
    setTogglingAvail(true);
    try { await setAvailabilityNow(firebaseUser.uid, !available); }
    finally { setTogglingAvail(false); }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch('/api/professionals/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
      fetch('/api/centros/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
    ]).then(([prof, centro]) => {
      setHasPerfil(!!prof);
      setHasCentro(!!centro);
      if (prof) {
        setVerificationStatus(prof.verification_status ?? null);
        fetch('/api/professionals/stats', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(s => { if (s) setStats(s); });
      }
    }).finally(() => setLoadingData(false));
  }, [token]);

  const cards = [
    !hasPerfil
      ? {
          icon: '📋',
          title: 'Registrar mi perfil',
          desc: 'Completá tu perfil con matrícula y especialidades',
          color: 'green',
          path: '/dashboard/profesional/registrarse',
        }
      : {
          icon: '✏️',
          title: 'Editar mi perfil',
          desc: 'Actualizá tus datos, especialidades y contacto',
          color: 'green',
          path: '/dashboard/profesional/registrarse',
        },
    hasPerfil && !hasCentro
      ? {
          icon: '🏥',
          title: 'Registrar mi centro',
          desc: 'Registrá tu institución o centro terapéutico en el mapa',
          color: 'orange',
          path: '/dashboard/profesional/registrar-centro',
        }
      : hasPerfil && hasCentro
      ? {
          icon: '🏥',
          title: 'Mi centro',
          desc: 'Administrá tu institución o centro terapéutico',
          color: 'orange',
          path: '/dashboard/profesional/registrar-centro',
        }
      : null,
    {
      icon: '🔍',
      title: 'Buscar centros y escuelas',
      desc: 'Encontrá centros terapéuticos y escuelas especiales',
      color: 'blue',
      path: '/dashboard/alumno',
    },
    {
      icon: '💬',
      title: 'Mis mensajes',
      desc: 'Revisá consultas de alumnos y familias',
      color: 'purple',
      path: '/dashboard/mensajes',
    },
    {
      icon: '👤',
      title: 'Mi perfil',
      desc: 'Verificá y actualizá tus datos personales',
      color: 'gray',
      path: '/dashboard/perfil',
    },
  ].filter(Boolean) as Card[];

  const borderMap: Record<string, string> = {
    green:  'border-green-200  hover:border-green-400  hover:bg-green-50',
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    blue:   'border-blue-200   hover:border-blue-400   hover:bg-blue-50',
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    gray:   'border-gray-200   hover:border-gray-400   hover:bg-gray-50',
  };
  const textMap: Record<string, string> = {
    green:  'text-green-600',
    orange: 'text-orange-600',
    blue:   'text-blue-600',
    purple: 'text-purple-600',
    gray:   'text-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingModal />
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Discapp</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg"
            >
              ← Inicio
            </button>
          )}
          {appUser && (
            <span className="text-sm text-gray-600">
              {(appUser as any).full_name || appUser.fullName}
            </span>
          )}
        </div>
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel Profesional</h2>
        <p className="text-gray-500 mb-8">¿Qué querés hacer hoy?</p>

        {/* Toggle disponibilidad */}
        {hasPerfil && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {available ? '🟢 Disponible ahora' : '⚫ No disponible'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {available ? 'Los alumnos pueden contactarte' : 'Tu perfil está en pausa'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={available}
              aria-label={available ? 'Marcarme como no disponible' : 'Marcarme como disponible'}
              onClick={toggleAvailability}
              disabled={togglingAvail}
              className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50"
              style={{ backgroundColor: available ? '#22c55e' : '#d1d5db' }}>
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: available ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}
              />
            </button>
          </div>
        )}

        {/* Banner de estado de verificación */}
        {hasPerfil && verificationStatus && verificationStatus !== 'verificado' && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            verificationStatus === 'rechazado'
              ? 'bg-red-50 border-red-200'
              : verificationStatus === 'documentos_enviados'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              {verificationStatus === 'rechazado' ? '❌' : verificationStatus === 'documentos_enviados' ? '⏳' : '📄'}
            </span>
            <div>
              <p className={`font-semibold text-sm ${
                verificationStatus === 'rechazado' ? 'text-red-800' : verificationStatus === 'documentos_enviados' ? 'text-blue-800' : 'text-amber-800'
              }`}>
                {verificationStatus === 'rechazado'
                  ? 'Verificación rechazada'
                  : verificationStatus === 'documentos_enviados'
                  ? 'Documentos en revisión'
                  : 'Sin documentos de verificación'}
              </p>
              <p className={`text-xs mt-0.5 ${
                verificationStatus === 'rechazado' ? 'text-red-700' : verificationStatus === 'documentos_enviados' ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {verificationStatus === 'rechazado'
                  ? 'El equipo no pudo verificar tus documentos. Por favor actualizá tu perfil con documentos válidos.'
                  : verificationStatus === 'documentos_enviados'
                  ? 'Tus documentos fueron enviados y están siendo revisados por el equipo. Te avisaremos cuando esté listo.'
                  : 'Subí el frente y dorso de tu DNI y una selfie para verificar tu identidad.'}
              </p>
              {(verificationStatus === 'sin_documentos' || verificationStatus === 'rechazado') && (
                <button
                  onClick={() => router.push('/dashboard/profesional/registrarse')}
                  className="mt-2 text-xs font-semibold text-indigo-600 underline">
                  Ir a verificar →
                </button>
              )}
            </div>
          </div>
        )}

        {hasPerfil && verificationStatus === 'verificado' && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <span className="text-green-600 text-lg" aria-hidden="true">✓</span>
            <p className="text-sm font-semibold text-green-800">Perfil verificado</p>
          </div>
        )}

        {/* Estadísticas */}
        {hasPerfil && stats && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: '⭐',
                value: stats.avgRating !== null ? `${stats.avgRating}` : '—',
                label: 'Calificación',
                sub: stats.reviewCount > 0 ? `${stats.reviewCount} reseña${stats.reviewCount !== 1 ? 's' : ''}` : 'Sin reseñas',
              },
              { icon: '❤️', value: String(stats.favoriteCount), label: 'Favoritos', sub: 'Guardado por usuarios' },
              { icon: '💬', value: String(stats.conversationCount), label: 'Conversaciones', sub: 'Desde siempre' },
            ].map(({ icon, value, label, sub }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs font-semibold text-gray-500">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{sub}</p>
              </div>
            ))}
            <button
              onClick={() => router.push(`/dashboard/profesional/estadisticas`)}
              className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm text-center hover:bg-indigo-100 transition-colors">
              <span className="text-2xl" aria-hidden="true">📊</span>
              <p className="text-xs font-semibold text-indigo-600 mt-2">Ver más estadísticas</p>
            </button>
          </div>
        )}

        {/* Citas pendientes */}
        {hasPerfil && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📅 Citas
            </h3>
            <AppointmentsList role="professional" />
          </div>
        )}

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {!hasPerfil && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">
                  Primero completá tu perfil profesional para poder registrar un centro.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.map(card => (
                <button
                  key={card.path + card.title}
                  onClick={() => router.push(card.path)}
                  className={`text-left p-6 rounded-2xl border-2 bg-white shadow-sm transition-all hover:scale-105 ${borderMap[card.color]}`}
                >
                  <span className="text-4xl mb-4 block" aria-hidden="true">{card.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{card.desc}</p>
                  <span className={`text-sm font-semibold ${textMap[card.color]}`}>
                    Continuar →
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

interface Card {
  icon: string;
  title: string;
  desc: string;
  color: string;
  path: string;
}
