import { useEffect, useMemo, useState } from "react";
import { UserPlus, Loader2, Shield, Check, Link2 } from "lucide-react";
import {
  fetchAllProfiles,
  adminUpdateProfile,
  inviteMember,
  type Profile,
  type MemberRole,
} from "@/lib/db";
import { players } from "@/data/stats";

export default function MembersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // invite form
  const [email, setEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [invitePlayer, setInvitePlayer] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllProfiles()
      .then(setProfiles)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load members."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const linkedPlayerIds = useMemo(
    () => new Set(profiles.map((p) => p.player_id).filter(Boolean)),
    [profiles]
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg("");
    setError("");
    try {
      await inviteMember({
        email: email.trim(),
        full_name: inviteName.trim(),
        role: inviteRole,
        player_id: invitePlayer ? Number(invitePlayer) : null,
      });
      setInviteMsg(`Invite sent to ${email.trim()}`);
      setEmail("");
      setInviteName("");
      setInvitePlayer("");
      setInviteRole("member");
      setTimeout(load, 800); // give the trigger a moment to create the profile
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setInviting(false);
    }
  };

  const setRole = async (p: Profile, role: MemberRole) => {
    try {
      await adminUpdateProfile(p.id, { role });
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, role } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const setPlayer = async (p: Profile, player_id: number | null) => {
    try {
      await adminUpdateProfile(p.id, { player_id });
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, player_id } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Shield className="w-6 h-6 text-falcon-gold" /> Members & Access
      </h1>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Invite */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Invite a member
        </h2>
        <form onSubmit={handleInvite} className="grid sm:grid-cols-2 gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@address.com"
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
          />
          <input
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Full name (optional)"
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MemberRole)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={invitePlayer}
            onChange={(e) => setInvitePlayer(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
          >
            <option value="">Link to player (optional)</option>
            {players.map((p) => (
              <option key={p.player_id} value={p.player_id} disabled={linkedPlayerIds.has(p.player_id)}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send invite
            </button>
            {inviteMsg && (
              <span className="text-emerald-400 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" /> {inviteMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Roster */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">
          Members ({profiles.length})
        </h2>
        {loading ? (
          <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-6" />
        ) : profiles.length === 0 ? (
          <p className="text-falcon-cream/30 text-sm text-center py-6">No members yet. Send an invite above.</p>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">
                    {p.full_name || <span className="text-falcon-cream/40">Unnamed</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-falcon-cream/30" />
                  <select
                    value={p.player_id ?? ""}
                    onChange={(e) => setPlayer(p, e.target.value ? Number(e.target.value) : null)}
                    className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
                  >
                    <option value="">No player</option>
                    {players.map((pl) => (
                      <option
                        key={pl.player_id}
                        value={pl.player_id}
                        disabled={pl.player_id !== p.player_id && linkedPlayerIds.has(pl.player_id)}
                      >
                        {pl.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={p.role}
                    onChange={(e) => setRole(p, e.target.value as MemberRole)}
                    className={`px-2 py-1.5 border rounded-lg text-xs focus:outline-none ${
                      p.role === "admin"
                        ? "bg-falcon-gold/10 border-falcon-gold/30 text-falcon-gold"
                        : "bg-white/5 border-white/10 text-falcon-cream/70"
                    }`}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
