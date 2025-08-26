
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Index from "./pages/Index";
import Watchlist from "./pages/Watchlist";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/watchlist" element={
                <ProtectedRoute>
                  <Watchlist />
                </ProtectedRoute>
              } />
              <Route path="/portfolio" element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <ProtectedRoute>
                  <NotFound />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
