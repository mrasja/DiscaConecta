import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { recipientUserId, senderName, messagePreview } = await request.json();
    if (!recipientUserId) return NextResponse.json({ error: 'recipientUserId requerido' }, { status: 400 });

    const recipient = await prisma.users.findFirst({
      where: { id: recipientUserId },
      select: { fcm_token: true },
    });

    if (!recipient?.fcm_token) return NextResponse.json({ ok: true, sent: false });

    // Asegura que firebase-admin esté inicializado
    await import('@/lib/firebase-admin');
    const { getMessaging } = await import('firebase-admin/messaging');

    await getMessaging().send({
      token: recipient.fcm_token,
      notification: {
        title: `Mensaje de ${senderName}`,
        body:  messagePreview.slice(0, 100),
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'new-message',
        },
        fcmOptions: { link: '/dashboard/mensajes' },
      },
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error('Error POST /api/messages/notify:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
