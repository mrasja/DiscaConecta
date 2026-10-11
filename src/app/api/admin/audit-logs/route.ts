import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '150'), 300);

    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { user: { select: { full_name: true, email: true } } },
    });

    // BigInt (id) no serializa a JSON nativamente.
    const serialized = logs.map(l => ({ ...l, id: l.id.toString() }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error GET /api/admin/audit-logs:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
