import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { fcm_token: token },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error POST /api/fcm-token:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    await prisma.users.update({
      where: { id: user.id },
      data: { fcm_token: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error DELETE /api/fcm-token:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
