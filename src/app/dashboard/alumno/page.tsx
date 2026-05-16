'use client';
import { useState, useCallback } from 'react';
import { useProfessionals, useCenters, useEscuelas } from '@/hooks/useSearch';
import type { SearchFilters, Professional, Center } from '@/types';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

const DISABILITY_OPTIONS = [
  { value: 'visual', label: 'Visual' },
  { value: 'auditiva', label: 'Auditiva' },
  { value: 'motriz', label: 'Motriz' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'tea', label: 'TEA' },
  { value: 'multiple', label: 'Múltiple' },
];

export default function AlumnoSearchPage() {
  /*const [filters, setFilters] = useState<SearchFilters>({
    city: '', province: '', disabilityType: undefined,
    lat: -34.6037, lng: -58.3816, radiusKm: 25
  });*/

  const [filters, setFilters] = useState<SearchFilters>({
  city: 'Buenos Aires',
  province: 'Buenos Aires',
  lat: -34.6037,
  lng: -58.3816,
  radiusKm: 200
});
  const [tab, setTab] = useState<'profesionales' | 'escuelas' | 'centros' | 'mapa'>('profesionales');
  const [selected, setSelected] = useState<{
    type: 'professional' | 'center' | 'escuela' ;
    data: any;
    } | null>(null);

  const { data: professionals, isLoading: loadingProf } = useProfessionals(filters);
  const { data: centers, isLoading: loadingCenters }    = useCenters(filters);
  const { data: escuelas = [], isLoading: loadingEscuelas } = useEscuelas(filters);



  const updateFilter = (key: keyof SearchFilters, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Buscar recursos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input 
            placeholder="Ciudad" 
            value={filters.city}
            onChange={e => updateFilter('city', e.target.value)}
            className="..."
            />
          <input placeholder="Provincia" value={filters.province || ''}
            onChange={e => updateFilter('province', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <input placeholder="Escuela" value={filters.school || ''}
            onChange={e => updateFilter('school', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <select value={filters.disabilityType || ''}
            onChange={e => updateFilter('disabilityType', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">Tipo de discapacidad</option>
            {DISABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={!!filters.needsCompanion}
              onChange={e => updateFilter('needsCompanion', e.target.checked)}
              className="rounded text-indigo-600" />
            Acompañante terapéutico
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={!!filters.needsNurse}
              onChange={e => updateFilter('needsNurse', e.target.checked)}
              className="rounded text-indigo-600" />
            Enfermera
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6">
          {(['profesionales', 'escuelas', 'centros', 'mapa'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2
                ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
              {t === 'escuelas' ? `Escuelas (${escuelas.length})` : t}
            </button>
          ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* PROFESIONALES */}
        {tab === 'profesionales' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProf ? <SkeletonCards /> :
             professionals?.map(p => <ProfessionalCard key={p.id} professional={p} />)
            }
            {!loadingProf && !professionals?.length && <EmptyState message="No se encontraron profesionales con esos filtros" />}
          </div>
        )}

        {/* CENTROS */}
        {tab === 'centros' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingCenters ? <SkeletonCards /> :
             centers?.map((c: Center) => <CenterCard key={c.id} center={c} />)
            }
            {!loadingCenters && !centers?.length && <EmptyState message="No se encontraron centros con esos filtros" />}
          </div>
        )}

        {tab === 'escuelas' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingEscuelas ? <SkeletonCards /> :
            escuelas.length === 0
              ? <EmptyState message="No se encontraron escuelas con esos filtros" />
              : escuelas.map((e: any) => (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">🏫</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{e.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.localidad}, {e.jurisdiccion}</p>
                        {e.distancia_km && (
                          <p className="text-xs text-indigo-500 mt-0.5">📍 {e.distancia_km} km</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${e.sector === 'Estatal' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {e.sector}
                      </span>
                      {e.ambito === 'Rural' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Rural</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {e.nivel_primario   && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Primario</span>}
                      {e.nivel_secundario && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Secundario</span>}
                      {e.nivel_jardin     && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Jardín</span>}
                      {e.nivel_temprana   && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Temprana</span>}
                      {e.nivel_integracion && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Integración</span>}
                    </div>
                    {e.domicilio && <p className="text-xs text-gray-500 mb-3">📍 {e.domicilio}</p>}
                    <div className="flex gap-2">
                      {e.telefono && (
                        <a href={`tel:${e.telefono}`}
                          className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100">
                          📞 {e.telefono}
                        </a>
                      )}
                      {e.email && (
                        <a href={`mailto:${e.email}`}
                          className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100">
                          ✉️ Email
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">CUE: {e.cueanexo}</p>
                  </div>
                ))
            }
          </div>
        )}

        {/* MAPA */}
        {tab === 'mapa' && (
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ height: '600px' }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <Map
                    defaultCenter={{ lat: filters.lat || -34.6037, lng: filters.lng || -58.3816 }}
                    defaultZoom={12}
                    style={{ width: '100%', height: '100%' }}
                >
                    {professionals?.map((p: any) => {
                    const pos = parseLocation(p.location_text);
                    if (!pos) return null;
                    return (
                        <Marker key={p.id}
                        position={pos}
                        onClick={() => setSelected({ type: 'professional', data: p })}
                        />
                    );
                    })}

                    {centers?.map((c: any) => {
                    const pos = parseLocation(c.location_text);
                    if (!pos) return null;
                    return (
                        <Marker key={c.id}
                        position={pos}
                        onClick={() => setSelected({ type: 'center', data: c })}
                        />
                    );
                    })}

                    {escuelas?.map((e: any) => {
                      const pos = parseLocation(e.location_text);
                      if (!pos) return null;
                      return (
                        <Marker key={e.id} position={pos}
                          onClick={() => setSelected({ type: 'escuela', data: e })}
                        />
                      );
                    })}

                    {selected && (() => {
                    const pos = parseLocation(selected.data.location_text);
                    if (!pos) return null;
                    return (
                        <InfoWindow position={pos} onCloseClick={() => setSelected(null)}>
                        <div className="p-2">
                            <p className="font-bold text-sm">
                            {selected.data.full_name || selected.data.name}
                            </p>
                            <p className="text-xs text-gray-500">
                            {selected.data.city}, {selected.data.province}
                            </p>
                            <p className="font-bold text-sm">
                              {selected.data.full_name || selected.data.nombre || selected.data.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selected.data.city || selected.data.localidad}, {selected.data.province || selected.data.jurisdiccion}
                            </p>
                            {selected.data.contact_whatsapp && (
                            <a href={`https://wa.me/${selected.data.contact_whatsapp.replace(/\D/g,'')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs text-green-600 mt-1 block">
                                WhatsApp →
                            </a>
                            )}
                        </div>
                        </InfoWindow>
                    );
                    })()}
                </Map>
                </APIProvider>
            </div>
            )}
      </div>
    </div>
  );
}


// ─── TARJETA PROFESIONAL ──────────────────────────────────────
const ProfessionalCard = ({ professional: p }: { professional: Professional }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-indigo-600 font-bold text-lg">
          {p.user?.fullName?.[0] || 'P'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{p.user?.fullName}</p>
          {p.isVerified && <span className="text-blue-500 text-sm" title="Verificado">✓</span>}
        </div>
        <p className="text-sm text-indigo-600 capitalize">{p.profession.replace(/_/g,' ')}</p>
        <p className="text-xs text-gray-400">{p.city}, {p.province}</p>
      </div>
    </div>
    {p.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.bio}</p>}
    <div className="flex flex-wrap gap-1 mb-3">
      {p.specialties.slice(0, 3).map(s => (
        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">
          {s}
        </span>
      ))}
    </div>
    <div className="flex gap-2">
      {p.contactWhatsapp && (
        <a href={`https://wa.me/${p.contactWhatsapp}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors">
          WhatsApp
        </a>
      )}
      {p.contactPhone && (
        <a href={`tel:${p.contactPhone}`}
          className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors">
          Llamar
        </a>
      )}
    </div>
  </div>
);

// ─── TARJETA CENTRO ───────────────────────────────────────────
const CenterCard = ({ center: c }: { center: Center }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-3 mb-3">
      {c.logoUrl
        ? <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
        : <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <span className="text-2xl">🏥</span>
          </div>
      }
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{c.name}</p>
          {c.isVerified && <span className="text-blue-500 text-sm">✓</span>}
        </div>
        <p className="text-sm text-orange-600 capitalize">{c.centerType?.replace(/_/g,' ')}</p>
        <p className="text-xs text-gray-400">{c.city}, {c.province}</p>
      </div>
    </div>
    {c.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>}
    <div className="flex flex-wrap gap-1 mb-3">
      {c.services.slice(0, 3).map(s => (
        <span key={s} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full">{s}</span>
      ))}
    </div>
    {c.phone && (
      <a href={`tel:${c.phone}`}
        className="block text-center py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100">
        📞 {c.phone}
      </a>
    )}
  </div>
);

// ─── HELPERS UI ───────────────────────────────────────────────
const SkeletonCards = () => (
  <>
    {[1,2,3].map(i => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      </div>
    ))}
  </>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="col-span-full text-center py-12">
    <span className="text-4xl mb-3 block">🔍</span>
    <p className="text-gray-500">{message}</p>
  </div>
);

// Parsea "POINT(-58.3983 -34.5883)" → { lat: -34.5883, lng: -58.3983 }
function parseLocation(locationText: string | null): { lat: number; lng: number } | null {
  if (!locationText) return null;
  const match = locationText.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!match) return null;
  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2]),
  };
}
