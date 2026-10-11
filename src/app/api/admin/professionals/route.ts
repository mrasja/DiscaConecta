import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, isAdminUser } from '@/lib/auth-server';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pendingOnly = searchParams.get('pending') === 'true';

    const professionals = await prisma.professionals.findMany({
      where: pendingOnly ? { is_verified: false } : undefined,
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        user: { select: { full_name: true, email: true, avatar_url: true } },
      },
    });

    return NextResponse.json(professionals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_verified, is_featured, featured_days } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const data: any = { updated_at: new Date() };

    if (is_verified !== undefined) {
      data.is_verified = is_verified;
      data.verification_status = is_verified ? 'verificado' : 'rechazado';
    }
    if (is_featured !== undefined) {
      data.is_featured = is_featured;
      data.featured_until = is_featured && featured_days
        ? new Date(Date.now() + featured_days * 86400000)
        : null;
    }

    const updated = await prisma.professionals.update({
      where: { id },
      data,
      include: { user: { select: { id: true, fcm_token: true, full_name: true } } },
    });

    await logAudit({
      userId: user!.id, action: 'professional.update', entityType: 'professionals', entityId: id,
      metadata: { is_verified, is_featured, featured_days }, request,
    });

    // Send FCM notification to the professional (only on verification change)
    const fcmToken = (updated.user as any)?.fcm_token;
    if (fcmToken && is_verified !== undefined) {
      try {
        await import('@/lib/firebase-admin');
        const { getMessaging } = await import('firebase-admin/messaging');
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title: is_verified ? '¡Perfil verificado!' : 'Verificación no aprobada',
            body: is_verified
              ? 'Tu perfil fue verificado por el equipo de DiscaConecta. ¡Ya aparecés en las búsquedas!'
              : 'El equipo no pudo verificar tus documentos. Por favor actualizá tu perfil.',
          },
          webpush: {
            notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
            fcmOptions: { link: '/dashboard/profesional' },
          },
        });
      } catch (fcmErr) {
        console.error('FCM error (non-fatal):', fcmErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
