'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const STEPS_ALUMNO = [
  {
    icon: '🔍',
    title: 'Buscá lo que necesitás',
    body: 'Encontrá profesionales, centros terapéuticos y escuelas especiales cerca tuyo. Filtrá por ciudad, tipo de discapacidad, obra social y más.',
  },
  {
    icon: '📍',
    title: 'Usá el mapa',
    body: 'Activá la pestaña Mapa para ver los resultados cerca tuyo y elegir el más conveniente por distancia.',
  },
  {
    icon: '💬',
    title: 'Contactá directamente',
    body: 'Escribile por WhatsApp o por mensajes internos. Sin intermediarios ni esperas.',
  },
  {
    icon: '🔔',
    title: 'Guardá búsquedas',
    body: 'Tocá "Guardar búsqueda" para recibir alertas cuando aparezcan nuevos profesionales que coincidan con tus filtros.',
  },
];

const STEPS_PROFESIONAL = [
  {
    icon: '📝',
    title: 'Completá tu perfil',
    body: 'Agregá tu profesión, especialidades, obra sociales que atendés y zona de trabajo. Cuanto más completo, más familias te encontrarán.',
  },
  {
    icon: '✅',
    title: 'Verificá tu identidad',
    body: 'Subí tu DNI y una selfie para obtener el tilde de verificado. Las familias confían más en profesionales verificados.',
  },
  {
    icon: '🟢',
    title: 'Marcate disponible',
    body: 'Activá el toggle de disponibilidad en tu panel para aparecer en las búsquedas. Podés cambiarlo cuando quieras.',
  },
  {
    icon: '💬',
    title: 'Respondé rápido',
    body: 'Las familias valoran la respuesta rápida. Habilitá las notificaciones para no perderte ningún mensaje.',
  },
];

const KEY = 'discaconecta_onboarding_done_v2';

export function OnboardingModal() {
  const { appUser } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  const steps = appUser?.role === 'profesional' ? STEPS_PROFESIONAL : STEPS_ALUMNO;

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  const next = () => {
    if (step < steps.length - 1) { setStep(s => s + 1); return; }
    localStorage.setItem(KEY, '1');
    setShow(false);
  };

  const skip = () => {
    localStorage.setItem(KEY, '1');
    setShow(false);
  };

  if (!show || !appUser) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">

        <div className="flex justify-center gap-1.5 mb-6" aria-label={`Paso ${step + 1} de ${steps.length}`}>
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? '#4f46e5' : '#e5e7eb' }} />
          ))}
        </div>

        <span className="text-5xl mb-4 block" aria-hidden="true">{current.icon}</span>
        <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.body}</p>

        <button onClick={next}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
          {step < steps.length - 1 ? 'Siguiente →' : '¡Empezar!'}
        </button>

        {step < steps.length - 1 && (
          <button onClick={skip} className="mt-3 text-sm text-gray-400 hover:text-gray-600 w-full py-1">
            Saltar introducción
          </button>
        )}
      </div>
    </div>
  );
}
