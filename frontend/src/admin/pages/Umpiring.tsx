import { useEffect, useMemo, useState } from "react";
import { Gavel, Loader2, Plus, Trash2, Pencil, Check, X, ArrowLeftRight } from "lucide-react";
import {
  fetchAllProfiles,
  fetchDuties,
  createDuty,
  updateDuty,
  deleteDuty,
  fetchPendingSwaps,
  resolveSwapRequest,
  fetchFixtures,
  type Profile,
  type Duty,
  type SwapRequest,
  type Fixture,
} from "@/lib/db";

// Module scope so the select keeps focus across renders.
function MemberSelect({ value, onChange, profiles }: { value: string; onChange: (v: string) => void; profiles: Profile[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
      <option value="">— umpire —</option>
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"}</option>)}
    </select>
  );
}

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const toMin = (t: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const fixtureLabel = (f: Fixture) =>
  f.opponent ? `vs ${f.opponent}` : f.tournament?.name ?? "a match";

// A duty clashes with a Falcons match on the same date. Within 4 hours of the
// match time it's a hard BLOCK; otherwise the same day is a soft WARN.
function dutyConflicts(date: string, time: string, fixtures: Fixture[]) {
  const msgs: { level: "block" | "warn"; text: string }[] = [];
  if (!date) return { block: false, warn: false, msgs };
  for (const f of fixtures) {
    if (f.match_date !== date) continue;
    const dm = toMin(time || null);
    const mm = toMin(f.match_time);
    const at = f.match_time ? ` at ${f.match_time.slice(0, 5)}` : "";
    if (dm != null && mm != null && Math.abs(dm - mm) <= 240) {
      msgs.push({ level: "block", text: `Within 4h of a match ${fixtureLabel(f)}${at}` });
    } else {
      msgs.push({ level: "warn", text: `Same day as a match ${fixtureLabel(f)}${at}` });
    }
  }
  return { block: msgs.some((m) => m.level === "block"), warn: msgs.some((m) => m.level === "warn"), msgs };
}

export default function UmpiringPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create form
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [ump1, setUmp1] = useState("");
  const [ump2, setUmp2] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ duty_date: string; duty_time: string; umpire1: string; umpire2: string; notes: string }>({
    duty_date: "", duty_time: "", umpire1: "", umpire2: "", notes: "",
  });

  const addConflict = useMemo(() => dutyConflicts(date, time, fixtures), [date, time, fixtures]);
  const editConflict = useMemo(() => dutyConflicts(edit.duty_date, edit.duty_time, fixtures), [edit.duty_date, edit.duty_time, fixtures]);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.full_name || "Unnamed"]));
    return (id: string | null) => (id ? m.get(id) ?? "Unknown" : "—");
  }, [profiles]);

  const load = () => {
    setLoading(true);
    Promise.all([fetchAllProfiles(), fetchDuties(), fetchPendingSwaps(), fetchFixtures()])
      .then(([p, d, s, f]) => { setProfiles(p); setDuties(d); setSwaps(s); setFixtures(f); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Fairness: how many duties each member currently holds.
  const tally = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of duties) {
      for (const u of [d.umpire1, d.umpire2]) if (u) counts.set(u, (counts.get(u) ?? 0) + 1);
    }
    return profiles
      .map((p) => ({ name: p.full_name || "Unnamed", count: counts.get(p.id) ?? 0 }))
      .sort((a, b) => a.count - b.count);
  }, [duties, profiles]);

  const addDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!date) return setError("Pick a date.");
    if (ump1 && ump2 && ump1 === ump2) return setError("Choose two different umpires.");
    if (addConflict.block) return setError("This duty is within 4 hours of a Falcons match — pick another time.");
    setSaving(true);
    try {
      await createDuty({ duty_date: date, duty_time: time || null, umpire1: ump1 || null, umpire2: ump2 || null, notes: notes.trim() || null });
      setDate(""); setTime(""); setUmp1(""); setUmp2(""); setNotes("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (d: Duty) => {
    setEditId(d.id);
    setEdit({ duty_date: d.duty_date, duty_time: d.duty_time?.slice(0, 5) ?? "", umpire1: d.umpire1 ?? "", umpire2: d.umpire2 ?? "", notes: d.notes ?? "" });
  };

  const saveEdit = async (id: string) => {
    if (edit.umpire1 && edit.umpire2 && edit.umpire1 === edit.umpire2) return setError("Choose two different umpires.");
    if (editConflict.block) return setError("This duty is within 4 hours of a Falcons match — pick another time.");
    try {
      await updateDuty(id, {
        duty_date: edit.duty_date,
        duty_time: edit.duty_time || null,
        umpire1: edit.umpire1 || null,
        umpire2: edit.umpire2 || null,
        notes: edit.notes.trim() || null,
      });
      setEditId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  };

  const removeDuty = async (id: string) => {
    if (!confirm("Delete this umpiring duty?")) return;
    try { await deleteDuty(id); setDuties((p) => p.filter((d) => d.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  const resolve = async (req: SwapRequest, approve: boolean) => {
    try { await resolveSwapRequest(req, approve); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not resolve."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Gavel className="w-6 h-6 text-falcon-gold" /> Umpiring Duties
      </h1>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Assign */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add a duty
        </h2>
        <form onSubmit={addDuty} className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40"
          />
          <MemberSelect value={ump1} onChange={setUmp1} profiles={profiles} />
          <MemberSelect value={ump2} onChange={setUmp2} profiles={profiles} />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (optional)"
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
          />
          <button
            type="submit"
            disabled={saving || addConflict.block}
            className="px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
          </button>
        </form>
        <p className="mt-2 text-xs text-falcon-cream/40">Umpires are optional — create the slot now and assign people later.</p>
        {addConflict.msgs.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {addConflict.msgs.map((m, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${m.level === "block" ? "text-red-300 bg-red-500/10 border border-red-500/25" : "text-amber-300 bg-amber-500/10 border border-amber-500/20"}`}>
                <X className={`w-3.5 h-3.5 shrink-0 ${m.level === "block" ? "" : "opacity-0"}`} />
                {m.level === "block" ? "Blocked: " : "Heads up: "}{m.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending swaps */}
      {swaps.length > 0 && (
        <div className="bg-[#0d1424] border border-amber-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Pending swap requests ({swaps.length})
          </h2>
          <div className="space-y-2">
            {swaps.map((s) => {
              const duty = duties.find((d) => d.id === s.duty_id);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.02]">
                  <div className="flex-1 text-sm text-falcon-cream/80">
                    <span className="font-medium">{nameOf(s.requested_by)}</span> → <span className="font-medium text-falcon-gold">{nameOf(s.requested_to)}</span>
                    <span className="text-falcon-cream/40"> · {duty ? fmtDate(duty.duty_date) : "duty"}</span>
                    {s.note && <span className="block text-xs text-falcon-cream/40 mt-0.5">“{s.note}”</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resolve(s, true)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => resolve(s, false)} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rota */}
        <div className="lg:col-span-2 bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            Duty rota ({duties.length})
            {duties.filter((d) => !d.umpire1 && !d.umpire2).length > 0 && (
              <span className="text-amber-400/80 normal-case font-medium text-xs">· {duties.filter((d) => !d.umpire1 && !d.umpire2).length} unassigned</span>
            )}
          </h2>
          {loading ? (
            <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-6" />
          ) : duties.length === 0 ? (
            <p className="text-falcon-cream/30 text-sm text-center py-6">No duties yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {duties.map((d) => (
                <div key={d.id} className="px-3 py-3 rounded-lg bg-white/[0.02]">
                  {editId === d.id ? (
                    <div className="space-y-2">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2 items-center">
                        <input type="date" value={edit.duty_date} onChange={(e) => setEdit({ ...edit, duty_date: e.target.value })}
                          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-falcon-cream focus:outline-none focus:border-falcon-gold/40" />
                        <input type="time" value={edit.duty_time} onChange={(e) => setEdit({ ...edit, duty_time: e.target.value })}
                          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-falcon-cream focus:outline-none focus:border-falcon-gold/40" />
                        <MemberSelect value={edit.umpire1} onChange={(v) => setEdit({ ...edit, umpire1: v })} profiles={profiles} />
                        <MemberSelect value={edit.umpire2} onChange={(v) => setEdit({ ...edit, umpire2: v })} profiles={profiles} />
                        <input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Note"
                          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-falcon-cream focus:outline-none focus:border-falcon-gold/40" />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(d.id)} disabled={editConflict.block} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-white/5 text-falcon-cream/50"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {editConflict.msgs.map((m, i) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded ${m.level === "block" ? "text-red-300" : "text-amber-300"}`}>
                          {m.level === "block" ? "Blocked: " : "Heads up: "}{m.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[64px]">
                        <div className="text-falcon-gold font-semibold text-sm">{fmtDate(d.duty_date).split(",")[0]}</div>
                        <div className="text-falcon-cream/40 text-xs">{fmtDate(d.duty_date).split(", ").slice(1).join(" ")}{d.duty_time ? ` · ${d.duty_time.slice(0, 5)}` : ""}</div>
                      </div>
                      <div className="flex-1 text-sm">
                        {!d.umpire1 && !d.umpire2 ? (
                          <button onClick={() => startEdit(d)} className="inline-flex items-center gap-1 text-xs font-medium text-amber-400/90 hover:text-amber-300">
                            <Plus className="w-3.5 h-3.5" /> Assign umpires
                          </button>
                        ) : (
                          <>
                            <span className="text-falcon-cream">{nameOf(d.umpire1)}</span>
                            <span className="text-falcon-cream/30"> & </span>
                            <span className="text-falcon-cream">{nameOf(d.umpire2)}</span>
                          </>
                        )}
                        {d.notes && <span className="block text-xs text-falcon-cream/40">{d.notes}</span>}
                      </div>
                      <button onClick={() => startEdit(d)} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => removeDuty(d.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fairness tally */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Duties per member</h2>
          {tally.length === 0 ? (
            <p className="text-falcon-cream/30 text-sm">No members yet.</p>
          ) : (
            <div className="space-y-1.5">
              {tally.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-white/[0.02]">
                  <span className="text-falcon-cream/80 truncate">{t.name}</span>
                  <span className={`font-semibold ${t.count === 0 ? "text-falcon-cream/30" : "text-falcon-gold"}`}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
