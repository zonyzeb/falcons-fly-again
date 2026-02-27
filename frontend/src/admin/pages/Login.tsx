import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { login } from "@/admin/store";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/admin/squad");
    } else {
      setError("Invalid password");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-falcon-gold to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-falcon-gold/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-falcon-cream">Admin Access</h1>
          <p className="text-falcon-cream/40 text-sm mt-1">Falcons Cricket Club</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter admin password"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-falcon-gold/20 rounded-xl text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/50 focus:ring-1 focus:ring-falcon-gold/30 transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-falcon-gold/20 transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
