'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BackHeader } from '@/components/BackHeader';
import { uploadVerificationDoc } from '@/lib/firebase-storage';
import Image from 'next/image';

const PROFESIONES = [
  { value: 'acompanante_terapeutico', label: 'Acompañante Terapéutico (AT)' },
  { value: 'enfermera',               label: 'Enfermera/o' },
  { value: 'docente_especial',        label: 'Docente de Educación Especial' },
  { value: 'psicologo',               label: 'Psicólogo/a' },
  { value: 'fonoaudiologo',           label: 'Fonoaudiólogo/a' },
  { value: 'otro',                    label: 'Otro' },
];

const ESPECIALIDADES = [
  'tea', 'visual', 'auditiva', 'motriz', 'intelectual',
  'multiple', 'down', 'paralisis cerebral', 'hidrocefalia',
];

const OBRAS_SOCIALES_OPTS = [
  'OSDE', 'Swiss Medical', 'Galeno', 'IOMA', 'PAMI', 'Medifé',
  'Accord Salud', 'Sancor Salud', 'Medicus', 'OMINT', 'Particular / Sin obra social',
];

// ── Componente de carga de foto individual ──────────────────────
function DocUpload({
  label, hint, value, onChange, accept = 'image/*',
}: {
  label: string; hint: string;
  value: File | null; onChange: (f: File) => void;
  accept?: string;
}) {
  const preview = value ? URL.createObjectURL(value) : null;
  return (
    <label className="block cursor-pointer">
      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</span>
      <div className={`relative w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors
        ${value ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'}`}>
        {preview
          ? <Image src={preview} alt={label} fill className="object-cover" />
          : <>
              <span className="text-3xl mb-1" aria-hidden="true">📷</span>
              <span className="text-xs text-gray-500 text-center px-2">{hint}</span>
            </>
        }
        {value && (
          <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-xs text-center py-1">
            ✓ {value.name.length > 20 ? value.name.slice(0, 20) + '…' : value.name}
          </div>
        )}
      </div>
      <input type="file" accept={accept} className="sr-only"
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
    </label>
  );
}

