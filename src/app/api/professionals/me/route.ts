import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const professional = await prisma.professionals.findFirst({
      where: { user_id: user.id }
    });

    return NextResponse.json(professional || null);
  } catch (error) {
    console.error('Error GET /api/professionals/me:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
