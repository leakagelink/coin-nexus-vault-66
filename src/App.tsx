
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthWrapper } from "@/components/layout/auth-wrapper";
import { ComingSoon } from "@/components/coming-soon";
import { useIsWebBrowser } from "@/hooks/useIsWebBrowser";
import Index from "./pages/Index";
import Watchlist from "./pages/Watchlist";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Trades from "./pages/Trades";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const isWebBrowser = useIsWebBrowser();
  const location = useLocation();
  
  // Allow admin panel to work on web browsers
  if (isWebBrowser && !location.pathname.startsWith('/admin')) {
    return <ComingSoon />;
  }

  return (
    <AuthWrapper>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/trades" element={<Trades />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthWrapper>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
