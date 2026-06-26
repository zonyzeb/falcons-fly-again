import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchUpcomingFixtures,
  fetchPlayerAvailability,
  setMatchAvailability,
  type Fixture,
  type MatchAvailability,
  type MatchAvailStatus,
} from "@/lib/db";

const STATUS: { value: MatchAvailStatus; label: string; ring: string; active: string }[] = [
  { value: "available", label: "Available", ring: "border-emerald-500/30", active: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" },
  { value: "maybe", label: "Maybe", ring: "border-amber-500/30", active: "bg-amber-500/20 border-amber-500/50 text-amber-300" },
  { value: "unavailable", label: "Can't play", ring: "border-red-500/30", active: "bg-red-500/15 border-red-500/50 text-red-300" },
];

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function MyAvailability() {
  const { user, profile } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [rows, setRows] = useState<MatchAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const playerId = profile?.player_id ?? null;

  useEffect(() => {
    if (!user) return;
    const tasks: [Promise<Fixture[]>, Promise<MatchAvailability[]>] = [
      fetchUpcomingFixtures(),
      playerId != null ? fetchPlayerAvailability(playerId) : Promise.resolve([]),
    ];
    Promise.all(tasks)
      .then(([f, r]) => { setFixtures(f); setRows(r); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [user, playerId]);

  const statusByFixture = useMemo(() => {
    const m = new Map<string, MatchAvailStatus>();
    for (const r of rows) m.set(r.fixture_id, r.status);
    return m;
  }, [rows]);

  const respond = async (fixtureId: string, status: MatchAvailStatus) => {
    if (!user || playerId == null) return;
    setSavingId(fixtureId);
    setError("");
    try {
      await setMatchAvailability({ fixture_id: fixtureId, player_id: playerId, status, set_by: user.id });
      setRows((prev) => [
        ...prev.filter((r) => r.fixture_id !== fixtureId),
        { id: "", fixture_id: fixtureId, player_id: playerId, status, set_by: user.id },
      ]);
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
          <CalendarCheck className="w-5 h-5 text-falcon-gold" /> My Availability
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Tell the captain which upcoming matches you can play.</p>
        {playerId == null && (
          <p className="mt-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Your account isn't linked to a squad player yet — ask an admin to link you so you can set availability.
          </p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {fixtures.length === 0 ? (
        <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">
          No upcoming matches scheduled yet.
        </p>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f) => {
            const cur = statusByFixture.get(f.id);
            return (
              <div key={f.id} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-falcon-cream text-sm font-medium truncate">
                      {f.tournament?.name ?? "Match"}{f.opponent ? <span className="text-falcon-cream/60"> · vs {f.opponent}</span> : null}
                    </div>
                    <div className="text-xs text-falcon-cream/40">
                      {fmtDate(f.match_date)}{f.match_time ? ` · ${f.match_time.slice(0, 5)}` : ""}
                      {f.ground ? ` · ${f.ground}` : ""}
                    </div>
                  </div>
                  {savingId === f.id && <Loader2 className="w-4 h-4 text-falcon-gold animate-spin shrink-0" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS.map((s) => (
                    <button
                      key={s.value}
                      disabled={playerId == null}
                      onClick={() => respond(f.id, s.value)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        cur === s.value ? s.active : `${s.ring} text-falcon-cream/60 hover:bg-white/5`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
