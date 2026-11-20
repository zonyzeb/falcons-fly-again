import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Loader2, Plus, Trash2, Pencil, Check, X, ChevronDown, Users, Car, HandHelping, Bell, Wallet } from "lucide-react";
import { players } from "@/data/stats";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchTrainingSessions, createTrainingSession, updateTrainingSession, deleteTrainingSession,
  fetchTrainingAvailability, setTrainingAvailability, setTrainingPaid, fetchAllProfiles, sendNotification,
  type TrainingSession, type TrainingAvailability, type MatchAvailStatus, type Profile,
} from "@/lib/db";

const playerName = (pid: number) => players.find((p) => p.player_id === pid)?.name ?? `#${pid}`;
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

const STATUSES: { key: MatchAvailStatus; label: string; active: string }[] = [
  { key: "available", label: "In", active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  { key: "maybe", label: "Maybe", active: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  { key: "unavailable", label: "Out", active: "bg-red-500/15 border-red-500/40 text-red-300" },
];

const EMPTY = { title: "", session_date: "", start_time: "", end_time: "", location: "", cost_sek: "", paid_by: "", notes: "", auto_remind: true };
type Form = typeof EMPTY;

function Field({ ph, type = "text", val, on }: { ph: string; type?: string; val: string; on: (v: string) => void }) {
  return (
    <input type={type} value={val} onChange={(e) => on(e.target.value)} placeholder={ph}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
  );
}

export default function TrainingPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Form>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Form>({ ...EMPTY });

  const [openId, setOpenId] = useState<string | null>(null);
  const [avail, setAvail] = useState<Record<string, TrainingAvailability[]>>({});
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchTrainingSessions(), fetchAllProfiles()])
      .then(([s, p]) => { setSessions(s); setProfiles(p); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.full_name || "Unnamed"]));
    return (id: string | null) => (id ? m.get(id) ?? "Unknown" : null);
  }, [profiles]);

  const clean = (v: Form) => ({
    title: v.title.trim() || null,
    session_date: v.session_date,
    start_time: v.start_time || null,
    end_time: v.end_time || null,
    location: v.location.trim() || null,
    cost_sek: v.cost_sek ? parseInt(v.cost_sek, 10) : null,
    paid_by: v.paid_by || null,
    notes: v.notes.trim() || null,
    auto_remind: v.auto_remind,
  });
  const toForm = (s: TrainingSession): Form => ({
    title: s.title ?? "", session_date: s.session_date, start_time: s.start_time?.slice(0, 5) ?? "",
    end_time: s.end_time?.slice(0, 5) ?? "", location: s.location ?? "", cost_sek: s.cost_sek?.toString() ?? "",
    paid_by: s.paid_by ?? "", notes: s.notes ?? "", auto_remind: s.auto_remind,
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.session_date) return setError("Date is required.");
    setSaving(true);
    try { await createTrainingSession(clean(form)); setForm({ ...EMPTY }); setShowNew(false); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add session."); }
    finally { setSaving(false); }
  };
  const save = async (id: string) => {
    if (!edit.session_date) return setError("Date is required.");
    try { await updateTrainingSession(id, clean(edit)); setEditId(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this training session? Responses, lifts and payment records for it will be removed too.")) return;
    try { await deleteTrainingSession(id); setSessions((p) => p.filter((s) => s.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  const toggle = async (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (!avail[id]) {
      try { const rows = await fetchTrainingAvailability(id); setAvail((m) => ({ ...m, [id]: rows })); }
      catch (err) { setError(err instanceof Error ? err.message : "Could not load responses."); }
    }
  };
  const setStatus = async (sessionId: string, playerId: number, status: MatchAvailStatus) => {
    try {
      await setTrainingAvailability({ session_id: sessionId, player_id: playerId, status, set_by: user?.id ?? null });
      setAvail((m) => {
        const existing = (m[sessionId] ?? []).find((r) => r.player_id === playerId);
        const next: TrainingAvailability = existing
          ? { ...existing, status }
          : { id: "", session_id: sessionId, player_id: playerId, status, pickup: "none", pickup_seats: null, pickup_area: null, paid: false, paid_at: null, set_by: user?.id ?? null };
        return { ...m, [sessionId]: [...(m[sessionId] ?? []).filter((r) => r.player_id !== playerId), next] };
      });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not set status."); }
  };
  const togglePaid = async (sessionId: string, playerId: number, paid: boolean) => {
    try {
      await setTrainingPaid(sessionId, playerId, paid);
      setAvail((m) => ({ ...m, [sessionId]: (m[sessionId] ?? []).map((r) => r.player_id === playerId ? { ...r, paid, paid_at: paid ? new Date().toISOString() : null } : r) }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update payment."); }
  };

  const remind = async (s: TrainingSession) => {
    setRemindingId(s.id); setError(""); setNote("");
    const label = `${s.title ? s.title + " · " : ""}${fmtDate(s.session_date)}${s.start_time ? " " + s.start_time.slice(0, 5) : ""}`;
    try {
      const res = await sendNotification({ kind: "training", scope: "pending", sessionId: s.id, sessionLabel: label });
      setNote(res.sent ? `Reminder sent to ${res.sent} player${res.sent !== 1 ? "s" : ""} who hadn't responded.` : (res.note || "Everyone has already responded."));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send reminders."); }
    finally { setRemindingId(null); }
  };

  const formGrid = (v: Form, set: (f: Form) => void, isEdit: boolean) => (
    <>
      <Field ph="Title (e.g. Nets)" val={v.title} on={(x) => set({ ...v, title: x })} />
      <Field ph="Location" val={v.location} on={(x) => set({ ...v, location: x })} />
      <Field ph="Date *" type="date" val={v.session_date} on={(x) => set({ ...v, session_date: x })} />
      <Field ph="Start" type="time" val={v.start_time} on={(x) => set({ ...v, start_time: x })} />
      <Field ph="End" type="time" val={v.end_time} on={(x) => set({ ...v, end_time: x })} />
      <Field ph="Cost (SEK)" type="number" val={v.cost_sek} on={(x) => set({ ...v, cost_sek: x })} />
      <select value={v.paid_by} onChange={(e) => set({ ...v, paid_by: e.target.value })}
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
        <option value="">Paid by…</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"}</option>)}
      </select>
      <Field ph="Notes" val={v.notes} on={(x) => set({ ...v, notes: x })} />
      <label className="flex items-center gap-2 text-sm text-falcon-cream/70 px-1">
        <input type="checkbox" checked={v.auto_remind} onChange={(e) => set({ ...v, auto_remind: e.target.checked })}
          className="w-4 h-4 accent-falcon-gold" />
        Auto-remind players who haven't responded
      </label>
      <div className="flex gap-2 lg:col-span-3">
        {isEdit ? (
          <>
            <button onClick={() => save(editId!)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
            <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
          </>
        ) : (
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add session
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-falcon-gold" /> Training
        </h1>
        <button onClick={() => { setShowNew((s) => !s); setEditId(null); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-falcon-gold/10 text-falcon-gold border border-falcon-gold/20 hover:bg-falcon-gold/15 shrink-0">
          <Plus className="w-3.5 h-3.5" /> New session
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      {note && <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{note}</p>}

      {showNew && (
        <form onSubmit={add} className="bg-[#0d1424] border border-white/5 rounded-xl p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formGrid(form, setForm, false)}
        </form>
      )}

      {loading ? (
        <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-8" />
      ) : sessions.length === 0 ? (
        <p className="text-falcon-cream/50 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No training sessions yet — add one above.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const rows = avail[s.id] ?? [];
            const available = rows.filter((r) => r.status === "available");
            const share = s.cost_sek != null && available.length > 0 ? Math.round(s.cost_sek / available.length) : null;
            const paidCount = available.filter((r) => r.paid).length;
            const offers = rows.filter((r) => r.pickup === "offer");
            const needs = rows.filter((r) => r.pickup === "need");
            const byStatus = (st: MatchAvailStatus) => rows.filter((r) => r.status === st).length;

            return (
              <div key={s.id} className="bg-[#0d1424] border border-white/5 rounded-xl overflow-hidden">
                {editId === s.id ? (
                  <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{formGrid(edit, setEdit, true)}</div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
                    <div className="text-center min-w-[52px] sm:min-w-[60px]">
                      <div className="text-falcon-gold font-semibold text-sm">{fmtDate(s.session_date).split(",")[0]}</div>
                      <div className="text-falcon-cream/40 text-xs">{fmtDate(s.session_date).split(", ")[1]}{s.start_time ? ` · ${s.start_time.slice(0, 5)}` : ""}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-falcon-cream text-sm font-medium truncate">{s.title || "Training"}</div>
                      <div className="text-xs text-falcon-cream/40 truncate">
                        {[s.location, s.cost_sek != null ? `${s.cost_sek} kr` : null, s.auto_remind ? null : "auto-remind off", s.notes].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button onClick={() => remind(s)} disabled={remindingId === s.id} title="Remind players who haven't responded"
                      className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 text-falcon-cream/60 hover:text-falcon-gold hover:border-falcon-gold/30 flex items-center gap-1.5 shrink-0 disabled:opacity-50">
                      {remindingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} <span className="hidden sm:inline">Remind</span>
                    </button>
                    <button onClick={() => toggle(s.id)} className="px-2 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 text-falcon-cream/60 hover:text-falcon-gold hover:border-falcon-gold/30 flex items-center gap-1.5 shrink-0">
                      <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Responses</span> <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openId === s.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => { setEditId(s.id); setEdit(toForm(s)); setShowNew(false); }} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}

                {openId === s.id && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-emerald-400">{byStatus("available")} in</span>
                      <span className="text-amber-400">{byStatus("maybe")} maybe</span>
                      <span className="text-red-400">{byStatus("unavailable")} out</span>
                      <span className="text-falcon-cream/30">{players.length - rows.length} no response</span>
                    </div>

                    {/* Cost split + payments */}
                    {s.cost_sek != null && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-falcon-cream/70 mb-2">
                          <Wallet className="w-4 h-4 text-falcon-gold/70" />
                          {share != null
                            ? <>Split {s.cost_sek} kr ÷ {available.length} in = <b className="text-falcon-cream">{share} kr</b> each · {paidCount}/{available.length} paid ({paidCount * share} / {share * available.length} kr){s.paid_by ? ` · fronted by ${nameOf(s.paid_by)}` : ""}</>
                            : <>Cost {s.cost_sek} kr — splits once players mark themselves in.</>}
                        </div>
                        {available.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {available.map((r) => (
                              <button key={r.player_id} onClick={() => togglePaid(s.id, r.player_id, !r.paid)}
                                className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${r.paid ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "border-white/10 text-falcon-cream/50 hover:text-falcon-cream/80"}`}>
                                {r.paid && <Check className="w-3 h-3 inline mr-0.5" />}{playerName(r.player_id)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Carpool */}
                    {(offers.length > 0 || needs.length > 0) && (
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-cyan-300/80 font-medium mb-1 flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Offering lifts</div>
                          {offers.length === 0 ? <p className="text-falcon-cream/30">—</p> : offers.map((o) => (
                            <p key={o.player_id} className="text-falcon-cream/60">{playerName(o.player_id)}{o.pickup_seats ? ` · ${o.pickup_seats} seats` : ""}{o.pickup_area ? ` · ${o.pickup_area}` : ""}</p>
                          ))}
                        </div>
                        <div>
                          <div className="text-amber-300/80 font-medium mb-1 flex items-center gap-1"><HandHelping className="w-3.5 h-3.5" /> Need a lift</div>
                          {needs.length === 0 ? <p className="text-falcon-cream/30">—</p> : needs.map((o) => (
                            <p key={o.player_id} className="text-falcon-cream/60">{playerName(o.player_id)}{o.pickup_area ? ` · ${o.pickup_area}` : ""}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-player status grid */}
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                      {players.map((p) => {
                        const cur = rows.find((r) => r.player_id === p.player_id)?.status;
                        return (
                          <div key={p.player_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02]">
                            <span className="flex-1 text-sm text-falcon-cream/80 truncate">{p.name}</span>
                            {STATUSES.map((st) => (
                              <button key={st.key} onClick={() => setStatus(s.id, p.player_id, st.key)}
                                className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${cur === st.key ? st.active : "border-white/10 text-falcon-cream/40 hover:text-falcon-cream/70"}`}>{st.label}</button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
