'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StarDisplay, ReviewModal } from '@/components/ReviewStars';

interface Props {
  targetType: 'professional' | 'center' | 'association';
  targetId: string;
  targetName: string;
}

export function ReviewsSection({ targetType, targetId, targetName }: Props) {
  const { token } = useAuth();
  const [data, setData]         = useState<{ reviews: any[]; avg: number | null; count: number }>
    ({ reviews: [], avg: null, count: 0 });
  const [showModal, setShowModal] = useState(false);

  const load = () =>
    fetch(`/api/reviews?target_type=${targetType}&target_id=${targetId}`)
      .then(r => r.json()).then(setData).catch(() => {});

  useEffect(() => { load(); }, [targetId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">
            Reseñas {data.count > 0 && <span className="text-gray-400 font-normal">({data.count})</span>}
          </h2>
          {data.avg !== null && <StarDisplay avg={data.avg} count={data.count} size="md" />}
        </div>
        {token && (
          <button onClick={() => setShowModal(true)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            + Dejar reseña
          </button>
        )}
      </div>

      {data.reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Todavía no hay reseñas. ¡Sé el primero!
        </p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r: any) => (
            <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  {(r.reviewer?.full_name || 'U')[0].toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-900">{r.reviewer?.full_name || 'Usuario'}</span>
                <StarDisplay avg={r.rating} count={0} size="sm" />
              </div>
              {r.comment && <p className="text-sm text-gray-600 ml-9">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-1 ml-9">
                {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReviewModal
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onClose={() => setShowModal(false)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
