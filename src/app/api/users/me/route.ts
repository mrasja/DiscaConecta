import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

// GET — obtener usuario actual
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}