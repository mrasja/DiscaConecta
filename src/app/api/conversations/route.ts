import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { targetUserId } = await request.json();
  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: 'Usuario inválido' }, { status: 400 });
  }

  // Verificar que el target existe
  const target = await prisma.users.findUnique({
    where: { id: targetUserId },
    select: { id: true, full_name: true, avatar_url: true, role: true }
  });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Crear o recuperar conversación en Postgres (metadata)
  const [pA, pB] = [user.id, targetUserId].sort();
  const conv = await prisma.conversations.upsert({
    where:  { participant_a_participant_b: { participant_a: pA, participant_b: pB } },
    create: { participant_a: pA, participant_b: pB },
    update: {}
  });

  return NextResponse.json({ convId: conv.id, targetUser: target });
}

export async function GET(request: NextRequest) {
  const user = await verifyToken(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { participant_a: user.id },
          { participant_b: user.id }
        ]
      },
      orderBy: { last_message_at: 'desc' },
    });

    // Para cada conversación buscar el otro usuario por separado
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant_a === user.id
          ? conv.participant_b
          : conv.participant_a;

        const otherUser = await prisma.users.findUnique({
          where: { id: otherUserId! },
          select: { id: true, full_name: true, avatar_url: true, role: true }
        });

        return {
          id:             conv.id,
          lastMessage:    conv.last_message,
          lastMessageAt:  conv.last_message_at,
          otherUser,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}