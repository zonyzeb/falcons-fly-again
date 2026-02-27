import { useMemo } from "react";
import { Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { playerStats } from "@/data/stats";
import { loadState } from "@/admin/store";

const gold = "#d4a843";
const emerald = "#34d399";
const rose = "#fb7185";
const violet = "#a78bfa";
const cyan = "#22d3ee";

export default function InsightsPage() {
  const state = loadState();

  const runsScoredData = useMemo(
    () =>
      [...playerStats]
        .filter((p) => (p.batting?.runs ?? 0) > 0)
        .sort((a, b) => (b.batting?.runs || 0) - (a.batting?.runs || 0))
        .slice(0, 10)
        .map((p) => ({ name: p.name, runs: p.batting?.runs || 0, avg: p.batting?.average || 0 })),
    []
  );

  const wicketsData = useMemo(
    () =>
      [...playerStats]
        .filter((p) => (p.bowling?.wickets ?? 0) > 0)
        .sort((a, b) => (b.bowling?.wickets || 0) - (a.bowling?.wickets || 0))
        .slice(0, 10)
        .map((p) => ({ name: p.name, wickets: p.bowling?.wickets || 0, economy: p.bowling?.economy || 0 })),
    []
  );

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

  const impactScores = useMemo(() => {
    return playerStats
      .filter((p) => (p.batting?.matches ?? 0) > 0)
      .map((p) => {
        const batScore = (p.batting?.runs || 0) * 0.3 + (p.batting?.average || 0) * 2 + (p.batting?.strike_rate || 0) * 0.5;
        const bowlScore = (p.bowling?.wickets || 0) * 5 + (p.bowling?.economy ? (10 - p.bowling.economy) * 3 : 0);
        const fieldScore = (p.fielding?.catches || 0) * 3 + (p.fielding?.run_outs || 0) * 5;
        const total = Math.round(batScore + bowlScore + fieldScore);
        return { name: p.name, impact: total, batting: Math.round(batScore), bowling: Math.round(bowlScore), fielding: Math.round(fieldScore) };
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 12);
  }, []);

  const comboStats = useMemo(() => {
    return state.combinations.map((c) => {
      const totalRuns = c.players.reduce((s, p) => s + (playerStats.find((x) => x.player_id === p.player_id)?.batting?.runs || 0), 0);
      const totalWickets = c.players.reduce((s, p) => s + (playerStats.find((x) => x.player_id === p.player_id)?.bowling?.wickets || 0), 0);
      const avgSR = c.players.reduce((s, p) => s + (playerStats.find((x) => x.player_id === p.player_id)?.batting?.strike_rate || 0), 0) / c.players.length;
      return { name: c.name, runs: totalRuns, wickets: totalWickets, sr: Math.round(avgSR) };
    });
  }, [state.combinations]);

  const tooltipStyle = {
    contentStyle: { background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" },
    labelStyle: { color: "#faf4e6" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Brain className="w-6 h-6 text-falcon-gold" /> Team Insights
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runs Scored */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Runs by Player</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={runsScoredData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#faf4e680", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="runs" fill={emerald} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Wickets */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Wickets by Player</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wicketsData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#faf4e680", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="wickets" fill={rose} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar: All-rounders */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
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
                <Radar key={p.name} name={p.name} dataKey={p.name} stroke={[gold, emerald, rose, violet, cyan][i]} fill={[gold, emerald, rose, violet, cyan][i]} fillOpacity={0.1} />
              ))}
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Impact Scores */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Player Impact Scores</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={impactScores} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: "#faf4e660", fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="batting" stackId="a" fill={emerald} radius={[0, 0, 0, 0]} name="Batting" />
              <Bar dataKey="bowling" stackId="a" fill={rose} name="Bowling" />
              <Bar dataKey="fielding" stackId="a" fill={cyan} radius={[4, 4, 0, 0]} name="Fielding" />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combination Comparison */}
      {comboStats.length > 0 && (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Combination Comparison</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comboStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: "#faf4e680", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#faf4e640", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="runs" fill={emerald} name="Total Runs" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wickets" fill={rose} name="Total Wickets" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#faf4e680" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
