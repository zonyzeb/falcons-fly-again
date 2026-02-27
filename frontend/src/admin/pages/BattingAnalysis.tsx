import { useMemo } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { loadState, loadSetup, getFormatConfig, getPlayerStats, aggressionIndex, stabilityScore, finishingPower } from "@/admin/store";

const tooltipStyle = {
  contentStyle: { background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "#faf4e6" },
};

export default function BattingAnalysisPage() {
  const state = loadState();
  const setup = loadSetup();
  const config = getFormatConfig(setup);

  const activePlayers = useMemo(
    () => state.squad.filter((p) => p.active && p.available && p.fitness === "Fit"),
    [state.squad]
  );

  const battingData = useMemo(() => {
    return activePlayers
      .map((p) => {
        const s = getPlayerStats(p.player_id);
        return {
          name: p.name,
          role: p.role,
          aggression: aggressionIndex(p.player_id),
          stability: stabilityScore(p.player_id),
          finishing: finishingPower(p.player_id),
          runs: s?.batting?.runs || 0,
          sr: s?.batting?.strike_rate || 0,
          avg: s?.batting?.average || 0,
          innings: s?.batting?.innings || 0,
        };
      })
      .filter((p) => p.innings > 0)
      .sort((a, b) => b.runs - a.runs);
  }, [activePlayers]);

  const topOrder = useMemo(() => [...battingData].sort((a, b) => b.aggression - a.aggression).slice(0, 4), [battingData]);
  const middleOrder = useMemo(() => [...battingData].sort((a, b) => b.stability - a.stability).slice(0, 4), [battingData]);
  const finishers = useMemo(() => [...battingData].sort((a, b) => b.finishing - a.finishing).slice(0, 4), [battingData]);

  const radarData = useMemo(() => {
    const top5 = battingData.slice(0, 5);
    const maxAggr = Math.max(...battingData.map((d) => d.aggression)) || 1;
    const maxStab = Math.max(...battingData.map((d) => d.stability)) || 1;
    const maxFin = Math.max(...battingData.map((d) => d.finishing)) || 1;
    const maxSR = Math.max(...battingData.map((d) => d.sr)) || 1;
    const maxRuns = Math.max(...battingData.map((d) => d.runs)) || 1;
    return {
      data: [
        { stat: "Aggression", ...Object.fromEntries(top5.map((p) => [p.name, Math.round((p.aggression / maxAggr) * 100)])) },
        { stat: "Stability", ...Object.fromEntries(top5.map((p) => [p.name, Math.round((p.stability / maxStab) * 100)])) },
        { stat: "Finishing", ...Object.fromEntries(top5.map((p) => [p.name, Math.round((p.finishing / maxFin) * 100)])) },
        { stat: "Strike Rate", ...Object.fromEntries(top5.map((p) => [p.name, Math.round((p.sr / maxSR) * 100)])) },
        { stat: "Run Volume", ...Object.fromEntries(top5.map((p) => [p.name, Math.round((p.runs / maxRuns) * 100)])) },
      ],
      names: top5.map((p) => p.name),
    };
  }, [battingData]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    const format = setup.format;
    const anchorCount = battingData.filter((p) => p.stability > p.aggression).length;
    const hitterCount = battingData.filter((p) => p.aggression > p.stability).length;

    if ((format === "T10" || format === "T5") && anchorCount > config.anchorsNeeded + 1) {
      w.push(`Too many anchors (${anchorCount}) for ${format}. Power hitters should be prioritized.`);
    }
    if (format === "T5" && finishers.length < 3) {
      w.push("Not enough death-overs hitters for T5. Need at least 3 finishers.");
    }
    if ((format === "T20" || format === "T15") && hitterCount > 5) {
      w.push(`${hitterCount} aggressive hitters may compromise stability in ${format}.`);
    }
    return w;
  }, [battingData, setup, config, finishers]);

  const colors = ["#d4a843", "#34d399", "#fb7185", "#a78bfa", "#22d3ee"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-falcon-gold" /> Batting Analysis
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Format-aware batting roles for {config.label}</p>
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

      {/* Scores Overview */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Player Scores — {config.label}</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={battingData.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="name" tick={{ fill: "#faf4e660", fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="aggression" fill="#fb7185" name="Aggression" radius={[0, 0, 0, 0]} />
            <Bar dataKey="stability" fill="#34d399" name="Stability" radius={[0, 0, 0, 0]} />
            <Bar dataKey="finishing" fill="#a78bfa" name="Finishing" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Order */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Top Order</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Powerplay hitters (Overs 1–{config.powerplayOvers})</p>
          <div className="space-y-2">
            {topOrder.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-rose-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-falcon-cream/30">SR {p.sr} · {p.runs} runs</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-rose-400 font-semibold">{p.aggression}</div>
                  <div className="text-[10px] text-falcon-cream/30">AGGR</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Order */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Middle Order</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Stability + Acceleration (Overs {config.middleStart}–{config.middleEnd})</p>
          <div className="space-y-2">
            {middleOrder.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-emerald-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-falcon-cream/30">Avg {p.avg} · {p.innings} inn</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-semibold">{p.stability}</div>
                  <div className="text-[10px] text-falcon-cream/30">STAB</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finishers */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-1">Finishers</h2>
          <p className="text-xs text-falcon-cream/30 mb-3">Death overs specialists (Overs {config.deathStart}–{config.overs})</p>
          <div className="space-y-2">
            {finishers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-violet-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-falcon-cream/30">SR {p.sr} · NOuts {getPlayerStats(state.squad.find((s) => s.name === p.name)?.player_id || 0)?.batting?.not_outs || 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-violet-400 font-semibold">{p.finishing}</div>
                  <div className="text-[10px] text-falcon-cream/30">FINISH</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Top 5 Batting Profiles</h2>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData.data}>
            <PolarGrid stroke="#ffffff10" />
            <PolarAngleAxis dataKey="stat" tick={{ fill: "#faf4e660", fontSize: 11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            {radarData.names.map((name, i) => (
              <Radar key={name} name={name} dataKey={name} stroke={colors[i]} fill={colors[i]} fillOpacity={0.08} strokeWidth={2} />
            ))}
            <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
