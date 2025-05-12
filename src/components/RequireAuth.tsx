// src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function RequireAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 1) check initial session
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    init();

    // 2) subscribe to future changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading…</div>;
  }

  if (!session) {
    // Redirect to /login and preserve where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a session, render child routes
  return <Outlet />;
}
