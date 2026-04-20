import { useState } from "react";
import { Calendar, MapPin, Trophy, ExternalLink, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { matches as matchesData, isWin, type Match } from "@/data/stats";

interface Tournament {
  name: string;
  matches: Match[];
  wins: number;
  losses: number;
  latestDate: string;
}

function groupByTournament(matches: Match[]): Tournament[] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const key = match.tournament || "Friendlies";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(match);
  }
  return Array.from(map.entries())
    .map(([name, ms]) => ({
      name,
      matches: ms,
      wins: ms.filter(isWin).length,
      losses: ms.filter((m) => !isWin(m)).length,
      latestDate: ms[0]?.date ?? "",
    }))
    .sort((a, b) => {
      const parse = (d: string) => {
        const months: Record<string, number> = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
        };
        const [day, mon, yr] = d.split("-");
        return new Date(2000 + parseInt(yr), months[mon], parseInt(day)).getTime();
      };
      return parse(b.latestDate) - parse(a.latestDate);
    });
}

const tournaments = groupByTournament(matchesData);

function MatchRow({ match }: { match: Match }) {
  const won = isWin(match);
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-4 px-5 border-t border-border/30 first:border-t-0">
      <div className="flex items-center gap-2 md:w-28 shrink-0">
        <Calendar className="w-3.5 h-3.5 text-falcon-gold/60" />
        <span className="text-sm text-muted-foreground">{match.date}</span>
      </div>

      <div className="flex-1 min-w-0">
        {match.score.map((line, i) => (
          <p
            key={i}
            className={`text-sm truncate ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground mt-0.5"}`}
          >
            {line}
          </p>
        ))}
      </div>

      {match.venue && (
        <div className="flex items-center gap-1.5 text-muted-foreground md:w-36 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-falcon-gold/50 shrink-0" />
          <span className="text-xs truncate">{match.venue}</span>
        </div>
      )}

      <div className="flex items-center gap-2 md:justify-end shrink-0">
        <Badge
          className={
            won
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-sm text-xs"
              : "bg-rose-500/20 text-rose-400 border-rose-500/30 backdrop-blur-sm text-xs"
          }
        >
          <Trophy className="w-3 h-3 mr-1" />
          {won ? "Won" : "Lost"}
        </Badge>
        {match.url && (
          <a
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-falcon-gold/50 hover:text-falcon-gold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function TournamentCard({ tournament, index }: { tournament: Tournament; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const winPct = tournament.matches.length
    ? Math.round((tournament.wins / tournament.matches.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <GlassCard interactive={false} className="overflow-hidden">
        {/* Tournament header — clickable */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base leading-snug truncate">
              {tournament.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tournament.matches.length} match{tournament.matches.length !== 1 ? "es" : ""}
              {" · "}
              Latest: {tournament.latestDate}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* W/L pills */}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {tournament.wins}W
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              {tournament.losses}L
            </span>

            {/* Win % bar */}
            <div className="hidden sm:flex flex-col items-end gap-1 w-20">
              <span className="text-xs text-muted-foreground">{winPct}% wins</span>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-falcon-gold/70 to-falcon-gold"
                  style={{ width: `${winPct}%` }}
                />
              </div>
            </div>

            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Match rows */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="matches"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-background/30">
                {tournament.matches.map((match, i) => (
                  <MatchRow key={i} match={match} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

export function MatchesSection() {
  return (
    <section id="matches" className="falcon-section bg-background relative">
      <GradientMesh variant="section" />

      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass px-4 py-1.5 rounded-full mb-4">
            Matches & Results
          </span>
          <h2 className="falcon-heading text-foreground mt-4 mb-6">
            When Work Ends,{" "}
            <span className="text-gradient-gold">Cricket Begins</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This is where our competitive side comes alive. Browse results by tournament.
          </p>
        </motion.div>

        <div className="space-y-4">
          {tournaments.map((tournament, index) => (
            <TournamentCard key={tournament.name} tournament={tournament} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
