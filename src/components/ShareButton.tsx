'use client';
import { useState } from 'react';

interface Props { url: string; title: string; text?: string; }

export function ShareButton({ url, title, text }: Props) {
  const [msg, setMsg] = useState('');

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: text || title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setMsg('¡Link copiado!');
      setTimeout(() => setMsg(''), 2500);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {msg && <span role="status" className="text-xs text-green-600 font-medium">{msg}</span>}
      <button onClick={share} aria-label="Compartir perfil"
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir
      </button>
    </div>
  );
}
