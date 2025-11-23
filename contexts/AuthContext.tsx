import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { mockAuth } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoading: boolean;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  const refreshSession = async () => {
    if (supabase && !isMock) {
        // Real Supabase Logic
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.full_name || 'User',
            role: session.user.user_metadata.role || UserRole.CLIENT,
          });
        }
    } else {
        // Mock Logic
        const sessionUser = await mockAuth.getSession();
        setUser(sessionUser);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (supabase) {
        // Real Supabase Logic
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata.full_name || 'User',
            role: session.user.user_metadata.role || UserRole.CLIENT,
          });
        }
        
        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata.full_name || 'User',
              role: session.user.user_metadata.role || UserRole.CLIENT,
            });
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });
        
        return () => subscription.unsubscribe();
      } else {
        // Fallback to Mock Logic
        setIsMock(true);
        const sessionUser = await mockAuth.getSession();
        setUser(sessionUser);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    if (supabase && !isMock) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password', // Fallback for demo simplicity if needed
      });
      return { error: error?.message || null };
    } else {
      const { user: loggedUser, error } = await mockAuth.signIn(email);
      if (loggedUser) setUser(loggedUser);
      return { error };
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    if (supabase && !isMock) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      });
      return { error: error?.message || null };
    } else {
      const { user: newUser, error } = await mockAuth.signUp(email, name, role);
      if (newUser) setUser(newUser);
      return { error };
    }
  };

  const logout = async () => {
    if (supabase && !isMock) {
      await supabase.auth.signOut();
    } else {
      await mockAuth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshSession, isLoading, isMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};