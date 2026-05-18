import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

async function decodeToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch { return null; }
}

// GET — obtener usuario actual. Si no existe lo crea con rol='alumno' y devuelve _isNew=true
export async function GET(request: NextRequest) {
  try {
    const decoded = await decodeToken(request);
    if (!decoded) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const existing = await prisma.users.findUnique({
      where: { firebase_uid: decoded.uid },
    });

    if (existing) {
      // Actualizar avatar si cambió pero no tocar el rol
      if (decoded.picture && decoded.picture !== existing.avatar_url) {
        const updated = await prisma.users.update({
          where: { firebase_uid: decoded.uid },
          data: { avatar_url: decoded.picture },
        });
        return NextResponse.json({ ...updated, _isNew: false });
      }
      return NextResponse.json({ ...existing, _isNew: false });
    }

    // Usuario nuevo — crear con role='alumno' (válido en el constraint de la DB)
    const created = await prisma.users.create({
      data: {
        firebase_uid: decoded.uid,
        email:        decoded.email || '',
        full_name:    decoded.name  || decoded.email?.split('@')[0] || 'Usuario',
        avatar_url:   decoded.picture || null,
        role:         'alumno',
      },
    });

    return NextResponse.json({ ...created, _isNew: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH — actualizar perfil (nombre, rol)
export async function PATCH(request: NextRequest) {
  try {
    const decoded = await decodeToken(request);
    if (!decoded) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();

    const user = await prisma.users.upsert({
      where: { firebase_uid: decoded.uid },
      create: {
        firebase_uid: decoded.uid,
        email:        decoded.email || '',
        full_name:    body.full_name || decoded.name || decoded.email?.split('@')[0] || 'Usuario',
        avatar_url:   decoded.picture || null,
        role:         body.role || 'alumno',
      },
      update: {
        ...(body.full_name  ? { full_name:  body.full_name  } : {}),
        ...(body.role       ? { role:       body.role       } : {}),
        ...(body.avatar_url ? { avatar_url: body.avatar_url } : {}),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
