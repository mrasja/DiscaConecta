'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FavoriteButton } from '@/components/FavoriteButton';
import { BackHeader } from '@/components/BackHeader';

interface FavoriteItem {
  id: string;
  target_type: 'professional' | 'center';
  target_id: string;
  created_at: string;
  detail: {
    name: string;
    subtitle: string;
    location: string;
    avatar: string | null;
    isVerified: boolean;
    href: string | null;
  } | null;
}

export default function FavoritosPage() {
  const { token, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems]       = useState<FavoriteItem[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!appUser) { router.replace('/login'); return; }
  }, [appUser, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const handleRemove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const backTo = typeof window !== 'undefined' && window.history.length > 1
    ? undefined : '/dashboard/alumno';

  if (authLoading || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackHeader title="Mis favoritos" fallback="/dashboard/alumno" />

      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4" aria-hidden="true">🤍</span>
            <p className="text-gray-600 font-medium mb-1">Todavía no guardaste favoritos</p>
            <p className="text-sm text-gray-400 mb-6">
              Tocá el corazón en cualquier profesional o centro para guardarlo aquí.
            </p>
            <a href="/dashboard/alumno"
              className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#4f46e5' }}>
              Buscar recursos
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              {items.length} {items.length === 1 ? 'guardado' : 'guardados'}
            </p>
            {items.map(item => {
              if (!item.detail) return null;
              const { detail } = item;
              const isProfessional = item.target_type === 'professional';

              const Card = (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {detail.avatar
                      ? <img src={detail.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      : <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: isProfessional ? '#e0e7ff' : '#ffedd5' }}>
                          {isProfessional ? '👤' : '🏥'}
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{detail.name}</p>
                      {detail.isVerified && (
                        <span className="text-blue-500 text-xs" aria-label="Verificado">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-600 capitalize">{detail.subtitle}</p>
                    <p className="text-xs text-gray-400">{detail.location}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FavoriteButton
                      targetType={item.target_type}
                      targetId={item.target_id}
                      size="sm"
                      onToggle={(favorited) => { if (!favorited) handleRemove(item.id); }}
                    />
                  </div>
                </div>
              );

              return detail.href ? (
                <a key={item.id} href={detail.href} className="block">
                  {Card}
                </a>
              ) : (
                <div key={item.id}>{Card}</div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
