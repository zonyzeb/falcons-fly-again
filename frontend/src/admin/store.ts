import { players, playerStats, matches } from "@/data/stats";
import type { PlayerStatsEntry } from "@/data/stats";

const STORAGE_KEY = "falcons_admin";
const SETUP_KEY = "falcons_match_setup";

// ── Player types ──

export type PlayerRole = "BAT" | "BOWL" | "ALL" | "WK";
export type BowlingType = "Fast" | "Spin" | "Medium" | "N/A";
export type FitnessStatus = "Fit" | "Injured" | "Doubtful" | "Recovering";

export interface SquadPlayer {
  player_id: number;
  name: string;
  slug: string;
  photo: string;
  role: PlayerRole;
  bowlingType: BowlingType;
  preferredPosition: number;
  available: boolean;
  active: boolean;
  fitness: FitnessStatus;
}

export interface CombinationPlayer {
  player_id: number;
  battingOrder: number;
  bowlingPriority: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isKeeper: boolean;
  battingPhase?: "top" | "middle" | "finisher";
  bowlingPhase?: "powerplay" | "middle" | "death" | "";
}

export interface TeamCombination {
  id: string;
  name: string;
  created: string;
  players: CombinationPlayer[];
  notes: string;
  format?: FormatType;
  playerCount?: number;
}

export interface AdminState {
  squad: SquadPlayer[];
  combinations: TeamCombination[];
}

// ── Match Format Engine ──

export type FormatType = "T20" | "T15" | "T10" | "T5" | "CUSTOM";
export type ImpactSubType = "batting" | "bowling" | "flexible";

export interface ImpactSub {
  player_id: number;
  type: ImpactSubType;
}

export interface MatchSetup {
  format: FormatType;
  customOvers: number;
  playerCount: number;
  impactSubEnabled: boolean;
  impactSubs: ImpactSub[];
}

export interface FormatConfig {
  label: string;
  overs: number;
  maxPerBowler: number;
  powerplayOvers: number;
  middleStart: number;
  middleEnd: number;
  deathStart: number;
  minBowlers: number;
  aggression: "low" | "medium" | "high" | "extreme";
  anchorsNeeded: number;
  finishersNeeded: number;
  allRoundersPreferred: number;
  description: string;
}

export const FORMAT_CONFIGS: Record<string, FormatConfig> = {
  T20: {
    label: "T20 (20 overs)",
    overs: 20,
    maxPerBowler: 4,
    powerplayOvers: 6,
    middleStart: 7,
    middleEnd: 15,
    deathStart: 16,
    minBowlers: 5,
    aggression: "medium",
    anchorsNeeded: 2,
    finishersNeeded: 2,
    allRoundersPreferred: 2,
    description: "Balanced structure – 2–3 anchors, 2 finishers, rotation important",
  },
  T15: {
    label: "T15 (15 overs)",
    overs: 15,
    maxPerBowler: 3,
    powerplayOvers: 4,
    middleStart: 5,
    middleEnd: 11,
    deathStart: 12,
    minBowlers: 5,
    aggression: "high",
    anchorsNeeded: 1,
    finishersNeeded: 2,
    allRoundersPreferred: 3,
    description: "Faster start – less room for anchors, more all-rounders",
  },
  T10: {
    label: "T10 (10 overs)",
    overs: 10,
    maxPerBowler: 2,
    powerplayOvers: 3,
    middleStart: 4,
    middleEnd: 7,
    deathStart: 8,
    minBowlers: 5,
    aggression: "high",
    anchorsNeeded: 1,
    finishersNeeded: 3,
    allRoundersPreferred: 3,
    description: "Power hitters prioritized – strike rate > average, no slow starters",
  },
  T5: {
    label: "T5 (5 overs)",
    overs: 5,
    maxPerBowler: 1,
    powerplayOvers: 2,
    middleStart: 3,
    middleEnd: 4,
    deathStart: 5,
    minBowlers: 5,
    aggression: "extreme",
    anchorsNeeded: 0,
    finishersNeeded: 4,
    allRoundersPreferred: 2,
    description: "Pure hitters – minimal bowling depth, maximum aggression",
  },
};

