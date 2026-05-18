import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pendingOnly = searchParams.get('pending') === 'true';

    const professionals = await prisma.professionals.findMany({
      where: pendingOnly ? { is_verified: false } : undefined,
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        user: {
          select: { full_name: true, email: true, avatar_url: true },
        },
      },
    });

    return NextResponse.json(professionals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_verified } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const updated = await prisma.professionals.update({
      where: { id },
      data: { is_verified, updated_at: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
