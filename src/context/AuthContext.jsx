import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';

const AuthContext = createContext({ user: null, loading: true, profile: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const hydrateProfile = async () => {
        try {
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          const snapshot = await getDoc(userRef);
          let data;
          if (snapshot.exists()) {
            data = snapshot.data();
          } else {
            data = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              banned: false,
              isAdmin: false,
            };
            await setDoc(userRef, data, { merge: true });
          }

          if (data?.banned) {
            await signOut(auth);
            if (!cancelled) {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
            return;
          }

          if (!cancelled) {
            setUser(firebaseUser);
            setProfile(data);
            setLoading(false);
          }
        } catch (error) {
          console.error('Auth guard failed', error);
          if (!cancelled) {
            setUser(firebaseUser);
            setProfile(null);
            setLoading(false);
          }
        }
      };

      hydrateProfile();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading, profile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
