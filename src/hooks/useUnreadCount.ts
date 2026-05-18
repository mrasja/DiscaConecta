'use client';
import { useState, useEffect } from 'react';
import { subscribeTotalUnread } from '@/lib/firebase-rtdb';
import { useAuth } from '@/context/AuthContext';

export function useUnreadCount(): number {
  const { firebaseUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    return subscribeTotalUnread(firebaseUser.uid, setCount);
  }, [firebaseUser?.uid]);

  return count;
}
