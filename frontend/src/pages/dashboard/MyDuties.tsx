import { useEffect, useMemo, useState } from "react";
import { Gavel, Loader2, ArrowLeftRight, X } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchMyDuties,
  fetchAllProfiles,
  fetchMySwaps,
  createSwapRequest,
  cancelSwapRequest,
  type Duty,
  type Profile,
  type SwapRequest,
} from "@/lib/db";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_CLS: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  declined: "text-red-400",
  cancelled: "text-falcon-cream/40",
};

export default function MyDuties() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // swap form state, keyed by `${dutyId}:${slot}`
  const [openSwap, setOpenSwap] = useState<string | null>(null);
  const [swapTo, setSwapTo] = useState("");
  const [swapNote, setSwapNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchMyDuties(user.id), fetchAllProfiles(), fetchMySwaps(user.id)])
      .then(([d, p, s]) => { setDuties(d); setProfiles(p); setSwaps(s); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.full_name || "Unnamed"]));
    return (id: string) => m.get(id) ?? "Unknown";
  }, [profiles]);

  // a member can have a pending request per duty-slot already
  const pendingKey = useMemo(() => {
    const set = new Set<string>();
    for (const s of swaps) if (s.status === "pending") set.add(`${s.duty_id}:${s.slot}`);
    return set;
  }, [swaps]);

  const submitSwap = async (dutyId: string, slot: 1 | 2) => {
    if (!user) return;
    if (!swapTo) return setError("Pick who you want to swap with.");
    setSubmitting(true);
    setError("");
    try {
      await createSwapRequest({
        duty_id: dutyId,
        slot,
        requested_by: user.id,
        requested_to: swapTo,
        note: swapNote.trim() || null,
      });
      setOpenSwap(null); setSwapTo(""); setSwapNote("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request swap.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    try { await cancelSwapRequest(id); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not cancel."); }
  };

  if (loading) return <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto mt-8" />;

  const others = user ? profiles.filter((p) => p.id !== user.id) : profiles;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Gavel className="w-5 h-5 text-falcon-gold" /> My Umpiring Duties
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Your assigned match days. Can't make one? Request a swap.</p>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {duties.length === 0 ? (
        <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">
          You have no umpiring duties assigned. The admin will add them here.
        </p>
      ) : (
        <div className="space-y-3">
          {duties.map((d) => {
            const slot: 1 | 2 = d.umpire1 === user?.id ? 1 : 2;
            const partner = slot === 1 ? d.umpire2 : d.umpire1;
            const key = `${d.id}:${slot}`;
            const hasPending = pendingKey.has(key);
            return (
              <div key={d.id} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[64px]">
                    <div className="text-falcon-gold font-semibold">{fmtDate(d.duty_date).split(",")[0]}</div>
                    <div className="text-falcon-cream/40 text-xs">{fmtDate(d.duty_date).split(", ").slice(1).join(" ")}</div>
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="text-falcon-cream">With: {partner ? nameOf(partner) : <span className="text-falcon-cream/30">TBD</span>}</div>
                    {d.notes && <div className="text-xs text-falcon-cream/40 mt-0.5">{d.notes}</div>}
                  </div>
                  {hasPending ? (
                    <span className="text-xs text-amber-400 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">Swap pending</span>
                  ) : (
                    <button
                      onClick={() => { setOpenSwap(openSwap === key ? null : key); setSwapTo(""); setSwapNote(""); }}
                      className="text-xs text-falcon-cream/60 hover:text-falcon-gold px-3 py-1.5 rounded-lg border border-white/10 hover:border-falcon-gold/30 flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Request swap
                    </button>
                  )}
                </div>

                {openSwap === key && !hasPending && (
                  <div className="mt-3 pt-3 border-t border-white/5 grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <select
                      value={swapTo}
                      onChange={(e) => setSwapTo(e.target.value)}
                      className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
                    >
                      <option value="">Swap with…</option>
                      {others.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"}</option>)}
                    </select>
                    <input
                      value={swapNote}
                      onChange={(e) => setSwapNote(e.target.value)}
                      placeholder="Note (optional)"
                      className="px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
                    />
                    <button
                      onClick={() => submitSwap(d.id, slot)}
                      disabled={submitting}
                      className="px-4 py-2 bg-gradient-to-r from-falcon-gold to-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Send
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* My swap requests */}
      {swaps.length > 0 && (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">My swap requests</h2>
          <div className="space-y-2">
            {swaps.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="flex-1 text-falcon-cream/70">
                  To <span className="text-falcon-cream">{nameOf(s.requested_to)}</span>
                  {s.note && <span className="text-falcon-cream/40"> · “{s.note}”</span>}
                </span>
                <span className={`text-xs font-medium capitalize ${STATUS_CLS[s.status]}`}>{s.status}</span>
                {s.status === "pending" && (
                  <button onClick={() => cancel(s.id)} className="p-1 text-falcon-cream/40 hover:text-red-400" title="Cancel">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