// ── Componente de selfie con cámara en vivo ─────────────────────
function SelfieCapture({ value, onChange }: { value: File | null; onChange: (f: File) => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState('');

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError('No se pudo acceder a la cámara. Asegurate de dar permiso.');
    }
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      onChange(file);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setStreaming(false);
    }, 'image/jpeg', 0.9);
  }, [onChange]);

  const retake = () => {
    onChange(null as any);
    startCamera();
  };

  const preview = value ? URL.createObjectURL(value) : null;

  return (
    <div>
      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Selfie en vivo *</span>
      <p className="text-xs text-gray-400 mb-2">
        Tomá una foto de tu cara mirando de frente, con buena luz.
      </p>

      <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-dashed
        bg-gray-900 flex items-center justify-center"
        style={{ borderColor: value ? '#22c55e' : '#d1d5db' }}>
        {streaming && <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />}
        {preview && !streaming && <Image src={preview} alt="Selfie" fill className="object-cover" />}
        {!streaming && !preview && (
          <div className="text-center text-white">
            <span className="text-4xl block mb-2">🤳</span>
            <p className="text-sm">Presioná para abrir la cámara</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <div className="flex gap-2 mt-2">
        {!streaming && !value && (
          <button type="button" onClick={startCamera}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Abrir cámara
          </button>
        )}
        {streaming && (
          <button type="button" onClick={capture}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
            📸 Tomar foto
          </button>
        )}
        {value && !streaming && (
          <>
            <div className="flex-1 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 text-center">
              ✓ Selfie tomada
            </div>
            <button type="button" onClick={retake}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              Repetir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function RegistrarseProPage() {
  const { token, firebaseUser } = useAuth();
  const router = useRouter();

  const [step,           setStep]           = useState<1 | 2>(1);
  const [loading,        setLoading]        = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error,          setError]          = useState('');
  const [isEditing,      setIsEditing]      = useState(false);
  const [existingDocsUploaded, setExistingDocsUploaded] = useState(false);

  // Paso 1 — datos profesionales
  const [form, setForm] = useState({
    profession:      '',
    licenseNumber:   '',
    bio:             '',
    specialties:     [] as string[],
    obrasSociales:   [] as string[],
    workZones:       '',
    city:            '',
    province:        '',
    address:         '',
    contactPhone:    '',
    contactWhatsapp: '',
    isAvailable:     true,
  });

  // Paso 2 — documentos
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack,  setDniBack]  = useState<File | null>(null);
  const [selfie,   setSelfie]   = useState<File | null>(null);

  // Cargar datos existentes al montar
  useEffect(() => {
    if (!token) return;
    fetch('/api/professionals/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(prof => {
        if (prof) {
          setIsEditing(true);
          setExistingDocsUploaded(!!(prof.dni_front_url && prof.dni_back_url && prof.selfie_url));
          setForm({
            profession:      prof.profession      ?? '',
            licenseNumber:   prof.license_number  ?? '',
            bio:             prof.bio             ?? '',
            specialties:     prof.specialties     ?? [],
            obrasSociales:   prof.obras_sociales  ?? [],
            workZones:       (prof.work_zones ?? []).join(', '),
            city:            prof.city            ?? '',
            province:        prof.province        ?? '',
            address:         prof.address         ?? '',
            contactPhone:    prof.contact_phone   ?? '',
            contactWhatsapp: prof.contact_whatsapp ?? '',
            isAvailable:     prof.is_available    ?? true,
          });
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [token]);

  const update = (key: string, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleSpec = (s: string) =>
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));

  const toggleOS = (s: string) =>
    setForm(prev => ({
      ...prev,
      obrasSociales: prev.obrasSociales.includes(s)
        ? prev.obrasSociales.filter(x => x !== s)
        : [...prev.obrasSociales, s],
    }));

  const goToStep2 = () => {
    if (!form.profession || !form.city || !form.province) {
      setError('Completá profesión, ciudad y provincia');
      return;
    }
    if (form.specialties.length === 0) {
      setError('Seleccioná al menos una especialidad');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const needDocs = !existingDocsUploaded;
    if (needDocs && (!dniFront || !dniBack || !selfie)) {
      setError('Subí el DNI (frente y dorso) y tomá la selfie para continuar');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = firebaseUser?.uid || 'unknown';

      let dniFrontUrl: string | undefined;
      let dniBackUrl:  string | undefined;
      let selfieUrl:   string | undefined;

      if (dniFront || dniBack || selfie) {
        const uploads = await Promise.all([
          dniFront ? uploadVerificationDoc(uid, 'dni_front', dniFront) : Promise.resolve(undefined),
          dniBack  ? uploadVerificationDoc(uid, 'dni_back',  dniBack)  : Promise.resolve(undefined),
          selfie   ? uploadVerificationDoc(uid, 'selfie',    selfie)   : Promise.resolve(undefined),
        ]);
        [dniFrontUrl, dniBackUrl, selfieUrl] = uploads;
      }

      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...form,
          workZones: form.workZones.split(',').map(z => z.trim()).filter(Boolean),
          obrasSociales: form.obrasSociales,
          ...(dniFrontUrl ? { dniFrontUrl } : {}),
          ...(dniBackUrl  ? { dniBackUrl  } : {}),
          ...(selfieUrl   ? { selfieUrl   } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      router.push('/dashboard/profesional');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <BackHeader title="Mi perfil profesional" />
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BackHeader title={isEditing ? 'Editar mi perfil' : 'Registrar mi perfil'} />

      {/* Indicador de pasos */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step >= n ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > n ? '✓' : n}
            </div>
            <span className={`text-sm font-medium ${step >= n ? 'text-gray-900' : 'text-gray-400'}`}>
              {n === 1 ? 'Datos profesionales' : 'Verificación de identidad'}
            </span>
            {n < 2 && <div className="flex-1 h-px bg-gray-200 w-8" />}
          </div>
        ))}
      </div>

      {/* ── PASO 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Profesión */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Profesión *</label>
            <select value={form.profession} onChange={e => update('profession', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Seleccioná tu profesión</option>
              {PROFESIONES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Matrícula / Nº de Registro</label>
            <input value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)}
              placeholder="Ej: AT-12345"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción / Bio</label>
            <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
              rows={3} placeholder="Contá tu experiencia y enfoque de trabajo..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Especialidades *</label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map(s => (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors
                    ${form.specialties.includes(s) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Obras sociales */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Obras sociales que aceptás</label>
            <div className="flex flex-wrap gap-2">
              {OBRAS_SOCIALES_OPTS.map(s => (
                <button key={s} type="button" onClick={() => toggleOS(s)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors
                    ${form.obrasSociales.includes(s) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Zonas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Zonas donde trabajás</label>
            <input value={form.workZones} onChange={e => update('workZones', e.target.value)}
              placeholder="Ej: Palermo, Recoleta, Belgrano"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">Separadas por coma</p>
          </div>

          {/* Ciudad / Provincia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ciudad *</label>
              <input value={form.city} onChange={e => update('city', e.target.value)}
                placeholder="Buenos Aires"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Provincia *</label>
              <input value={form.province} onChange={e => update('province', e.target.value)}
                placeholder="Buenos Aires"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección</label>
            <input value={form.address} onChange={e => update('address', e.target.value)}
              placeholder="Av. Corrientes 1234"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
              <input value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WhatsApp</label>
              <input value={form.contactWhatsapp} onChange={e => update('contactWhatsapp', e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

          <button type="button" onClick={goToStep2}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Continuar → Verificación de identidad
          </button>
        </div>
      )}

      {/* ── PASO 2 ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {existingDocsUploaded ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-green-800">✓ Documentos ya enviados</p>
              <p className="text-xs text-green-700 mt-1">
                Ya tenemos tus documentos. Podés actualizarlos si querés, o guardar directamente.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">¿Por qué pedimos esto?</p>
              <p className="text-xs text-amber-700 mt-1">
                Para proteger a las familias, verificamos que sos una persona real con matrícula válida.
                Tus documentos se almacenan de forma segura y solo los ve el equipo de Discapp.
              </p>
            </div>
          )}

          <DocUpload
            label={existingDocsUploaded ? 'DNI — Frente (opcional, actualizar)' : 'DNI — Frente *'}
            hint="Foto del frente de tu DNI con número visible"
            value={dniFront}
            onChange={setDniFront}
          />

          <DocUpload
            label={existingDocsUploaded ? 'DNI — Dorso (opcional, actualizar)' : 'DNI — Dorso *'}
            hint="Foto del dorso de tu DNI"
            value={dniBack}
            onChange={setDniBack}
          />

          <SelfieCapture value={selfie} onChange={setSelfie} />

          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
            <p>✓ Las imágenes se encriptan en tránsito y en reposo</p>
            <p>✓ No se usan para publicidad ni se comparten con terceros</p>
            <p>✓ La verificación puede demorar hasta 48 hs hábiles</p>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setStep(1); setError(''); }}
              className="px-6 py-3 rounded-xl font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              ← Volver
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando…
                  </span>
                : isEditing ? 'Guardar cambios' : 'Enviar y registrarme'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
