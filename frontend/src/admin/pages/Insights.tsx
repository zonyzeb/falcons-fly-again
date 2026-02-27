import { useMemo } from "react";
import { Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, CartesianGrid } from "recharts";
import { playerStats } from "@/data/stats";
import { loadState, loadSetup, getFormatConfig, FORMAT_CONFIGS, generateSmartXI, aggressionIndex, stabilityScore, finishingPower, bowlingDepthScore, deathBowlingStrength, getPlayerStats } from "@/admin/store";
import type { FormatType, MatchSetup } from "@/admin/store";

const gold = "#d4a843";
const emerald = "#34d399";
const rose = "#fb7185";
const violet = "#a78bfa";
const cyan = "#22d3ee";

const tooltipStyle = {
  contentStyle: { background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "#faf4e6" },
};

export default function InsightsPage() {
  const state = loadState();
  const setup = loadSetup();
  const config = getFormatConfig(setup);

  // Format-based best XIs
  const formatXIs = useMemo(() => {
    const formats: FormatType[] = ["T20", "T15", "T10", "T5"];
    return formats.map((f) => {
      const mockSetup: MatchSetup = { format: f, customOvers: 20, playerCount: 11, impactSubEnabled: false, impactSubs: [] };
      const xi = generateSmartXI(state.squad, mockSetup, "balanced");
      const totalAggr = xi.players.reduce((s, p) => s + aggressionIndex(p.player_id), 0);
      const totalStab = xi.players.reduce((s, p) => s + stabilityScore(p.player_id), 0);
      const totalFin = xi.players.reduce((s, p) => s + finishingPower(p.player_id), 0);
      const totalBD = xi.players.reduce((s, p) => s + bowlingDepthScore(p.player_id), 0);
      return { format: f, ...xi, aggression: totalAggr, stability: totalStab, finishing: totalFin, bowlingDepth: totalBD };
    });
  }, [state.squad]);

  const formatCompare = useMemo(() => {
    return formatXIs.map((fx) => ({
      format: fx.format,
      Aggression: fx.aggression,
      Stability: fx.stability,
      Finishing: fx.finishing,
      "Bowling Depth": fx.bowlingDepth,
    }));
  }, [formatXIs]);

  // Per-player impact by format
  const playerFormatImpact = useMemo(() => {
    const top = playerStats
      .filter((p) => (p.batting?.matches ?? 0) > 0)
      .slice(0, 8);
    return top.map((p) => ({
      name: p.name,
      aggression: aggressionIndex(p.player_id),
      stability: stabilityScore(p.player_id),
      finishing: finishingPower(p.player_id),
      bowling: bowlingDepthScore(p.player_id),
    }));
  }, []);

  // Impact scores
  const impactScores = useMemo(() => {
    return playerStats
      .filter((p) => (p.batting?.matches ?? 0) > 0)
      .map((p) => {
        const batScore = (p.batting?.runs || 0) * 0.3 + (p.batting?.average || 0) * 2 + (p.batting?.strike_rate || 0) * 0.5;
        const bowlScore = (p.bowling?.wickets || 0) * 5 + (p.bowling?.economy ? (10 - p.bowling.economy) * 3 : 0);
        const fieldScore = (p.fielding?.catches || 0) * 3 + (p.fielding?.run_outs || 0) * 5;
        return { name: p.name, impact: Math.round(batScore + bowlScore + fieldScore), batting: Math.round(batScore), bowling: Math.round(bowlScore), fielding: Math.round(fieldScore) };
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 12);
  }, []);

  // Combination comparison (saved)
  const comboStats = useMemo(() => {
    return state.combinations.map((c) => {
      const totalRuns = c.players.reduce((s, p) => s + (getPlayerStats(p.player_id)?.batting?.runs || 0), 0);
      const totalWickets = c.players.reduce((s, p) => s + (getPlayerStats(p.player_id)?.bowling?.wickets || 0), 0);
      const totalAggr = c.players.reduce((s, p) => s + aggressionIndex(p.player_id), 0);
      return { name: `${c.name} (${c.format || "?"})`, runs: totalRuns, wickets: totalWickets, aggression: totalAggr };
    });
  }, [state.combinations]);

  // All-rounder radar
  const allRounders = useMemo(() => {
    return playerStats
      .filter((p) => (p.batting?.innings ?? 0) > 3 && (p.bowling?.innings ?? 0) > 3)
      .map((p) => {
        const maxRuns = Math.max(...playerStats.map((x) => x.batting?.runs || 0)) || 1;
        const maxWkts = Math.max(...playerStats.map((x) => x.bowling?.wickets || 0)) || 1;
        const maxCatches = Math.max(...playerStats.map((x) => x.fielding?.catches || 0)) || 1;
        const maxSR = Math.max(...playerStats.map((x) => x.batting?.strike_rate || 0)) || 1;
        const maxEco = Math.max(...playerStats.map((x) => x.bowling?.economy || 0)) || 1;
        return {
          name: p.name,
          batting: Math.round(((p.batting?.runs || 0) / maxRuns) * 100),
          bowling: Math.round(((p.bowling?.wickets || 0) / maxWkts) * 100),
          fielding: Math.round(((p.fielding?.catches || 0) / maxCatches) * 100),
          strikeRate: Math.round(((p.batting?.strike_rate || 0) / maxSR) * 100),
          economy: Math.round((1 - (p.bowling?.economy || maxEco) / (maxEco * 1.5)) * 100),
        };
      })
      .sort((a, b) => (b.batting + b.bowling + b.fielding) - (a.batting + a.bowling + a.fielding))
      .slice(0, 5);
  }, []);

  // Best death bowlers by format
  const deathBowlersByFormat = useMemo(() => {
    return playerStats
      .filter((p) => (p.bowling?.wickets ?? 0) > 0)
      .map((p) => ({ name: p.name, deathStr: deathBowlingStrength(p.player_id) }))
      .sort((a, b) => b.deathStr - a.deathStr)
      .slice(0, 6);
  }, []);

  // Highest SR combo for T5
  const highSRPlayers = useMemo(() => {
    return playerStats
      .filter((p) => (p.batting?.strike_rate ?? 0) > 0)
      .map((p) => ({ name: p.name, sr: p.batting?.strike_rate || 0, runs: p.batting?.runs || 0 }))
      .sort((a, b) => b.sr - a.sr)
      .slice(0, 8);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Brain className="w-6 h-6 text-falcon-gold" /> Insights & Analysis
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Format-based combination analysis and player performance</p>
      </div>

      {/* Format Comparison Chart */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Best XI Score by Format</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatCompare}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="format" tick={{ fill: "#faf4e680", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="Aggression" fill={rose} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Stability" fill={emerald} />
            <Bar dataKey="Finishing" fill={violet} />
            <Bar dataKey="Bowling Depth" fill={cyan} radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best XIs per format */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {formatXIs.map((fx) => (
          <div key={fx.format} className={`bg-[#0d1424] border rounded-xl p-4 ${fx.format === setup.format ? "border-falcon-gold/30" : "border-white/5"}`}>
            <h3 className="text-sm font-semibold text-falcon-gold mb-2">Best XI — {fx.format}</h3>
            <div className="space-y-1">
              {fx.players.slice(0, 11).map((p, i) => {
                const sp = state.squad.find((s) => s.player_id === p.player_id);
                return (
                  <div key={p.player_id} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-falcon-gold font-bold">{i + 1}</span>
                    <span className="text-falcon-cream flex-1 truncate">{sp?.name}</span>
                    <span className="text-falcon-cream/30">{sp?.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Impact Scores */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Player Impact Scores</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={impactScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: "#faf4e660", fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="batting" stackId="a" fill={emerald} name="Batting" />
              <Bar dataKey="bowling" stackId="a" fill={rose} name="Bowling" />
              <Bar dataKey="fielding" stackId="a" fill={cyan} radius={[4, 4, 0, 0]} name="Fielding" />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* All-rounder Radar */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">All-rounder Profiles</h2>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={[
              { stat: "Batting", ...Object.fromEntries(allRounders.map((p) => [p.name, p.batting])) },
              { stat: "Bowling", ...Object.fromEntries(allRounders.map((p) => [p.name, p.bowling])) },
              { stat: "Fielding", ...Object.fromEntries(allRounders.map((p) => [p.name, p.fielding])) },
              { stat: "Strike Rate", ...Object.fromEntries(allRounders.map((p) => [p.name, p.strikeRate])) },
              { stat: "Economy", ...Object.fromEntries(allRounders.map((p) => [p.name, p.economy])) },
            ]}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="stat" tick={{ fill: "#faf4e660", fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              {allRounders.map((p, i) => (
                <Radar key={p.name} name={p.name} dataKey={p.name} stroke={[gold, emerald, rose, violet, cyan][i]} fill={[gold, emerald, rose, violet, cyan][i]} fillOpacity={0.08} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Death Bowlers */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Best Death Bowlers</h2>
          <div className="space-y-2">
            {deathBowlersByFormat.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-rose-400">{i + 1}</span>
                <span className="text-falcon-cream text-sm flex-1">{b.name}</span>
                <span className="text-xs text-rose-400 font-semibold">{b.deathStr}</span>
                <span className="text-[10px] text-falcon-cream/30">DEATH STR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Strike Rate (T5 Picks) */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Highest Strike Rate (T5 Picks)</h2>
          <div className="space-y-2">
            {highSRPlayers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-violet-400">{i + 1}</span>
                <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                <span className="text-xs text-falcon-cream/50">{p.runs}r</span>
                <span className="text-xs text-violet-400 font-semibold">SR {p.sr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Combination Comparison */}
      {comboStats.length > 0 && (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Saved Combination Comparison</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comboStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: "#faf4e680", fontSize: 10 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="runs" fill={emerald} name="Total Runs" radius={[0, 0, 0, 0]} />
              <Bar dataKey="wickets" fill={rose} name="Total Wickets" />
              <Bar dataKey="aggression" fill={gold} name="Aggression" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
