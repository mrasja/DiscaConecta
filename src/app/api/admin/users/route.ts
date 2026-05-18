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
    const role = searchParams.get('role');

    const users = await prisma.users.findMany({
      where: role ? { role } : undefined,
      orderBy: { created_at: 'desc' },
      take: 200,
      select: {
        id: true, email: true, full_name: true,
        role: true, is_active: true, created_at: true, avatar_url: true,
      },
    });

    return NextResponse.json(users);
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
    const { id, role, is_active } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const updated = await prisma.users.update({
      where: { id },
      data: {
        ...(role      !== undefined ? { role }      : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
