import { useState } from "react";
import { Calendar, MapPin, Trophy, ExternalLink, ChevronDown, Clock, Shield, Star, Swords, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { matches as matchesData, matchScorecards, isWin, type Match, type ScorecardBatter, type ScorecardBowler } from "@/data/stats";

interface Tournament {
  name: string;
  matches: Match[];
  wins: number;
  losses: number;
  latestDate: string;
}

interface ParsedScore {
  team: string;
  runs: number;
  wickets: number;
  raw: string;
}

function parseScoreLine(line: string): ParsedScore {
  const m = line.match(/^(.+?)\s+(\d+)\/(\d+)\s*$/);
  if (m) return { team: m[1], runs: parseInt(m[2]), wickets: parseInt(m[3]), raw: line };
  return { team: line, runs: 0, wickets: 0, raw: line };
}

function extractOvers(info: string): string {
  const m = info.match(/(\d+)\s*Ov/i);
  return m ? `T${m[1]}` : "";
}

function winnerName(result: string): string {
  const m = result.match(/^(.+?)\s+won\s+by/i);
  return m ? m[1].trim() : "";
}

function winMargin(result: string): string {
  const m = result.match(/won\s+by\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

function yearFromDate(date: string): string {
  const yr = date.split("-")[2];
  return yr ? `20${yr}` : "";
}

function withYear(name: string, matches: Match[]): string {
  if (/\d{4}/.test(name)) return name;
  const year = yearFromDate(matches[0]?.date ?? "");
  return year ? `${name} ${year}` : name;
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
      name: withYear(name, ms),
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

// ── Match Preview Dialog ──────────────────────────────────────────────────────

function BatterRow({ b, rank }: { b: ScorecardBatter; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-t border-border/20 first:border-t-0">
      <span className="w-4 text-xs text-muted-foreground/50 font-mono shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {b.name}{b.not_out && <span className="text-falcon-gold text-xs ml-1">*</span>}
        </p>
        <p className="text-xs text-muted-foreground">{b.team}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">{b.runs}</span>
        <span className="text-xs text-muted-foreground ml-1">({b.balls})</span>
      </div>
      <div className="text-right shrink-0 w-14 hidden sm:block">
        <span className="text-xs text-muted-foreground">{b.fours}×4 {b.sixes}×6</span>
      </div>
    </div>
  );
}

function BowlerRow({ b, rank }: { b: ScorecardBowler; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-t border-border/20 first:border-t-0">
      <span className="w-4 text-xs text-muted-foreground/50 font-mono shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
        <p className="text-xs text-muted-foreground">{b.team}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">{b.wickets}/{b.runs}</span>
      </div>
      <div className="text-right shrink-0 w-16 hidden sm:block">
        <span className="text-xs text-muted-foreground">{b.overs} ov · {b.economy.toFixed(1)} er</span>
      </div>
    </div>
  );
}

function MatchPreviewDialog({ match, open, onClose }: { match: Match; open: boolean; onClose: () => void }) {
  const won = isWin(match);
  const scores = match.score.map(parseScoreLine);
  const format = extractOvers(match.info);
  const winner = winnerName(match.result);
  const margin = winMargin(match.result);

  const matchId = match.url ? match.url.split("/").pop() ?? "" : "";
  const sc = matchId ? matchScorecards[matchId] ?? null : null;

  const isFalcons = (name: string) =>
    /falcons|hsc falcons|helenelund/i.test(name);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border-border/50 bg-card/95 backdrop-blur-xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Coloured top bar */}
        <div className={`h-1.5 w-full shrink-0 ${won ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400"}`} />

        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                  {match.tournament || "Friendly"}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Calendar className="w-3 h-3 text-falcon-gold/60" />
                    {match.date}
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MapPin className="w-3 h-3 text-falcon-gold/60" />
                      {match.venue}
                    </div>
                  )}
                  {format && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3 text-falcon-gold/60" />
                      {format}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scores */}
          <div className="space-y-2">
            {scores.map((s, i) => {
              const isTeamFalcons = isFalcons(s.team);
              const isWinner = winner && s.team.toLowerCase().includes(winner.toLowerCase().slice(0, 8));
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    isWinner ? "bg-emerald-500/10 border-emerald-500/25" : "bg-white/5 border-border/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isTeamFalcons ? "bg-falcon-gold/20 border border-falcon-gold/30" : "bg-white/10 border border-border/30"
                    }`}>
                      <Shield className={`w-3.5 h-3.5 ${isTeamFalcons ? "text-falcon-gold" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm font-medium truncate ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.team}
                    </span>
                    {isWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {s.runs > 0 ? (
                      <>
                        <span className={`text-lg font-bold tabular-nums ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>{s.runs}</span>
                        <span className="text-sm text-muted-foreground/60">/{s.wickets}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">{s.raw}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          <div className={`rounded-xl px-4 py-3 text-center ${
            won ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          }`}>
            <p className={`text-sm font-semibold ${won ? "text-emerald-400" : "text-rose-400"}`}>
              {won ? "Victory" : "Defeat"}
            </p>
            {margin && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {winner} won by <span className="font-medium text-foreground">{margin}</span>
              </p>
            )}
          </div>

          {sc && (
            <>
              {/* Man of the Match */}
              {sc.player_of_match && (
                <div className="rounded-xl px-4 py-3 bg-falcon-gold/10 border border-falcon-gold/25 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-falcon-gold/20 border border-falcon-gold/30 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-falcon-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-falcon-gold uppercase tracking-wider">Player of the Match</p>
                    <p className="text-sm font-semibold text-foreground truncate">{sc.player_of_match.name}</p>
                    <p className="text-xs text-muted-foreground">{sc.player_of_match.team} · {sc.player_of_match.stat}</p>
                  </div>
                </div>
              )}

              {/* Top Batters */}
              {sc.top_batters.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-3.5 h-3.5 text-falcon-gold" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Batters</span>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-border/30 px-4 py-1">
                    {sc.top_batters.map((b, i) => (
                      <BatterRow key={i} b={b} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Bowlers */}
              {sc.top_bowlers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-3.5 h-3.5 text-falcon-gold" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Bowlers</span>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-border/30 px-4 py-1">
                    {sc.top_bowlers.map((b, i) => (
                      <BowlerRow key={i} b={b} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Full scorecard link */}
          {match.url && (
            <a
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-falcon-gold/30 text-falcon-gold hover:bg-falcon-gold/10 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Scorecard on CricHeroes
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Match Row ─────────────────────────────────────────────────────────────────

function MatchRow({ match }: { match: Match }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const won = isWin(match);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-6 py-4 px-5 border-t border-border/30 first:border-t-0 hover:bg-accent/5 transition-colors group"
      >
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
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
            View →
          </span>
        </div>
      </button>

      <MatchPreviewDialog
        match={match}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

// ── Tournament Card ───────────────────────────────────────────────────────────

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
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {tournament.wins}W
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              {tournament.losses}L
            </span>

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

// ── Page Section ──────────────────────────────────────────────────────────────

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
