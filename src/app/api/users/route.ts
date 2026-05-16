import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    // Upsert — crear si no existe, devolver si ya existe
    const user = await prisma.users.upsert({
      where: { firebase_uid: decoded.uid },
      create: {
        firebase_uid: decoded.uid,
        email:        decoded.email || '',
        full_name:    decoded.name  || decoded.email?.split('@')[0] || 'Usuario',
        avatar_url:   decoded.picture || null,
        role:         'alumno',
      },
      update: {
        avatar_url: decoded.picture || undefined,
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}