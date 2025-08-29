import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, mobileNumber: string) => Promise<{ error: any }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
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

  const signUp = async (email: string, _password: string, fullName: string, mobileNumber: string) => {
    try {
      // Clean any previous auth state to avoid limbo
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' as any });
      } catch {
        // ignore
      }

      // Use signUp with email confirmation required
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temp_password_123!', // Temporary password for OTP flow
        options: {
          emailRedirectTo: `https://nadex.space/`,
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
          title: "OTP Sent",
          description: "6-digit code aapke email par bheja gaya hai. Kripya OTP daal kar verify karein.",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    try {
      // Verify 6-digit email OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Verified",
          description: "Aapka account verify ho gaya hai. Redirect ho rahe hain...",
        });
        // Force a clean state refresh to ensure correct session
        window.location.href = "/";
      }

      return { error };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return { error };
    }
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

  const value = {
    user,
    session,
    loading,
    signUp,
    verifyEmailOtp,
    signIn,
    signOut,
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
