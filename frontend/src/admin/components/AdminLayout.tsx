import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Users, Swords, BarChart3, Brain, CalendarCheck, LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { logout } from "@/admin/store";

const navItems = [
  { to: "/admin/squad", label: "Squad", icon: Users },
  { to: "/admin/combinations", label: "Combinations", icon: Swords },
  { to: "/admin/matches", label: "Matches", icon: BarChart3 },
  { to: "/admin/insights", label: "Insights", icon: Brain },
  { to: "/admin/availability", label: "Availability", icon: CalendarCheck },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
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
              <p className="text-xs text-falcon-cream/40">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-falcon-gold/15 text-falcon-gold border border-falcon-gold/20"
                    : "text-falcon-cream/60 hover:text-falcon-cream hover:bg-white/5"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-falcon-gold/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-falcon-gold/10 bg-[#0d1424]/80 backdrop-blur-xl flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-falcon-cream/60 hover:text-falcon-cream mr-3"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <NavLink to="/" className="text-falcon-cream/40 hover:text-falcon-gold text-sm transition-colors">
            ← Back to Site
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
