'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { compressImage } from '@/lib/compress-image';
import { uploadImage } from '@/lib/upload';
import { ACCESSIBILITY_SUBTYPES } from '@/types';
import type { AccessibilityCategory } from '@/types';

const CATEGORY_OPTIONS: { value: AccessibilityCategory; label: string; emoji: string; color: string }[] = [
  { value: 'barrera',         label: 'Barrera',          emoji: '⚠️', color: '#dc2626' },
  { value: 'acceso_positivo', label: 'Acceso positivo',  emoji: '✅', color: '#16a34a' },
  { value: 'servicio',        label: 'Estacionamiento / servicio', emoji: '🅿️', color: '#2563eb' },
];

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onCreated: (report: any) => void;
}

export function AccessibilityReportForm({ lat, lng, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<AccessibilityCategory | null>(null);
  const [subtype, setSubtype] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!token || !category || !subtype || submitting) return;
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const compressed = await compressImage(photoFile);
        const uploaded = await uploadImage(compressed, 'accessibility-reports', token);
        photo_url = uploaded.url;
      }

      const res = await fetch('/api/accessibility-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, subtype, description: description || undefined, photo_url, lat, lng }),
      });

      if (!res.ok) throw new Error();
      const created = await res.json();
      onCreated(created);
      toast('¡Gracias! Tu reporte se sumó al mapa', 'success');
    } catch {
      toast('No se pudo crear el reporte. Probá de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Reportar accesibilidad">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[88vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">📍 Reportar accesibilidad</h2>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 no-min">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <fieldset>
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Qué querés marcar?</legend>
            <div className="flex flex-col gap-2">
              {CATEGORY_OPTIONS.map(o => {
                const active = category === o.value;
                return (
                  <button key={o.value} type="button" aria-pressed={active}
                    onClick={() => { setCategory(o.value); setSubtype(''); }}
                    style={active ? { backgroundColor: o.color, color: 'white', borderColor: o.color } : {}}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors text-left
                      ${active ? '' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <span aria-hidden="true">{o.emoji}</span>{o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {category && (
            <div>
              <label htmlFor="report-subtype" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Detalle
              </label>
              <select id="report-subtype" value={subtype} onChange={e => setSubtype(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Elegí una opción</option>
                {ACCESSIBILITY_SUBTYPES[category].map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="report-description" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Descripción (opcional)
            </label>
            <textarea id="report-description" rows={3} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Agregá detalles que ayuden a otros..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Foto (opcional)
            </label>
            {photoPreview ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs no-min">
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 cursor-pointer hover:border-indigo-300 hover:text-indigo-400">
                <span className="text-2xl" aria-hidden="true">📷</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
              </label>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={!category || !subtype || submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Enviando…' : 'Publicar reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}
