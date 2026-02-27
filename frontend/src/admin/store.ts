import { players, playerStats, matches } from "@/data/stats";
import type { PlayerStatsEntry } from "@/data/stats";

const STORAGE_KEY = "falcons_admin";

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
}

export interface TeamCombination {
  id: string;
  name: string;
  created: string;
  players: CombinationPlayer[];
  notes: string;
}

export interface AdminState {
  squad: SquadPlayer[];
  combinations: TeamCombination[];
}

function inferRole(stats: PlayerStatsEntry, subTitle: string): PlayerRole {
  if (subTitle === "WK") return "WK";
  const bat = stats.batting;
  const bowl = stats.bowling;
  const batInnings = bat?.innings ?? 0;
  const bowlInnings = bowl?.innings ?? 0;
  if (batInnings > 0 && bowlInnings > 0) {
    const ratio = bowlInnings / batInnings;
    if (ratio > 0.6) return "ALL";
  }
  if (bowlInnings > batInnings) return "BOWL";
  if (batInnings > 0) return "BAT";
  return "BAT";
}

function inferBowlingType(stats: PlayerStatsEntry): BowlingType {
  const bowlInnings = stats.bowling?.innings ?? 0;
  if (bowlInnings === 0) return "N/A";
  return "Medium";
}

function buildInitialSquad(): SquadPlayer[] {
  return players.map((p) => {
    const stats = playerStats.find((s) => s.player_id === p.player_id);
    const role = inferRole(stats || ({} as PlayerStatsEntry), p.sub_title);
    return {
      player_id: p.player_id,
      name: p.name,
      slug: p.slug,
      photo: p.profile_pic_url,
      role,
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
