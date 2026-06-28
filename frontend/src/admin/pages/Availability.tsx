import { useState, useMemo, useEffect } from "react";
import { CalendarCheck, Zap, AlertTriangle, Star, Loader2, Users } from "lucide-react";
import { loadState, getPlayerStats } from "@/admin/store";
import type { SquadPlayer } from "@/admin/store";
import { fetchUpcomingFixtures, fetchFixtureAvailability, type Fixture, type MatchAvailStatus } from "@/lib/db";

type Resp = MatchAvailStatus | "none";

const STATUS_PILL: Record<Resp, { label: string; cls: string }> = {
  available: { label: "Available", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  maybe: { label: "Maybe", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  unavailable: { label: "Out", cls: "text-red-400 bg-red-500/10 border-red-500/30" },
  none: { label: "No reply", cls: "text-falcon-cream/30 bg-white/[0.03] border-white/10" },
};
const STATUS_ORDER: Record<Resp, number> = { available: 0, maybe: 1, none: 2, unavailable: 3 };

function computeFormScore(p: SquadPlayer): number {
  const stats = getPlayerStats(p.player_id);
  if (!stats) return 0;
  let score = 0;
  const bat = stats.batting;
  const bowl = stats.bowling;
  if (bat?.runs) score += bat.runs * 0.2;
  if (bat?.average) score += bat.average * 1.5;
  if (bat?.strike_rate) score += bat.strike_rate * 0.3;
  if (bowl?.wickets) score += bowl.wickets * 4;
  if (bowl?.economy) score += Math.max(0, (10 - bowl.economy)) * 2;
  if (stats.fielding?.catches) score += stats.fielding.catches * 2;
  return Math.round(score);
}

// Builds the best XI from players marked available for the selected match.
function suggestXI(squad: SquadPlayer[]): { main: SquadPlayer[]; alt: SquadPlayer[]; risks: string[] } {
  const eligible = squad
    .filter((p) => p.active && p.available && p.fitness === "Fit")
    .map((p) => ({ ...p, form: computeFormScore(p) }))
    .sort((a, b) => b.form - a.form);

  const risks: string[] = [];
  const selected: typeof eligible = [];
  const remaining = [...eligible];

  const pick = (filter: (p: SquadPlayer) => boolean, count: number, label: string) => {
    let picked = 0;
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (filter(remaining[i])) {
        selected.push(remaining[i]);
        remaining.splice(i, 1);
        picked++;
        if (picked >= count) break;
      }
    }
    if (picked < count) risks.push(`Only ${picked}/${count} ${label} available`);
  };

  remaining.sort((a, b) => b.form - a.form);
  pick((p) => p.role === "WK", 1, "wicketkeepers");
  pick((p) => p.role === "BOWL", 3, "pure bowlers");
  pick((p) => p.role === "ALL", 2, "all-rounders");

  const slotsLeft = 11 - selected.length;
  const fillers = remaining.sort((a, b) => b.form - a.form).slice(0, Math.max(0, slotsLeft));
  selected.push(...fillers);

  const main = selected.slice(0, 11);
  const altPool = eligible.filter((p) => !main.some((m) => m.player_id === p.player_id));
  const alt = altPool.slice(0, 11);

  const bowlCount = main.filter((p) => p.role === "BOWL" || p.role === "ALL").length;
  const batCount = main.filter((p) => p.role === "BAT" || p.role === "ALL" || p.role === "WK").length;
  if (main.length >= 1 && bowlCount < 5) risks.push(`Only ${bowlCount} bowling options in XI (need 5+)`);
  if (main.length >= 1 && batCount < 6) risks.push(`Only ${batCount} batting options`);
  if (main.length < 11) risks.push(`Only ${main.length} available — need ${11 - main.length} more for a full XI`);

  return { main, alt, risks };
}

function PlayerRow({ p, rank }: { p: SquadPlayer; rank: number }) {
  const stats = getPlayerStats(p.player_id);
  const form = computeFormScore(p);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]">
      <span className="w-5 text-center text-xs font-bold text-falcon-gold">{rank}</span>
      {p.photo && !p.photo.includes("default") ? (
        <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold text-xs font-bold">
          {p.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-falcon-cream text-sm font-medium truncate">{p.name}</div>
        <div className="text-xs text-falcon-cream/30">{p.role} · {p.bowlingType}</div>
      </div>
      <div className="text-right text-xs space-y-0.5">
        <div className="text-falcon-cream/50">{stats?.batting?.runs || 0}r · {stats?.bowling?.wickets || 0}w</div>
        <div className="flex items-center gap-1 justify-end">
          <Zap className="w-3 h-3 text-falcon-gold" />
          <span className="text-falcon-gold font-medium">{form}</span>
        </div>
      </div>
    </div>
  );
}

function fmtFixture(f: Fixture) {
  const d = new Date(f.match_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f.tournament?.name ?? "Match"}${f.opponent ? ` vs ${f.opponent}` : ""} · ${d}`;
}

export default function AvailabilityPage() {
  const squad = useMemo(() => loadState().squad, []);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixtureId, setFixtureId] = useState("");
  const [availMap, setAvailMap] = useState<Map<number, MatchAvailStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUpcomingFixtures()
      .then((fs) => { setFixtures(fs); if (fs[0]) setFixtureId(fs[0].id); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load fixtures."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!fixtureId) { setAvailMap(new Map()); return; }
    setLoadingAvail(true);
    fetchFixtureAvailability(fixtureId)
      .then((rows) => setAvailMap(new Map(rows.map((r) => [r.player_id, r.status]))))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load availability."))
      .finally(() => setLoadingAvail(false));
  }, [fixtureId]);

  const activeSquad = useMemo(() => squad.filter((p) => p.active), [squad]);
  const statusOf = (pid: number): Resp => availMap.get(pid) ?? "none";

  const mergedSquad = useMemo(
    () => squad.map((p) => ({ ...p, available: availMap.get(p.player_id) === "available" })),
    [squad, availMap]
  );
  const { main, alt, risks } = useMemo(() => suggestXI(mergedSquad), [mergedSquad]);

  const sortedPlayers = useMemo(
    () => [...activeSquad].sort((a, b) => {
      const d = STATUS_ORDER[statusOf(a.player_id)] - STATUS_ORDER[statusOf(b.player_id)];
      return d !== 0 ? d : computeFormScore(b) - computeFormScore(a);
    }),
    [activeSquad, availMap]
  );

  const countOf = (s: Resp) => activeSquad.filter((p) => statusOf(p.player_id) === s).length;
  const maybePlayers = sortedPlayers.filter((p) => statusOf(p.player_id) === "maybe");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-falcon-gold" /> Availability & Selection
      </h1>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {/* Match selector */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
        <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Select match</label>
        {loading ? (
          <Loader2 className="w-5 h-5 text-falcon-gold animate-spin mt-2" />
        ) : fixtures.length === 0 ? (
          <p className="text-falcon-cream/40 text-sm mt-2">No upcoming matches. Add one on the Fixtures page first.</p>
        ) : (
          <select
            value={fixtureId}
            onChange={(e) => setFixtureId(e.target.value)}
            className="mt-2 w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
          >
            {fixtures.map((f) => <option key={f.id} value={f.id}>{fmtFixture(f)}</option>)}
          </select>
        )}
      </div>

      {fixtureId && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {([["available", "Available", "text-emerald-400"], ["maybe", "Maybe", "text-amber-400"], ["unavailable", "Out", "text-red-400"], ["none", "No reply", "text-falcon-cream/50"]] as [Resp, string, string][]).map(([key, label, cls]) => (
              <div key={key} className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
                <p className={`text-2xl font-display font-bold ${cls}`}>{loadingAvail ? "–" : countOf(key)}</p>
                <p className="text-xs text-falcon-cream/40">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player responses */}
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Player responses
              </h2>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {sortedPlayers.map((p) => {
                  const pill = STATUS_PILL[statusOf(p.player_id)];
                  return (
                    <div key={p.player_id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                      <span className="text-falcon-cream text-sm flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] text-falcon-cream/30">{p.role}</span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${pill.cls}`}>{pill.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggested XI */}
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1 flex items-center gap-2">
                <Star className="w-4 h-4 text-falcon-gold" /> Suggested XI
              </h2>
              <p className="text-xs text-falcon-cream/40 mb-3">Best 11 from {countOf("available")} available, by role &amp; form.</p>
              {risks.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {risks.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {r}
                    </div>
                  ))}
                </div>
              )}
              {main.length === 0 ? (
                <p className="text-falcon-cream/20 text-xs text-center py-8">No available players yet for this match.</p>
              ) : (
                <div className="space-y-1.5">{main.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />)}</div>
              )}
            </div>

            {/* Bench & standby */}
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Bench &amp; standby</h2>
              {alt.length > 0 && (
                <>
                  <p className="text-xs text-falcon-cream/40 mb-1.5">Available, not in XI</p>
                  <div className="space-y-1.5 mb-4">{alt.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />)}</div>
                </>
              )}
              {maybePlayers.length > 0 && (
                <>
                  <p className="text-xs text-amber-400/80 mb-1.5">Maybe (chase these up)</p>
                  <div className="space-y-1.5">
                    {maybePlayers.map((p) => (
                      <div key={p.player_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.04] text-sm text-falcon-cream/80">
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-[10px] text-falcon-cream/30">{p.role}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {alt.length === 0 && maybePlayers.length === 0 && (
                <p className="text-falcon-cream/20 text-xs text-center py-8">No bench or standby players.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
