import { createContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '../supabase/config';
import { logout, signInWithGoogle, syncAuthenticatedUser } from '../supabase/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const loadedUserId = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadUser(sessionUser) {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setAccessDenied(false);
          setLoading(false);
          loadedUserId.current = null;
        }
        return;
      }
      
      try {
        const syncedProfile = await syncAuthenticatedUser(sessionUser);
        if (isMounted) {
          if (!syncedProfile || !syncedProfile.isActive || syncedProfile.status !== 'active') {
            setUser(null);
            setAccessDenied(true);
            loadedUserId.current = null;
          } else {
            setUser(syncedProfile);
            setAccessDenied(false);
            loadedUserId.current = sessionUser.id;
          }
        }
      } catch (err) {
        console.error('Error syncing user profile:', err);
        if (isMounted) {
          setUser(null);
          setAccessDenied(true);
          loadedUserId.current = null;
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      if (isMounted) {
        setFirebaseUser(currentUser);
        if (currentUser && loadedUserId.current !== currentUser.id) setLoading(true);
      }
      loadUser(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null;
        if (isMounted) setFirebaseUser(currentUser);
        
        // Prevent full screen loading flash on token refreshes or redundant auth events when switching tabs
        if (_event === 'TOKEN_REFRESHED') return;
        if (currentUser && loadedUserId.current === currentUser.id && _event !== 'SIGNED_OUT') return;

        if (isMounted) {
          if (currentUser) setLoading(true);
        }
        loadUser(currentUser);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    user,
    loading,
    accessDenied,
    signInWithGoogle,
    logout,
  }), [firebaseUser, user, loading, accessDenied]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
