'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { appUser } = useAuth();

  const cards = [
    {
      icon: '📋',
      title: 'Registrar mi perfil',
      desc: 'Completá tu perfil con matrícula y especialidades',
      color: 'green',
      path: '/dashboard/profesional/registrarse',
    },
    {
      icon: '🏥',
      title: 'Registrar mi centro',
      desc: 'Registrá tu institución o centro terapéutico en el mapa',
      color: 'orange',
      path: '/dashboard/profesional/registrar-centro',
    },
    {
      icon: '💬',
      title: 'Mis mensajes',
      desc: 'Revisá consultas de alumnos y familias',
      color: 'purple',
      path: '/dashboard/mensajes',
    },
  ];

  const borderMap: Record<string, string> = {
    green:  'border-green-200  hover:border-green-400  hover:bg-green-50',
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    blue:   'border-blue-200   hover:border-blue-400   hover:bg-blue-50',
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
  };
  const textMap: Record<string, string> = {
    green:  'text-green-600',
    orange: 'text-orange-600',
    blue:   'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Volver
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Discapp</span>
        </div>
        {appUser && (
          <span className="text-sm text-gray-600">
            {(appUser as any).full_name}
          </span>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel Profesional</h2>
        <p className="text-gray-500 mb-8">¿Qué querés hacer hoy?</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(card => (
            <button
              key={card.path}
              onClick={() => router.push(card.path)}
              className={`text-left p-6 rounded-2xl border-2 bg-white shadow-sm transition-all hover:scale-105 ${borderMap[card.color]}`}
            >
              <span className="text-4xl mb-4 block">{card.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{card.desc}</p>
              <span className={`text-sm font-semibold ${textMap[card.color]}`}>
                Continuar →
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
