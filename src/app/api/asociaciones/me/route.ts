import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const asociacion = await prisma.asociaciones.findFirst({
      where: { owner_user_id: user.id },
    });

    return NextResponse.json(asociacion || null);
  } catch (error) {
    console.error('Error GET /api/asociaciones/me:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const existing = await prisma.asociaciones.findFirst({ where: { owner_user_id: user.id } });
    if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    const body = await request.json();

    const updated = await prisma.asociaciones.update({
      where: { id: existing.id },
      data: {
        ...(body.nombre             !== undefined ? { nombre: body.nombre }                         : {}),
        ...(body.descripcion        !== undefined ? { descripcion: body.descripcion }                : {}),
        ...(body.disciplinas        !== undefined ? { disciplinas: body.disciplinas }                : {}),
        ...(body.tiposDiscapacidad  !== undefined ? { tipos_discapacidad: body.tiposDiscapacidad }   : {}),
        ...(body.domicilio          !== undefined ? { domicilio: body.domicilio }                    : {}),
        ...(body.barrio             !== undefined ? { barrio: body.barrio }                           : {}),
        ...(body.localidad          !== undefined ? { localidad: body.localidad }                    : {}),
        ...(body.provincia          !== undefined ? { provincia: body.provincia }                    : {}),
        ...(body.telefono           !== undefined ? { telefono: body.telefono }                       : {}),
        ...(body.email              !== undefined ? { email: body.email }                            : {}),
        ...(body.whatsapp           !== undefined ? { whatsapp: body.whatsapp }                       : {}),
        ...(body.website            !== undefined ? { website: body.website }                         : {}),
        ...(body.fotos              !== undefined ? { fotos: body.fotos }                             : {}),
        updated_at: new Date(),
      },
    });

    if (body.lat && body.lng) {
      await prisma.$executeRaw`
        UPDATE asociaciones
        SET location = ST_MakePoint(${body.lng}, ${body.lat})::geography
        WHERE id = ${existing.id}::uuid
      `;
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error PATCH /api/asociaciones/me:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
