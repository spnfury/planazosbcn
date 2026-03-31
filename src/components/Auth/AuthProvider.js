'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session — use getUser() which validates JWT server-side
    // and automatically refreshes expired tokens (unlike getSession which
    // only reads from local storage without validation)
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (currentUser) {
        // After getUser succeeds, getSession will have the refreshed session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          setSession(currentSession);
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes (token refreshes, sign in/out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    sessionStorage.removeItem('restaurant_user');
    setSession(null);
    setUser(null);
    // Redirect to appropriate login page
    const isRestaurant = window.location.pathname.startsWith('/restaurant');
    window.location.href = isRestaurant ? '/restaurant/login' : '/admin/login';
  }

  // Proactively refresh the session token to prevent expiry
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      // getUser() validates the JWT server-side and refreshes the token
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      if (error || !refreshedUser) {
        // Token is invalid/expired and couldn't be refreshed — force re-login
        setSession(null);
        setUser(null);
        window.location.href = '/admin/login';
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes (JWT default expiry is 1 hour)
    return () => clearInterval(interval);
  }, [session]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
