import { useMemo } from "react";
import { Zap, ArrowUp, ArrowDown, Repeat, TrendingUp, Shield, Target } from "lucide-react";
import { loadState, loadSetup, getFormatConfig, getPlayerStats, aggressionIndex, bowlingDepthScore, playerFormScore } from "@/admin/store";

interface Scenario {
  title: string;
  description: string;
  suggestion: string;
  subType: string;
  winBoost: number;
  icon: React.ElementType;
  color: string;
}

export default function ImpactStrategyPage() {
  const state = loadState();
  const setup = loadSetup();
  const config = getFormatConfig(setup);

  const impactPlayers = useMemo(() => {
    return setup.impactSubs.map((sub) => {
      const sp = state.squad.find((p) => p.player_id === sub.player_id);
      const stats = getPlayerStats(sub.player_id);
      return { ...sub, name: sp?.name || "Unknown", role: sp?.role || "BAT", stats, form: sp ? playerFormScore(sp) : 0 };
    });
  }, [setup.impactSubs, state.squad]);

  const scenarios: Scenario[] = useMemo(() => {
    if (!setup.impactSubEnabled || impactPlayers.length === 0) return [];

    const batSubs = impactPlayers.filter((p) => p.type === "batting");
    const bowlSubs = impactPlayers.filter((p) => p.type === "bowling");
    const flexSubs = impactPlayers.filter((p) => p.type === "flexible");

    const result: Scenario[] = [];

    result.push({
      title: "Defending Low Total",
      description: `You're defending under ${config.overs * 6} runs. Bowling pressure is critical.`,
      suggestion: bowlSubs.length > 0
        ? `Activate ${bowlSubs[0].name} (Bowling Impact) at over ${config.deathStart} to tighten death overs.`
        : flexSubs.length > 0
          ? `Use ${flexSubs[0].name} (Flexible) as a bowling change at over ${Math.floor(config.overs * 0.6)}.`
          : "No bowling impact sub available — consider swapping a batter for a bowler.",
      subType: bowlSubs.length > 0 ? "bowling" : "flexible",
      winBoost: bowlSubs.length > 0 ? 12 : flexSubs.length > 0 ? 7 : 0,
      icon: Shield,
      color: "rose",
    });

    result.push({
      title: "Chasing High Target",
      description: `Required rate above ${Math.round(config.overs * 8 / config.overs)} RPO. Need batting firepower.`,
      suggestion: batSubs.length > 0
        ? `Activate ${batSubs[0].name} (Batting Impact) after over ${Math.floor(config.overs * 0.5)} for a power finish.`
        : flexSubs.length > 0
          ? `Deploy ${flexSubs[0].name} at over ${Math.floor(config.overs * 0.4)} to accelerate.`
          : "No batting impact sub available — adjust aggression in existing lineup.",
      subType: batSubs.length > 0 ? "batting" : "flexible",
      winBoost: batSubs.length > 0 ? 15 : flexSubs.length > 0 ? 9 : 0,
      icon: TrendingUp,
      color: "emerald",
    });

    result.push({
      title: "Pitch Slowing Down",
      description: "Ball is gripping — spinners becoming effective.",
      suggestion: bowlSubs.filter((p) => p.role === "BOWL").length > 0
        ? `Bring in ${bowlSubs[0].name} to exploit slow conditions in middle overs (${config.middleStart}–${config.middleEnd}).`
        : flexSubs.length > 0
          ? `${flexSubs[0].name} can adapt — deploy as a change bowler to break partnerships.`
          : "Consider existing bowlers for spin options.",
      subType: "bowling",
      winBoost: 8,
      icon: Target,
      color: "cyan",
    });

    result.push({
      title: "Early Wickets Fallen",
      description: "3+ wickets down in powerplay — need stability.",
      suggestion: batSubs.length > 0
        ? `Bring ${batSubs[0].name} immediately to stabilize innings. Focus on building partnerships.`
        : flexSubs.length > 0
          ? `Deploy ${flexSubs[0].name} as stabilizer — shift to accumulation mode.`
          : "Existing middle order must absorb pressure.",
      subType: batSubs.length > 0 ? "batting" : "flexible",
      winBoost: batSubs.length > 0 ? 18 : 10,
      icon: Repeat,
      color: "violet",
    });

    return result;
  }, [setup, impactPlayers, config]);

  const bestBatImpact = useMemo(() => {
    return state.squad
      .filter((p) => p.active && p.available && p.fitness === "Fit")
      .map((p) => ({ ...p, aggr: aggressionIndex(p.player_id), form: playerFormScore(p) }))
      .sort((a, b) => b.aggr - a.aggr)
      .slice(0, 5);
  }, [state.squad]);

  const bestBowlImpact = useMemo(() => {
    return state.squad
      .filter((p) => p.active && p.available && p.fitness === "Fit" && (p.role === "BOWL" || p.role === "ALL"))
      .map((p) => ({ ...p, depth: bowlingDepthScore(p.player_id), form: playerFormScore(p) }))
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 5);
  }, [state.squad]);

  if (!setup.impactSubEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Zap className="w-6 h-6 text-falcon-gold" /> Impact Strategy
        </h1>
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-8 text-center">
          <Zap className="w-12 h-12 text-falcon-cream/10 mx-auto mb-3" />
          <p className="text-falcon-cream/40 text-sm">Impact Substitute is OFF</p>
          <p className="text-falcon-cream/30 text-xs mt-1">Enable it in Match Setup to see tactical strategies</p>
        </div>

        {/* Still show recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Best Batting Impact Candidates</h2>
            <div className="space-y-2">
              {bestBatImpact.map((p, i) => (
                <div key={p.player_id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                  <span className="w-5 text-center text-xs font-bold text-emerald-400">{i + 1}</span>
                  <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                  <span className="text-xs text-falcon-cream/40">{p.role}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{p.aggr} AGR</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Best Bowling Impact Candidates</h2>
            <div className="space-y-2">
              {bestBowlImpact.map((p, i) => (
                <div key={p.player_id} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                  <span className="w-5 text-center text-xs font-bold text-rose-400">{i + 1}</span>
                  <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                  <span className="text-xs text-falcon-cream/40">{p.bowlingType}</span>
                  <span className="text-xs text-rose-400 font-semibold">{p.depth} DEP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Zap className="w-6 h-6 text-falcon-gold" /> Impact Strategy
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">
          {config.label} · {impactPlayers.length} impact sub{impactPlayers.length !== 1 ? "s" : ""} configured
        </p>
      </div>

      {/* Current Impact Subs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {impactPlayers.map((p) => {
          const typeColor = p.type === "batting" ? "from-emerald-400 to-green-600" : p.type === "bowling" ? "from-rose-400 to-red-600" : "from-violet-400 to-purple-600";
          return (
            <div key={p.player_id} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColor} flex items-center justify-center mb-3`}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-falcon-cream font-semibold text-sm">{p.name}</h3>
              <p className="text-xs text-falcon-cream/40 capitalize">{p.type} Impact · {p.role}</p>
              <div className="mt-2 text-xs text-falcon-cream/50">
                Form: <span className="text-falcon-gold font-semibold">{p.form}</span>
                {p.stats?.batting?.runs ? ` · ${p.stats.batting.runs}r` : ""}
                {p.stats?.bowling?.wickets ? ` · ${p.stats.bowling.wickets}w` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scenarios */}
      <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Match Scenarios</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const borderColor = { rose: "border-rose-500/20", emerald: "border-emerald-500/20", cyan: "border-cyan-500/20", violet: "border-violet-500/20" }[sc.color];
          const iconBg = { rose: "bg-rose-500/15 text-rose-400", emerald: "bg-emerald-500/15 text-emerald-400", cyan: "bg-cyan-500/15 text-cyan-400", violet: "bg-violet-500/15 text-violet-400" }[sc.color];
          return (
            <div key={sc.title} className={`bg-[#0d1424] border ${borderColor} rounded-xl p-5`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-falcon-cream font-semibold text-sm">{sc.title}</h3>
                  <p className="text-xs text-falcon-cream/40 mt-0.5">{sc.description}</p>
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-4 py-3 text-xs text-falcon-cream/70 leading-relaxed mb-3">
                {sc.suggestion}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ArrowUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">+{sc.winBoost}%</span>
                <span className="text-falcon-cream/30">estimated win probability increase</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
