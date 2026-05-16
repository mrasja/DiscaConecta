'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { appUser } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Discapp</span>
        </div>
        {appUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{appUser.fullName}</span>
            <img src={appUser.avatarUrl || '/avatar-placeholder.png'} alt="" className="w-8 h-8 rounded-full" />
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Cómo querés ingresar?</h2>
          <p className="text-gray-500">Seleccioná tu perfil para continuar</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RoleCard
            icon="🎓"
            title="Soy Alumno"
            description="Buscá centros, profesionales y acompañantes cerca tuyo"
            color="blue"
            onClick={() => router.push('/dashboard/alumno')}
          />
          <RoleCard
            icon="👩‍⚕️"
            title="Soy Profesional"
            description="Registrate, mostrá tus servicios y conectá con alumnos"
            color="green"
            onClick={() => router.push('/dashboard/profesional')}
          />
        </div>
      </main>
    </div>
  );
}

const RoleCard = ({ icon, title, description, color, onClick }: any) => (
  <button onClick={onClick} className={`
    group text-left p-6 rounded-2xl border-2 transition-all hover:scale-105
    ${color === 'blue'  ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'  : ''}
    ${color === 'green' ? 'border-green-200 hover:border-green-400 hover:bg-green-50' : ''}
    bg-white shadow-sm
  `}>
    <span className="text-4xl mb-4 block">{icon}</span>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
    <span className={`mt-4 inline-block text-sm font-medium
      ${color === 'blue' ? 'text-blue-600' : 'text-green-600'}`}>
      Continuar →
    </span>
  </button>
);