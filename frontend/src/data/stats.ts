import playersData from "@stats/players.json";
import matchesData from "@stats/matches.json";
import teamStatsData from "@stats/team_stats.json";
import leaderboardData from "@stats/leaderboard.json";
import playerStatsData from "@stats/player_stats.json";

export interface Player {
  player_id: number;
  name: string;
  slug: string;
  sub_title: string;
  profile_url: string;
  profile_pic_url: string;
}

export interface Match {
  tournament: string;
  info: string;
  score: string[];
  result: string;
  url: string;
  date: string;
  venue: string;
}

export interface TeamStat {
  label: string;
  value: string;
}

export interface LeaderboardEntry {
  player_name: string;
  stat: string;
  profile: string;
}

export interface Leaderboard {
  batting: LeaderboardEntry[];
  bowling: LeaderboardEntry[];
  fielding: LeaderboardEntry[];
}

export interface BattingStats {
  innings: number;
  runs: number;
  balls_faced: number;
  highest_score: number;
  highest_score_not_out: string;
  average: number;
  strike_rate: number;
  not_outs: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
}

export interface BowlingStats {
  innings: number;
  wickets: number;
  overs: string;
  runs_conceded: number;
  best_figures: number;
  economy: number;
  average: number;
  strike_rate: number;
  maidens: number;
}

export interface FieldingStats {
  matches: number;
  catches: number;
  caught_behind: number;
  run_outs: number;
  assisted_run_outs: number;
  stumpings: number;
  caught_and_bowled: number;
  total_dismissals: number;
}

export interface PlayerStatsEntry {
  player_id: number;
  name: string;
  slug: string;
  profile_photo: string;
  batting: Partial<BattingStats>;
  bowling: Partial<BowlingStats>;
  fielding: Partial<FieldingStats>;
}

export const players: Player[] = playersData;
export const matches: Match[] = matchesData;
export const teamStats: TeamStat[] = teamStatsData;
export const leaderboard: Leaderboard = leaderboardData;
export const playerStats: PlayerStatsEntry[] = playerStatsData;

export function getPlayerStats(name: string): PlayerStatsEntry | undefined {
  return playerStats.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

export function getPlayerBySlug(slug: string): PlayerStatsEntry | undefined {
  return playerStats.find((p) => p.slug === slug);
}

export function getRosterPlayer(slug: string): Player | undefined {
  return players.find((p) => p.slug === slug);
}

export function isWin(match: Match): boolean {
  const result = match.result.toLowerCase();
  return (
    result.includes("falcons won") ||
    result.includes("hsc falcons won") ||
    result.includes("helenelund cricket club won")
  );
}

export function isLoss(match: Match): boolean {
  const result = match.result.toLowerCase();
  return !isWin(match) && !result.includes("tie") && !result.includes("abandon");
}
