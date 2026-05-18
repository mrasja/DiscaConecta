import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.profession, p.license_number, p.is_verified,
             p.bio, p.specialties, p.work_zones, p.city, p.province,
             p.address, p.neighborhood, p.contact_phone, p.contact_whatsapp,
             p.is_available, p.created_at,
             u.full_name, u.avatar_url
      FROM professionals p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ${id}::uuid
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
