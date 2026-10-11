// Glyph del ícono de la app (pin de mapa + persona) — mismo diseño que el
// ícono del launcher de Android y el favicon, para que la marca sea consistente
// entre el ícono de la app y el logo que se ve adentro.
export function LogoMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <path d="M48,17 C68,17 80,31 80,47 C80,58 68,70 48,84 C28,70 16,58 16,47 C16,31 28,17 48,17 Z" fill="white" />
      <circle cx="48" cy="40" r="6.5" fill="#4f46e5" />
      <path d="M37,60 C37,50 41.5,45 48,45 C54.5,45 59,50 59,60 Z" fill="#4f46e5" />
    </svg>
  );
}
