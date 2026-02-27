import { useState, useMemo } from "react";
import { Users, LayoutGrid, List, Search, Check, X, Heart, ChevronDown } from "lucide-react";
import { loadState, saveState, getPlayerStats } from "@/admin/store";
import type { SquadPlayer, PlayerRole, BowlingType, FitnessStatus } from "@/admin/store";

const ROLES: { value: PlayerRole; label: string; color: string }[] = [
  { value: "BAT", label: "Batsman", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "BOWL", label: "Bowler", color: "bg-rose-500/20 text-rose-400" },
  { value: "ALL", label: "All-rounder", color: "bg-violet-500/20 text-violet-400" },
  { value: "WK", label: "Keeper", color: "bg-cyan-500/20 text-cyan-400" },
];

const BOWLING_TYPES: BowlingType[] = ["Fast", "Medium", "Spin", "N/A"];
const FITNESS: { value: FitnessStatus; color: string }[] = [
  { value: "Fit", color: "text-emerald-400" },
  { value: "Doubtful", color: "text-amber-400" },
  { value: "Injured", color: "text-red-400" },
  { value: "Recovering", color: "text-cyan-400" },
];

function RoleBadge({ role }: { role: PlayerRole }) {
  const r = ROLES.find((x) => x.value === role)!;
  return <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.color}`}>{r.label}</span>;
}

export default function SquadPage() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const squad = useMemo(() => {
    const q = search.toLowerCase();
    return state.squad.filter((p) => p.name.toLowerCase().includes(q));
  }, [state.squad, search]);

  const updatePlayer = (id: number, updates: Partial<SquadPlayer>) => {
    const next = {
      ...state,
      squad: state.squad.map((p) => (p.player_id === id ? { ...p, ...updates } : p)),
    };
    setState(next);
    saveState(next);
  };

  const counts = useMemo(() => {
    const active = state.squad.filter((p) => p.active);
    return {
      total: state.squad.length,
      active: active.length,
      available: active.filter((p) => p.available).length,
      fit: active.filter((p) => p.fitness === "Fit").length,
    };
  }, [state.squad]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
            <Users className="w-6 h-6 text-falcon-gold" /> Squad Management
          </h1>
          <p className="text-falcon-cream/40 text-sm mt-1">{counts.total} players · {counts.available} available · {counts.fit} fit</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-falcon-cream/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40 w-48"
            />
          </div>
          <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button onClick={() => setView("table")} className={`p-2 rounded-md transition-colors ${view === "table" ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/40 hover:text-falcon-cream"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView("card")} className={`p-2 rounded-md transition-colors ${view === "card" ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/40 hover:text-falcon-cream"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {view === "table" && (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-falcon-cream/40 text-left">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Bowling</th>
                <th className="px-4 py-3 font-medium">Fitness</th>
                <th className="px-4 py-3 font-medium text-center">Available</th>
                <th className="px-4 py-3 font-medium text-center">Active</th>
                <th className="px-4 py-3 font-medium">Bat Pos</th>
                <th className="px-4 py-3 font-medium">Stats</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => {
                const stats = getPlayerStats(p.player_id);
                const isEditing = editId === p.player_id;
                return (
                  <tr
                    key={p.player_id}
                    onClick={() => setEditId(isEditing ? null : p.player_id)}
                    className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${!p.active ? "opacity-40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.photo && !p.photo.includes("default") ? (
                          <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold text-xs font-bold">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-falcon-cream font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={p.role}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updatePlayer(p.player_id, { role: e.target.value as PlayerRole })}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-falcon-cream text-xs focus:outline-none"
                        >
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <RoleBadge role={p.role} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={p.bowlingType}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updatePlayer(p.player_id, { bowlingType: e.target.value as BowlingType })}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-falcon-cream text-xs focus:outline-none"
                        >
                          {BOWLING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <span className="text-falcon-cream/60">{p.bowlingType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={p.fitness}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updatePlayer(p.player_id, { fitness: e.target.value as FitnessStatus })}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-falcon-cream text-xs focus:outline-none"
                        >
                          {FITNESS.map((f) => <option key={f.value} value={f.value}>{f.value}</option>)}
                        </select>
                      ) : (
                        <span className={`flex items-center gap-1.5 ${FITNESS.find((f) => f.value === p.fitness)?.color}`}>
                          <Heart className="w-3 h-3" /> {p.fitness}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); updatePlayer(p.player_id, { available: !p.available }); }}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${p.available ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-white/10 text-white/20"}`}
                      >
                        {p.available && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); updatePlayer(p.player_id, { active: !p.active }); }}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${p.active ? "bg-falcon-gold/20 border-falcon-gold/40 text-falcon-gold" : "border-white/10 text-white/20"}`}
                      >
                        {p.active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number" min={0} max={11}
                          value={p.preferredPosition || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updatePlayer(p.player_id, { preferredPosition: parseInt(e.target.value) || 0 })}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-falcon-cream text-xs w-14 focus:outline-none"
                          placeholder="–"
                        />
                      ) : (
                        <span className="text-falcon-cream/50">{p.preferredPosition || "–"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-falcon-cream/40 text-xs">
                      {stats?.batting?.matches || 0}m · {stats?.batting?.runs || 0}r · {stats?.bowling?.wickets || 0}w
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {squad.map((p) => {
            const stats = getPlayerStats(p.player_id);
            return (
              <div
                key={p.player_id}
                className={`bg-[#0d1424] border border-white/5 rounded-xl p-4 transition-all hover:border-falcon-gold/20 ${!p.active ? "opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {p.photo && !p.photo.includes("default") ? (
                      <img src={p.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold font-bold">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-falcon-cream font-medium text-sm">{p.name}</h3>
                      <RoleBadge role={p.role} />
                    </div>
                  </div>
                  <span className={`text-xs flex items-center gap-1 ${FITNESS.find((f) => f.value === p.fitness)?.color}`}>
                    <Heart className="w-3 h-3" /> {p.fitness}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-falcon-cream/40 mb-3">
                  <span>{p.bowlingType}</span>
                  <span>{stats?.batting?.matches || 0} matches</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-white/5 rounded-lg py-1.5">
                    <div className="text-falcon-cream font-semibold">{stats?.batting?.runs || 0}</div>
                    <div className="text-falcon-cream/30">Runs</div>
                  </div>
                  <div className="bg-white/5 rounded-lg py-1.5">
                    <div className="text-falcon-cream font-semibold">{stats?.bowling?.wickets || 0}</div>
                    <div className="text-falcon-cream/30">Wkts</div>
                  </div>
                  <div className="bg-white/5 rounded-lg py-1.5">
                    <div className="text-falcon-cream font-semibold">{stats?.fielding?.catches || 0}</div>
                    <div className="text-falcon-cream/30">Catches</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePlayer(p.player_id, { available: !p.available })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.available ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-falcon-cream/30 border border-white/10"}`}
                  >
                    {p.available ? "Available" : "Unavailable"}
                  </button>
                  <button
                    onClick={() => updatePlayer(p.player_id, { active: !p.active })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.active ? "bg-falcon-gold/15 text-falcon-gold border border-falcon-gold/30" : "bg-white/5 text-falcon-cream/30 border border-white/10"}`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
