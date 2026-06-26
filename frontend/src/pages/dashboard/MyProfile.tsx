import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { updateOwnName } from "@/lib/db";
import { players } from "@/data/stats";

export default function MyProfile() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const linkedPlayer = players.find((p) => p.player_id === profile?.player_id);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await updateOwnName(user.id, name.trim());
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold">My Profile</h1>

      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Display name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Your name"
            className="w-full mt-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-falcon-cream/50">Email</p>
            <p className="mt-1 text-falcon-cream/70 truncate">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-falcon-cream/50">Role</p>
            <p className="mt-1 text-falcon-cream/70">
              {isAdmin ? <span className="text-falcon-gold">Admin</span> : "Member"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-falcon-cream/50">Linked player</p>
            <p className="mt-1 text-falcon-cream/70">
              {linkedPlayer ? linkedPlayer.name : <span className="text-falcon-cream/30">Not linked</span>}
            </p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
