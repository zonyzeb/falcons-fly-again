import { useEffect, useMemo, useState } from "react";
import { Loader2, Dumbbell, Car, HandHelping, MapPin, Clock, Wallet, Check } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { players } from "@/data/stats";
import {
  fetchUpcomingTraining,
  fetchPlayerTrainingAvailability,
  fetchTrainingAvailabilityForSessions,
  setTrainingAvailability,
  setTrainingPaid,
  type TrainingSession,
  type TrainingAvailability,
  type MatchAvailStatus,
  type PickupKind,
} from "@/lib/db";

const playerName = (pid: number) => players.find((p) => p.player_id === pid)?.name ?? `#${pid}`;

const STATUS: { value: MatchAvailStatus; label: string; ring: string; active: string }[] = [
  { value: "available", label: "Available", ring: "border-emerald-500/30", active: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" },
  { value: "maybe", label: "Maybe", ring: "border-amber-500/30", active: "bg-amber-500/20 border-amber-500/50 text-amber-300" },
  { value: "unavailable", label: "Can't make it", ring: "border-red-500/30", active: "bg-red-500/15 border-red-500/50 text-red-300" },
];

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function timeRange(s: TrainingSession) {
  if (!s.start_time) return "";
  const a = s.start_time.slice(0, 5);
  const b = s.end_time ? `–${s.end_time.slice(0, 5)}` : "";
  return `${a}${b}`;
}

export default function MyTraining() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [myRows, setMyRows] = useState<TrainingAvailability[]>([]);
  const [allRows, setAllRows] = useState<TrainingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  // local draft of pickup detail fields (seats / area) before they are committed
  const [draft, setDraft] = useState<Record<string, { seats: string; area: string }>>({});

  const playerId = profile?.player_id ?? null;

  useEffect(() => {
    if (!user) return;
    fetchUpcomingTraining()
      .then(async (s) => {
        setSessions(s);
        const [mine, all] = await Promise.all([
          playerId != null ? fetchPlayerTrainingAvailability(playerId) : Promise.resolve([] as TrainingAvailability[]),
          fetchTrainingAvailabilityForSessions(s.map((x) => x.id)),
        ]);
        setMyRows(mine);
        setAllRows(all);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [user, playerId]);

  const myBySession = useMemo(() => {
    const m = new Map<string, TrainingAvailability>();
    for (const r of myRows) m.set(r.session_id, r);
    return m;
  }, [myRows]);

  const availCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of allRows) if (r.status === "available") m.set(r.session_id, (m.get(r.session_id) ?? 0) + 1);
    return m;
  }, [allRows]);

  const carpoolBySession = useMemo(() => {
    const m = new Map<string, { offers: TrainingAvailability[]; needs: TrainingAvailability[] }>();
    for (const r of allRows) {
      if (r.pickup === "none") continue;
      const g = m.get(r.session_id) ?? { offers: [], needs: [] };
      if (r.pickup === "offer") g.offers.push(r);
      else if (r.pickup === "need") g.needs.push(r);
      m.set(r.session_id, g);
    }
    return m;
  }, [allRows]);

  // Apply a change to my own row locally (optimistic) in both lists.
  const applyLocal = (sessionId: string, patch: Partial<TrainingAvailability>) => {
    setMyRows((prev) => {
      const existing = prev.find((r) => r.session_id === sessionId);
      const next: TrainingAvailability = {
        id: existing?.id ?? "",
        session_id: sessionId,
        player_id: playerId as number,
        status: existing?.status ?? "available",
        pickup: existing?.pickup ?? "none",
        pickup_seats: existing?.pickup_seats ?? null,
        pickup_area: existing?.pickup_area ?? null,
        paid: existing?.paid ?? false,
        paid_at: existing?.paid_at ?? null,
        set_by: user?.id ?? null,
        ...patch,
      };
      return [...prev.filter((r) => r.session_id !== sessionId), next];
    });
    setAllRows((prev) => {
      const existing = prev.find((r) => r.session_id === sessionId && r.player_id === playerId);
      const base: TrainingAvailability = existing ?? {
        id: "", session_id: sessionId, player_id: playerId as number, status: "available",
        pickup: "none", pickup_seats: null, pickup_area: null, paid: false, paid_at: null, set_by: user?.id ?? null,
      };
      return [...prev.filter((r) => !(r.session_id === sessionId && r.player_id === playerId)), { ...base, ...patch }];
    });
  };

  const saveRow = async (sessionId: string, patch: { status?: MatchAvailStatus; pickup?: PickupKind; pickup_seats?: number | null; pickup_area?: string | null }) => {
    if (!user || playerId == null) return;
    const mine = myBySession.get(sessionId);
    const status = patch.status ?? mine?.status;
    if (!status) return; // must choose a status first
    setSavingId(sessionId);
    setError("");
    const full = {
      session_id: sessionId,
      player_id: playerId,
      status,
      pickup: patch.pickup ?? mine?.pickup ?? "none",
      pickup_seats: patch.pickup_seats !== undefined ? patch.pickup_seats : mine?.pickup_seats ?? null,
      pickup_area: patch.pickup_area !== undefined ? patch.pickup_area : mine?.pickup_area ?? null,
      set_by: user.id,
    };
    applyLocal(sessionId, full);
    try {
      await setTrainingAvailability(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingId(null);
    }
  };

  const togglePaid = async (sessionId: string) => {
    if (!user || playerId == null) return;
    const mine = myBySession.get(sessionId);
    const next = !(mine?.paid ?? false);
    setSavingId(sessionId);
    applyLocal(sessionId, { paid: next, paid_at: next ? new Date().toISOString() : null });
    try {
      await setTrainingPaid(sessionId, playerId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-falcon-gold" /> Training
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Say if you can make each session, split the cost, and sort out lifts.</p>
        {playerId == null && (
          <p className="mt-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Your account isn't linked to a squad player yet — ask an admin to link you so you can respond.
          </p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {sessions.length === 0 ? (
        <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">
          No upcoming training scheduled yet.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const mine = myBySession.get(s.id);
            const cur = mine?.status;
            const count = availCount.get(s.id) ?? 0;
            const share = s.cost_sek != null && count > 0 ? Math.round(s.cost_sek / count) : null;
            const carpool = carpoolBySession.get(s.id);
            const d = draft[s.id] ?? {
              seats: mine?.pickup_seats != null ? String(mine.pickup_seats) : "",
              area: mine?.pickup_area ?? "",
            };
            const setD = (patch: Partial<{ seats: string; area: string }>) =>
              setDraft((prev) => ({ ...prev, [s.id]: { ...d, ...patch } }));

            return (
              <div key={s.id} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-falcon-cream text-sm font-medium truncate">{s.title || "Training"}</div>
                    <div className="text-xs text-falcon-cream/40 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span>{fmtDate(s.session_date)}</span>
                      {timeRange(s) && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-falcon-gold/60" />{timeRange(s)}</span>}
                      {s.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-falcon-gold/60" />{s.location}</span>}
                    </div>
                  </div>
                  {savingId === s.id && <Loader2 className="w-4 h-4 text-falcon-gold animate-spin shrink-0" />}
                </div>

                {s.notes && <p className="text-xs text-falcon-cream/50 mb-3">{s.notes}</p>}

                <div className="grid grid-cols-3 gap-2">
                  {STATUS.map((st) => (
                    <button
                      key={st.value}
                      disabled={playerId == null}
                      onClick={() => saveRow(s.id, { status: st.value })}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        cur === st.value ? st.active : `${st.ring} text-falcon-cream/60 hover:bg-white/5`
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Cost share */}
                {s.cost_sek != null && (
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-falcon-cream/60">
                      <Wallet className="w-4 h-4 text-falcon-gold/70" />
                      {share != null ? (
                        <>Your share: <b className="text-falcon-cream">{share} kr</b> <span className="text-falcon-cream/30">({s.cost_sek} kr ÷ {count})</span></>
                      ) : (
                        <>Cost {s.cost_sek} kr — split once players mark Available</>
                      )}
                    </span>
                    {share != null && cur === "available" && (
                      <button
                        onClick={() => togglePaid(s.id)}
                        disabled={playerId == null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${
                          mine?.paid ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "border-white/10 text-falcon-cream/60 hover:bg-white/5"
                        }`}
                      >
                        {mine?.paid ? <><Check className="w-3.5 h-3.5" /> Paid</> : "Mark paid"}
                      </button>
                    )}
                  </div>
                )}

                {/* Carpool controls (only once you've responded) */}
                {cur && cur !== "unavailable" && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveRow(s.id, { pickup: mine?.pickup === "offer" ? "none" : "offer" })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          mine?.pickup === "offer" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "border-white/10 text-falcon-cream/60 hover:bg-white/5"
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" /> I can give a lift
                      </button>
                      <button
                        onClick={() => saveRow(s.id, { pickup: mine?.pickup === "need" ? "none" : "need" })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          mine?.pickup === "need" ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "border-white/10 text-falcon-cream/60 hover:bg-white/5"
                        }`}
                      >
                        <HandHelping className="w-3.5 h-3.5" /> I need a lift
                      </button>
                    </div>
                    {mine?.pickup === "offer" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          type="number" min={1} max={8} inputMode="numeric" placeholder="Seats"
                          value={d.seats}
                          onChange={(e) => setD({ seats: e.target.value })}
                          onBlur={() => saveRow(s.id, { pickup_seats: d.seats ? Number(d.seats) : null })}
                          className="w-20 bg-[#0a0f1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
                        />
                        <input
                          type="text" placeholder="Pick-up area (e.g. Spånga)"
                          value={d.area}
                          onChange={(e) => setD({ area: e.target.value })}
                          onBlur={() => saveRow(s.id, { pickup_area: d.area || null })}
                          className="flex-1 min-w-[140px] bg-[#0a0f1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
                        />
                      </div>
                    )}
                    {mine?.pickup === "need" && (
                      <div className="mt-2">
                        <input
                          type="text" placeholder="Where do you need picking up? (e.g. Kista)"
                          value={d.area}
                          onChange={(e) => setD({ area: e.target.value })}
                          onBlur={() => saveRow(s.id, { pickup_area: d.area || null })}
                          className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Carpool board */}
                {carpool && (carpool.offers.length > 0 || carpool.needs.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-white/5 grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-cyan-300/80 font-medium mb-1 flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Offering lifts</div>
                      {carpool.offers.length === 0 ? <p className="text-falcon-cream/30">—</p> : carpool.offers.map((o) => (
                        <p key={o.player_id} className="text-falcon-cream/60">
                          {playerName(o.player_id)}{o.pickup_seats ? ` · ${o.pickup_seats} seat${o.pickup_seats !== 1 ? "s" : ""}` : ""}{o.pickup_area ? ` · ${o.pickup_area}` : ""}
                        </p>
                      ))}
                    </div>
                    <div>
                      <div className="text-amber-300/80 font-medium mb-1 flex items-center gap-1"><HandHelping className="w-3.5 h-3.5" /> Need a lift</div>
                      {carpool.needs.length === 0 ? <p className="text-falcon-cream/30">—</p> : carpool.needs.map((o) => (
                        <p key={o.player_id} className="text-falcon-cream/60">
                          {playerName(o.player_id)}{o.pickup_area ? ` · ${o.pickup_area}` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
