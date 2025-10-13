'use client';

import { supabase } from '@/lib/supabaseClient';
import { createUrl } from '@/utils/basePath';
import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: string[];
  authLoading: boolean;
  rolesLoading: boolean;
  loading: boolean; // Computed property for backward compatibility
  isAuthenticated: boolean; // Helper to check if user is fully authenticated
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getUserRoles: (userId: string) => Promise<string[]>;
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
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  
  // Refs to prevent unnecessary state updates
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const isInitialized = useRef(false);

  // Sticky state for user and session to prevent loading states during tab switches
  const stickyUser = useRef<User | null>(null);
  const stickySession = useRef<Session | null>(null);
  const stickyRoles = useRef<string[]>([]);
  const isTabSwitch = useRef(false);

  // Simple function to update auth state
  const updateAuth = useCallback((newSession: Session | null, newUser: User | null) => {
    // Only update if the values actually changed
    if (newSession !== sessionRef.current || newUser !== userRef.current) {
      setSession(newSession);
      setUser(newUser);
      sessionRef.current = newSession;
      userRef.current = newUser;
      
      // Update sticky state when auth actually changes
      if (newUser) {
        stickyUser.current = newUser;
        stickySession.current = newSession;
        // Also update sticky roles if we have them
        if (roles.length > 0) {
          stickyRoles.current = roles;
        }
      }
    }
  }, []); // Remove roles dependency to prevent infinite loop

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthLoading(false);
          setRolesLoading(false);
          return;
        }
        
        console.log('Session found:', !!session, 'User:', session?.user?.email);
        
        // Set initial state
        updateAuth(session, session?.user ?? null);
        
        // Always end auth loading after session fetch - don't wait for roles
        setAuthLoading(false);
        
        if (session?.user) {
          console.log('User found, fetching roles in background...');
          // Fetch roles in background - don't block auth loading
          setRolesLoading(true);
          getUserRoles(session.user.id).catch(error => {
            console.error('Error fetching roles in background:', error);
            setRoles(['user']); // Safe default
            setRolesLoading(false);
          });
        } else {
          console.log('No user found, setting empty roles');
          setRoles([]);
          setRolesLoading(false);
        }
        
        isInitialized.current = true;
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthLoading(false);
        setRolesLoading(false);
        setUser(null);
        setSession(null);
        setRoles([]);
        isInitialized.current = true;
      }
    };

    getInitialSession();

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip if not initialized yet to prevent race conditions
        if (!isInitialized.current) return;
        
        // Skip if this is a tab switch and we have valid sticky state
        if (isTabSwitch.current && stickyUser.current && stickyRoles.current.length > 0) {
          console.log('Tab switch detected - skipping auth state change processing');
          return;
        }
        

        
        console.log('Auth state change:', event, 'User:', session?.user?.email);
        
        // Update auth state
        updateAuth(session, session?.user ?? null);
        
        if (session?.user) {
          // Check if this is a tab switch and we have sticky roles
          if (isTabSwitch.current && stickyRoles.current.length > 0) {
            console.log('Tab switch detected - using sticky roles, skipping fetch');
            setRoles(stickyRoles.current);
            setRolesLoading(false);
          } else {
            console.log('User in auth change, fetching roles in background...');
            // Fetch roles in background - don't block auth state
            setRolesLoading(true);
            getUserRoles(session.user.id).catch(error => {
              console.error('Error fetching roles in auth change:', error);
              setRoles(['user']); // Safe default
              setRolesLoading(false);
            });
          }
        } else {
          console.log('No user in auth change, clearing roles');
          setRoles([]);
          setRolesLoading(false);
        }
      }
    );

    // Handle browser visibility changes to prevent unnecessary auth reloads
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible - setting tab switch flag');
        isTabSwitch.current = true;
        // Reset the flag after a delay to prevent rapid auth changes
        setTimeout(() => {
          isTabSwitch.current = false;
          console.log('Tab switch quiet period ended');
        }, 2000); // 2 second quiet period
      }
    };

    // Handle window focus events
    const handleFocus = () => {
      console.log('Window focused - maintaining sticky auth state');
      // Don't trigger any auth checks, just maintain current state
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []); // Empty dependency array to prevent unnecessary re-runs

  const getUserRoles = async (userId: string): Promise<string[]> => {
    try {
      console.log(`Fetching roles for user: ${userId}`);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('Error fetching user roles:', error);
        
        // If profile doesn't exist, return default role without creating profile
        if (error.code === 'PGRST116') {
          console.log('Profile not found, using default role');
          setRoles(['user']);
          setRolesLoading(false);
          return ['user'];
        }
        
        // For other errors, use default role
        console.error('Using fallback role due to error');
        setRoles(['user']);
        setRolesLoading(false);
        return ['user'];
      }
      
      console.log('Profile data received:', profile);
      const userRoles = profile?.roles || [];
      console.log('User roles:', userRoles);
      
      // If roles array is empty, use default role
      if (userRoles.length === 0) {
        console.log('Profile exists but has no roles, using default role');
        setRoles(['user']);
        setRolesLoading(false);
        return ['user'];
      }
      
      setRoles(userRoles);
      setRolesLoading(false);
      // Update sticky roles
      stickyRoles.current = userRoles;
      return userRoles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      
      // Use default role on any error
      console.error('Using fallback role due to unexpected error');
      setRoles(['user']);
      setRolesLoading(false);
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
      setAuthLoading(false);
      setRolesLoading(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        // Even if there's an error, we should still clear local state
        // and redirect to login
      }
      
      console.log('Sign out completed');
      
      // Force redirect to login page with correct base path
      window.location.href = createUrl('/auth/login');
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Clear state and redirect even if there's an error
      setUser(null);
      setSession(null);
      setRoles([]);
      setAuthLoading(false);
      setRolesLoading(false);
      window.location.href = createUrl('/auth/login');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Sending password reset email...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const refreshRoles = async () => {
    if (user) {
      console.log('Manually refreshing roles for user:', user.id);
      setRolesLoading(true);
      try {
        const userRoles = await getUserRoles(user.id);
        console.log('Roles refreshed successfully:', userRoles);
        return userRoles;
      } catch (error) {
        console.error('Error refreshing roles:', error);
        setRoles(['user']); // Set default role on error
        setRolesLoading(false);
        return ['user'];
      }
    }
    return [];
  };



  const value = {
    user: user || stickyUser.current, // Use sticky user if current user is null
    session: session || stickySession.current, // Use sticky session if current session is null
    roles: roles.length > 0 ? roles : stickyRoles.current, // Use sticky roles if current roles are empty
    authLoading: authLoading && !stickyUser.current, // Don't show loading if we have sticky auth
    rolesLoading: rolesLoading && !stickyRoles.current.length, // Don't show loading if we have sticky roles
    loading: (authLoading && !stickyUser.current) || (rolesLoading && !stickyRoles.current.length), // Computed property for backward compatibility
    isAuthenticated: Boolean((!authLoading || stickyUser.current) && !!(user || stickyUser.current) && (!rolesLoading || stickyRoles.current.length)), // Helper to check if user is fully authenticated
    signIn,
    signUp,
    signOut,
    resetPassword,
    getUserRoles,
    refreshRoles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
