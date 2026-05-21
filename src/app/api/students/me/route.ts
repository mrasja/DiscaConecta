import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const student = await prisma.students.findFirst({ where: { user_id: user.id } });
    return NextResponse.json(student ?? null);
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

    const existing = await prisma.students.findFirst({ where: { user_id: user.id } });

    const data = {
      disability_types: body.disabilityTypes || [],
      school_name:      body.schoolName      || null,
      needs_companion:  body.needsCompanion  ?? false,
      needs_nurse:      body.needsNurse      ?? false,
      description:      body.description     || null,
      city:             body.city            || null,
      province:         body.province        || null,
      contact_phone:    body.contactPhone    || null,
      is_visible:       body.isVisible       ?? true,
    };

    let student;
    if (existing) {
      student = await prisma.students.update({ where: { id: existing.id }, data });
    } else {
      student = await prisma.students.create({ data: { user_id: user.id, ...data } });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
