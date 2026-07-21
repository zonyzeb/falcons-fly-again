import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Calendar, MapPin } from "lucide-react";
import type { Fixture, AvailCounts, MatchResult } from "@/lib/db";

// Fixed-pixel layout so the SVG connectors line up exactly with the cards
// (desktop only). On mobile we render a vertical stacked list instead.
const CARD_H = 64;
const GAP = 18;
const STEP = CARD_H + GAP;
const ROOT_W = 158;
const CARD_X = 232;
const CARD_W = 304;
const VB_W = CARD_X + CARD_W;

const RESULT_BADGE: Record<MatchResult, { label: string; cls: string }> = {
  won: { label: "Won", cls: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  lost: { label: "Lost", cls: "text-red-300 bg-red-500/15 border-red-500/30" },
  tied: { label: "Tied", cls: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  no_result: { label: "No result", cls: "text-falcon-cream/40 bg-white/5 border-white/10" },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export interface TreeGroup {
  id: string;
  tournament: { name: string; format: string | null; season: number | null } | null | undefined;
  fixtures: Fixture[];
}

export function groupByTournament(fixtures: Fixture[]): TreeGroup[] {
  const map = new Map<string, TreeGroup>();
  for (const f of fixtures) {
    if (!map.has(f.tournament_id)) map.set(f.tournament_id, { id: f.tournament_id, tournament: f.tournament, fixtures: [] });
    map.get(f.tournament_id)!.fixtures.push(f);
  }
  return [...map.values()];
}

function Badge({ f }: { f: Fixture }) {
  if (f.result) return <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${RESULT_BADGE[f.result].cls}`}>{RESULT_BADGE[f.result].label}</span>;
  if (f.xi_published) return <span className="text-[10px] uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">XI set</span>;
  return <span className="text-[10px] uppercase tracking-wide text-falcon-cream/30 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded-full">Scheduled</span>;
}

function Counts({ f, c }: { f: Fixture; c?: AvailCounts }) {
  if (f.result || !c || (c.available === 0 && c.maybe === 0)) return null;
  return (
    <span className="text-[10px] flex items-center gap-1.5">
      <span className="text-emerald-400">{c.available} in</span>
      {c.maybe > 0 && <span className="text-amber-400">{c.maybe} maybe</span>}
    </span>
  );
}

function MatchBody({ f, c }: { f: Fixture; c?: AvailCounts }) {
  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-falcon-cream font-medium truncate">
          Falcons <span className="text-falcon-cream/40">vs</span> {f.opponent ?? "TBD"}
        </div>
        <div className="text-[11px] text-falcon-cream/40 mt-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-falcon-gold/60" />{fmt(f.match_date)}{f.match_time ? ` · ${f.match_time.slice(0, 5)}` : ""}</span>
          {f.ground && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-falcon-gold/60" />{f.ground}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge f={f} />
        <Counts f={f} c={c} />
      </div>
    </>
  );
}

export function TournamentTree({
  groups,
  matchHref,
  counts,
}: {
  groups: TreeGroup[];
  matchHref?: (f: Fixture) => string;
  counts?: Map<string, AvailCounts>;
}) {
  return (
    <>
      {/* Desktop: horizontal graph with SVG connectors */}
      <div className="hidden sm:block space-y-10">
        {groups.map((g) => {
          const n = g.fixtures.length;
          const H = Math.max(n * STEP - GAP, 132);
          const rootY = H / 2;
          const midX = (ROOT_W + CARD_X) / 2;
          return (
            <div key={g.id} className="overflow-x-auto pb-1">
              <div className="relative mx-auto" style={{ width: VB_W, height: H }}>
                <svg width={VB_W} height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
                  <defs>
                    <linearGradient id={`tt-${g.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#EAB44A" stopOpacity="0.75" />
                      <stop offset="1" stopColor="#EAB44A" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  {g.fixtures.map((f, i) => {
                    const y = i * STEP + CARD_H / 2;
                    return (
                      <motion.path key={f.id} d={`M${ROOT_W} ${rootY} C ${midX} ${rootY} ${midX} ${y} ${CARD_X} ${y}`}
                        fill="none" stroke={`url(#tt-${g.id})`} strokeWidth={2.5}
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.55, delay: 0.15 + i * 0.08 }} />
                    );
                  })}
                  <circle cx={ROOT_W} cy={rootY} r={5} fill="#EAB44A" />
                  {g.fixtures.map((f, i) => <circle key={f.id} cx={CARD_X} cy={i * STEP + CARD_H / 2} r={4} fill="#EAB44A" />)}
                </svg>

                <motion.div className="absolute" style={{ left: 0, top: rootY - 61, width: ROOT_W }}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                  <div className="rounded-2xl p-4 bg-gradient-to-br from-falcon-gold to-amber-600 shadow-lg shadow-falcon-gold/20">
                    <Trophy className="w-6 h-6 text-[#3a2406]" />
                    <div className="mt-2 font-display font-bold text-[#3a2406] leading-tight text-[15px]">{g.tournament?.name ?? "Tournament"}</div>
                    <div className="text-xs text-[#6b4410] mt-0.5">{[g.tournament?.format, g.tournament?.season].filter(Boolean).join(" · ") || "—"}</div>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-[#3a2406] bg-amber-100/70 px-2 py-0.5 rounded-md">
                      {n} match{n !== 1 ? "es" : ""}
                    </span>
                  </div>
                </motion.div>

                {g.fixtures.map((f, i) => (
                  <motion.div key={f.id} className="absolute" style={{ left: CARD_X, top: i * STEP, width: CARD_W, height: CARD_H }}
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}>
                    {(() => {
                      const inner = (
                        <div className="h-full flex items-center gap-3 rounded-xl bg-[#0d1424] border border-white/5 border-l-2 border-l-falcon-gold/60 px-3.5 hover:border-falcon-gold/40 transition-colors">
                          <MatchBody f={f} c={counts?.get(f.id)} />
                        </div>
                      );
                      return matchHref ? <Link to={matchHref(f)} className="block h-full">{inner}</Link> : inner;
                    })()}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stacked list */}
      <div className="sm:hidden space-y-6">
        {groups.map((g) => {
          const n = g.fixtures.length;
          return (
            <div key={g.id}>
              <div className="rounded-2xl p-4 bg-gradient-to-br from-falcon-gold to-amber-600 shadow-lg shadow-falcon-gold/20 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-[#3a2406] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-[#3a2406] leading-tight truncate">{g.tournament?.name ?? "Tournament"}</div>
                  <div className="text-xs text-[#6b4410]">{[g.tournament?.format, g.tournament?.season].filter(Boolean).join(" · ") || "—"}</div>
                </div>
                <span className="text-[11px] font-semibold text-[#3a2406] bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0">{n} match{n !== 1 ? "es" : ""}</span>
              </div>
              <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-falcon-gold/25 ml-4">
                {g.fixtures.map((f, i) => {
                  const inner = (
                    <div className="relative flex items-center gap-3 rounded-xl bg-[#0d1424] border border-white/5 px-3.5 py-3 active:bg-white/[0.03] transition-colors">
                      <span className="absolute -left-[19px] w-2.5 h-2.5 rounded-full bg-falcon-gold ring-4 ring-[#0a0f1e]" />
                      <MatchBody f={f} c={counts?.get(f.id)} />
                    </div>
                  );
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                      {matchHref ? <Link to={matchHref(f)} className="block">{inner}</Link> : inner}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
