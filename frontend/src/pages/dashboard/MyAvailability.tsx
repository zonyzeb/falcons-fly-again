import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchMyAvailability,
  upsertMyAvailability,
  type AvailStatus,
  type FitnessStatus,
} from "@/lib/db";

const STATUS: { value: AvailStatus; label: string; ring: string; active: string }[] = [
  { value: "available", label: "Available", ring: "border-emerald-500/30", active: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" },
  { value: "maybe", label: "Maybe", ring: "border-amber-500/30", active: "bg-amber-500/20 border-amber-500/50 text-amber-300" },
  { value: "unavailable", label: "Unavailable", ring: "border-red-500/30", active: "bg-red-500/20 border-red-500/50 text-red-300" },
];

const FITNESS: FitnessStatus[] = ["Fit", "Doubtful", "Injured", "Recovering"];

export default function MyAvailability() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<AvailStatus>("available");
  const [fitness, setFitness] = useState<FitnessStatus>("Fit");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchMyAvailability(user.id)
      .then((row) => {
        if (row) {
          setStatus(row.status);
          setFitness(row.fitness);
          setNote(row.note ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await upsertMyAvailability({
        user_id: user.id,
        player_id: profile?.player_id ?? null,
        status,
        fitness,
        note: note.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto mt-8" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold mb-1">My Availability</h1>
        <p className="text-falcon-cream/40 text-sm">
          Let the captain know if you can play. Update this any time before selection.
        </p>
        {!profile?.player_id && (
          <p className="mt-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Your account isn't linked to a squad player yet — ask an admin to link you so your
            response shows against your name in selection.
          </p>
        )}
      </div>

      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Can you play?</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {STATUS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                  status === s.value ? s.active : `${s.ring} text-falcon-cream/60 hover:bg-white/5`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Fitness</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {FITNESS.map((f) => (
              <button
                key={f}
                onClick={() => setFitness(f)}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  fitness === f
                    ? "bg-falcon-gold/20 border-falcon-gold/50 text-falcon-gold"
                    : "border-white/10 text-falcon-cream/60 hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Can only make the second match"
            className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40 resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "Saved" : "Save availability"}
        </button>
      </div>
    </div>
  );
}
