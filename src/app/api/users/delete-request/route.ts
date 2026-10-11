import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { reason } = await request.json().catch(() => ({ reason: '' }));

  const profile = await prisma.users.findUnique({ where: { id: user.id } });
  if (!profile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  await prisma.users.update({
    where: { id: user.id },
    data: {
      deletion_requested_at: new Date(),
      deletion_reason: reason || null,
    },
  });

  return NextResponse.json({ ok: true, message: 'Solicitud recibida. Procesaremos la eliminación en un plazo de 30 días hábiles.' });
}
