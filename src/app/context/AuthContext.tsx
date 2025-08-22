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
  getUserRoles: (userId: string) => Promise<string[]>;
  refreshRoles: () => Promise<void>;
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
    }, 10000); // 3 seconds - faster timeout

    return () => clearTimeout(timeoutId);
  }, [loading]);

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
          } catch (error) {
            console.error('Error fetching roles:', error);
            setRoles([]);
          }
        } else {
          console.log('No user found, setting empty roles');
          setRoles([]);
        }
        
        console.log('Setting loading to false');
        setLoading(false);
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
          } catch (error) {
            console.error('Error fetching roles in auth change:', error);
            setRoles([]);
          }
        } else {
          console.log('No user in auth change, clearing roles');
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getUserRoles = async (userId: string): Promise<string[]> => {
    try {
      console.log('Fetching roles for user:', userId);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('Error fetching user roles:', error);
        // If profile doesn't exist, create one with default role
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile...');
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              { 
                id: userId, 
                roles: ['user'], // Default role
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select("roles")
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setRoles(['user']); // Fallback to default role
            return ['user'];
          }
          
          const userRoles = newProfile?.roles || ['user'];
          console.log('Created profile with roles:', userRoles);
          setRoles(userRoles);
          return userRoles;
        }
        return [];
      }
      
      console.log('Profile data received:', profile);
      const userRoles = profile?.roles || [];
      console.log('User roles:', userRoles);
      
      setRoles(userRoles);
      return userRoles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
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
      
      if (data.user) {
        console.log('Sign in successful, fetching roles immediately...');
        // Fetch roles immediately after successful login
        try {
          await getUserRoles(data.user.id);
        } catch (roleError) {
          console.error('Error fetching roles after login:', roleError);
          // Continue even if role fetching fails
        }
      }
      
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
      console.log('Refreshing roles for user:', user.id);
      await getUserRoles(user.id);
    }
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
