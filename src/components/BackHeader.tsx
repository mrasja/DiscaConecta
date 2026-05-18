'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface BackHeaderProps {
  title?: string;
  subtitle?: string;
  fallback?: string;
  rightSlot?: ReactNode;
}

export function BackHeader({
  title,
  subtitle,
  fallback = '/dashboard/alumno',
  rightSlot,
}: BackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center gap-3 px-4 h-14">

        {/* Botón volver — estilo Material Design */}
        <button
          onClick={handleBack}
          aria-label="Volver"
          className="w-9 h-9 flex items-center justify-center rounded-full
            bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all flex-shrink-0 no-min">
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Título + subtítulo */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {title}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>

        {/* Slot derecho (ej. ShareButton) */}
        {rightSlot}
      </div>
    </header>
  );
}
