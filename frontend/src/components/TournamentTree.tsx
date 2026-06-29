import { Link } from "react-router-dom";
import { Trophy, Calendar, MapPin } from "lucide-react";
import type { Fixture } from "@/lib/db";

// Fixed-pixel layout so the SVG connectors line up exactly with the cards;
// the wrapper scrolls horizontally on narrow screens.
const CARD_H = 62;
const GAP = 18;
const STEP = CARD_H + GAP;
const ROOT_W = 158;
const CARD_X = 232;
const CARD_W = 300;
const VB_W = CARD_X + CARD_W;

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

export function TournamentTree({ groups, matchHref }: { groups: TreeGroup[]; matchHref?: (f: Fixture) => string }) {
  return (
    <div className="space-y-10">
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
                    <path key={f.id} d={`M${ROOT_W} ${rootY} C ${midX} ${rootY} ${midX} ${y} ${CARD_X} ${y}`}
                      fill="none" stroke={`url(#tt-${g.id})`} strokeWidth={2.5} />
                  );
                })}
                <circle cx={ROOT_W} cy={rootY} r={5} fill="#EAB44A" />
                {g.fixtures.map((f, i) => <circle key={f.id} cx={CARD_X} cy={i * STEP + CARD_H / 2} r={4} fill="#EAB44A" />)}
              </svg>

              {/* Root: the tournament */}
              <div className="absolute" style={{ left: 0, top: rootY - 60, width: ROOT_W }}>
                <div className="rounded-2xl p-4 bg-gradient-to-br from-falcon-gold to-amber-600 shadow-lg shadow-falcon-gold/20">
                  <Trophy className="w-6 h-6 text-[#3a2406]" />
                  <div className="mt-2 font-display font-bold text-[#3a2406] leading-tight text-[15px]">{g.tournament?.name ?? "Tournament"}</div>
                  <div className="text-xs text-[#6b4410] mt-0.5">{[g.tournament?.format, g.tournament?.season].filter(Boolean).join(" · ") || "—"}</div>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-[#3a2406] bg-amber-100/70 px-2 py-0.5 rounded-md">
                    {n} match{n !== 1 ? "es" : ""}
                  </span>
                </div>
              </div>

              {/* Branches: the matches */}
              {g.fixtures.map((f, i) => {
                const style = { left: CARD_X, top: i * STEP, width: CARD_W, height: CARD_H } as const;
                const inner = (
                  <div className="h-full flex items-center gap-3 rounded-xl bg-[#0d1424] border border-white/5 border-l-2 border-l-falcon-gold/60 px-3.5 hover:border-falcon-gold/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-falcon-cream font-medium truncate">
                        Falcons <span className="text-falcon-cream/40">vs</span> {f.opponent ?? "TBD"}
                      </div>
                      <div className="text-[11px] text-falcon-cream/40 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-falcon-gold/60" />{fmt(f.match_date)}{f.match_time ? ` · ${f.match_time.slice(0, 5)}` : ""}</span>
                        {f.ground && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-falcon-gold/60" />{f.ground}</span>}
                      </div>
                    </div>
                    {f.xi_published ? (
                      <span className="text-[10px] uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">XI set</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide text-falcon-cream/30 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded-full shrink-0">Scheduled</span>
                    )}
                  </div>
                );
                return matchHref ? (
                  <Link key={f.id} to={matchHref(f)} className="absolute block" style={style}>{inner}</Link>
                ) : (
                  <div key={f.id} className="absolute" style={style}>{inner}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
