import { matches, type Match } from "@/data/stats";
import type { Fixture, MatchResult } from "@/lib/db";

// Maps a Falcons fixture to its scraped CricHeroes result so admins don't have
// to type results by hand. The scraped feed (matches.json) only contains
// Falcons matches, so the date is a reliable key (one match per day); opponent
// is used as a tiebreaker if a day ever has two.

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** "21-Jun-26" → "2026-06-21" */
function normDate(d: string): string | null {
  const m = d.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const mon = MONTHS[m[2] as keyof typeof MONTHS];
  return mon ? `20${m[3]}-${mon}-${m[1].padStart(2, "0")}` : null;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The non-Falcons team in a scraped match, with any trailing score stripped. */
function opponentOf(sm: Match): string {
  const other = (sm.score || []).find((s) => !/falcon/i.test(s)) || "";
  return other.replace(/\s+\d.*$/, "").trim();
}

function deriveResult(sm: Match): { result: MatchResult; result_note: string } | null {
  const r = (sm.result || "").trim();
  if (!r) return null;
  if (/no\s*result|abandon|wash/i.test(r)) return { result: "no_result", result_note: r };
  if (/\btie/i.test(r)) return { result: "tied", result_note: r };
  const won = r.match(/^(.*?)\s+won\s+by/i);
  if (won) return { result: /falcon/i.test(won[1]) ? "won" : "lost", result_note: r };
  return null;
}

/** Returns the scraped result for a fixture, or null if no confident match. */
export function matchScrapedResult(fx: Fixture): { result: MatchResult; result_note: string } | null {
  const sameDate = matches.filter((m) => normDate(m.date) === fx.match_date);
  if (sameDate.length === 0) return null;
  let sm: Match | undefined = sameDate.length === 1 ? sameDate[0] : undefined;
  if (!sm && fx.opponent) {
    const opp = slug(fx.opponent);
    const cand = sameDate.filter((m) => {
      const o = slug(opponentOf(m));
      return o && opp && (o.includes(opp) || opp.includes(o));
    });
    if (cand.length === 1) sm = cand[0];
  }
  return sm ? deriveResult(sm) : null;
}
