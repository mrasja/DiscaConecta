import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city     = searchParams.get('city');
    const province = searchParams.get('province');
    const lat      = parseFloat(searchParams.get('lat') || '0');
    const lng      = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '25');
    const sector   = searchParams.get('sector');
    const nivel    = searchParams.get('nivel');
 
    const escuelas = await prisma.$queryRaw<any[]>`
      SELECT
        e.id, e.cueanexo, e.nombre, e.domicilio, e.localidad,
        e.jurisdiccion, e.departamento, e.codigo_postal,
        e.sector, e.ambito,
        e.nivel_temprana, e.nivel_jardin, e.nivel_primario,
        e.nivel_secundario, e.nivel_integracion,
        e.telefono, e.email,
        ST_AsText(e.location) AS location_text,
        CASE WHEN ${lat} != 0 AND e.location IS NOT NULL THEN
          ROUND((ST_Distance(
            e.location::geography,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000)::numeric, 1)
        ELSE NULL END AS distancia_km
      FROM escuelas_especiales e
      WHERE e.is_active = TRUE
        AND (${city}::text IS NULL OR e.localidad ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR e.jurisdiccion ILIKE ${`%${province}%`})
        AND (${sector}::text IS NULL OR e.sector = ${sector})
        AND (
          ${nivel}::text IS NULL OR
          (${nivel} = 'temprana'    AND e.nivel_temprana = TRUE) OR
          (${nivel} = 'jardin'      AND e.nivel_jardin = TRUE) OR
          (${nivel} = 'primario'    AND e.nivel_primario = TRUE) OR
          (${nivel} = 'secundario'  AND e.nivel_secundario = TRUE) OR
          (${nivel} = 'integracion' AND e.nivel_integracion = TRUE)
        )
        AND (${lat} = 0 OR e.location IS NULL OR
             ST_DWithin(
               e.location::geography,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY distancia_km ASC NULLS LAST
      LIMIT 100
    `;
 
    return NextResponse.json(escuelas);
  } catch (error) {
    console.error('Error GET /api/escuelas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}