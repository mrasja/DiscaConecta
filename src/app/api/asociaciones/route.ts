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
    const disciplina      = searchParams.get('disciplina');
    const disabilityType  = searchParams.get('disabilityType');
    const isVerifiedOnly  = searchParams.get('isVerifiedOnly') === 'true';
    const limit           = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset           = parseInt(searchParams.get('offset') || '0');

    const asociaciones = await prisma.$queryRaw<any[]>`
      SELECT
        a.id, a.nombre, a.descripcion,
        a.disciplinas, a.tipos_discapacidad,
        a.domicilio, a.barrio, a.localidad, a.provincia,
        a.telefono, a.email, a.whatsapp, a.website,
        a.logo_url, a.fotos, a.is_verified,
        ST_AsText(a.location) AS location_text,
        CASE WHEN ${lat} != 0 AND a.location IS NOT NULL THEN
          ROUND((ST_Distance(
            a.location::geography,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000)::numeric, 1)
        ELSE NULL END AS distancia_km
      FROM asociaciones a
      WHERE a.is_active = TRUE
        AND (${city}::text IS NULL OR a.localidad ILIKE ${`%${city}%`})
        AND (${province}::text IS NULL OR a.provincia ILIKE ${`%${province}%`})
        AND (${disciplina}::text IS NULL OR ${disciplina} = ANY(a.disciplinas))
        AND (${disabilityType}::text IS NULL OR ${disabilityType} = ANY(a.tipos_discapacidad))
        AND (${isVerifiedOnly} = FALSE OR a.is_verified = TRUE)
        AND (${lat} = 0 OR a.location IS NULL OR
             ST_DWithin(
               a.location::geography,
               ST_MakePoint(${lng}, ${lat})::geography,
               ${radiusKm * 1000}
             ))
      ORDER BY distancia_km ASC NULLS LAST, a.is_verified DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json(asociaciones);
  } catch (error) {
    console.error('Error GET /api/asociaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { verifyToken } = await import('@/lib/auth-server');
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const existing = await prisma.asociaciones.findFirst({
      where: { owner_user_id: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya tenés una asociación registrada' }, { status: 400 });
    }

    const body = await request.json();

    if (!body.nombre || !body.domicilio || !body.localidad || !body.provincia) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const asociacion = await prisma.asociaciones.create({
      data: {
        owner_user_id: user.id,
        nombre:             body.nombre,
        descripcion:        body.descripcion,
        disciplinas:        body.disciplinas || [],
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
        UPDATE asociaciones
        SET location = ST_MakePoint(${body.lng}, ${body.lat})::geography
        WHERE id = ${asociacion.id}::uuid
      `;
    }

    return NextResponse.json(asociacion, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/asociaciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
