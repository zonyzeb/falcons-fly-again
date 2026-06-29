import { useCallback, useEffect, useState } from "react";
import { fetchSquad, upsertSquadPlayer, type SquadRow } from "@/lib/db";
import { buildSquad } from "@/admin/store";
import type { SquadPlayer } from "@/admin/store";

type EditablePatch = Partial<Pick<SquadPlayer, "role" | "bowlingType" | "active" | "fitness" | "preferredPosition">>;

/**
 * Cloud-backed squad. Returns the merged squad (roster + cloud overrides),
 * loading/error state, and an updatePlayer that upserts a player's attributes.
 */
export function useSquad() {
  const [rows, setRows] = useState<SquadRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchSquad().then(setRows).catch((e) => setError(e instanceof Error ? e.message : "Failed to load squad."));
  }, []);
  useEffect(() => { load(); }, [load]);

  const squad = buildSquad(rows ?? []);

  const updatePlayer = useCallback(async (player_id: number, patch: EditablePatch) => {
    const dbPatch = {
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.bowlingType !== undefined ? { bowling_type: patch.bowlingType } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      ...(patch.fitness !== undefined ? { fitness: patch.fitness } : {}),
      ...(patch.preferredPosition !== undefined ? { preferred_position: patch.preferredPosition } : {}),
    };
    setError("");
    // optimistic
    setRows((prev) => {
      const list = prev ? [...prev] : [];
      const i = list.findIndex((r) => r.player_id === player_id);
      const base: SquadRow = list[i] ?? { player_id, role: null, bowling_type: null, active: true, fitness: "Fit", preferred_position: 0 };
      const next = { ...base, ...dbPatch };
      if (i >= 0) list[i] = next; else list.push(next);
      return list;
    });
    try {
      await upsertSquadPlayer(player_id, dbPatch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save change.");
      load(); // revert to server state
    }
  }, [load]);

  return { squad, loading: rows === null, error, updatePlayer, refresh: load };
}
