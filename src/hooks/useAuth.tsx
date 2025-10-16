import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  showPasswordReset: boolean;
  setShowPasswordReset: (show: boolean) => void;
  signUp: (email: string, password: string, fullName: string, mobileNumber: string) => Promise<{ error: any }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    // If the URL contains tokens (recovery/magic link), ensure we exchange them for a session
    const urlHasTokens =
      typeof window !== 'undefined' && (
        window.location.hash.includes('access_token') ||
        window.location.search.includes('code=') ||
        window.location.search.includes('type=recovery')
      );

    if (urlHasTokens) {
      // Fallback in case automatic URL detection fails
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {
        // no-op, Supabase may have already processed the URL
      });
    }

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      // Handle password recovery
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, mobileNumber: string) => {
    try {
      // Clean any previous auth state to avoid limbo
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' as any });
      } catch {
        // ignore
      }

      // Sign up with password and send confirmation email
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            display_name: fullName,
            mobile_number: mobileNumber,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email and click the confirmation link to verify your account.",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const verifyEmailOtp = async (_email: string, _otp: string) => {
    // OTP flow is disabled. Keeping function for interface compatibility.
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome Back",
          description: "You have been successfully logged in.",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        toast({
          title: "Logout Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      }
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Get the current site URL dynamically
      const siteUrl = window.location.origin;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback`,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    showPasswordReset,
    setShowPasswordReset,
    signUp,
    verifyEmailOtp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
