import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

type Mode = "password" | "magic";

export default function Login() {
  const { signInWithPassword, signInWithMagicLink, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "password") {
        await signInWithPassword(email.trim(), password);
        navigate(from, { replace: true });
      } else {
        await signInWithMagicLink(email.trim());
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-falcon-gold to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-falcon-gold/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-falcon-cream">Member Sign In</h1>
          <p className="text-falcon-cream/40 text-sm mt-1">Falcons Cricket Club</p>
        </div>

        {!configured && (
          <div className="mb-4 text-amber-400 text-xs text-center bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Sign-in is not configured yet. Add the Supabase environment variables.
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-3">
            <Mail className="w-10 h-10 mx-auto text-falcon-gold" />
            <p className="text-falcon-cream text-sm">
              We've emailed a sign-in link to <span className="font-semibold">{email}</span>.
              Open it on this device to continue.
            </p>
            <button
              onClick={() => { setSent(false); setMode("password"); }}
              className="text-falcon-gold/70 hover:text-falcon-gold text-sm"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 p-1 mb-4 bg-white/5 rounded-xl">
              <button
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === "password" ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/50"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { setMode("magic"); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === "magic" ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/50"
                }`}
              >
                Magic link
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-falcon-gold/20 rounded-xl text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/50 focus:ring-1 focus:ring-falcon-gold/30 transition-all"
                  autoFocus
                />
              </div>

              {mode === "password" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-falcon-gold/20 rounded-xl text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/50 focus:ring-1 focus:ring-falcon-gold/30 transition-all"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={busy || !configured}
                className="w-full py-3 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-falcon-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "password" ? "Sign In" : "Send magic link"}
              </button>
            </form>

            <p className="text-center text-falcon-cream/30 text-xs mt-6">
              Accounts are invite-only. Ask a club admin to add you.
            </p>
            <p className="text-center mt-4">
              <Link to="/" className="text-falcon-cream/40 hover:text-falcon-gold text-sm">
                ← Back to site
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
