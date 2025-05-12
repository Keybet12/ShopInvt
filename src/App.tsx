// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

const ProtectedLayout: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    // subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Always send "/" to /dashboard (ProtectedLayout will redirect if no session) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Index />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
