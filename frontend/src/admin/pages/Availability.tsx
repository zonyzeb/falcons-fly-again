import { useState, useMemo } from "react";
import { CalendarCheck, Zap, AlertTriangle, Users, Check, Star } from "lucide-react";
import { loadState, saveState, getPlayerStats } from "@/admin/store";
import type { SquadPlayer } from "@/admin/store";

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

  // Sort remaining by form desc for picking
  remaining.sort((a, b) => b.form - a.form);

  // Ensure at least 1 keeper
  pick((p) => p.role === "WK", 1, "wicketkeepers");

  // Ensure 4-5 bowlers/all-rounders
  const bowlersNeeded = 5;
  pick((p) => p.role === "BOWL", 3, "pure bowlers");
  pick((p) => p.role === "ALL", 2, "all-rounders");

  // Fill remaining slots with best form players
  const slotsLeft = 11 - selected.length;
  const fillers = remaining.sort((a, b) => b.form - a.form).slice(0, Math.max(0, slotsLeft));
  selected.push(...fillers);

  const main = selected.slice(0, 11);
  const altPool = eligible.filter((p) => !main.some((m) => m.player_id === p.player_id));
  const alt = altPool.slice(0, 11);

  const bowlCount = main.filter((p) => p.role === "BOWL" || p.role === "ALL").length;
  const batCount = main.filter((p) => p.role === "BAT" || p.role === "ALL" || p.role === "WK").length;
  if (bowlCount < 5) risks.push(`Only ${bowlCount} bowling options in XI (need 5+)`);
  if (batCount < 6) risks.push(`Only ${batCount} batting options`);
  if (main.length < 11) risks.push(`Only ${main.length} fit & available players`);

  return { main, alt, risks };
}

function PlayerRow({ p, rank }: { p: SquadPlayer; rank: number }) {
  const stats = getPlayerStats(p.player_id);
  const form = computeFormScore(p);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
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

export default function AvailabilityPage() {
  const [state, setState] = useState(loadState);

  const toggleAvailability = (id: number) => {
    const next = {
      ...state,
      squad: state.squad.map((p) => (p.player_id === id ? { ...p, available: !p.available } : p)),
    };
    setState(next);
    saveState(next);
  };

  const { main, alt, risks } = useMemo(() => suggestXI(state.squad), [state.squad]);

  const availableCount = state.squad.filter((p) => p.active && p.available).length;
  const fitCount = state.squad.filter((p) => p.active && p.available && p.fitness === "Fit").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-falcon-gold" /> Availability & Selection
      </h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-falcon-cream">{state.squad.filter((p) => p.active).length}</p>
          <p className="text-xs text-falcon-cream/40">Active Squad</p>
        </div>
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-emerald-400">{availableCount}</p>
          <p className="text-xs text-falcon-cream/40">Available</p>
        </div>
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-cyan-400">{fitCount}</p>
          <p className="text-xs text-falcon-cream/40">Fit & Ready</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Availability Toggle */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Mark Availability
          </h2>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {state.squad.filter((p) => p.active).map((p) => (
              <button
                key={p.player_id}
                onClick={() => toggleAvailability(p.player_id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  p.available ? "bg-emerald-500/5 border border-emerald-500/20" : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  p.available ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-white/10"
                }`}>
                  {p.available && <Check className="w-3 h-3" />}
                </div>
                <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                <span className={`text-xs ${p.fitness === "Fit" ? "text-emerald-400" : p.fitness === "Doubtful" ? "text-amber-400" : "text-red-400"}`}>
                  {p.fitness}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Suggested XI */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-falcon-gold" /> Suggested XI
          </h2>
          {risks.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {risks.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            {main.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />)}
          </div>
        </div>

        {/* Alternative XI */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Alternative XI</h2>
          <div className="space-y-1.5">
            {alt.length === 0 ? (
              <p className="text-falcon-cream/20 text-xs text-center py-8">Not enough players for an alternative XI</p>
            ) : (
              alt.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
