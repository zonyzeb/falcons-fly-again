import { useMemo } from "react";
import { Crosshair, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { loadState, loadSetup, getFormatConfig, getPlayerStats, bowlingDepthScore, deathBowlingStrength } from "@/admin/store";

const tooltipStyle = {
  contentStyle: { background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "#faf4e6" },
};

export default function BowlingAnalysisPage() {
  const state = loadState();
  const setup = loadSetup();
  const config = getFormatConfig(setup);

  const bowlers = useMemo(() => {
    return state.squad
      .filter((p) => p.active && p.available && p.fitness === "Fit")
      .map((p) => {
        const s = getPlayerStats(p.player_id);
        const bowl = s?.bowling;
        return {
          name: p.name,
          role: p.role,
          bowlingType: p.bowlingType,
          wickets: bowl?.wickets || 0,
          economy: bowl?.economy || 0,
          overs: bowl?.overs || 0,
          innings: bowl?.innings || 0,
          average: bowl?.average || 0,
          depth: bowlingDepthScore(p.player_id),
          deathStr: deathBowlingStrength(p.player_id),
          canBowl: (p.role === "BOWL" || p.role === "ALL") && (bowl?.innings || 0) > 0,
        };
      })
      .filter((p) => p.canBowl || p.innings > 0)
      .sort((a, b) => b.depth - a.depth);
  }, [state.squad]);

  const totalOvers = config.overs;
  const maxPerBowler = config.maxPerBowler;
  const activeBowlers = bowlers.filter((b) => b.canBowl);
  const totalBowlingCapacity = activeBowlers.length * maxPerBowler;
  const coveragePercent = Math.min(100, Math.round((totalBowlingCapacity / totalOvers) * 100));

  const ppBowlers = useMemo(() => [...activeBowlers].sort((a, b) => b.depth - a.depth).slice(0, 3), [activeBowlers]);
  const middleBowlers = useMemo(() => [...activeBowlers].sort((a, b) => a.economy - b.economy).slice(0, 3), [activeBowlers]);
  const deathBowlers = useMemo(() => [...activeBowlers].sort((a, b) => b.deathStr - a.deathStr).slice(0, 3), [activeBowlers]);

  const overAllocation = useMemo(() => {
    return activeBowlers.slice(0, Math.ceil(totalOvers / maxPerBowler)).map((b) => ({
      name: b.name,
      allocated: maxPerBowler,
      max: maxPerBowler,
    }));
  }, [activeBowlers, totalOvers, maxPerBowler]);

  const depthData = useMemo(
    () => activeBowlers.slice(0, 10).map((b) => ({ name: b.name, depth: b.depth, death: b.deathStr })),
    [activeBowlers]
  );

  const totalDepth = activeBowlers.reduce((s, b) => s + b.depth, 0);
  const maxPossibleDepth = activeBowlers.length * 80 || 1;
  const depthPercent = Math.round((totalDepth / maxPossibleDepth) * 100);

  const totalDeathStr = deathBowlers.reduce((s, b) => s + b.deathStr, 0);
  const maxPossibleDeath = 3 * 60 || 1;
  const deathPercent = Math.round((totalDeathStr / maxPossibleDeath) * 100);

  const ppStrength = ppBowlers.reduce((s, b) => s + b.depth, 0);
  const maxPossiblePP = 3 * 80 || 1;
  const ppPercent = Math.round((ppStrength / maxPossiblePP) * 100);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (activeBowlers.length < config.minBowlers) {
      w.push(`Only ${activeBowlers.length} bowling options. Need at least ${config.minBowlers} for ${config.label}.`);
    }
    if (totalBowlingCapacity < totalOvers) {
      w.push(`Bowling capacity (${totalBowlingCapacity} overs) doesn't cover required ${totalOvers} overs.`);
    }
    if (deathBowlers.length < 2) {
      w.push("Limited death bowling options — consider adding a death specialist.");
    }
    return w;
  }, [activeBowlers, config, totalBowlingCapacity, totalOvers, deathBowlers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Crosshair className="w-6 h-6 text-falcon-gold" /> Bowling Analysis
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">
          {config.label} — Max {maxPerBowler} overs/bowler · {config.minBowlers}+ bowlers needed
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      {/* Strength Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Bowling Depth", value: depthPercent, color: "from-emerald-400 to-green-600", sub: `${activeBowlers.length} bowling options` },
          { label: "Death Bowling", value: deathPercent, color: "from-rose-400 to-red-600", sub: `${deathBowlers.length} death specialists` },
          { label: "Powerplay Control", value: ppPercent, color: "from-cyan-400 to-blue-600", sub: `${ppBowlers.length} PP bowlers` },
        ].map((m) => (
          <div key={m.label} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-falcon-cream/60 text-sm font-medium">{m.label}</span>
              <span className="text-falcon-cream font-display font-bold text-lg">{m.value}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-2">
              <div className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-500`} style={{ width: `${m.value}%` }} />
            </div>
            <p className="text-xs text-falcon-cream/30">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Phase Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Opening Spell</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Overs 1–{config.powerplayOvers}</p>
          <div className="space-y-2">
            {ppBowlers.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-cyan-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-falcon-cream/30">{b.bowlingType} · {b.wickets}w</div>
                </div>
                <span className="text-xs text-falcon-cream/50">eco {b.economy}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Middle Overs</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Overs {config.middleStart}–{config.middleEnd}</p>
          <div className="space-y-2">
            {middleBowlers.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-emerald-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-falcon-cream/30">{b.bowlingType} · avg {b.average}</div>
                </div>
                <span className="text-xs text-falcon-cream/50">eco {b.economy}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Death Overs</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Overs {config.deathStart}–{config.overs}</p>
          <div className="space-y-2">
            {deathBowlers.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-rose-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-falcon-cream/30">{b.bowlingType} · {b.wickets}w</div>
                </div>
                <span className="text-xs text-rose-400 font-semibold">{b.deathStr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Depth Chart */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Bowling Depth vs Death Strength</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={depthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="name" tick={{ fill: "#faf4e660", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="depth" fill="#34d399" name="Bowling Depth" radius={[4, 4, 0, 0]} />
            <Bar dataKey="death" fill="#fb7185" name="Death Strength" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overs Distribution */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Overs Distribution</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${coveragePercent >= 100 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
            Coverage: {coveragePercent}%
          </span>
        </div>
        <div className="space-y-2">
          {overAllocation.map((b) => (
            <div key={b.name} className="flex items-center gap-3">
              <span className="w-24 text-sm text-falcon-cream truncate">{b.name}</span>
              <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-falcon-gold/60 to-falcon-gold/30 rounded-lg flex items-center px-2"
                  style={{ width: `${(b.allocated / (maxPerBowler + 1)) * 100}%` }}
                >
                  <span className="text-[10px] text-falcon-cream font-semibold">{b.allocated} ov</span>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs text-falcon-cream/40 pt-2 border-t border-white/5">
            <span>Total capacity: {totalBowlingCapacity} overs</span>
            <span>Required: {totalOvers} overs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
