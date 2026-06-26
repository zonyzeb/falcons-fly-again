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
    .select("id, duty_date, umpire1, umpire2, notes")
    .order("duty_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Duty[];
}

export async function fetchMyDuties(userId: string): Promise<Duty[]> {
  const { data, error } = await supabase
    .from("umpiring_duties")
    .select("id, duty_date, umpire1, umpire2, notes")
    .or(`umpire1.eq.${userId},umpire2.eq.${userId}`)
    .order("duty_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Duty[];
}

export async function createDuty(input: {
  duty_date: string;
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