export function getFormatConfig(setup: MatchSetup): FormatConfig {
  if (setup.format === "CUSTOM") {
    const overs = setup.customOvers;
    const mpb = Math.max(1, Math.floor(overs / 5));
    const pp = Math.max(1, Math.round(overs * 0.3));
    return {
      label: `Custom (${overs} overs)`,
      overs,
      maxPerBowler: mpb,
      powerplayOvers: pp,
      middleStart: pp + 1,
      middleEnd: Math.floor(overs * 0.75),
      deathStart: Math.floor(overs * 0.75) + 1,
      minBowlers: Math.min(5, setup.playerCount - 4),
      aggression: overs <= 8 ? "extreme" : overs <= 12 ? "high" : "medium",
      anchorsNeeded: overs >= 15 ? 2 : overs >= 10 ? 1 : 0,
      finishersNeeded: overs <= 10 ? 3 : 2,
      allRoundersPreferred: overs <= 10 ? 3 : 2,
      description: `Custom format – ${overs} overs, max ${mpb} per bowler`,
    };
  }
  return FORMAT_CONFIGS[setup.format];
}

export function getMinBowlersForCount(playerCount: number, format: FormatConfig): number {
  if (playerCount <= 9) return Math.min(4, playerCount - 3);
  if (playerCount === 10) return Math.min(4, format.minBowlers);
  return format.minBowlers;
}

export function getDefaultSetup(): MatchSetup {
  return { format: "T20", customOvers: 20, playerCount: 11, impactSubEnabled: false, impactSubs: [] };
}

export function loadSetup(): MatchSetup {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultSetup();
}

