'use client';
import { useRef, useState } from 'react';
import { uploadAvatar } from '@/lib/firebase-storage';
import { useAuth } from '@/context/AuthContext';
import { compressImage } from '@/lib/compress-image';

interface AvatarUploadProps {
  current?: string | null;
  name?: string;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ current, name, onUpload }: AvatarUploadProps) {
  const { firebaseUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const [error, setError]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!firebaseUser || !file) return;
    if (file.size > 10 * 1024 * 1024) { setError('La imagen debe pesar menos de 10 MB'); return; }
    setError('');
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    try {
      const toUpload = await compressImage(file, 0.3);
      const url = await uploadAvatar(firebaseUser.uid, toUpload);
      onUpload(url);
    } catch {
      setPreview(null);
      setError('No se pudo subir la foto. Verificá que Firebase Storage esté habilitado.');
    } finally {
      setUploading(false);
    }
  };

  const src = preview || current;
  const initial = (name || 'U')[0].toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar foto de perfil"
        className="relative group w-20 h-20 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 no-min"
        disabled={uploading}>
        {src
          ? <img src={src} alt="Foto de perfil" className="w-full h-full object-cover" />
          : <span className="text-indigo-600 font-bold text-2xl">{initial}</span>
        }

        {/* Overlay hover */}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>

        {/* Spinner */}
        {uploading && (
          <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>

      <p className="text-xs text-gray-400">Tocá para cambiar foto</p>
      {error && <p className="text-xs text-red-500 text-center max-w-[180px]">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
