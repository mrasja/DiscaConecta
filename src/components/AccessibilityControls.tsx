'use client';
import { useEffect, useState } from 'react';

type FontSize = 'sm' | 'md' | 'lg';

export function AccessibilityControls() {
  const [hc, setHc]           = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>('md');

  useEffect(() => {
    const storedHc   = localStorage.getItem('discapp_hc') === 'true';
    const storedFont = (localStorage.getItem('discapp_font') as FontSize) || 'md';
    setHc(storedHc);
    setFontSizeState(storedFont);
    document.documentElement.classList.toggle('hc', storedHc);
    document.documentElement.setAttribute('data-font', storedFont);
  }, []);

  const toggleHc = () => {
    const next = !hc;
    setHc(next);
    localStorage.setItem('discapp_hc', String(next));
    document.documentElement.classList.toggle('hc', next);
  };

  const applyFont = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('discapp_font', size);
    document.documentElement.setAttribute('data-font', size);
  };

  const FONT_OPTIONS: { id: FontSize; label: string; display: string }[] = [
    { id: 'sm', label: 'Chico',  display: 'A' },
    { id: 'md', label: 'Normal', display: 'A' },
    { id: 'lg', label: 'Grande', display: 'A' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
      <h2 className="font-semibold text-gray-900">Accesibilidad visual</h2>

      {/* Toggle alto contraste */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Alto contraste</p>
          <p className="text-xs text-gray-400">Fondo negro, texto amarillo</p>
        </div>
        <button
          role="switch"
          aria-checked={hc}
          aria-label={`Alto contraste: ${hc ? 'activado' : 'desactivado'}`}
          onClick={toggleHc}
          className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 no-min"
          style={{ backgroundColor: hc ? '#4f46e5' : '#d1d5db' }}>
          <span
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
            style={{ transform: hc ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}
          />
        </button>
      </div>

      {/* Selector tamaño de fuente */}
      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">Tamaño de texto</p>
        <div className="flex gap-2" role="group" aria-label="Tamaño de texto">
          {FONT_OPTIONS.map(opt => {
            const active = fontSize === opt.id;
            const sizeClass = opt.id === 'sm' ? 'text-sm' : opt.id === 'lg' ? 'text-xl' : 'text-base';
            return (
              <button
                key={opt.id}
                onClick={() => applyFont(opt.id)}
                aria-pressed={active}
                aria-label={`Texto ${opt.label}`}
                className="flex-1 py-3 rounded-xl border-2 font-bold transition-all no-min"
                style={active
                  ? { borderColor: '#4f46e5', color: '#4f46e5', backgroundColor: '#eef2ff' }
                  : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                <span className={sizeClass}>{opt.display}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between px-1 mt-1.5">
          {FONT_OPTIONS.map(o => (
            <span key={o.id} className="text-xs text-gray-400 flex-1 text-center">{o.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
