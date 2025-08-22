'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserRoles: (userId: string, retryCount?: number) => Promise<string[]>;
  refreshRoles: () => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 15000); // 15 seconds - longer timeout to allow for role fetching

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Add page refresh mechanism for role fetching
  useEffect(() => {
    if (user && (!roles || roles.length === 0) && !loading) {
      console.log('User exists but no roles, refreshing page in 3 seconds...');
      const refreshTimeout = setTimeout(() => {
        console.log('Refreshing page to reload roles...');
        window.location.reload();
      }, 3000); // Refresh after 3 seconds

      return () => clearTimeout(refreshTimeout);
    }
  }, [user, roles, loading]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('Session found:', !!session, 'User:', session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching roles...');
          // Fetch roles immediately and await them
          try {
            const userRoles = await getUserRoles(session.user.id);
            console.log('Roles fetched successfully:', userRoles);
            
            // Ensure roles are actually set before ending loading
            if (userRoles && userRoles.length > 0) {
              console.log('Initial roles confirmed, ending loading state');
              setLoading(false);
            } else {
              console.log('No initial roles returned, setting default and ending loading');
              setRoles(['user']);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching roles:', error);
            // Set default role instead of empty array
            setRoles(['user']);
            setLoading(false);
          }
        } else {
          console.log('No user found, setting empty roles and ending loading');
          setRoles([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
        setUser(null);
        setSession(null);
        setRoles([]);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User in auth change, fetching roles...');
          try {
            const userRoles = await getUserRoles(session.user.id);
            console.log('Roles fetched in auth change:', userRoles);
            
            // Ensure roles are actually set before ending loading
            if (userRoles && userRoles.length > 0) {
              console.log('Roles confirmed, ending loading state');
              setLoading(false);
            } else {
              console.log('No roles returned, setting default and ending loading');
              setRoles(['user']);
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching roles in auth change:', error);
            // Set default role instead of empty array
            setRoles(['user']);
            setLoading(false);
          }
        } else {
          console.log('No user in auth change, clearing roles and ending loading');
          setRoles([]);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getUserRoles = async (userId: string, retryCount = 0): Promise<string[]> => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      console.log(`Fetching roles for user: ${userId} (attempt ${retryCount + 1})`);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('Error fetching user roles:', error);
        
        // If profile doesn't exist, return default role without creating profile
        if (error.code === 'PGRST116') {
          console.log('Profile not found, using default role without creating profile');
          setRoles(['user']); // Default role without creating profile
          return ['user'];
        }
        
        // For other errors, retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`Retrying role fetch in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return getUserRoles(userId, retryCount + 1);
        }
        
        console.error('Max retries reached, using fallback role');
        setRoles(['user']); // Fallback to default role
        return ['user'];
      }
      
      console.log('Profile data received:', profile);
      const userRoles = profile?.roles || [];
      console.log('User roles:', userRoles);
      
      // If roles array is empty, use default role without updating database
      if (userRoles.length === 0) {
        console.log('Profile exists but has no roles, using default role without updating database');
        setRoles(['user']);
        return ['user'];
      }
      
      setRoles(userRoles);
      return userRoles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      
      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        console.log(`Retrying due to unexpected error in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return getUserRoles(userId, retryCount + 1);
      }
      
      console.error('Max retries reached, using fallback role');
      setRoles(['user']); // Fallback to default role
      return ['user'];
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in process...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Sign in successful, auth state change will handle role fetching');
      console.log('Sign in process completed');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setRoles([]);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        // Even if there's an error, we should still clear local state
        // and redirect to login
      }
      
      console.log('Sign out completed');
      
      // Force redirect to login page
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Clear state and redirect even if there's an error
      setUser(null);
      setSession(null);
      setRoles([]);
      window.location.href = '/auth/login';
    }
  };

  const refreshRoles = async () => {
    if (user) {
      console.log('Manually refreshing roles for user:', user.id);
      try {
        const userRoles = await getUserRoles(user.id);
        console.log('Roles refreshed successfully:', userRoles);
        return userRoles;
      } catch (error) {
        console.error('Error refreshing roles:', error);
        setRoles(['user']); // Set default role on error
        return ['user'];
      }
    }
    return [];
  };



  const value = {
    user,
    session,
    roles,
    loading,
    signIn,
    signUp,
    signOut,
    getUserRoles,
    refreshRoles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
