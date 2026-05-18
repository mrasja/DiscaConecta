'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  loading: boolean;
  token: string | null;
  isNewUser: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null, appUser: null, loading: true, token: null, isNewUser: false,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser]           = useState<User | null>(null);
  const [loading, setLoading]           = useState(true);
  const [token, setToken]               = useState<string | null>(null);
  const [isNewUser, setIsNewUser]       = useState(false);

  const fetchAppUser = useCallback(async (idToken: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsNewUser(!!data._isNew);
        setAppUser(data);
      }
    } catch (e) { console.error(e); }
  }, []);

  const refreshUser = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const idToken = await fbUser.getIdToken();
    setToken(idToken);
    await fetchAppUser(idToken);
  }, [fetchAppUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Marcar como cargando ANTES de las operaciones async para que el
      // dashboard no redirija a /login mientras se fetchea el usuario.
      setLoading(true);
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        setFirebaseUser(fbUser);
        await fetchAppUser(idToken);
      } else {
        setFirebaseUser(null);
        setAppUser(null);
        setToken(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchAppUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, token, isNewUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
