import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import Player from "./pages/Player";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth, RequireAdmin } from "@/auth/guards";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/Home"));
const AboutPage = lazy(() => import("@/pages/About"));
const TeamPage = lazy(() => import("@/pages/Team"));
const MatchesPublicPage = lazy(() => import("@/pages/Matches"));
const GalleryPage = lazy(() => import("@/pages/Gallery"));
const JoinUsPage = lazy(() => import("@/pages/JoinUs"));
const ContactPage = lazy(() => import("@/pages/Contact"));

const LoginPage = lazy(() => import("@/auth/Login"));
const AuthCallbackPage = lazy(() => import("@/auth/AuthCallback"));

const DashboardLayout = lazy(() => import("@/pages/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const MyAvailabilityPage = lazy(() => import("@/pages/dashboard/MyAvailability"));
const MyDutiesPage = lazy(() => import("@/pages/dashboard/MyDuties"));
const MyProfilePage = lazy(() => import("@/pages/dashboard/MyProfile"));

const AdminLayout = lazy(() => import("@/admin/components/AdminLayout"));
const MatchSetupPage = lazy(() => import("@/admin/pages/MatchSetup"));
const SquadPage = lazy(() => import("@/admin/pages/Squad"));
const CombinationsPage = lazy(() => import("@/admin/pages/Combinations"));
const BattingAnalysisPage = lazy(() => import("@/admin/pages/BattingAnalysis"));
const BowlingAnalysisPage = lazy(() => import("@/admin/pages/BowlingAnalysis"));
const ImpactStrategyPage = lazy(() => import("@/admin/pages/ImpactStrategy"));
const AdminMatchesPage = lazy(() => import("@/admin/pages/Matches"));
const InsightsPage = lazy(() => import("@/admin/pages/Insights"));
const AvailabilityPage = lazy(() => import("@/admin/pages/Availability"));
const UmpiringPage = lazy(() => import("@/admin/pages/Umpiring"));
const FixturesPage = lazy(() => import("@/admin/pages/Fixtures"));
const TournamentsPage = lazy(() => import("@/admin/pages/Tournaments"));
const MembersPage = lazy(() => import("@/admin/pages/Members"));

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
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public pages with shared Header + Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/matches" element={<MatchesPublicPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/join" element={<JoinUsPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Player page has its own Header/Footer */}
              <Route path="/player/:slug" element={<Player />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Member dashboard (any signed-in member) */}
              <Route
                path="/dashboard"
                element={<RequireAuth><DashboardLayout /></RequireAuth>}
              >
                <Route index element={<DashboardHome />} />
                <Route path="availability" element={<MyAvailabilityPage />} />
                <Route path="duties" element={<MyDutiesPage />} />
                <Route path="profile" element={<MyProfilePage />} />
              </Route>

              {/* Admin (role === admin) */}
              <Route path="/admin">
                <Route index element={<Navigate to="/admin/squad" replace />} />
                <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route path="setup" element={<MatchSetupPage />} />
                  <Route path="squad" element={<SquadPage />} />
                  <Route path="combinations" element={<CombinationsPage />} />
                  <Route path="batting" element={<BattingAnalysisPage />} />
                  <Route path="bowling" element={<BowlingAnalysisPage />} />
                  <Route path="impact" element={<ImpactStrategyPage />} />
                  <Route path="matches" element={<AdminMatchesPage />} />
                  <Route path="insights" element={<InsightsPage />} />
                  <Route path="availability" element={<AvailabilityPage />} />
                  <Route path="umpiring" element={<UmpiringPage />} />
                  <Route path="tournaments" element={<TournamentsPage />} />
                  <Route path="fixtures" element={<FixturesPage />} />
                  <Route path="members" element={<MembersPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
