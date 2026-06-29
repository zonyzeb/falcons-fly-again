import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarCheck, Star, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { players } from "@/data/stats";
import {
  fetchUpcomingFixtures,
  fetchPlayerAvailability,
  setMatchAvailability,
  fetchSelectionsForFixtures,
  type Fixture,
  type MatchAvailability,
  type MatchAvailStatus,
  type TeamSelection,
} from "@/lib/db";

const playerName = (pid: number) => players.find((p) => p.player_id === pid)?.name ?? `#${pid}`;

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
  const [selections, setSelections] = useState<TeamSelection[]>([]);
  const [openXi, setOpenXi] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const playerId = profile?.player_id ?? null;

  useEffect(() => {
    if (!user) return;
    fetchUpcomingFixtures()
      .then(async (f) => {
        setFixtures(f);
        const [avail, sels] = await Promise.all([
          playerId != null ? fetchPlayerAvailability(playerId) : Promise.resolve([] as MatchAvailability[]),
          fetchSelectionsForFixtures(f.map((x) => x.id)),
        ]);
        setRows(avail);
        setSelections(sels);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [user, playerId]);

  const statusByFixture = useMemo(() => {
    const m = new Map<string, MatchAvailStatus>();
    for (const r of rows) m.set(r.fixture_id, r.status);
    return m;
  }, [rows]);

  const selByFixture = useMemo(() => {
    const m = new Map<string, TeamSelection[]>();
    for (const s of selections) {
      if (!m.has(s.fixture_id)) m.set(s.fixture_id, []);
      m.get(s.fixture_id)!.push(s);
    }
    for (const list of m.values()) list.sort((a, b) => a.batting_order - b.batting_order);
    return m;
  }, [selections]);

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

                {/* Selection status (members-only, once announced) */}
                {(() => {
                  if (!f.xi_published) {
                    return <p className="mt-3 text-xs text-falcon-cream/30">Lineup not announced yet.</p>;
                  }
                  const xi = selByFixture.get(f.id) ?? [];
                  const mine = playerId != null ? xi.find((s) => s.player_id === playerId) : undefined;
                  return (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between gap-2">
                        {mine ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300 font-medium">
                            <CheckCircle2 className="w-4 h-4" /> You're in the XI · batting #{mine.batting_order}
                            {mine.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-falcon-gold/20 text-falcon-gold border border-falcon-gold/40 font-bold">C</span>}
                            {mine.is_keeper && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">WK</span>}
                          </span>
                        ) : (
                          <span className="text-sm text-falcon-cream/40">{playerId == null ? "XI announced" : "Not in the XI this time"}</span>
                        )}
                        {xi.length > 0 && (
                          <button onClick={() => setOpenXi(openXi === f.id ? null : f.id)} className="inline-flex items-center gap-1 text-xs text-falcon-cream/50 hover:text-falcon-gold">
                            <Star className="w-3.5 h-3.5" /> Team <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openXi === f.id ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>
                      {openXi === f.id && (
                        <div className="mt-2 space-y-1">
                          {xi.map((s) => (
                            <div key={s.player_id} className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${s.player_id === playerId ? "bg-emerald-500/[0.06]" : "bg-white/[0.02]"}`}>
                              <span className="w-4 text-center text-xs text-falcon-gold font-bold">{s.batting_order}</span>
                              <span className="flex-1 text-falcon-cream/80 truncate">{playerName(s.player_id)}</span>
                              {s.is_captain && <span className="text-[10px] text-falcon-gold font-bold">C</span>}
                              {s.is_keeper && <span className="text-[10px] text-cyan-300 font-bold">WK</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
