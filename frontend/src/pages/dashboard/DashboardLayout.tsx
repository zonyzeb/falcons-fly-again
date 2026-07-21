import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, CalendarCheck, User, LogOut, Shield, Settings, Gavel } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/dashboard/availability", label: "My Availability", icon: CalendarCheck },
  { to: "/dashboard/duties", label: "My Duties", icon: Gavel },
  { to: "/dashboard/profile", label: "My Profile", icon: User },
];

export default function DashboardLayout() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-falcon-cream">
      <header className="border-b border-falcon-gold/10 bg-[#0d1424]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center h-14 px-4 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-falcon-gold to-amber-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold">Falcons</span>
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-falcon-gold/10 border border-falcon-gold/20 text-falcon-gold hover:bg-falcon-gold/20 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Admin tools
              </NavLink>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-sm text-falcon-cream/40 mb-4">
          Signed in as{" "}
          <span className="text-falcon-cream/70">{profile?.full_name || "member"}</span>
          {isAdmin && <span className="text-falcon-gold"> · admin</span>}
        </p>

        <nav className="flex gap-1 p-1 mb-6 bg-white/5 rounded-xl w-full sm:w-fit">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/50 hover:text-falcon-cream"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="sm:inline">{item.label.replace("My ", "")}</span>
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  );
}
