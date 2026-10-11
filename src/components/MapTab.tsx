'use client';
import { useRef, useCallback, useEffect, useMemo } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';

function parseLocation(locationText: string | null): { lat: number; lng: number } | null {
  if (!locationText) return null;
  const match = locationText.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

function pinIcon(color: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path fill="${color}" stroke="white" stroke-width="1.5" d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 26 14 26S28 23.333 28 14C28 6.268 21.732 0 14 0z"/>
    <circle fill="white" cx="14" cy="13" r="6"/>
    <text x="14" y="17" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold" fill="${color}">${label}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 28, height: 40 } as google.maps.Size,
    anchor: { x: 14, y: 40 } as google.maps.Point,
  };
}

const PINS = {
  professional:     pinIcon('#4f46e5', 'P'),
  center:           pinIcon('#ea580c', 'C'),
  escuela:          pinIcon('#7c3aed', 'E'),
  barrera:          pinIcon('#dc2626', '!'),
  acceso_positivo:  pinIcon('#16a34a', '✓'),
  servicio:         pinIcon('#2563eb', 'P'),
  asociacion:       pinIcon('#059669', 'A'),
};

const CATEGORY_LABELS: Record<string, string> = {
  barrera: 'Barrera', acceso_positivo: 'Acceso positivo', servicio: 'Estacionamiento / servicio',
};
const SUBTYPE_LABELS: Record<string, string> = {
  vereda_rota: 'Vereda rota o en mal estado', sin_rampa: 'Sin rampa',
  escalon_sin_salvar: 'Escalón sin salvar', obra_bloquea_paso: 'Obra que bloquea el paso', otro_barrera: 'Otra barrera',
  rampa_buen_estado: 'Rampa en buen estado', entrada_sin_escalones: 'Entrada sin escalones',
  bano_accesible: 'Baño accesible', semaforo_sonoro: 'Semáforo sonoro', piso_tactil: 'Piso táctil / podotáctil', otro_positivo: 'Otro acceso positivo',
  estacionamiento_reservado: 'Estacionamiento reservado', parada_transporte_accesible: 'Parada de transporte accesible',
  ascensor: 'Ascensor', otro_servicio: 'Otro servicio',
};

// Encuadra el mapa en los resultados cuando cambia `trigger` (no en cada render:
// evita competir con el zoom/paneo manual del usuario mientras arrastra el mapa).
function FitBoundsController({ trigger, points }: { trigger: number; points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !trigger || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, trigger]);

  return null;
}

function zoomToRadius(zoom: number): number {
  if (zoom >= 15) return 3;
  if (zoom >= 14) return 5;
  if (zoom >= 13) return 10;
  if (zoom >= 12) return 20;
  if (zoom >= 11) return 40;
  if (zoom >= 10) return 80;
  return 150;
}

type SelectedItem = { type: 'professional' | 'center' | 'escuela' | 'accessibility' | 'asociacion'; data: any } | null;
type MapLayers = { profesionales: boolean; centros: boolean; escuelas: boolean; accesibilidad: boolean; asociaciones: boolean };

interface MapTabProps {
  professionals: any[];
  centers: any[];
  escuelas: any[];
  asociaciones?: any[];
  accessibilityReports?: any[];
  mapLayers: MapLayers;
  toggleLayer: (key: keyof MapLayers) => void;
  geoLoading: boolean;
  handleGeolocate: (recenterMap?: boolean) => void;
  mapKey: number;
  mapInitCenter: { lat: number; lng: number };
  mapInitZoom: number;
  selected: SelectedItem;
  setSelected: (val: SelectedItem) => void;
  setTabRaw: (tab: 'profesionales' | 'escuelas' | 'centros' | 'mapa') => void;
  apiKey: string;
  onMapMove?: (center: { lat: number; lng: number }, radiusKm: number) => void;
  isFetching?: boolean;
  reportMode?: boolean;
  onToggleReportMode?: () => void;
  onMapClickToReport?: (pos: { lat: number; lng: number }) => void;
  onVote?: (reportId: string, vote: 1 | -1) => void;
  canVote?: boolean;
  fitBoundsTrigger?: number;
}

