import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToMessages, sendMessage as fbSendMessage, markAsRead, type Message } from '@/lib/firebase-rtdb';
import { useAuth } from '@/context/AuthContext';

export function useChat(convId: string | null) {
  const { firebaseUser } = useAuth();
  const [messages, setMessages]   = useState<Message[]>([]);
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!convId) return;
    const unsubscribe = subscribeToMessages(convId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    if (firebaseUser) markAsRead(convId, firebaseUser.uid);
    return unsubscribe;
  }, [convId, firebaseUser]);

  const send = useCallback(async (text: string, otherUserId: string) => {
    if (!convId || !text.trim()) return;
    setSending(true);
    try {
      await fbSendMessage(convId, otherUserId, text);
    } finally {
      setSending(false);
    }
  }, [convId]);

  return { messages, send, sending, bottomRef };
}