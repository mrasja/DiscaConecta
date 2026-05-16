'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null, appUser: null, loading: true, token: null
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser]           = useState<User | null>(null);
  const [loading, setLoading]           = useState(true);
  const [token, setToken]               = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        setFirebaseUser(fbUser);
        // Fetch or create app user
        try {
          const res = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          if (res.ok) setAppUser(await res.json());
        } catch (e) { console.error(e); }
      } else {
        setFirebaseUser(null);
        setAppUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);