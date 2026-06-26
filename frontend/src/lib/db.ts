import { supabase } from "@/lib/supabase";

export type MemberRole = "member" | "admin";
export type AvailStatus = "available" | "unavailable" | "maybe";
export type FitnessStatus = "Fit" | "Doubtful" | "Injured" | "Recovering";

export interface Profile {
  id: string;
  full_name: string | null;
  role: MemberRole;
  player_id: number | null;
  created_at?: string;
}

export interface AvailabilityRow {
  user_id: string;
  player_id: number | null;
  status: AvailStatus;
  fitness: FitnessStatus;
  note: string | null;
  updated_at?: string;
}

// ── profiles ──

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, player_id, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, player_id, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateOwnName(userId: string, full_name: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", userId);
  if (error) throw error;
}

/** Admin-only (enforced by RLS): set a member's role + linked player. */
export async function adminUpdateProfile(
  id: string,
  patch: { role?: MemberRole; player_id?: number | null; full_name?: string }
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

// ── availability ──

export async function fetchMyAvailability(userId: string): Promise<AvailabilityRow | null> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as AvailabilityRow | null;
}

export async function upsertMyAvailability(row: AvailabilityRow) {
  const { error } = await supabase
    .from("availability")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchAllAvailability(): Promise<AvailabilityRow[]> {
  const { data, error } = await supabase.from("availability").select("*");
  if (error) throw error;
  return (data ?? []) as AvailabilityRow[];
}

// ── umpiring duties ──

export interface Duty {
  id: string;
  duty_date: string; // YYYY-MM-DD
  duty_time: string | null; // HH:MM[:SS]
  umpire1: string | null;
  umpire2: string | null;
  notes: string | null;
}

export type SwapStatus = "pending" | "approved" | "declined" | "cancelled";

export interface SwapRequest {
  id: string;
  duty_id: string;
  slot: 1 | 2;
  requested_by: string;
  requested_to: string;
  note: string | null;
  status: SwapStatus;
  created_at?: string;
}

export async function fetchDuties(): Promise<Duty[]> {
  const { data, error } = await supabase
    .from("umpiring_duties")
    .select("id, duty_date, duty_time, umpire1, umpire2, notes")
    .order("duty_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Duty[];
}

export async function fetchMyDuties(userId: string): Promise<Duty[]> {
  const { data, error } = await supabase
    .from("umpiring_duties")
    .select("id, duty_date, duty_time, umpire1, umpire2, notes")
    .or(`umpire1.eq.${userId},umpire2.eq.${userId}`)
    .order("duty_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Duty[];
}

export async function createDuty(input: {
  duty_date: string;
  duty_time?: string | null;
  umpire1: string | null;
  umpire2: string | null;
  notes?: string | null;
}) {
  const { error } = await supabase.from("umpiring_duties").insert(input);
  if (error) throw error;
}

export async function updateDuty(id: string, patch: Partial<Omit<Duty, "id">>) {
  const { error } = await supabase.from("umpiring_duties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDuty(id: string) {
  const { error } = await supabase.from("umpiring_duties").delete().eq("id", id);
  if (error) throw error;
}

// ── swap requests ──

export async function createSwapRequest(input: {
  duty_id: string;
  slot: 1 | 2;
  requested_by: string;
  requested_to: string;
  note?: string | null;
}) {
  const { error } = await supabase.from("duty_swap_requests").insert(input);
  if (error) throw error;
}

export async function fetchPendingSwaps(): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from("duty_swap_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SwapRequest[];
}

export async function fetchMySwaps(userId: string): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from("duty_swap_requests")
    .select("*")
    .eq("requested_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SwapRequest[];
}

export async function cancelSwapRequest(id: string) {
  const { error } = await supabase
    .from("duty_swap_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}

/** Admin: approve (reassign the slot) or decline a swap request. */
export async function resolveSwapRequest(req: SwapRequest, approve: boolean) {
  if (approve) {
    const slotCol = req.slot === 1 ? "umpire1" : "umpire2";
    const { error: dErr } = await supabase
      .from("umpiring_duties")
      .update({ [slotCol]: req.requested_to })
      .eq("id", req.duty_id);
    if (dErr) throw dErr;
  }
  const { error } = await supabase
    .from("duty_swap_requests")
    .update({ status: approve ? "approved" : "declined", resolved_at: new Date().toISOString() })
    .eq("id", req.id);
  if (error) throw error;
}

// ── tournaments ──

export interface Tournament {
  id: string;
  name: string;
  format: string | null;
  season: number | null;
  start_date: string | null;
  fee_sek: number | null;
  paid_by: string | null; // auth user id of the member who paid
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, format, season, start_date, fee_sek, paid_by")
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tournament[];
}

export async function createTournament(input: Omit<Tournament, "id">) {
  const { error } = await supabase.from("tournaments").insert(input);
  if (error) throw error;
}

export async function updateTournament(id: string, patch: Partial<Omit<Tournament, "id">>) {
  const { error } = await supabase.from("tournaments").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTournament(id: string) {
  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) throw error;
}

// ── fixtures (matches within a tournament) ──

export interface Fixture {
  id: string;
  tournament_id: string;
  opponent: string | null;
  match_date: string; // YYYY-MM-DD
  match_time: string | null; // HH:MM[:SS]
  ground: string | null;
  notes: string | null;
  tournament?: Tournament | null; // joined
}

const FIXTURE_SELECT =
  "id, tournament_id, opponent, match_date, match_time, ground, notes, tournament:tournaments(id, name, format, season, start_date)";

export type MatchAvailStatus = "available" | "maybe" | "unavailable";

export interface MatchAvailability {
  id: string;
  fixture_id: string;
  player_id: number;
  status: MatchAvailStatus;
  set_by: string | null;
}

export async function fetchFixtures(): Promise<Fixture[]> {
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as unknown as Fixture[];
}

/** Upcoming fixtures (today onward) — used by the public site. */
export async function fetchUpcomingFixtures(): Promise<Fixture[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("fixtures")
    .select(FIXTURE_SELECT)
    .gte("match_date", today)
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as unknown as Fixture[];
}

export type FixtureInput = {
  tournament_id: string;
  opponent: string | null;
  match_date: string;
  match_time: string | null;
  ground: string | null;
  notes: string | null;
};

export async function createFixture(input: FixtureInput) {
  const { error } = await supabase.from("fixtures").insert(input);
  if (error) throw error;
}

export async function updateFixture(id: string, patch: Partial<FixtureInput>) {
  const { error } = await supabase.from("fixtures").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFixture(id: string) {
  const { error } = await supabase.from("fixtures").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFixtureAvailability(fixtureId: string): Promise<MatchAvailability[]> {
  const { data, error } = await supabase
    .from("match_availability")
    .select("id, fixture_id, player_id, status, set_by")
    .eq("fixture_id", fixtureId);
  if (error) throw error;
  return (data ?? []) as MatchAvailability[];
}

/** Availability rows for a given player across all fixtures (member's own view). */
export async function fetchPlayerAvailability(playerId: number): Promise<MatchAvailability[]> {
  const { data, error } = await supabase
    .from("match_availability")
    .select("id, fixture_id, player_id, status, set_by")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data ?? []) as MatchAvailability[];
}

/** Upsert a player's availability for a fixture (member sets own, or admin sets anyone). */
export async function setMatchAvailability(input: {
  fixture_id: string;
  player_id: number;
  status: MatchAvailStatus;
  set_by: string | null;
}) {
  const { error } = await supabase
    .from("match_availability")
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "fixture_id,player_id" });
  if (error) throw error;
}

// ── invites (serverless) ──

export async function inviteMember(input: {
  email: string;
  full_name?: string;
  role?: MemberRole;
  player_id?: number | null;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in.");

  const res = await fetch("/api/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Invite failed.");
}
