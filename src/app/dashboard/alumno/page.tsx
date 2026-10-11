'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProfessionals, useCenters, useEscuelas, useAsociaciones, useMapProfessionals, useMapCenters, useMapEscuelas, useMapAsociaciones, useMapAccessibilityReports } from '@/hooks/useSearch';
import { DISCIPLINA_OPTIONS } from '@/types';
import { AccessibilityReportForm } from '@/components/AccessibilityReportForm';
import { LogoMark } from '@/components/Logo';
import { ADMIN_EMAILS } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import type { SearchFilters, Professional, Center } from '@/types';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useToast } from '@/context/ToastContext';
import { useAutoSaveSearch, loadLastSearch } from '@/hooks/useLastSearch';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { SaveSearchButton } from '@/components/SaveSearchButton';
import { getCurrentPosition } from '@/lib/geolocation';

const MapTab = dynamic(() => import('@/components/MapTab'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl bg-gray-100" style={{ height: '70vh' }}>
      <p className="text-gray-400 text-sm">Cargando mapa...</p>
    </div>
  ),
});

const DISABILITY_OPTIONS = [
  { value: 'visual',      label: 'Visual',       icon: '👁️' },
  { value: 'auditiva',    label: 'Auditiva',      icon: '👂' },
  { value: 'motriz',      label: 'Motriz',        icon: '🦽' },
  { value: 'intelectual', label: 'Intelectual',   icon: '🧠' },
  { value: 'tea',         label: 'TEA',           icon: '♾️' },
  { value: 'multiple',    label: 'Múltiple',      icon: '♿' },
] as const;

const PROFESSION_OPTIONS = [
  { value: 'acompanante_terapeutico', label: 'Acompañante terapéutico' },
  { value: 'enfermera',               label: 'Enfermera/o' },
  { value: 'docente_especial',        label: 'Docente especial' },
  { value: 'psicologo',               label: 'Psicólogo/a' },
  { value: 'fonoaudiologo',           label: 'Fonoaudiólogo/a' },
  { value: 'otro',                    label: 'Otro' },
] as const;

const CENTER_TYPE_OPTIONS = [
  { value: 'escuela_especial',   label: 'Escuela especial' },
  { value: 'centro_terapeutico', label: 'Centro terapéutico' },
  { value: 'rehabilitacion',     label: 'Rehabilitación' },
  { value: 'integracion',        label: 'Integración' },
  { value: 'otro',               label: 'Otro' },
] as const;

const OBRAS_SOCIALES = [
  'OSDE', 'Swiss Medical', 'Galeno', 'IOMA', 'PAMI', 'Medifé',
  'Accord Salud', 'Sancor Salud', 'Medicus', 'OMINT', 'Particular',
] as const;

const DEFAULT_FILTERS: SearchFilters = {
  city: 'Buenos Aires',
  province: 'Buenos Aires',
  lat: -34.6037,
  lng: -58.3816,
  radiusKm: 50,
};

// Haptic feedback — usa @capacitor/haptics en Android, vibrate() como fallback
async function haptic(style: 'light' | 'medium' = 'light') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium });
  } catch {
    navigator.vibrate?.(style === 'light' ? 20 : 40);
  }
}

type TabId = 'profesionales' | 'escuelas' | 'centros' | 'asociaciones' | 'mapa';

