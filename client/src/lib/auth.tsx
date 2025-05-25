// client/src/lib/auth.tsx
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient'; 
import type { User as AuthUser, Session } from '@supabase/supabase-js';
// Use Profile type from schema, and alias it as AppUser for clarity in this context
import type { Profile as AppUser, Profile } from '@shared/schema'; 

interface AuthContextType {
  user: AppUser | null;          
  session: Session | null;       
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Helper to transform Supabase Auth user and profile into your AppUser type
const transformToAppUser = (authUser: AuthUser | null, profileData: Profile | null): AppUser | null => {
  if (!authUser || !profileData) return null;
  // Ensure profileData fields match your 'profiles' table schema in shared/schema.ts
  return {
    id: profileData.id, 
    username: profileData.username,
    role: profileData.role,
    playerId: profileData.playerId,
    email: profileData.email, // This will be the dummy email from the profiles table
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    isActive: profileData.isActive,
    createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
    updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) : new Date(),
  };
};


export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session && !!appUser && session.user?.aud === 'authenticated';
  const isAdmin = appUser?.role === 'admin';

  const fetchUserProfile = useCallback(async (authUser: AuthUser | null): Promise<AppUser | null> => {
    if (!authUser) {
      setAppUser(null);
      return null;
    }
    try {
      const { data: profileData, error } = await supabase
        .from('profiles') // Changed from 'users' to 'profiles'
        .select('*')
        .eq('id', authUser.id) 
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        setAppUser(null); 
        return null;
      }
      if (profileData) {
        const transformedUser = transformToAppUser(authUser, profileData as Profile);
        setAppUser(transformedUser);
        return transformedUser;
      }
    } catch (e) {
      console.error('Exception fetching user profile:', e);
      setAppUser(null);
      return null;
    }
    return null;
  }, []);


  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user);
      } else {
        setAppUser(null); // Ensure appUser is cleared if no session
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user);
        } else {
          setAppUser(null); 
        }
        // Avoid redundant setLoading(false) if getSession is still running
        // or ensure it's only called once all async ops complete
        if (_event !== 'INITIAL_SESSION') {
             setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (username: string, pin: string): Promise<{ success: boolean; error?: string; user?: AppUser }> => {
    setLoading(true);
    try {
      const email = `${username.trim()}@rowdycup.app`; 

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pin,
      });

      if (signInError) {
        console.error('Supabase login error:', signInError.message);
        return { success: false, error: signInError.message || 'Login failed' };
      }

      if (data.session && data.user) {
        const profile = await fetchUserProfile(data.user); 
        if (profile) {
          return { success: true, user: profile };
        } else {
          await supabase.auth.signOut(); 
          return { success: false, error: 'Login successful, but failed to load user profile. Ensure profile exists and RLS allows access.' };
        }
      }
      return { success: false, error: 'Login failed: No session or user data returned from Supabase.' };

    } catch (error: any) {
      console.error('Login exception:', error);
      return { success: false, error: error.message || 'An unexpected error occurred.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Supabase logout error:", error.message);
    }
    // onAuthStateChange will handle setting session and appUser to null
    setLoading(false);
  };

  const value = {
    user: appUser,
    session,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}