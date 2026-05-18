import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city      = searchParams.get('city');
    const province  = searchParams.get('province');
    const lat       = parseFloat(searchParams.get('lat') || '0');
    const lng       = parseFloat(searchParams.get('lng') || '0');
    const radiusKm  = parseFloat(searchParams.get('radiusKm') || '25');
    const tipo           = searchParams.get('tipo');
    const isVerifiedOnly = searchParams.get('isVerifiedOnly') === 'true';
    const limit          = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset         = parseInt(searchParams.get('offset') || '0');

    const centros = await prisma.$queryRaw<any[]>`
      SELECT
        c.id, c.nombre, c.tipo, c.descripcion,
        c.servicios, c.tipos_discapacidad,
        c.domicilio, c.barrio, c.localidad, c.provincia,
        c.telefono, c.email, c.whatsapp, c.website,
        c.logo_url, c.fotos, c.is_verified,
        ST_AsText(c.location) AS location_text,
        CASE WHEN ${lat} != 0 AND c.location IS NOT NULL THEN
          ROUND((ST_Distance(
            c.location::geography,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000)::numeric, 1)
        ELSE NULL END AS distancia_km
      FROM centros_terapeuticos c
      WHERE c.is_active = TRUE
        AND (${city}::text IS NULL OR c.localidad ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR c.provincia ILIKE ${`%${province}%`})
        AND (${tipo}::text IS NULL OR c.tipo = ${tipo})
        AND (${isVerifiedOnly} = FALSE OR c.is_verified = TRUE)
        AND (${lat} = 0 OR c.location IS NULL OR
             ST_DWithin(
               c.location::geography,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY distancia_km ASC NULLS LAST, c.is_verified DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
 
    return NextResponse.json(centros);
  } catch (error) {
    console.error('Error GET /api/centros:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
 
export async function POST(request: NextRequest) {
  try {
    const { verifyToken } = await import('@/lib/auth-server');
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const existing = await prisma.centros_terapeuticos.findFirst({
      where: { owner_user_id: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya tenés un centro registrado' }, { status: 400 });
    }

    const body = await request.json();

    const centro = await prisma.centros_terapeuticos.create({
      data: {
        owner_user_id: user.id,
        nombre:             body.nombre,
        tipo:               body.tipo || 'centro_terapeutico',
        descripcion:        body.descripcion,
        servicios:          body.servicios || [],
        tipos_discapacidad: body.tiposDiscapacidad || [],
        domicilio:          body.domicilio,
        barrio:             body.barrio,
        localidad:          body.localidad,
        provincia:          body.provincia,
        telefono:           body.telefono,
        email:              body.email,
        whatsapp:           body.whatsapp,
        website:            body.website,
        fotos:              [],
        is_verified:        false,
        is_active:          true,
      }
    });
 
    if (body.lat && body.lng) {
      await prisma.$executeRaw`
        UPDATE centros_terapeuticos
        SET location = ST_MakePoint(${body.lng}, ${body.lat})::geography
        WHERE id = ${centro.id}::uuid
      `;
    }
 
    return NextResponse.json(centro, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/centros:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}