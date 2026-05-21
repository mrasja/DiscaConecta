'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function dashboardPath(role?: string) {
  if (role === 'admin') return '/dashboard';
  if (role === 'profesional') return '/dashboard/profesional';
  return '/dashboard/alumno';
}

export default function LandingPage() {
  const { appUser, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Discapp</span>
        </div>
        <div className="flex items-center gap-3">
          {!loading && appUser ? (
            <Link href={dashboardPath(appUser.role)}
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Ir a mi cuenta →
            </Link>
          ) : (
            <>
              <Link href="/login"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Ingresar
              </Link>
              <Link href="/login"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="px-6 py-20 max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
            Para familias y profesionales
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Conectamos familias con{' '}
            <span className="text-indigo-600">profesionales de discapacidad</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Encontrá acompañantes terapéuticos, docentes especiales, psicólogos y más — cerca tuyo,
            verificados y listos para ayudar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={appUser ? '/dashboard/alumno' : '/login'}
              className="bg-indigo-600 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Buscar un profesional →
            </Link>
            <Link href={appUser ? '/dashboard/profesional' : '/login'}
              className="bg-white text-indigo-600 text-base font-semibold px-8 py-4 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
              Soy profesional
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-indigo-600 py-12">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center text-white">
            {[
              { num: '500+', label: 'Profesionales' },
              { num: '200+', label: 'Centros terapéuticos' },
              { num: '1000+', label: 'Familias conectadas' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold">{num}</p>
                <p className="text-sm text-indigo-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Todo lo que necesitás en un solo lugar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Búsqueda avanzada',
                desc: 'Filtrá por tipo de discapacidad, obra social, zona y más. Mapa interactivo incluido.',
              },
              {
                icon: '✅',
                title: 'Profesionales verificados',
                desc: 'Verificamos la identidad y matrícula de cada profesional para tu tranquilidad.',
              },
              {
                icon: '💬',
                title: 'Contacto directo',
                desc: 'Escribile por WhatsApp o mensajes internos. Sin intermediarios.',
              },
              {
                icon: '🏥',
                title: 'Centros y escuelas',
                desc: 'Encontrá centros terapéuticos y escuelas especiales en tu zona.',
              },
              {
                icon: '📍',
                title: 'Geolocalización',
                desc: 'Ordená resultados por distancia y visualizalos en el mapa.',
              },
              {
                icon: '🔔',
                title: 'Notificaciones',
                desc: 'Recibí alertas cuando haya nuevos profesionales que te interesan.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-6 bg-gray-50 rounded-2xl">
                <span className="text-3xl mb-4 block" aria-hidden="true">{icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Sos profesional del área de discapacidad?
            </h2>
            <p className="text-gray-500 mb-8">
              Registrá tu perfil, subí tus documentos y aparecé en las búsquedas de familias que te necesitan.
            </p>
            <Link href={appUser ? '/dashboard/profesional' : '/login'}
              className="bg-indigo-600 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors inline-block">
              {appUser ? 'Ir a mi panel profesional →' : 'Registrarme como profesional →'}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Discapp — Conectando familias con profesionales de discapacidad en Argentina</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/login" className="hover:text-gray-600 transition-colors">Ingresar</Link>
          <Link href="/login" className="hover:text-gray-600 transition-colors">Registrarse</Link>
        </div>
      </footer>
    </div>
  );
}
