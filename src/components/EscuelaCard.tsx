'use client';
import { MapPin, Phone, Mail, Navigation } from 'lucide-react';

interface EscuelaCardProps {
  escuela: any;
  onClick?: () => void;
}

export function EscuelaCard({ escuela: e, onClick }: EscuelaCardProps) {
  const niveles: string[] = [];
  if (e.nivel_temprana)   niveles.push('Temprana');
  if (e.nivel_jardin)     niveles.push('Jardín');
  if (e.nivel_primario)   niveles.push('Primario');
  if (e.nivel_secundario) niveles.push('Secundario');
  if (e.nivel_integracion) niveles.push('Integración');

  const sectorStyle = e.sector === 'Estatal'
    ? 'bg-blue-50 text-blue-700'
    : e.sector === 'Privado'
    ? 'bg-purple-50 text-purple-700'
    : 'bg-orange-50 text-orange-700';

  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5">

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-xl">
          🏫
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {e.nombre}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{e.localidad}, {e.jurisdiccion}</span>
          </div>
          {e.distancia_km && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-indigo-500">
              <Navigation className="w-3 h-3" />
              <span>{e.distancia_km} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Badges sector + ámbito */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sectorStyle}`}>
          {e.sector}
        </span>
        {e.ambito === 'Rural' && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
            Rural
          </span>
        )}
        {e.departamento && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 truncate max-w-[140px]">
            {e.departamento}
          </span>
        )}
      </div>

      {/* Niveles */}
      {niveles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {niveles.map(n => (
            <span key={n}
              className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Dirección */}
      {e.domicilio && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          📍 {e.domicilio}{e.codigo_postal ? ` — CP ${e.codigo_postal}` : ''}
        </p>
      )}

      {/* Contacto */}
      <div className="flex flex-wrap gap-2">
        {e.telefono && (
          <a href={`tel:${e.telefono}`}
            onClick={ev => ev.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors">
            <Phone className="w-3 h-3" />
            <span className="truncate max-w-[110px]">{e.telefono}</span>
          </a>
        )}
        {e.email && (
          <a href={`mailto:${e.email}`}
            onClick={ev => ev.stopPropagation()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors">
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </a>
        )}
      </div>

      {/* CUE al pie */}
      <p className="text-xs text-gray-300 mt-2">CUE: {e.cueanexo}</p>
    </div>
  );
}