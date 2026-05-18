'use client';
import { useState, useEffect } from 'react';

const STEPS = [
  {
    icon: '🔍',
    title: 'Buscá lo que necesitás',
    body: 'Encontrá profesionales, centros terapéuticos y escuelas especiales cerca tuyo. Filtrá por ciudad, tipo de discapacidad y más.',
  },
  {
    icon: '💬',
    title: 'Contactá directamente',
    body: 'Escribile por WhatsApp, llamá o mandá un mensaje por la app. Sin intermediarios, sin esperas.',
  },
  {
    icon: '⭐',
    title: 'Guardá tus favoritos',
    body: 'Tocá el corazón en cualquier tarjeta para guardarlo. Dejá reseñas para ayudar a otras familias.',
  },
];

const KEY = 'discapp_onboarding_done';

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  const next = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    localStorage.setItem(KEY, '1');
    setShow(false);
  };

  const skip = () => {
    localStorage.setItem(KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">

        {/* Progreso */}
        <div className="flex justify-center gap-1.5 mb-6" aria-label={`Paso ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? '#4f46e5' : '#e5e7eb' }} />
          ))}
        </div>

        <span className="text-5xl mb-4 block" aria-hidden="true">{current.icon}</span>
        <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.body}</p>

        <button onClick={next}
          style={{ backgroundColor: '#4f46e5', color: 'white' }}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90">
          {step < STEPS.length - 1 ? 'Siguiente' : '¡Empezar!'}
        </button>

        {step < STEPS.length - 1 && (
          <button onClick={skip} className="mt-3 text-sm text-gray-400 hover:text-gray-600 w-full py-1">
            Saltar
          </button>
        )}
      </div>
    </div>
  );
}
