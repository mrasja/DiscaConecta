import { getDatabase, ref, push, onValue, off, set,
         serverTimestamp, query, orderByChild, update, get } from 'firebase/database';
import { auth } from './firebase';

export const db = getDatabase();

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: Record<string, boolean>;
  lastMessage?: string;
  lastMessageAt?: number;
  otherUser?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  unread?: number;
}

// Generar ID de conversación consistente (el menor primero)
export const getConvId = (userIdA: string, userIdB: string): string =>
  [userIdA, userIdB].sort().join('_');

// Enviar mensaje
export async function sendMessage(convId: string, otherUserId: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const messagesRef  = ref(db, `conversations/${convId}/messages`);
  const convRef      = ref(db, `conversations/${convId}`);
  const myConvRef    = ref(db, `userConversations/${user.uid}/${convId}`);
  const otherConvRef = ref(db, `userConversations/${otherUserId}/${convId}`);
  const unreadRef    = ref(db, `unreadCount/${otherUserId}/${convId}`);

  const newMsg: Omit<Message, 'id'> = {
    senderId:     user.uid,
    senderName:   user.displayName || 'Usuario',
    senderAvatar: user.photoURL || undefined,
    text:         text.trim(),
    timestamp:    Date.now(),
    read:         false,
  };

  // Inicializar conversación si no existe
  const snap = await get(convRef);
  if (!snap.exists()) {
    await set(convRef, {
      participants: { [user.uid]: true, [otherUserId]: true },
      createdAt: Date.now(),
    });
    await set(myConvRef, true);
    await set(otherConvRef, true);
  }

  // Push mensaje
  await push(messagesRef, newMsg);

  // Actualizar metadata
  await update(convRef, { lastMessage: text.trim(), lastMessageAt: Date.now() });

  // Incrementar no leídos del otro usuario
  const unreadSnap = await get(unreadRef);
  await set(unreadRef, (unreadSnap.exists() ? unreadSnap.val() : 0) + 1);
}

// Suscribirse a mensajes de una conversación
export function subscribeToMessages(convId: string, callback: (messages: Message[]) => void) {
  const messagesRef = query(ref(db, `conversations/${convId}/messages`), orderByChild('timestamp'));
  const handler = (snap: any) => {
    if (!snap.exists()) { callback([]); return; }
    const msgs: Message[] = [];
    snap.forEach((child: any) => msgs.push({ id: child.key, ...child.val() }));
    callback(msgs);
  };
  onValue(messagesRef, handler);
  return () => off(messagesRef, 'value', handler);
}

// Suscribirse a las conversaciones de un usuario
export function subscribeToConversations(userId: string, callback: (convIds: string[]) => void) {
  const convRef = ref(db, `userConversations/${userId}`);
  const handler = (snap: any) => {
    if (!snap.exists()) { callback([]); return; }
    callback(Object.keys(snap.val()));
  };
  onValue(convRef, handler);
  return () => off(convRef, 'value', handler);
}

// Marcar mensajes como leídos
export async function markAsRead(convId: string, userId: string) {
  const unreadRef = ref(db, `unreadCount/${userId}/${convId}`);
  await set(unreadRef, 0);
}

// Disponibilidad en tiempo real del profesional (RTDB)
export function setAvailabilityNow(professionalFirebaseUid: string, available: boolean) {
  const availRef = ref(db, `availability/${professionalFirebaseUid}`);
  return set(availRef, available ? Date.now() : null);
}

export function subscribeAvailability(professionalFirebaseUid: string, callback: (available: boolean) => void) {
  const availRef = ref(db, `availability/${professionalFirebaseUid}`);
  const handler  = (snap: any) => callback(snap.exists() && snap.val() !== null);
  onValue(availRef, handler);
  return () => off(availRef, 'value', handler);
}

// Total de no leídos
export function subscribeTotalUnread(userId: string, callback: (total: number) => void) {
  const unreadRef = ref(db, `unreadCount/${userId}`);
  const handler = (snap: any) => {
    if (!snap.exists()) { callback(0); return; }
    const total = Object.values(snap.val() as Record<string, number>).reduce((a, b) => a + b, 0);
    callback(total);
  };
  onValue(unreadRef, handler);
  return () => off(unreadRef, 'value', handler);
}
