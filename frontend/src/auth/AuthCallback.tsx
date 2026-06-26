import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, KeyRound, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

// Capture the link type before supabase strips the URL hash.
function initialLinkType(): string {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("type") || new URLSearchParams(window.location.search).get("type") || "";
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [linkType] = useState(initialLinkType);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const needsPassword = linkType === "invite" || linkType === "recovery";

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    if (!needsPassword) navigate("/dashboard", { replace: true });
  }, [loading, session, needsPassword, navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !needsPassword || !session) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-falcon-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-falcon-gold to-amber-600 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-falcon-cream">
            {linkType === "invite" ? "Welcome to the Falcons" : "Reset your password"}
          </h1>
          <p className="text-falcon-cream/40 text-sm mt-1">Set a password to finish.</p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="New password"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-falcon-gold/20 rounded-xl text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/50"
              autoFocus
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              placeholder="Confirm password"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-falcon-gold/20 rounded-xl text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/50"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Set password & continue
          </button>
        </form>
      </div>
    </div>
  );
}
