import { useState, useEffect } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { getUserRole } from '../utils/firestore';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'participant' | null>(null);
  const [participantId, setParticipantId] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const roleData = await getUserRole(user.email!);
          setUserRole(roleData?.role || null);
          setParticipantId(roleData?.participantId);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
          setParticipantId(undefined);
        }
      } else {
        setUserRole(null);
        setParticipantId(undefined);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
        // Trigger auth state change to reflect updated profile
        setUser({...result.user, displayName});
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    loading,
    userRole,
    participantId,
    signIn,
    signUp,
    logout
  };
};