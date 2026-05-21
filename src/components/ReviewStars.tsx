'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { compressImage } from '@/lib/compress-image';

interface DisplayProps {
  avg: number | null;
  count: number;
  size?: 'sm' | 'md';
}

export function StarDisplay({ avg, count, size = 'sm' }: DisplayProps) {
  if (avg === null) return null;
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-1" aria-label={`${avg.toFixed(1)} de 5 estrellas, ${count} reseña${count !== 1 ? 's' : ''}`}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${starSize} ${s <= Math.round(avg) ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}

interface PickerProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarPicker({ value, onChange }: PickerProps) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          role="radio" aria-checked={value === s}
          aria-label={`${s} estrella${s !== 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none">
          <svg className={`w-8 h-8 transition-colors ${s <= (hover || value) ? 'text-amber-400' : 'text-gray-200'}`}
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface ModalProps {
  targetType: 'professional' | 'center';
  targetId: string;
  targetName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ targetType, targetId, targetName, onClose, onSubmitted }: ModalProps) {
  const { token, firebaseUser } = useAuth();
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File) => {
    const compressed = await compressImage(file, 0.5);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Elegí una puntuación'); return; }
    setLoading(true); setError('');
    try {
      let photoUrl: string | null = null;
      if (photoFile && firebaseUser) {
        const { uploadReviewPhoto } = await import('@/lib/firebase-storage');
        photoUrl = await uploadReviewPhoto(firebaseUser.uid, photoFile);
      }
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, rating, comment, photo_url: photoUrl }),
      });
      if (res.ok) { onSubmitted(); onClose(); }
      else setError('Error al enviar la reseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog" aria-modal="true" aria-labelledby="review-title"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 id="review-title" className="text-lg font-bold text-gray-900 mb-1">Dejar una reseña</h2>
        <p className="text-sm text-gray-500 mb-5">{targetName}</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Puntuación</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comentario <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea id="review-comment" value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder="Contá tu experiencia..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Foto <span className="text-gray-400 font-normal">(opcional)</span></p>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            {photoPreview ? (
              <div className="relative w-24 h-24">
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
              </div>
            ) : (
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                📷 Agregar foto
              </button>
            )}
          </div>
          {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Enviando…' : 'Publicar reseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
