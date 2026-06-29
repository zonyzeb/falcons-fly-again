import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Users, BarChart3, Brain, CalendarCheck, LogOut, Menu, X, Shield, Crosshair, TrendingUp, Zap, UserCog, Gavel, CalendarPlus, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";

const navItems = [
  { to: "/admin/fixtures", label: "Tournaments & Fixtures", icon: CalendarPlus },
  { to: "/admin/availability", label: "Availability & XI", icon: CalendarCheck },
  { to: "/admin/umpiring", label: "Umpiring", icon: Gavel },
  { to: "/admin/squad", label: "Squad", icon: Users },
  { to: "/admin/members", label: "Members", icon: UserCog },
  { to: "/admin/batting", label: "Batting Analysis", icon: TrendingUp },
  { to: "/admin/bowling", label: "Bowling Analysis", icon: Crosshair },
  { to: "/admin/impact", label: "Impact Strategy", icon: Zap },
  { to: "/admin/matches", label: "Matches", icon: BarChart3 },
  { to: "/admin/insights", label: "Insights", icon: Brain },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d1424] border-r border-falcon-gold/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-falcon-gold/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-falcon-gold to-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-falcon-cream">Falcons</h1>
              <p className="text-xs text-falcon-cream/40">Selection Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-falcon-gold/15 text-falcon-gold border border-falcon-gold/20"
                    : "text-falcon-cream/60 hover:text-falcon-cream hover:bg-white/5"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-falcon-gold/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with format banner */}
        <header className="border-b border-falcon-gold/10 bg-[#0d1424]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center h-14 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-falcon-cream/60 hover:text-falcon-cream mr-3"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <NavLink to="/dashboard" className="flex items-center gap-1.5 text-falcon-cream/60 hover:text-falcon-gold text-sm transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5" /> Member view
              </NavLink>
              <span className="text-falcon-cream/20">|</span>
              <NavLink to="/" className="text-falcon-cream/40 hover:text-falcon-gold text-sm transition-colors">
                Back to Site
              </NavLink>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