export function saveSetup(setup: MatchSetup) {
  localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

// ── Scoring helpers ──

export function aggressionIndex(playerId: number): number {
  const s = getPlayerStats(playerId);
  if (!s?.batting) return 0;
  return Math.round((s.batting.strike_rate || 0) * 0.6 + (s.batting.sixes || 0) * 4 + (s.batting.fours || 0) * 2);
}

export function stabilityScore(playerId: number): number {
  const s = getPlayerStats(playerId);
  if (!s?.batting) return 0;
  return Math.round((s.batting.average || 0) * 2 + (s.batting.thirties || 0) * 5 + (s.batting.fifties || 0) * 10 + (s.batting.hundreds || 0) * 20);
}

export function finishingPower(playerId: number): number {
  const s = getPlayerStats(playerId);
  if (!s?.batting) return 0;
  return Math.round(
    (s.batting.strike_rate || 0) * 0.5 + (s.batting.not_outs || 0) * 3 + (s.batting.sixes || 0) * 5
  );
}

export function bowlingDepthScore(playerId: number): number {
  const s = getPlayerStats(playerId);
  if (!s?.bowling) return 0;
  const eco = s.bowling.economy || 99;
  return Math.round((s.bowling.wickets || 0) * 5 + Math.max(0, (10 - eco)) * 4 + (s.bowling.three_wickets || 0) * 8);
}

export function deathBowlingStrength(playerId: number): number {
  const s = getPlayerStats(playerId);
  if (!s?.bowling?.wickets) return 0;
  const eco = s.bowling.economy || 99;
  return Math.round((s.bowling.wickets || 0) * 3 + Math.max(0, (12 - eco)) * 5);
}

export function playerFormScore(p: SquadPlayer): number {
  const s = getPlayerStats(p.player_id);
  if (!s) return 0;
  let score = 0;
  if (s.batting?.runs) score += s.batting.runs * 0.2;
  if (s.batting?.average) score += s.batting.average * 1.5;
  if (s.batting?.strike_rate) score += s.batting.strike_rate * 0.3;
  if (s.bowling?.wickets) score += s.bowling.wickets * 4;
  if (s.bowling?.economy) score += Math.max(0, (10 - s.bowling.economy)) * 2;
  if (s.fielding?.catches) score += s.fielding.catches * 2;
  return Math.round(score);
}

// ── Smart XI Generator ──

export interface GeneratedXI {
  label: string;
  description: string;
  players: CombinationPlayer[];
  scores: { aggression: number; stability: number; finishing: number; bowlingDepth: number; deathBowling: number; powerplay: number };
}

export function generateSmartXI(
  squad: SquadPlayer[],
  setup: MatchSetup,
  variant: "balanced" | "aggressive" | "defensive" = "balanced"
): GeneratedXI {
  const config = getFormatConfig(setup);
  const eligible = squad
    .filter((p) => p.active && p.available && p.fitness === "Fit")
    .map((p) => ({ ...p, form: playerFormScore(p), aggr: aggressionIndex(p.player_id), stab: stabilityScore(p.player_id), fin: finishingPower(p.player_id) }));

  const target = setup.playerCount;
  const selected: typeof eligible = [];

  const pick = (pool: typeof eligible, count: number) => {
    for (let i = 0; i < count && pool.length > 0; i++) {
      const best = pool.shift();
      if (best && !selected.some((s) => s.player_id === best.player_id)) {
        selected.push(best);
      }
    }
  };

  // Keepers first
  const keepers = eligible.filter((p) => p.role === "WK").sort((a, b) => b.form - a.form);
  pick(keepers, 1);

  const minBowlers = getMinBowlersForCount(target, config);

  if (variant === "aggressive") {
    const allrounders = eligible.filter((p) => p.role === "ALL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.aggr - a.aggr);
    pick(allrounders, Math.min(config.allRoundersPreferred + 1, allrounders.length));
    const bowlers = eligible.filter((p) => p.role === "BOWL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => bowlingDepthScore(b.player_id) - bowlingDepthScore(a.player_id));
    pick(bowlers, Math.max(0, minBowlers - selected.filter((s) => s.role === "ALL" || s.role === "BOWL").length));
    const batters = eligible.filter((p) => !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.aggr - a.aggr);
    pick(batters, Math.max(0, target - selected.length));
  } else if (variant === "defensive") {
    const bowlers = eligible.filter((p) => p.role === "BOWL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => bowlingDepthScore(b.player_id) - bowlingDepthScore(a.player_id));
    pick(bowlers, Math.min(minBowlers + 1, bowlers.length));
    const allrounders = eligible.filter((p) => p.role === "ALL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.stab - a.stab);
    pick(allrounders, config.allRoundersPreferred);
    const batters = eligible.filter((p) => !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.stab - a.stab);
    pick(batters, Math.max(0, target - selected.length));
  } else {
    const allrounders = eligible.filter((p) => p.role === "ALL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.form - a.form);
    pick(allrounders, config.allRoundersPreferred);
    const bowlers = eligible.filter((p) => p.role === "BOWL" && !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => bowlingDepthScore(b.player_id) - bowlingDepthScore(a.player_id));
    pick(bowlers, Math.max(0, minBowlers - selected.filter((s) => s.role === "ALL" || s.role === "BOWL").length));
    const batters = eligible.filter((p) => !selected.some((s) => s.player_id === p.player_id)).sort((a, b) => b.form - a.form);
    pick(batters, Math.max(0, target - selected.length));
  }

  const final = selected.slice(0, target);

  // Assign batting order
  const sorted = [...final].sort((a, b) => {
    if (a.role === "WK" && b.role !== "WK") return -1;
    if (b.role === "WK" && a.role !== "WK") return 1;
    if (a.role === "BAT" && b.role !== "BAT") return -1;
    if (b.role === "BAT" && a.role !== "BAT") return 1;
    return b.form - a.form;
  });

  const combinationPlayers: CombinationPlayer[] = sorted.map((p, i) => ({
    player_id: p.player_id,
    battingOrder: i + 1,
    bowlingPriority: (p.role === "BOWL" || p.role === "ALL") ? i : 0,
    isCaptain: i === 0,
    isViceCaptain: i === 1,
    isKeeper: p.role === "WK",
    battingPhase: i < 3 ? "top" as const : i < 7 ? "middle" as const : "finisher" as const,
    bowlingPhase: (p.role === "BOWL" || p.role === "ALL") ? (i % 3 === 0 ? "powerplay" as const : i % 3 === 1 ? "middle" as const : "death" as const) : "" as const,
  }));

  const totalAggr = final.reduce((s, p) => s + p.aggr, 0);
  const totalStab = final.reduce((s, p) => s + p.stab, 0);
  const totalFin = final.reduce((s, p) => s + p.fin, 0);
  const bowlIds = final.filter((p) => p.role === "BOWL" || p.role === "ALL");
  const totalBD = bowlIds.reduce((s, p) => s + bowlingDepthScore(p.player_id), 0);
  const totalDeath = bowlIds.reduce((s, p) => s + deathBowlingStrength(p.player_id), 0);

  const labels = { balanced: "Suggested XI", aggressive: "Aggressive XI", defensive: "Defensive XI" };
  const descs = {
    balanced: "Optimal balance of batting, bowling, and fielding based on recent form",
    aggressive: "Maximum strike rate and attacking options prioritized",
    defensive: "Stability, economy, and bowling depth emphasized",
  };

  return {
    label: labels[variant],
    description: descs[variant],
    players: combinationPlayers,
    scores: {
      aggression: totalAggr,
      stability: totalStab,
      finishing: totalFin,
      bowlingDepth: totalBD,
      deathBowling: totalDeath,
      powerplay: Math.round(totalAggr * 0.4 + totalBD * 0.3),
    },
  };
}

// ── Squad / State ──

function inferRole(stats: PlayerStatsEntry, subTitle: string): PlayerRole {
  if (subTitle === "WK") return "WK";
  const batInnings = stats.batting?.innings ?? 0;
  const bowlInnings = stats.bowling?.innings ?? 0;
  if (batInnings > 0 && bowlInnings > 0 && bowlInnings / batInnings > 0.6) return "ALL";
  if (bowlInnings > batInnings) return "BOWL";
  return "BAT";
}

function inferBowlingType(stats: PlayerStatsEntry): BowlingType {
  return (stats.bowling?.innings ?? 0) === 0 ? "N/A" : "Medium";
}

function buildInitialSquad(): SquadPlayer[] {
  return players.map((p) => {
    const stats = playerStats.find((s) => s.player_id === p.player_id);
    return {
      player_id: p.player_id,
      name: p.name,
      slug: p.slug,
      photo: p.profile_pic_url,
      role: inferRole(stats || ({} as PlayerStatsEntry), p.sub_title),
      bowlingType: inferBowlingType(stats || ({} as PlayerStatsEntry)),
      preferredPosition: 0,
      available: true,
      active: true,
      fitness: "Fit" as FitnessStatus,
    };
  });
}

export function loadState(): AdminState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: AdminState = JSON.parse(raw);
      const existingIds = new Set(saved.squad.map((s) => s.player_id));
      for (const p of players) {
        if (!existingIds.has(p.player_id)) {
          const stats = playerStats.find((s) => s.player_id === p.player_id);
          saved.squad.push({
            player_id: p.player_id,
            name: p.name,
            slug: p.slug,
            photo: p.profile_pic_url,
            role: inferRole(stats || ({} as PlayerStatsEntry), p.sub_title),
            bowlingType: inferBowlingType(stats || ({} as PlayerStatsEntry)),
            preferredPosition: 0,
            available: true,
            active: true,
            fitness: "Fit",
          });
        }
      }
      return saved;
    }
  } catch {}
  return { squad: buildInitialSquad(), combinations: [] };
}

export function saveState(state: AdminState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPlayerStats(playerId: number): PlayerStatsEntry | undefined {
  return playerStats.find((s) => s.player_id === playerId);
}

export function getMatches() {
  return matches;
}

// ── Auth ──

export const ADMIN_PASSWORD = "falcons2025";
const AUTH_KEY = "falcons_admin_auth";

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
