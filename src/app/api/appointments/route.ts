import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'professional' | 'student'

    const where = role === 'professional'
      ? { professional_id: user.id }
      : { student_id: user.id };

    const appointments = await prisma.appointments.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 50,
    });

    return NextResponse.json(appointments);
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
    const { professionalId, date, durationMinutes, notes } = body;

    if (!professionalId || !date)
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });

    const appointment = await prisma.appointments.create({
      data: {
        professional_id:  professionalId,
        student_id:       user.id,
        date:             new Date(date),
        duration_minutes: durationMinutes ?? 60,
        notes:            notes ?? null,
        status:           'pending',
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status))
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

    const updated = await prisma.appointments.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
