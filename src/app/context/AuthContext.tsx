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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await getUserRoles(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await getUserRoles(session.user.id);
        } else {
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
        return [];
      }
      
      console.log('Profile data received:', profile);
      const userRoles = profile?.roles || [];
      console.log('User roles:', userRoles);
      
      setRoles(userRoles);
      return userRoles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
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
