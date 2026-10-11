import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT a.id, a.nombre, a.descripcion, a.disciplinas, a.tipos_discapacidad,
             a.domicilio, a.barrio, a.localidad, a.provincia,
             a.telefono, a.email, a.whatsapp, a.website,
             a.logo_url, a.fotos, a.is_verified, a.created_at,
             ST_AsText(a.location) AS location_text
      FROM asociaciones a
      WHERE a.id = ${id}::uuid AND a.is_active = TRUE
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
