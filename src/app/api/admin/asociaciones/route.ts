import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pendingOnly = searchParams.get('pending') === 'true';

    const asociaciones = await prisma.asociaciones.findMany({
      where: pendingOnly ? { is_verified: false, is_active: true } : { is_active: true },
      orderBy: { created_at: 'desc' },
      take: 200,
      include: { owner: { select: { full_name: true, email: true } } },
    });

    return NextResponse.json(asociaciones);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id, is_verified } = await request.json();
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const updated = await prisma.asociaciones.update({
      where: { id },
      data: { is_verified, updated_at: new Date() },
    });

    await logAudit({
      userId: user!.id, action: 'asociacion.update', entityType: 'asociaciones', entityId: id,
      metadata: { is_verified }, request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
