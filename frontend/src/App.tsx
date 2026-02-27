import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Player from "./pages/Player";
import NotFound from "./pages/NotFound";
import { isAuthenticated } from "@/admin/store";
import { lazy, Suspense } from "react";

const AdminLayout = lazy(() => import("@/admin/components/AdminLayout"));
const LoginPage = lazy(() => import("@/admin/pages/Login"));
const SquadPage = lazy(() => import("@/admin/pages/Squad"));
const CombinationsPage = lazy(() => import("@/admin/pages/Combinations"));
const MatchesPage = lazy(() => import("@/admin/pages/Matches"));
const InsightsPage = lazy(() => import("@/admin/pages/Insights"));
const AvailabilityPage = lazy(() => import("@/admin/pages/Availability"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/admin" replace />;
}

const Loading = () => (
  <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-falcon-gold/30 border-t-falcon-gold rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/player/:slug" element={<Player />} />
            <Route path="/admin">
              <Route index element={<LoginPage />} />
              <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
                <Route path="squad" element={<SquadPage />} />
                <Route path="combinations" element={<CombinationsPage />} />
                <Route path="matches" element={<MatchesPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="availability" element={<AvailabilityPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
