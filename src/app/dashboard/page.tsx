'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/Logo';
import { ADMIN_EMAILS } from '@/lib/admin';

export default function DashboardPage() {
  const { appUser, token, loading, isNewUser, refreshUser } = useAuth();
  const router = useRouter();
  const [settingRole, setSettingRole] = useState(false);

  const email = (appUser as any)?.email as string | undefined;
  const isAdmin = !!appUser && (appUser.role === 'admin' || ADMIN_EMAILS.includes(email || ''));

  useEffect(() => {
    if (loading) return;
    // Sin sesión: no forzamos login — el buscador ya es de acceso libre.
    // Recién pedimos cuenta cuando el usuario intenta hacer algo que la necesite
    // (guardar favoritos, escribir a un profesional, dejar una reseña, etc.).
    if (!appUser) { router.replace('/dashboard/alumno'); return; }
    // Admins siempre ven el picker para elegir qué panel ver
    if (isAdmin) return;
    // Usuario nuevo → mostrar picker de rol
    if (isNewUser) return;
    // Usuarios normales → redirigir directo a su panel
    if (appUser.role === 'profesional') { router.replace('/dashboard/profesional'); return; }
    if (appUser.role === 'alumno')      { router.replace('/dashboard/alumno');      return; }
  }, [appUser, loading, isNewUser, isAdmin, router]);

  const pickRole = async (role: 'alumno' | 'profesional') => {
    if (!token || settingRole) return;
    setSettingRole(true);
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      await refreshUser();
    } finally {
      setSettingRole(false);
    }
  };

  const showPicker = !loading && !!appUser && (isNewUser || isAdmin);
  if (!showPicker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      icon: '🎓',
      title: 'Alumno / Familia',
      description: 'Buscá centros, profesionales y acompañantes',
      color: 'blue',
      onClick: () => isAdmin
        ? router.push('/dashboard/alumno')
        : pickRole('alumno'),
    },
    {
      icon: '👩‍⚕️',
      title: 'Profesional',
      description: 'Gestioná tu perfil y conectá con alumnos',
      color: 'green',
      onClick: () => isAdmin
        ? router.push('/dashboard/profesional')
        : pickRole('profesional'),
    },
    ...(isAdmin ? [{
      icon: '🛠️',
      title: 'Panel Admin',
      description: 'Métricas, usuarios y verificación de perfiles',
      color: 'red',
      onClick: () => router.push('/dashboard/admin'),
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LogoMark className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">DiscaConecta</span>
        </div>
        {appUser && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">Admin</span>
            )}
            <span className="text-sm text-gray-600">{(appUser as any).full_name || appUser.fullName}</span>
          </div>
        )}
      </header>

      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {isAdmin ? '¿Qué panel querés ver?' : '¿Cómo vas a usar DiscaConecta?'}
          </h2>
          <p className="text-gray-500">
            {isAdmin
              ? 'Como admin podés navegar todos los paneles'
              : 'Elegí tu perfil — podés cambiarlo después desde tu cuenta'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(card => (
            <RoleCard key={card.title} {...card} disabled={settingRole} />
          ))}
        </div>
      </main>
    </div>
  );
}

const COLOR_MAP: Record<string, { border: string; text: string }> = {
  blue:  { border: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',   text: 'text-blue-600'   },
  green: { border: 'border-green-200 hover:border-green-400 hover:bg-green-50', text: 'text-green-600'  },
  red:   { border: 'border-red-200 hover:border-red-400 hover:bg-red-50',       text: 'text-red-600'    },
};

const RoleCard = ({ icon, title, description, color, onClick, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} className={`
    text-left p-6 rounded-2xl border-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-wait
    ${COLOR_MAP[color]?.border || ''} bg-white shadow-sm
  `}>
    <span className="text-4xl mb-4 block" aria-hidden="true">{icon}</span>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
    <span className={`mt-4 inline-block text-sm font-medium ${COLOR_MAP[color]?.text || ''}`}>
      Continuar →
    </span>
  </button>
);
