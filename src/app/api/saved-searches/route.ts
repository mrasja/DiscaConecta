import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const searches = await prisma.saved_searches.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return NextResponse.json(searches);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { filters, alertEmail, alertPush, isUrgent } = body;

    // Evitar duplicados exactos
    const existing = await prisma.saved_searches.findFirst({
      where: { user_id: user.id, filters: { equals: filters } },
    });
    if (existing) return NextResponse.json(existing);

    const saved = await prisma.saved_searches.create({
      data: {
        user_id:     user.id,
        filters,
        alert_email: alertEmail ?? false,
        alert_push:  alertPush  ?? false,
        is_urgent:   isUrgent   ?? false,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await prisma.saved_searches.deleteMany({ where: { id, user_id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
