import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

const Spinner = () => (
  <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-falcon-gold/30 border-t-falcon-gold rounded-full animate-spin" />
  </div>
);

/** Any signed-in member. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** Signed in AND role === admin. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (profile?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