const BOTTOM_TABS: { id: TabId; label: string; icon: (active: boolean) => ReactElement }[] = [
  {
    id: 'profesionales',
    label: 'Profesionales',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: 'escuelas',
    label: 'Escuelas',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    id: 'centros',
    label: 'Centros',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    id: 'asociaciones',
    label: 'Asociaciones',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: 'mapa',
    label: 'Mapa',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
];

export default function AlumnoSearchPage() {
  const router = useRouter();
  const { appUser, token } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = !!appUser && (appUser.role === 'admin' || ADMIN_EMAILS.includes((appUser as any).email));

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const last = loadLastSearch();
    return last ? { ...DEFAULT_FILTERS, ...last } : DEFAULT_FILTERS;
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useAutoSaveSearch(filters);

  const [tab, setTabRaw] = useState<TabId>('profesionales');
  const setTab = (next: TabId) => {
    haptic('light');
    setTabRaw(next);
    setFilters(prev => ({
      ...prev,
      profession:     undefined,
      centerType:     undefined,
      isVerifiedOnly: undefined,
      school:         undefined,
      sector:         undefined,
      nivel:          undefined,
      disciplina:     undefined,
    }));
  };

  const { toast } = useToast();
  const { recent: recentCities, addSearch: addRecentCity } = useRecentSearches();

  const [selected, setSelected] = useState<{ type: 'professional' | 'center' | 'escuela' | 'accessibility' | 'asociacion'; data: any } | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [mapInitCenter, setMapInitCenter] = useState({ lat: -34.6037, lng: -58.3816 });
  const [mapInitZoom,   setMapInitZoom]   = useState(12);
  const [mapLayers, setMapLayers] = useState({ profesionales: true, centros: true, escuelas: true, accesibilidad: true, asociaciones: true });
  const toggleLayer = (key: keyof typeof mapLayers) =>
    setMapLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const [reportMode, setReportMode] = useState(false);
  const [pendingReportPos, setPendingReportPos] = useState<{ lat: number; lng: number } | null>(null);

  // Filtros independientes para el mapa — se actualizan al mover el mapa
  const [mapFilters, setMapFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const goToMap = (lat: number, lng: number, item: any, type: 'professional' | 'center' | 'escuela' | 'asociacion') => {
    setMapInitCenter({ lat, lng });
    setMapInitZoom(15);
    setMapKey(k => k + 1);
    setSelected({ type, data: item });
    setTab('mapa');
    haptic('light');
  };

  const {
    data: profPages, isLoading: loadingProf,
    fetchNextPage: fetchMoreProf, hasNextPage: hasMoreProf, isFetchingNextPage: loadingMoreProf,
  } = useProfessionals(filters);
  const professionals = profPages?.pages.flat() ?? [];

  const {
    data: centerPages, isLoading: loadingCenters,
    fetchNextPage: fetchMoreCenters, hasNextPage: hasMoreCenters, isFetchingNextPage: loadingMoreCenters,
  } = useCenters(filters);
  const centers = centerPages?.pages.flat() ?? [];

  const { data: escuelas = [], isLoading: loadingEscuelas } = useEscuelas(filters);

  const {
    data: asociacionPages, isLoading: loadingAsociaciones,
    fetchNextPage: fetchMoreAsociaciones, hasNextPage: hasMoreAsociaciones, isFetchingNextPage: loadingMoreAsociaciones,
  } = useAsociaciones(filters);
  const asociaciones = asociacionPages?.pages.flat() ?? [];

  const isMapTab = tab === 'mapa';
  const { data: mapProfessionals = [], isFetching: fetchingMapProf } = useMapProfessionals(mapFilters, isMapTab);
  const { data: mapCenters = [],       isFetching: fetchingMapCent } = useMapCenters(mapFilters, isMapTab);
  const { data: mapEscuelas = [],      isFetching: fetchingMapEsc  } = useMapEscuelas(mapFilters, isMapTab);
  const { data: mapAsociaciones = [],  isFetching: fetchingMapAsoc } = useMapAsociaciones(mapFilters, isMapTab);
  const { data: mapAccessibilityReports = [], isFetching: fetchingMapAccess } =
    useMapAccessibilityReports(mapFilters, isMapTab, token);
  const isFetchingMap = fetchingMapProf || fetchingMapCent || fetchingMapEsc || fetchingMapAsoc || fetchingMapAccess;

  // Encuadrar el mapa en los resultados cuando el usuario busca por ciudad/provincia/radio.
  // Dos etapas: (1) esperar a que el usuario deje de tocar los campos de búsqueda
  // (si cambia ciudad y provincia casi juntas, cuentan como una sola búsqueda), y
  // (2) recién ahí vigilar isFetchingMap hasta que las 4 queries del mapa terminen.
  // Sin la etapa 1, un settle intermedio (ciudad ya cambiada, provincia todavía no)
  // podía disparar el encuadre con resultados vacíos/parciales.
  const searchInputDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchPendingRef = useRef(false);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  useEffect(() => {
    if (!searchPendingRef.current || isFetchingMap) return;
    searchPendingRef.current = false;
    setFitBoundsTrigger(v => v + 1);
  }, [mapProfessionals, mapCenters, mapEscuelas, mapAsociaciones, isFetchingMap]);

  const toggleReportMode = () => {
    if (!appUser) { toast('Iniciá sesión para reportar accesibilidad', 'info'); return; }
    haptic('light');
    setReportMode(v => !v);
  };

  const handleMapClickToReport = (pos: { lat: number; lng: number }) => {
    setPendingReportPos(pos);
    setReportMode(false);
  };

  const handleVote = async (reportId: string, vote: 1 | -1) => {
    if (!token) { toast('Iniciá sesión para votar', 'info'); return; }
    const res = await fetch(`/api/accessibility-reports/${reportId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vote }),
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ['accessibility-reports-map'] });
    }
  };

  const handleReportCreated = () => {
    setPendingReportPos(null);
    queryClient.invalidateQueries({ queryKey: ['accessibility-reports-map'] });
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    // Buscar por texto (ciudad/provincia) reemplaza el filtro de proximidad geográfica —
    // si no se limpia lat/lng, el radio (anclado a la posición vieja) sigue aplicando
    // en el WHERE del backend y descarta resultados reales de la ciudad nueva.
    const clearsGeo = key === 'city' || key === 'province';
    setFilters(prev => ({ ...prev, [key]: value, ...(clearsGeo ? { lat: undefined, lng: undefined } : {}) }));
    // Mantener mapFilters sincronizado con ciudad/provincia/lat cuando el usuario busca
    if (key === 'city' || key === 'province' || key === 'lat' || key === 'lng' || key === 'radiusKm') {
      setMapFilters(prev => ({ ...prev, [key]: value, ...(clearsGeo ? { lat: undefined, lng: undefined } : {}) }));
    }
    // Búsqueda explícita por texto — una vez que el usuario deja de tocar estos campos
    // y llegan los resultados, encuadrar el mapa (ver comentario arriba de searchPendingRef).
    if (key === 'city' || key === 'province' || key === 'radiusKm') {
      clearTimeout(searchInputDebounceRef.current);
      searchInputDebounceRef.current = setTimeout(() => {
        searchPendingRef.current = true;
      }, 600);
    }
    if (key === 'city' && typeof value === 'string' && value.length > 1) {
      addRecentCity(value);
    }
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleGeolocate = async (recenterMap = false) => {
    setGeoLoading(true);
    try {
      const { lat, lng } = await getCurrentPosition();
      setFilters(prev => ({ ...prev, lat, lng, city: '', province: '' }));
      setMapFilters(prev => ({ ...prev, lat, lng, city: '', radiusKm: 20 }));
      if (recenterMap || tab === 'mapa') {
        setMapInitCenter({ lat, lng });
        setMapInitZoom(14);
        setMapKey(k => k + 1);
      }
      toast('Ubicación actualizada', 'success');
    } catch {
      toast('No se pudo obtener la ubicación. Verificá que el permiso esté activado.', 'error');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleMapMove = useCallback((center: { lat: number; lng: number }, radiusKm: number) => {
    setMapFilters(prev => ({ ...prev, lat: center.lat, lng: center.lng, radiusKm, city: '' }));
  }, []);

  const activeFilterCount = [
    filters.disabilityType, filters.profession, filters.centerType,
    filters.isVerifiedOnly, filters.sector, filters.nivel, filters.school,
  ].filter(Boolean).length;

  const unreadCount = useUnreadCount();

  useAndroidBackButton(useCallback(() => {
    if (filterOpen) { setFilterOpen(false); return true; }
    return false;
  }, [filterOpen]));

  // Auto-geolocalización en el primer uso (silenciosa)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('discaconecta_geo_asked')) return;
    localStorage.setItem('discaconecta_geo_asked', '1');
    getCurrentPosition()
      .then(({ lat, lng }) => setFilters(prev => ({ ...prev, lat, lng, city: '', province: '' })))
      .catch(() => {}); // silencioso en el primer uso
  }, []);

  // Búsqueda por voz
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => {
    setVoiceSupported(!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  }, []);
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    haptic('light');
    const r = new SR();
    r.lang = 'es-AR';
    r.continuous = false;
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onerror  = () => setListening(false);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      updateFilter('city', text);
    };
    r.start();
  };

  // Pull to refresh
  const pullStartY = useRef(0);
  const lastRefreshRef = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { pullStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = async (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - pullStartY.current;
    // Evita relanzar mientras ya hay un refresh en curso, o repetir por gestos de
    // scroll consecutivos — si no, cada toque cerca del borde superior dispara otro
    // refresh y otro toast, y da la sensación de que el cartel verde "no se borra".
    const now = Date.now();
    if (delta > 80 && window.scrollY < 5 && !refreshing && now - lastRefreshRef.current > 3000) {
      lastRefreshRef.current = now;
      setRefreshing(true);
      haptic('medium');
      await queryClient.invalidateQueries();
      setRefreshing(false);
      toast('Resultados actualizados', 'success');
    }
  };

  // ── Filtros — contenido reutilizado en desktop y en el sheet móvil
  const FiltersContent = () => (
    <div className="space-y-5">
      {/* Ubicación */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ubicación</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filter-city" className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
            <input id="filter-city" type="text" placeholder="ej. Buenos Aires"
              value={filters.city || ''} onChange={e => updateFilter('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            {recentCities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {recentCities.map(c => (
                  <button key={c} type="button"
                    onClick={() => updateFilter('city', c)}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-indigo-50 hover:text-indigo-700 transition-colors no-min">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="filter-province" className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
            <input id="filter-province" type="text" placeholder="ej. Buenos Aires"
              value={filters.province || ''} onChange={e => updateFilter('province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <label htmlFor="filter-radius" className="block text-xs font-medium text-gray-500 mb-1">Radio de búsqueda</label>
            <select id="filter-radius" value={filters.radiusKm || 50}
              onChange={e => updateFilter('radiusKm', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={300}>300 km</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => handleGeolocate()} disabled={geoLoading}
              aria-label="Usar mi ubicación actual"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              <span aria-hidden="true">{geoLoading ? '⏳' : '📍'}</span>
              {geoLoading ? 'Buscando…' : 'Mi ubicación'}
            </button>
          </div>
        </div>
      </div>

      {/* Tipo de discapacidad (profesionales y asociaciones) */}
      {(tab === 'profesionales' || tab === 'asociaciones') && (
        <fieldset>
          <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de discapacidad</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!filters.disabilityType}
              onClick={() => updateFilter('disabilityType', undefined)}
              style={!filters.disabilityType ? { backgroundColor: '#4f46e5', color: 'white' } : {}}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${!filters.disabilityType ? 'border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'}`}>
              Todas
            </button>
            {DISABILITY_OPTIONS.map(o => {
              const active = filters.disabilityType === o.value;
              return (
                <button key={o.value} type="button" aria-pressed={active}
                  onClick={() => updateFilter('disabilityType', active ? undefined : o.value)}
                  style={active ? { backgroundColor: '#4f46e5', color: 'white' } : {}}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${active ? 'border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'}`}>
                  <span aria-hidden="true">{o.icon}</span>{o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Filtros contextuales según pestaña */}
      {tab === 'profesionales' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros de profesional</p>
          <div>
            <label htmlFor="filter-nombre" className="block text-xs font-medium text-gray-500 mb-1">Nombre del profesional</label>
            <input id="filter-nombre" type="text" placeholder="ej. García"
              value={filters.nombreProfesional || ''} onChange={e => updateFilter('nombreProfesional', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="filter-profession" className="block text-xs font-medium text-gray-500 mb-1">Profesión</label>
            <select id="filter-profession" value={filters.profession || ''}
              onChange={e => updateFilter('profession', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Todas las profesiones</option>
              {PROFESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-obra-social" className="block text-xs font-medium text-gray-500 mb-1">Obra social / prepaga</label>
            <select id="filter-obra-social" value={filters.obraSocial || ''}
              onChange={e => updateFilter('obraSocial', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Todas</option>
              {OBRAS_SOCIALES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!filters.isVerifiedOnly}
              onChange={e => updateFilter('isVerifiedOnly', e.target.checked || undefined)}
              className="rounded accent-indigo-600 w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            Solo profesionales verificados ✓
          </label>
        </div>
      )}

      {tab === 'escuelas' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros de escuela</p>
          <div>
            <label htmlFor="filter-school" className="block text-xs font-medium text-gray-500 mb-1">Nombre de escuela</label>
            <input id="filter-school" type="text" placeholder="ej. Escuela N° 500"
              value={filters.school || ''} onChange={e => updateFilter('school', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-sector" className="block text-xs font-medium text-gray-500 mb-1">Sector</label>
              <select id="filter-sector" value={filters.sector || ''}
                onChange={e => updateFilter('sector', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Todos</option>
                <option value="Estatal">Estatal</option>
                <option value="Privado">Privado</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-nivel" className="block text-xs font-medium text-gray-500 mb-1">Nivel</label>
              <select id="filter-nivel" value={filters.nivel || ''}
                onChange={e => updateFilter('nivel', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Todos</option>
                <option value="temprana">Estimulación temprana</option>
                <option value="jardin">Jardín</option>
                <option value="primario">Primario</option>
                <option value="secundario">Secundario</option>
                <option value="integracion">Integración</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'centros' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros de centro</p>
          <div>
            <label htmlFor="filter-center-type" className="block text-xs font-medium text-gray-500 mb-1">Tipo de centro</label>
            <select id="filter-center-type" value={filters.centerType || ''}
              onChange={e => updateFilter('centerType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Todos los centros</option>
              {CENTER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!filters.isVerifiedOnly}
              onChange={e => updateFilter('isVerifiedOnly', e.target.checked || undefined)}
              className="rounded accent-indigo-600 w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            Solo centros verificados ✓
          </label>
        </div>
      )}

      {tab === 'asociaciones' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros de asociación</p>
          <div>
            <label htmlFor="filter-disciplina" className="block text-xs font-medium text-gray-500 mb-1">Disciplina</label>
            <select id="filter-disciplina" value={filters.disciplina || ''}
              onChange={e => updateFilter('disciplina', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Todas las disciplinas</option>
              {DISCIPLINA_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!filters.isVerifiedOnly}
              onChange={e => updateFilter('isVerifiedOnly', e.target.checked || undefined)}
              className="rounded accent-indigo-600 w-4 h-4" style={{ minHeight: 'unset', minWidth: 'unset' }} />
            Solo asociaciones verificadas ✓
          </label>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      <OnboardingModal />

      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe pt-4">
          <div className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm text-gray-600">
            <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Actualizando...
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-top"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LogoMark className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">DiscaConecta</span>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          {isAdmin && (
            <button onClick={() => router.push('/dashboard')}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg no-min">
              ← Inicio
            </button>
          )}
          {!appUser ? (
            // Sin sesión: un solo CTA claro en vez de íconos que no llevan a nada sin cuenta.
            <button onClick={() => router.push('/login')}
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors no-min">
              Ingresar
            </button>
          ) : (
            <>
              {/* Favoritos */}
              <button onClick={() => router.push('/dashboard/favoritos')} aria-label="Mis favoritos"
                className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 no-min">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
              {/* Mensajes con badge */}
              <button onClick={() => router.push('/dashboard/mensajes')} aria-label={`Mensajes${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
                className="relative w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 no-min">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none no-min">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {/* Perfil */}
              <button onClick={() => router.push('/dashboard/perfil')} aria-label="Ver mi perfil"
                className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm no-min">
                {((appUser as any)?.full_name || appUser?.fullName || 'U')[0].toUpperCase()}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── MOBILE: barra compacta de búsqueda rápida + botón filtros ── */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1">
          <input type="text" placeholder="📍 Ciudad o provincia..."
            value={filters.city || ''}
            onChange={e => updateFilter('city', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          {voiceSupported && (
            <button onClick={startVoice} aria-label="Buscar por voz" disabled={listening}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 no-min"
              style={listening ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' } : {}}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                style={listening ? { color: '#ef4444' } : { color: '#6b7280' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => { haptic('light'); setFilterOpen(true); }}
          aria-label={`Abrir filtros${activeFilterCount > 0 ? `, ${activeFilterCount} activos` : ''}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors no-min"
          style={activeFilterCount > 0
            ? { backgroundColor: '#4f46e5', color: 'white' }
            : { backgroundColor: '#eef2ff', color: '#4338ca' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── DESKTOP: filtros siempre visibles ── */}
      <section id="main-content" aria-label="Filtros de búsqueda"
        className="hidden md:block bg-white border-b border-gray-200 px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            Buscar recursos
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <SaveSearchButton filters={filters} />
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium no-min">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        <FiltersContent />
      </section>

      {/* ── DESKTOP: pestañas horizontales ── */}
      <div role="tablist" aria-label="Tipo de resultado"
        className="hidden md:flex border-b border-gray-200 bg-white px-6">
        {BOTTOM_TABS.map(t => (
          <button key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 no-min
              ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>
            {t.id === 'escuelas' ? `Escuelas (${escuelas.length})` : t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO (resultados) ── */}
      <div id={tab === 'mapa' ? 'main-content-mobile' : 'main-content-mobile'}
        aria-live="polite" aria-atomic="false"
        className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>

        {/* PROFESIONALES */}
        {tab === 'profesionales' && (
          <div role="tabpanel" id="panel-profesionales" aria-labelledby="tab-profesionales">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loadingProf ? <SkeletonCards /> :
               professionals?.map((p: Professional) => <ProfessionalCard key={p.id} professional={p} />)}
              {!loadingProf && !professionals?.length &&
               <EmptyState message="No se encontraron profesionales con esos filtros"
                 onBroaden={() => setFilters(prev => ({ ...prev, city: '', province: '', radiusKm: 300 }))} />}
            </div>
            {hasMoreProf && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => fetchMoreProf()} disabled={loadingMoreProf}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors no-min">
                  {loadingMoreProf
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Cargando…</>
                    : `Cargar más profesionales (${professionals.length} mostrados)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CENTROS */}
        {tab === 'centros' && (
          <div role="tabpanel" id="panel-centros" aria-labelledby="tab-centros">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loadingCenters ? <SkeletonCards /> :
               centers?.map((c: Center) => {
                 const pos = parseLocation((c as any).location_text);
                 return (
                   <CenterCard key={c.id} center={c}
                     onShowMap={pos ? () => goToMap(pos.lat, pos.lng, c, 'center') : undefined} />
                 );
               })}
              {!loadingCenters && !centers?.length &&
               <EmptyState message="No se encontraron centros con esos filtros"
                 onBroaden={() => setFilters(prev => ({ ...prev, city: '', province: '', radiusKm: 300 }))} />}
            </div>
            {hasMoreCenters && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => fetchMoreCenters()} disabled={loadingMoreCenters}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 transition-colors no-min">
                  {loadingMoreCenters
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Cargando…</>
                    : `Cargar más centros (${centers.length} mostrados)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ASOCIACIONES */}
        {tab === 'asociaciones' && (
          <div role="tabpanel" id="panel-asociaciones" aria-labelledby="tab-asociaciones">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loadingAsociaciones ? <SkeletonCards /> :
               asociaciones?.map((a: any) => {
                 const pos = parseLocation(a.location_text);
                 return (
                   <AssociationCard key={a.id} asociacion={a}
                     onShowMap={pos ? () => goToMap(pos.lat, pos.lng, a, 'asociacion') : undefined} />
                 );
               })}
              {!loadingAsociaciones && !asociaciones?.length &&
               <EmptyState message="No se encontraron asociaciones con esos filtros"
                 onBroaden={() => setFilters(prev => ({ ...prev, city: '', province: '', radiusKm: 300 }))} />}
            </div>
            {hasMoreAsociaciones && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => fetchMoreAsociaciones()} disabled={loadingMoreAsociaciones}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors no-min">
                  {loadingMoreAsociaciones
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Cargando…</>
                    : `Cargar más asociaciones (${asociaciones.length} mostradas)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ESCUELAS */}
        {tab === 'escuelas' && (
          <div role="tabpanel" id="panel-escuelas" aria-labelledby="tab-escuelas"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingEscuelas ? <SkeletonCards /> :
             escuelas.length === 0
               ? <EmptyState message="No se encontraron escuelas con esos filtros"
                   onBroaden={() => setFilters(prev => ({ ...prev, city: '', province: '', radiusKm: 300 }))} />
               : escuelas.map((e: any) => (
                   <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                     <div className="flex items-start gap-3 mb-3">
                       <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">🏫</div>
                       <div className="flex-1 min-w-0">
                         <p className="font-semibold text-gray-900 text-sm line-clamp-2">{e.nombre}</p>
                         <p className="text-xs text-gray-400 mt-0.5">{e.localidad}, {e.jurisdiccion}</p>
                         {e.distancia_km && <p className="text-xs text-indigo-500 mt-0.5">📍 {e.distancia_km} km</p>}
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
                       {e.nivel_primario    && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Primario</span>}
                       {e.nivel_secundario  && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Secundario</span>}
                       {e.nivel_jardin      && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Jardín</span>}
                       {e.nivel_temprana    && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Temprana</span>}
                       {e.nivel_integracion && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">Integración</span>}
                     </div>
                     {e.domicilio && <p className="text-xs text-gray-500 mb-3">📍 {e.domicilio}</p>}
                     <div className="flex gap-2">
                       {e.telefono && (
                         <a href={`tel:${e.telefono}`} aria-label={`Llamar a ${e.nombre}: ${e.telefono}`}
                           className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100">
                           <span aria-hidden="true">📞 </span>{e.telefono}
                         </a>
                       )}
                       {e.email && (
                         <a href={`mailto:${e.email}`} aria-label={`Enviar email a ${e.nombre}`}
                           className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100">
                           <span aria-hidden="true">✉️ </span>Email
                         </a>
                       )}
                     </div>
                     <p className="text-xs text-gray-300 mt-2">CUE: {e.cueanexo}</p>
                     {e.location_text && (() => {
                       const pos = parseLocation(e.location_text);
                       return pos ? (
                         <button
                           onClick={() => goToMap(pos.lat, pos.lng, e, 'escuela')}
                           className="mt-2 w-full text-center py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-min">
                           📍 Ver en mapa
                         </button>
                       ) : null;
                     })()}
                   </div>
                 ))
            }
          </div>
        )}

        {/* MAPA */}
        {tab === 'mapa' && (
          <MapTab
            professionals={mapProfessionals}
            centers={mapCenters}
            escuelas={mapEscuelas}
            asociaciones={mapAsociaciones}
            accessibilityReports={mapAccessibilityReports}
            fitBoundsTrigger={fitBoundsTrigger}
            mapLayers={mapLayers}
            toggleLayer={toggleLayer}
            geoLoading={geoLoading}
            handleGeolocate={handleGeolocate}
            mapKey={mapKey}
            mapInitCenter={mapInitCenter}
            mapInitZoom={mapInitZoom}
            selected={selected}
            setSelected={setSelected}
            setTabRaw={setTabRaw}
            reportMode={reportMode}
            onToggleReportMode={toggleReportMode}
            onMapClickToReport={handleMapClickToReport}
            onVote={handleVote}
            canVote={!!appUser}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            onMapMove={handleMapMove}
            isFetching={isFetchingMap}
          />
        )}
      </div>

      {pendingReportPos && (
        <AccessibilityReportForm
          lat={pendingReportPos.lat}
          lng={pendingReportPos.lng}
          onClose={() => setPendingReportPos(null)}
          onCreated={handleReportCreated}
        />
      )}

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id}
              role="tab"
              aria-selected={active}
              aria-label={t.label}
              onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors no-min"
              style={active ? { color: '#4f46e5' } : { color: '#9ca3af' }}>
              {t.icon(active)}
              <span className="text-[9px] font-medium leading-none">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── FILTER BOTTOM SHEET (mobile only) ── */}
      {filterOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label="Filtros de búsqueda">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl overflow-y-auto max-h-[88vh]"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Filtros de búsqueda</h2>
              <button onClick={() => setFilterOpen(false)} aria-label="Cerrar filtros"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 no-min">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="px-5 py-4">
              <FiltersContent />
            </div>

            {/* Actions */}
            <div className="px-5 flex gap-3 border-t border-gray-100 pt-4">
              {activeFilterCount > 0 && (
                <button onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Limpiar ({activeFilterCount})
                </button>
              )}
              <button onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#4f46e5' }}>
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── TARJETA PROFESIONAL ──────────────────────────────────────
function shareReferral(p: Professional) {
  const name = p.user?.fullName ?? 'este profesional';
  const prof = p.profession.replace(/_/g, ' ');
  const url  = `${window.location.origin}/profesional/${p.id}`;
  const text = `Te recomiendo a ${name}, ${prof} en DiscaConecta. Podés ver su perfil acá: ${url}`;
  if (navigator.share) {
    navigator.share({ title: `Profesional en DiscaConecta — ${name}`, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert('Link copiado al portapapeles'));
  }
}

const ProfessionalCard = ({ professional: p }: { professional: Professional }) => (
  <article className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow relative
    ${(p as any).is_active_featured ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-200'}`}
    aria-label={`${p.user?.fullName}, ${p.profession.replace(/_/g,' ')}, ${p.city}`}>
    {(p as any).is_active_featured && (
      <span className="absolute top-3 right-3 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
        ⭐ Destacado
      </span>
    )}
    <div className="flex items-start gap-3 mb-3">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
        {(p as any).avatar_url
          ? <Image src={(p as any).avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
          : <span className="text-indigo-600 font-bold text-lg">{p.user?.fullName?.[0] || 'P'}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a href={`/profesional/${p.id}`}
            className="font-semibold text-gray-900 hover:text-indigo-600 truncate transition-colors">
            {p.user?.fullName}
          </a>
          {p.isVerified && <span className="text-blue-500 text-sm" aria-label="Profesional verificado">✓</span>}
        </div>
        <p className="text-sm text-indigo-600 capitalize">{p.profession.replace(/_/g,' ')}</p>
        <p className="text-xs text-gray-400">{p.city}, {p.province}</p>
        {(p.review_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-0.5" aria-label={`Calificación: ${p.avg_rating?.toFixed(1)} sobre 5, ${p.review_count} reseñas`}>
            <StarRating value={p.avg_rating ?? 0} />
            <span className="text-xs text-gray-400">({p.review_count})</span>
          </div>
        )}
      </div>
      <FavoriteButton targetType="professional" targetId={p.id} size="sm" />
    </div>
    {p.bio && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.bio}</p>}
    <div className="flex flex-wrap gap-1 mb-3" aria-label="Especialidades">
      {p.specialties.slice(0, 3).map(s => (
        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">{s}</span>
      ))}
    </div>
    <div className="flex gap-2">
      {p.contactWhatsapp && (
        <a href={`https://wa.me/${p.contactWhatsapp}`} target="_blank" rel="noopener noreferrer"
          aria-label={`Contactar a ${p.user?.fullName} por WhatsApp`}
          className="flex-1 text-center py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors">
          WhatsApp
        </a>
      )}
      {p.contactPhone && (
        <a href={`tel:${p.contactPhone}`} aria-label={`Llamar a ${p.user?.fullName}: ${p.contactPhone}`}
          className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors">
          Llamar
        </a>
      )}
      <a href={`/profesional/${p.id}`}
        className="px-3 py-2 bg-indigo-50 text-indigo-600 text-sm rounded-lg hover:bg-indigo-100 transition-colors"
        aria-label={`Ver perfil completo de ${p.user?.fullName}`}>
        Ver perfil
      </a>
      <button
        onClick={() => shareReferral(p)}
        aria-label={`Compartir perfil de ${p.user?.fullName}`}
        className="px-3 py-2 bg-gray-50 text-gray-500 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        title="Derivar / compartir">
        ↗
      </button>
    </div>
  </article>
);

// ─── TARJETA CENTRO ───────────────────────────────────────────
const CenterCard = ({ center: raw, onShowMap }: { center: Center; onShowMap?: () => void }) => {
  // La API devuelve snake_case; el tipo TypeScript usa camelCase — manejamos ambos
  const c = raw as any;
  const name        = c.nombre        ?? c.name        ?? '';
  const centerType  = c.tipo          ?? c.centerType  ?? '';
  const description = c.descripcion   ?? c.description ?? '';
  const services    = c.servicios     ?? c.services    ?? [];
  const city        = c.localidad     ?? c.city        ?? '';
  const province    = c.provincia     ?? c.province    ?? '';
  const phone       = c.telefono      ?? c.phone;
  const whatsapp    = c.whatsapp;
  const logoUrl     = c.logo_url      ?? c.logoUrl;
  const isVerified  = c.is_verified   ?? c.isVerified  ?? false;
  const isPro       = c.is_pro        ?? false;
  const fotos       = c.fotos         ?? [];
  const hasLocation = !!c.location_text;

  return (
    <article className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow relative
      ${isPro ? 'border-indigo-300 shadow-indigo-50 shadow-md' : 'border-gray-200'}`}
      aria-label={`${name}, ${centerType.replace(/_/g,' ')}, ${city}`}>
      {isPro && (
        <span className="absolute top-3 right-3 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
          PRO
        </span>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
          {logoUrl
            ? <Image src={logoUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
            : <span className="text-2xl">🏥</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{name}</p>
            {isVerified && <span className="text-blue-500 text-sm flex-shrink-0" aria-label="Centro verificado">✓</span>}
          </div>
          <p className="text-sm text-orange-600 capitalize">{centerType.replace(/_/g,' ')}</p>
          <p className="text-xs text-gray-400">{city}, {province}</p>
        </div>
      </div>
      {description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>}
      {fotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 -mx-1 px-1 pb-1 snap-x snap-mandatory" aria-label="Fotos del centro">
          {fotos.slice(0, 6).map((url: string, i: number) => (
            <div key={i} className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden snap-start bg-gray-100">
              <Image src={url} alt={`Foto ${i + 1} de ${name}`} width={80} height={64}
                className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-3" aria-label="Servicios">
        {services.slice(0, 3).map((s: string) => (
          <span key={s} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full">{s}</span>
        ))}
      </div>
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone}`} aria-label={`Llamar a ${name}`}
            className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100">
            📞 {phone}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            aria-label={`WhatsApp de ${name}`}
            className="flex-1 text-center py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100">
            WhatsApp
          </a>
        )}
        <a href={`/centro/${c.id}`}
          className="px-3 py-2 bg-orange-50 text-orange-600 text-sm rounded-lg hover:bg-orange-100 transition-colors"
          aria-label={`Ver perfil completo de ${name}`}>
          Ver perfil
        </a>
        <FavoriteButton targetType="center" targetId={c.id} size="sm" />
      </div>
      {hasLocation && onShowMap && (
        <button onClick={onShowMap}
          className="mt-2 w-full text-center py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-min">
          📍 Ver en mapa
        </button>
      )}
    </article>
  );
};

// ─── TARJETA ASOCIACIÓN ───────────────────────────────────────
const AssociationCard = ({ asociacion: a, onShowMap }: { asociacion: any; onShowMap?: () => void }) => {
  const name        = a.nombre;
  const description = a.descripcion;
  const disciplinas = a.disciplinas ?? [];
  const city        = a.localidad;
  const province    = a.provincia;
  const phone       = a.telefono;
  const whatsapp    = a.whatsapp;
  const logoUrl     = a.logo_url;
  const isVerified  = a.is_verified ?? false;
  const hasLocation = !!a.location_text;

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative"
      aria-label={`${name}, asociación, ${city}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
          {logoUrl
            ? <Image src={logoUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
            : <span className="text-2xl">🤝</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{name}</p>
            {isVerified && <span className="text-blue-500 text-sm flex-shrink-0" aria-label="Asociación verificada">✓</span>}
          </div>
          <p className="text-xs text-gray-400">{city}, {province}</p>
        </div>
      </div>
      {description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>}
      {disciplinas.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3" aria-label="Disciplinas">
          {disciplinas.slice(0, 3).map((d: string) => (
            <span key={d} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">{d}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone}`} aria-label={`Llamar a ${name}`}
            className="flex-1 text-center py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100">
            📞 {phone}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            aria-label={`WhatsApp de ${name}`}
            className="flex-1 text-center py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100">
            WhatsApp
          </a>
        )}
        <a href={`/asociacion/${a.id}`}
          className="px-3 py-2 bg-emerald-50 text-emerald-600 text-sm rounded-lg hover:bg-emerald-100 transition-colors"
          aria-label={`Ver perfil completo de ${name}`}>
          Ver perfil
        </a>
        <FavoriteButton targetType="association" targetId={a.id} size="sm" />
      </div>
      {hasLocation && onShowMap && (
        <button onClick={onShowMap}
          className="mt-2 w-full text-center py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors no-min">
          📍 Ver en mapa
        </button>
      )}
    </article>
  );
};

// ─── HELPERS UI ───────────────────────────────────────────────
const StarRating = ({ value }: { value: number }) => (
  <span className="flex items-center gap-0.5" aria-hidden="true">
    {[1,2,3,4,5].map(i => (
      <svg key={i} className="w-3 h-3" viewBox="0 0 24 24"
        fill={i <= Math.round(value) ? '#f59e0b' : 'none'}
        stroke="#f59e0b" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ))}
  </span>
);

const SkeletonCards = () => (
  <>
    <span className="sr-only" role="status">Cargando resultados…</span>
    {[1,2,3].map(i => (
      <div key={i} aria-hidden="true" className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
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

const EmptyState = ({ message, onBroaden }: { message: string; onBroaden?: () => void }) => (
  <div className="col-span-full text-center py-12" role="status">
    <span className="text-4xl mb-3 block" aria-hidden="true">🔍</span>
    <p className="text-gray-500 mb-4">{message}</p>
    {onBroaden && (
      <button onClick={onBroaden} className="text-sm text-indigo-600 font-medium underline-offset-2 hover:underline no-min">
        Buscar en toda Argentina →
      </button>
    )}
  </div>
);

function parseLocation(locationText: string | null): { lat: number; lng: number } | null {
  if (!locationText) return null;
  const match = locationText.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}
