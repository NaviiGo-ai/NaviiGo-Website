'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // auth is null during SSR or when Firebase credentials are missing
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Upsert user profile to Firestore on sign-in
      if (user) {
        try {
          const { upsertUserProfile } = await import('./firestore');
          await upsertUserProfile(user.uid, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
        } catch (err) {
          console.error('Failed to upsert user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Guard against double-click / rapid re-invocation of sign-in
  const signingInRef = useRef(false);

  const signInWithGoogle = async () => {
    if (!auth || signingInRef.current) return;
    signingInRef.current = true;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code;
      // User closed the popup or a new popup cancelled the old one — not real errors
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        signingInRef.current = false;
        return;
      }
      // Browser blocked the popup — fall back to redirect-based flow
      if (code === 'auth/popup-blocked') {
        try {
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          console.error("Error signing in with redirect fallback", redirectErr);
        }
        signingInRef.current = false;
        return;
      }
      console.error("Error signing in with Google", error);
    } finally {
      signingInRef.current = false;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
