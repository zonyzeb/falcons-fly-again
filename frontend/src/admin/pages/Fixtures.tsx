import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Loader2, Plus, Trash2, Pencil, Check, X, ChevronDown, Users } from "lucide-react";
import { players } from "@/data/stats";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchFixtures, createFixture, updateFixture, deleteFixture,
  fetchFixtureAvailability, setMatchAvailability, fetchTournaments,
  type Fixture, type MatchAvailability, type MatchAvailStatus, type Tournament,
} from "@/lib/db";

const STATUSES: { key: MatchAvailStatus; label: string; active: string }[] = [
  { key: "available",   label: "Available",   active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  { key: "maybe",       label: "Maybe",       active: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  { key: "unavailable", label: "Unavailable", active: "bg-red-500/15 border-red-500/40 text-red-300" },
];

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

const EMPTY = { tournament_id: "", opponent: "", match_date: "", match_time: "", ground: "", notes: "" };

export default function FixturesPage() {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ ...EMPTY });

  const [openId, setOpenId] = useState<string | null>(null);
  const [avail, setAvail] = useState<Record<string, MatchAvailability[]>>({});

  const load = () => {
    setLoading(true);
    Promise.all([fetchFixtures(), fetchTournaments()])
      .then(([f, t]) => { setFixtures(f); setTournaments(t); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toForm = (f: Fixture) => ({
    tournament_id: f.tournament_id, opponent: f.opponent ?? "", match_date: f.match_date,
    match_time: f.match_time?.slice(0, 5) ?? "", ground: f.ground ?? "", notes: f.notes ?? "",
  });

  const clean = (v: typeof EMPTY) => ({
    tournament_id: v.tournament_id,
    opponent: v.opponent.trim() || null,
    match_date: v.match_date,
    match_time: v.match_time || null,
    ground: v.ground.trim() || null,
    notes: v.notes.trim() || null,
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.tournament_id) return setError("Pick a tournament.");
    if (!form.match_date) return setError("Date is required.");
    setSaving(true);
    try { await createFixture(clean(form)); setForm({ ...EMPTY }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add fixture."); }
    finally { setSaving(false); }
  };

  const saveEdit = async (id: string) => {
    if (!edit.tournament_id || !edit.match_date) return setError("Tournament and date are required.");
    try { await updateFixture(id, clean(edit)); setEditId(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };

  const remove = async (id: string) => {
    try { await deleteFixture(id); setFixtures((p) => p.filter((f) => f.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  const toggleAvail = async (fixtureId: string) => {
    if (openId === fixtureId) { setOpenId(null); return; }
    setOpenId(fixtureId);
    if (!avail[fixtureId]) {
      try {
        const rows = await fetchFixtureAvailability(fixtureId);
        setAvail((m) => ({ ...m, [fixtureId]: rows }));
      } catch (err) { setError(err instanceof Error ? err.message : "Could not load availability."); }
    }
  };

  const setStatus = async (fixtureId: string, playerId: number, status: MatchAvailStatus) => {
    try {
      await setMatchAvailability({ fixture_id: fixtureId, player_id: playerId, status, set_by: user?.id ?? null });
      setAvail((m) => {
        const rows = (m[fixtureId] ?? []).filter((r) => r.player_id !== playerId);
        return { ...m, [fixtureId]: [...rows, { id: "", fixture_id: fixtureId, player_id: playerId, status, set_by: user?.id ?? null }] };
      });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not set status."); }
  };

  const TournamentSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
      <option value="">— tournament —</option>
      {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}{t.season ? ` (${t.season})` : ""}</option>)}
    </select>
  );

  const Field = ({ ph, type = "text", val, on }: { ph: string; type?: string; val: string; on: (v: string) => void }) => (
    <input type={type} value={val} onChange={(e) => on(e.target.value)} placeholder={ph}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <CalendarPlus className="w-6 h-6 text-falcon-gold" /> Fixtures & Availability
      </h1>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {!loading && tournaments.length === 0 ? (
        <p className="text-falcon-cream/50 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">
          Add a tournament first on the <Link to="/admin/tournaments" className="text-falcon-gold hover:underline">Tournaments</Link> page, then come back to add its matches.
        </p>
      ) : (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add a match
          </h2>
          <form onSubmit={add} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <TournamentSelect value={form.tournament_id} onChange={(v) => setForm({ ...form, tournament_id: v })} />
            <Field ph="Against (opponent)" val={form.opponent} on={(v) => setForm({ ...form, opponent: v })} />
            <Field ph="Ground / venue" val={form.ground} on={(v) => setForm({ ...form, ground: v })} />
            <Field ph="Date" type="date" val={form.match_date} on={(v) => setForm({ ...form, match_date: v })} />
            <Field ph="Time" type="time" val={form.match_time} on={(v) => setForm({ ...form, match_time: v })} />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)"
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
            <button type="submit" disabled={saving}
              className="lg:col-span-3 sm:w-auto px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add match
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-8" />
      ) : fixtures.length === 0 ? (
        <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No matches yet.</p>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f) => {
            const rows = avail[f.id] ?? [];
            const byStatus = (s: MatchAvailStatus) => rows.filter((r) => r.status === s).length;
            const statusOf = (pid: number) => rows.find((r) => r.player_id === pid)?.status;
            return (
              <div key={f.id} className="bg-[#0d1424] border border-white/5 rounded-xl overflow-hidden">
                {editId === f.id ? (
                  <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <TournamentSelect value={edit.tournament_id} onChange={(v) => setEdit({ ...edit, tournament_id: v })} />
                    <Field ph="Against" val={edit.opponent} on={(v) => setEdit({ ...edit, opponent: v })} />
                    <Field ph="Ground" val={edit.ground} on={(v) => setEdit({ ...edit, ground: v })} />
                    <Field ph="Date" type="date" val={edit.match_date} on={(v) => setEdit({ ...edit, match_date: v })} />
                    <Field ph="Time" type="time" val={edit.match_time} on={(v) => setEdit({ ...edit, match_time: v })} />
                    <Field ph="Notes" val={edit.notes} on={(v) => setEdit({ ...edit, notes: v })} />
                    <div className="flex gap-2 lg:col-span-3">
                      <button onClick={() => saveEdit(f.id)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-falcon-gold font-semibold text-sm">{fmtDate(f.match_date).split(",")[0]}</div>
                      <div className="text-falcon-cream/40 text-xs">{fmtDate(f.match_date).split(", ")[1]}{f.match_time ? ` · ${f.match_time.slice(0,5)}` : ""}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-falcon-cream text-sm font-medium truncate">
                        {f.tournament?.name ?? "Match"}{f.opponent ? <span className="text-falcon-cream/60"> · vs {f.opponent}</span> : null}
                      </div>
                      <div className="text-xs text-falcon-cream/40 truncate">
                        {[f.tournament?.format, f.ground, f.notes].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button onClick={() => toggleAvail(f.id)} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-falcon-cream/60 hover:text-falcon-gold hover:border-falcon-gold/30 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Availability <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openId === f.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => { setEditId(f.id); setEdit(toForm(f)); }} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}

                {openId === f.id && (
                  <div className="border-t border-white/5 p-4 space-y-3">
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-400">{byStatus("available")} available</span>
                      <span className="text-amber-400">{byStatus("maybe")} maybe</span>
                      <span className="text-red-400">{byStatus("unavailable")} out</span>
                      <span className="text-falcon-cream/30">{players.length - rows.length} no response</span>
                    </div>
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                      {players.map((p) => {
                        const cur = statusOf(p.player_id);
                        return (
                          <div key={p.player_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02]">
                            <span className="flex-1 text-sm text-falcon-cream/80 truncate">{p.name}</span>
                            {STATUSES.map((s) => (
                              <button key={s.key} onClick={() => setStatus(f.id, p.player_id, s.key)}
                                className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${cur === s.key ? s.active : "border-white/10 text-falcon-cream/40 hover:text-falcon-cream/70"}`}>
                                {s.label}
                              </button>
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
