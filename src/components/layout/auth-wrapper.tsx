
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthComingSoon } from '@/components/auth-coming-soon';
import { useIsWebBrowser } from '@/hooks/useIsWebBrowser';
import { LandingPage } from '@/components/landing/landing-page';
import { MaintenanceMode } from '@/components/maintenance-mode';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  // Show maintenance mode on ALL pages
  return <MaintenanceMode />;
}
