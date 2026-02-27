import { useMemo } from "react";
import { BarChart3, Trophy, MapPin, Calendar, ExternalLink } from "lucide-react";
import { getMatches } from "@/admin/store";
import { isWin, isLoss } from "@/data/stats";
import { playerStats } from "@/data/stats";

export default function MatchesPage() {
  const matches = getMatches();

  const summary = useMemo(() => {
    const wins = matches.filter(isWin).length;
    const losses = matches.filter(isLoss).length;
    const other = matches.length - wins - losses;
    return { total: matches.length, wins, losses, other, winPct: matches.length ? ((wins / matches.length) * 100).toFixed(1) : "0" };
  }, [matches]);

  const topBatters = useMemo(
    () => [...playerStats].filter((p) => p.batting?.runs).sort((a, b) => (b.batting?.runs || 0) - (a.batting?.runs || 0)).slice(0, 5),
    []
  );
  const topBowlers = useMemo(
    () => [...playerStats].filter((p) => p.bowling?.wickets).sort((a, b) => (b.bowling?.wickets || 0) - (a.bowling?.wickets || 0)).slice(0, 5),
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-falcon-gold" /> Match Performance
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Matches", value: summary.total, color: "from-falcon-gold to-amber-600" },
          { label: "Wins", value: summary.wins, color: "from-emerald-400 to-green-600" },
          { label: "Losses", value: summary.losses, color: "from-rose-400 to-red-600" },
          { label: "Other", value: summary.other, color: "from-slate-400 to-gray-600" },
          { label: "Win %", value: `${summary.winPct}%`, color: "from-violet-400 to-purple-600" },
        ].map((c) => (
          <div key={c.label} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-2`}>
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-display font-bold text-falcon-cream">{c.value}</p>
            <p className="text-xs text-falcon-cream/40 uppercase">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Batters */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Top Batters</h2>
          <div className="space-y-2">
            {topBatters.map((p, i) => (
              <div key={p.player_id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="w-5 text-center text-xs font-bold text-falcon-gold">{i + 1}</span>
                <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream font-semibold">{p.batting?.runs}</span>
                  <span className="text-falcon-cream/30 ml-1">runs</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream/60">avg {p.batting?.average}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream/60">sr {p.batting?.strike_rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bowlers */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Top Bowlers</h2>
          <div className="space-y-2">
            {topBowlers.map((p, i) => (
              <div key={p.player_id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="w-5 text-center text-xs font-bold text-falcon-gold">{i + 1}</span>
                <span className="text-falcon-cream text-sm flex-1">{p.name}</span>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream font-semibold">{p.bowling?.wickets}</span>
                  <span className="text-falcon-cream/30 ml-1">wkts</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream/60">eco {p.bowling?.economy}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-falcon-cream/60">avg {p.bowling?.average}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Match Results</h2>
        <div className="space-y-2">
          {matches.map((m, i) => {
            const won = isWin(m);
            const lost = isLoss(m);
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${won ? "bg-emerald-400" : lost ? "bg-red-400" : "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-falcon-cream text-sm font-medium truncate">{m.tournament}</div>
                  <div className="text-xs text-falcon-cream/40 truncate">{m.score.join(" vs ")}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-falcon-cream/40 shrink-0">
                  {m.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.venue}</span>}
                  {m.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>}
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-falcon-gold hover:text-falcon-gold-light">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${won ? "bg-emerald-500/15 text-emerald-400" : lost ? "bg-red-500/15 text-red-400" : "bg-gray-500/15 text-gray-400"}`}>
                  {won ? "Won" : lost ? "Lost" : "Draw"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