export default function MapTab({
  professionals, centers, escuelas, asociaciones = [], accessibilityReports = [],
  mapLayers, toggleLayer, geoLoading, handleGeolocate,
  mapKey, mapInitCenter, mapInitZoom,
  selected, setSelected, setTabRaw,
  apiKey, onMapMove, isFetching,
  reportMode, onToggleReportMode, onMapClickToReport, onVote, canVote,
  fitBoundsTrigger = 0,
}: MapTabProps) {
  const moveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const boundsPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = [];
    const collect = (items: any[], active: boolean) => {
      if (!active) return;
      for (const item of items) {
        const pos = parseLocation(item.location_text);
        if (pos) pts.push(pos);
      }
    };
    collect(professionals, mapLayers.profesionales);
    collect(centers, mapLayers.centros);
    collect(escuelas, mapLayers.escuelas);
    collect(asociaciones, mapLayers.asociaciones);
    return pts;
  }, [professionals, centers, escuelas, asociaciones, mapLayers.profesionales, mapLayers.centros, mapLayers.escuelas, mapLayers.asociaciones]);

  const handleCameraChanged = useCallback((e: any) => {
    const { center, zoom } = e.detail ?? {};
    if (!center || zoom == null || !onMapMove) return;
    clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => {
      onMapMove(center, zoomToRadius(zoom));
    }, 700);
  }, [onMapMove]);

  const handleMapClick = useCallback((e: any) => {
    const latLng = e.detail?.latLng;
    if (!latLng || !reportMode || !onMapClickToReport) return;
    onMapClickToReport({ lat: latLng.lat, lng: latLng.lng });
  }, [reportMode, onMapClickToReport]);

  return (
    <div role="tabpanel" id="panel-mapa" aria-labelledby="tab-mapa">
      {/* Screen reader list */}
      <section className="sr-only" aria-label="Lista de resultados del mapa">
        <p>El mapa interactivo no es accesible con lector de pantalla. A continuación se listan todos los resultados.</p>
        {professionals.length > 0 && (
          <>
            <h2>Profesionales ({professionals.length})</h2>
            <ul>
              {professionals.map((p: any) => (
                <li key={p.id}>
                  {p.user?.fullName || p.user?.full_name} — {p.profession?.replace(/_/g, ' ')} — {p.city}, {p.province}
                  {p.contact_whatsapp ? ` — WhatsApp: ${p.contact_whatsapp}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        {centers.length > 0 && (
          <>
            <h2>Centros ({centers.length})</h2>
            <ul>
              {centers.map((c: any) => (
                <li key={c.id}>{c.name} — {c.city}, {c.province}{c.phone ? ` — Tel: ${c.phone}` : ''}</li>
              ))}
            </ul>
          </>
        )}
        {escuelas.length > 0 && (
          <>
            <h2>Escuelas ({escuelas.length})</h2>
            <ul>
              {escuelas.map((e: any) => (
                <li key={e.id}>{e.nombre} — {e.localidad}, {e.jurisdiccion}{e.telefono ? ` — Tel: ${e.telefono}` : ''}</li>
              ))}
            </ul>
          </>
        )}
        {asociaciones.length > 0 && (
          <>
            <h2>Asociaciones ({asociaciones.length})</h2>
            <ul>
              {asociaciones.map((a: any) => (
                <li key={a.id}>{a.nombre} — {a.localidad}, {a.provincia}{a.telefono ? ` — Tel: ${a.telefono}` : ''}</li>
              ))}
            </ul>
          </>
        )}
        {accessibilityReports.length > 0 && (
          <>
            <h2>Reportes de accesibilidad ({accessibilityReports.length})</h2>
            <ul>
              {accessibilityReports.map((r: any) => (
                <li key={r.id}>
                  {CATEGORY_LABELS[r.category]}: {SUBTYPE_LABELS[r.subtype] || r.subtype}
                  {r.description ? ` — ${r.description}` : ''}
                  {r.address ? ` — ${r.address}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Layer toggles + geolocate */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {([
          { key: 'profesionales', label: 'Profesionales', color: '#4f46e5', emoji: '👤', count: professionals.length },
          { key: 'centros',       label: 'Centros',       color: '#ea580c', emoji: '🏥', count: centers.length },
          { key: 'escuelas',      label: 'Escuelas',      color: '#7c3aed', emoji: '🏫', count: escuelas.length },
          { key: 'asociaciones',  label: 'Asociaciones',  color: '#059669', emoji: '🤝', count: asociaciones.length },
          { key: 'accesibilidad', label: 'Accesibilidad', color: '#0891b2', emoji: '♿', count: accessibilityReports.length },
        ] as const).map(({ key, label, color, emoji, count }) => {
          const active = mapLayers[key];
          return (
            <button key={key}
              onClick={() => toggleLayer(key)}
              aria-pressed={active}
              style={active ? { backgroundColor: color, color: 'white' } : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors no-min">
              <span aria-hidden="true">{emoji}</span>
              {label}
              <span style={{ opacity: 0.75 }}>({count})</span>
            </button>
          );
        })}
        {onToggleReportMode && (
          <button
            onClick={onToggleReportMode}
            aria-pressed={!!reportMode}
            aria-label="Activar modo reportar accesibilidad: tocá el mapa donde querés dejar un reporte"
            style={reportMode ? { backgroundColor: '#0891b2', color: 'white' } : { backgroundColor: '#ecfeff', color: '#0e7490' }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors no-min">
            📍 Reportar
          </button>
        )}
        <button
          onClick={() => handleGeolocate(true)}
          disabled={geoLoading}
          aria-label="Centrar mapa en mi ubicación"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors no-min ml-auto"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
          {geoLoading ? '⏳' : '📍'} Mi ubicación
        </button>
      </div>

      {reportMode && (
        <p role="status" className="mb-2 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg px-3 py-2">
          Tocá un punto del mapa para reportar accesibilidad ahí.
        </p>
      )}

      {/* Leyenda de colores */}
      <div className="flex gap-3 mb-2 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#4f46e5' }} />
          Profesional
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#ea580c' }} />
          Centro
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#7c3aed' }} />
          Escuela
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#059669' }} />
          Asociación
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#dc2626' }} />
          Barrera
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#16a34a' }} />
          Acceso positivo
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#2563eb' }} />
          Servicio
        </span>
        {isFetching && (
          <span className="ml-auto text-indigo-500 animate-pulse">Actualizando…</span>
        )}
      </div>

      <div aria-hidden="true" className="rounded-2xl overflow-hidden shadow-lg relative" style={{ height: '70vh', cursor: reportMode ? 'crosshair' : undefined }}>
        <APIProvider apiKey={apiKey}>
          <Map
            key={mapKey}
            defaultCenter={mapInitCenter}
            defaultZoom={mapInitZoom}
            style={{ width: '100%', height: '100%' }}
            onCameraChanged={handleCameraChanged}
            onClick={handleMapClick}
          >
            <FitBoundsController trigger={fitBoundsTrigger} points={boundsPoints} />
            {mapLayers.profesionales && professionals.map((p: any) => {
              const pos = parseLocation(p.location_text);
              if (!pos) return null;
              return (
                <Marker key={p.id} position={pos}
                  icon={PINS.professional}
                  title={`${p.full_name || p.user?.full_name} — ${p.profession?.replace(/_/g, ' ')}`}
                  onClick={() => setSelected({ type: 'professional', data: p })} />
              );
            })}
            {mapLayers.centros && centers.map((c: any) => {
              const pos = parseLocation(c.location_text);
              if (!pos) return null;
              return (
                <Marker key={c.id} position={pos}
                  icon={PINS.center}
                  title={`${c.nombre || c.name} — ${(c.tipo || c.center_type)?.replace(/_/g, ' ')}`}
                  onClick={() => setSelected({ type: 'center', data: c })} />
              );
            })}
            {mapLayers.escuelas && escuelas.map((e: any) => {
              const pos = parseLocation(e.location_text);
              if (!pos) return null;
              return (
                <Marker key={e.id} position={pos}
                  icon={PINS.escuela}
                  title={`${e.nombre} — ${e.localidad}`}
                  onClick={() => setSelected({ type: 'escuela', data: e })} />
              );
            })}
            {mapLayers.asociaciones && asociaciones.map((a: any) => {
              const pos = parseLocation(a.location_text);
              if (!pos) return null;
              return (
                <Marker key={a.id} position={pos}
                  icon={PINS.asociacion}
                  title={a.nombre}
                  onClick={() => setSelected({ type: 'asociacion', data: a })} />
              );
            })}
            {mapLayers.accesibilidad && accessibilityReports.map((r: any) => {
              const pos = parseLocation(r.location_text);
              if (!pos) return null;
              return (
                <Marker key={r.id} position={pos}
                  icon={PINS[r.category as keyof typeof PINS] ?? PINS.servicio}
                  title={`${CATEGORY_LABELS[r.category] ?? r.category} — ${SUBTYPE_LABELS[r.subtype] ?? r.subtype}`}
                  onClick={() => setSelected({ type: 'accessibility', data: r })} />
              );
            })}

            {selected && selected.type === 'accessibility' && (() => {
              const pos = parseLocation(selected.data.location_text);
              if (!pos) return null;
              const d = selected.data;
              return (
                <InfoWindow position={pos} onCloseClick={() => setSelected(null)}>
                  <div style={{ minWidth: 180, maxWidth: 240, fontFamily: 'Arial, sans-serif' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{CATEGORY_LABELS[d.category] ?? d.category}</p>
                    <p style={{ fontSize: 11, color: '#0891b2', marginBottom: 4 }}>{SUBTYPE_LABELS[d.subtype] ?? d.subtype}</p>
                    {d.description && <p style={{ fontSize: 11, color: '#374151', marginBottom: 6 }}>{d.description}</p>}
                    {d.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.photo_url} alt="" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <button
                        onClick={() => onVote?.(d.id, 1)}
                        disabled={!canVote}
                        aria-pressed={d.my_vote === 1}
                        style={{
                          fontSize: 11, fontWeight: 600, border: 'none', cursor: canVote ? 'pointer' : 'not-allowed',
                          background: 'none', color: d.my_vote === 1 ? '#16a34a' : '#6b7280', padding: 0,
                        }}>
                        👍 {d.upvotes ?? 0}
                      </button>
                      <button
                        onClick={() => onVote?.(d.id, -1)}
                        disabled={!canVote}
                        aria-pressed={d.my_vote === -1}
                        style={{
                          fontSize: 11, fontWeight: 600, border: 'none', cursor: canVote ? 'pointer' : 'not-allowed',
                          background: 'none', color: d.my_vote === -1 ? '#dc2626' : '#6b7280', padding: 0,
                        }}>
                        👎 {d.downvotes ?? 0}
                      </button>
                    </div>
                    {!canVote && (
                      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Iniciá sesión para votar</p>
                    )}
                  </div>
                </InfoWindow>
              );
            })()}

            {selected && selected.type !== 'accessibility' && (() => {
              const pos = parseLocation(selected.data.location_text);
              if (!pos) return null;
              const d = selected.data;
              return (
                <InfoWindow position={pos} onCloseClick={() => setSelected(null)}>
                  <div style={{ minWidth: 180, maxWidth: 240, fontFamily: 'Arial, sans-serif' }}>
                    {selected.type === 'professional' && (
                      <>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{d.full_name}</p>
                        <p style={{ fontSize: 11, color: '#4f46e5', marginBottom: 2, textTransform: 'capitalize' }}>{d.profession?.replace(/_/g,' ')}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{d.city}, {d.province}</p>
                        {d.is_verified && <span style={{ fontSize: 10, color: '#3b82f6' }}>✓ Verificado</span>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {d.contact_whatsapp && (
                            <a href={`https://wa.me/${d.contact_whatsapp.replace(/\D/g,'')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              WhatsApp →
                            </a>
                          )}
                          <a href={`/profesional/${d.id}`}
                            style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600 }}>
                            Ver perfil →
                          </a>
                        </div>
                      </>
                    )}
                    {selected.type === 'center' && (
                      <>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{d.nombre || d.name}</p>
                        <p style={{ fontSize: 11, color: '#ea580c', marginBottom: 2, textTransform: 'capitalize' }}>{(d.tipo || d.centerType)?.replace(/_/g,' ')}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{d.localidad || d.city}, {d.provincia || d.province}</p>
                        {d.descripcion && <p style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>{d.descripcion.slice(0, 80)}{d.descripcion.length > 80 ? '…' : ''}</p>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {(d.telefono || d.phone) && (
                            <a href={`tel:${d.telefono || d.phone}`}
                              style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                              📞 Llamar
                            </a>
                          )}
                          {d.whatsapp && (
                            <a href={`https://wa.me/${d.whatsapp.replace(/\D/g,'')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              WhatsApp →
                            </a>
                          )}
                          <a href={`/centro/${d.id}`}
                            style={{ fontSize: 11, color: '#ea580c', fontWeight: 600 }}>
                            Ver perfil →
                          </a>
                          <button onClick={() => { setSelected(null); setTabRaw('centros'); }}
                            style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Ver lista →
                          </button>
                        </div>
                      </>
                    )}
                    {selected.type === 'asociacion' && (
                      <>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{d.nombre}</p>
                        {d.disciplinas?.length > 0 && (
                          <p style={{ fontSize: 11, color: '#059669', marginBottom: 2 }}>{d.disciplinas.join(', ')}</p>
                        )}
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{d.localidad}, {d.provincia}</p>
                        {d.descripcion && <p style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>{d.descripcion.slice(0, 80)}{d.descripcion.length > 80 ? '…' : ''}</p>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {d.telefono && (
                            <a href={`tel:${d.telefono}`}
                              style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                              📞 Llamar
                            </a>
                          )}
                          {d.whatsapp && (
                            <a href={`https://wa.me/${d.whatsapp.replace(/\D/g,'')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                              WhatsApp →
                            </a>
                          )}
                          <a href={`/asociacion/${d.id}`}
                            style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                            Ver perfil →
                          </a>
                        </div>
                      </>
                    )}
                    {selected.type === 'escuela' && (
                      <>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{d.nombre}</p>
                        <p style={{ fontSize: 11, color: '#7c3aed', marginBottom: 2 }}>{d.sector} · {d.ambito}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{d.localidad}, {d.jurisdiccion}</p>
                        {d.domicilio && <p style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>📍 {d.domicilio}</p>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {d.telefono && (
                            <a href={`tel:${d.telefono}`}
                              style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                              📞 Llamar
                            </a>
                          )}
                          {d.email && (
                            <a href={`mailto:${d.email}`}
                              style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                              ✉ Email
                            </a>
                          )}
                          <button onClick={() => { setSelected(null); setTabRaw('escuelas'); }}
                            style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Ver lista →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </InfoWindow>
              );
            })()}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
