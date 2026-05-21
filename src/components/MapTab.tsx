'use client';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

function parseLocation(locationText: string | null): { lat: number; lng: number } | null {
  if (!locationText) return null;
  const match = locationText.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

type SelectedItem = { type: 'professional' | 'center' | 'escuela'; data: any } | null;
type MapLayers = { profesionales: boolean; centros: boolean; escuelas: boolean };

interface MapTabProps {
  professionals: any[];
  centers: any[];
  escuelas: any[];
  mapLayers: MapLayers;
  toggleLayer: (key: keyof MapLayers) => void;
  geoLoading: boolean;
  handleGeolocate: (recenterMap?: boolean) => void;
  mapKey: number;
  mapInitCenter: { lat: number; lng: number };
  mapInitZoom: number;
  selected: SelectedItem;
  setSelected: (val: SelectedItem) => void;
  setTabRaw: (tab: string) => void;
  apiKey: string;
}

export default function MapTab({
  professionals, centers, escuelas,
  mapLayers, toggleLayer, geoLoading, handleGeolocate,
  mapKey, mapInitCenter, mapInitZoom,
  selected, setSelected, setTabRaw,
  apiKey,
}: MapTabProps) {
  return (
    <div role="tabpanel" id="panel-mapa" aria-labelledby="tab-mapa">
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
      </section>

      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {([
          { key: 'profesionales', label: 'Profesionales', color: '#4f46e5', emoji: '👤', count: professionals.length },
          { key: 'centros',       label: 'Centros',       color: '#ea580c', emoji: '🏥', count: centers.length },
          { key: 'escuelas',      label: 'Escuelas',      color: '#7c3aed', emoji: '🏫', count: escuelas.length },
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
        <button
          onClick={() => handleGeolocate(true)}
          disabled={geoLoading}
          aria-label="Centrar mapa en mi ubicación"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors no-min ml-auto"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
          {geoLoading ? '⏳' : '📍'} Mi ubicación
        </button>
      </div>

      <div aria-hidden="true" className="rounded-2xl overflow-hidden shadow-lg" style={{ height: '70vh' }}>
        <APIProvider apiKey={apiKey}>
          <Map
            key={mapKey}
            defaultCenter={mapInitCenter}
            defaultZoom={mapInitZoom}
            style={{ width: '100%', height: '100%' }}>
            {mapLayers.profesionales && professionals.map((p: any) => {
              const pos = parseLocation(p.location_text);
              if (!pos) return null;
              return <Marker key={p.id} position={pos}
                title={`${p.user?.fullName || p.user?.full_name} — ${p.profession?.replace(/_/g, ' ')}`}
                onClick={() => setSelected({ type: 'professional', data: p })} />;
            })}
            {mapLayers.centros && centers.map((c: any) => {
              const pos = parseLocation(c.location_text);
              if (!pos) return null;
              return <Marker key={c.id} position={pos}
                title={`${(c.nombre || c.name)} — ${(c.tipo || c.center_type)?.replace(/_/g, ' ')}`}
                onClick={() => setSelected({ type: 'center', data: c })} />;
            })}
            {mapLayers.escuelas && escuelas.map((e: any) => {
              const pos = parseLocation(e.location_text);
              if (!pos) return null;
              return <Marker key={e.id} position={pos}
                title={`${e.nombre} — ${e.localidad}`}
                onClick={() => setSelected({ type: 'escuela', data: e })} />;
            })}
            {selected && (() => {
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
