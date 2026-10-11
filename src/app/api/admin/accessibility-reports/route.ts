import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const hiddenOnly = searchParams.get('hidden') === 'true';

    const reports = await prisma.$queryRaw<any[]>`
      SELECT
        r.id, r.category, r.subtype, r.description, r.photo_url, r.address,
        r.upvotes, r.downvotes, r.is_active, r.created_at,
        ST_AsText(r.location) AS location_text,
        u.full_name AS reporter_name, u.email AS reporter_email
      FROM accessibility_reports r
      LEFT JOIN users u ON u.id = r.reporter_id
      WHERE ${hiddenOnly} = FALSE OR r.is_active = FALSE
      ORDER BY r.created_at DESC
      LIMIT 300
    `;

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error GET /api/admin/accessibility-reports:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
