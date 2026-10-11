'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Props {
  targetType: 'professional' | 'center' | 'association';
  targetId: string;
  initialFavorited?: boolean;
  size?: 'sm' | 'md';
  onToggle?: (favorited: boolean) => void;
}

export function FavoriteButton({ targetType, targetId, initialFavorited = false, size = 'md', onToggle }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
        onToggle?.(data.favorited);
        toast(data.favorited ? 'Guardado en favoritos' : 'Eliminado de favoritos',
              data.favorited ? 'success' : 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnSize = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={favorited}
      className={`${btnSize} rounded-full transition-colors disabled:opacity-40
        ${favorited
          ? 'text-rose-500 hover:text-rose-400'
          : 'text-gray-300 hover:text-rose-400'}`}
    >
      <svg className={iconSize} viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
