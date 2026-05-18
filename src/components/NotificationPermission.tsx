'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

async function getFcmToken(): Promise<string | null> {
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { app } = await import('@/lib/firebase');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    return token || null;
  } catch {
    return null;
  }
}

export function NotificationPermission() {
  const { token: authToken } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && !localStorage.getItem('notif_asked')) {
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const allow = async () => {
    const perm = await Notification.requestPermission();
    localStorage.setItem('notif_asked', '1');
    setShow(false);
    if (perm === 'granted' && authToken) {
      const fcmToken = await getFcmToken();
      if (fcmToken) {
        await fetch('/api/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ token: fcmToken }),
        }).catch(() => {});
      }
    }
  };

  const dismiss = () => {
    localStorage.setItem('notif_asked', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div role="alertdialog" aria-labelledby="notif-title" aria-describedby="notif-body"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40
        bg-white border border-gray-200 rounded-2xl shadow-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">🔔</span>
        <div className="flex-1">
          <p id="notif-title" className="text-sm font-semibold text-gray-900">¿Activar notificaciones?</p>
          <p id="notif-body" className="text-xs text-gray-500 mt-0.5">
            Te avisamos cuando recibís un mensaje nuevo.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={allow}
              style={{ backgroundColor: '#4f46e5', color: 'white' }}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90">
              Activar
            </button>
            <button onClick={dismiss}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Llamar cuando se envía un mensaje nuevo, para notificar al destinatario */
export async function notifyRecipient(
  authToken: string,
  recipientUserId: string,
  senderName: string,
  messagePreview: string,
) {
  await fetch('/api/messages/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ recipientUserId, senderName, messagePreview }),
  }).catch(() => {});
}
