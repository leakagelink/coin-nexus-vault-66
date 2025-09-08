
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthComingSoon } from '@/components/auth-coming-soon';
import { useIsWebBrowser } from '@/hooks/useIsWebBrowser';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const isWebBrowser = useIsWebBrowser();
  const location = useLocation();

  console.log('AuthWrapper - user:', !!user, 'isWebBrowser:', isWebBrowser, 'pathname:', location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/portfolio', '/trades', '/wallet', '/watchlist', '/account', '/admin'];
  const requiresAuth = protectedRoutes.some(route => location.pathname.startsWith(route));

  // If user is not logged in and trying to access protected routes
  if (!user && requiresAuth) {
    return <AuthScreen />;
  }

  // Show special coming soon message for authenticated users on web browsers (except admin)
  if (user && isWebBrowser && !location.pathname.startsWith('/admin')) {
    console.log('Showing AuthComingSoon component');
    return <AuthComingSoon />;
  }

  return <>{children}</>;
}
