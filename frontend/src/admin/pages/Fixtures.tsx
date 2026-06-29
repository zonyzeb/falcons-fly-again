import { useEffect, useMemo, useState } from "react";
import { Trophy, Loader2, Plus, Trash2, Pencil, Check, X, ChevronDown, Users, Gavel } from "lucide-react";
import { players } from "@/data/stats";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchFixtures, createFixture, updateFixture, deleteFixture, fetchFixtureAvailability, setMatchAvailability,
  fetchTournaments, fetchDuties, createTournament, updateTournament, deleteTournament, fetchAllProfiles, fetchAvailabilityCounts,
  type Fixture, type MatchAvailability, type MatchAvailStatus, type Tournament, type Duty, type Profile, type AvailCounts,
} from "@/lib/db";
import { TournamentTree, groupByTournament } from "@/components/TournamentTree";

const toMin = (t: string | null) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function matchDutyClashes(date: string, time: string, duties: Duty[]): string[] {
  if (!date) return [];
  const out: string[] = [];
  for (const d of duties) {
    if (d.duty_date !== date) continue;
    const fm = toMin(time || null), dm = toMin(d.duty_time);
    const at = d.duty_time ? ` at ${d.duty_time.slice(0, 5)}` : "";
    out.push(fm != null && dm != null && Math.abs(fm - dm) <= 240 ? `An umpiring duty${at} is within 4h of this match` : `An umpiring duty${at} is on the same day`);
  }
  return out;
}

const STATUSES: { key: MatchAvailStatus; label: string; active: string }[] = [
  { key: "available", label: "Available", active: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  { key: "maybe", label: "Maybe", active: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  { key: "unavailable", label: "Unavailable", active: "bg-red-500/15 border-red-500/40 text-red-300" },
];

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

function Field({ ph, type = "text", val, on }: { ph: string; type?: string; val: string; on: (v: string) => void }) {
  return (
    <input type={type} value={val} onChange={(e) => on(e.target.value)} placeholder={ph}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
  );
}
function PaidBySelect({ val, on, profiles }: { val: string; on: (v: string) => void; profiles: Profile[] }) {
  return (
    <select value={val} onChange={(e) => on(e.target.value)}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
      <option value="">Paid by…</option>
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"}</option>)}
    </select>
  );
}

const T_EMPTY = { name: "", format: "", season: "", start_date: "", fee: "", paid_by: "" };
const M_EMPTY = { opponent: "", match_date: "", match_time: "", ground: "", notes: "", result: "", result_note: "" };

export default function FixturesPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [counts, setCounts] = useState<Map<string, AvailCounts>>(new Map());
  const [selTid, setSelTid] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // tournament forms
  const [showNewT, setShowNewT] = useState(false);
  const [tForm, setTForm] = useState({ ...T_EMPTY });
  const [tEditing, setTEditing] = useState(false);
  const [tEdit, setTEdit] = useState({ ...T_EMPTY });
  const [tSaving, setTSaving] = useState(false);

  // match forms
  const [mForm, setMForm] = useState({ ...M_EMPTY });
  const [mSaving, setMSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [mEdit, setMEdit] = useState({ ...M_EMPTY });
  const [openId, setOpenId] = useState<string | null>(null);
  const [avail, setAvail] = useState<Record<string, MatchAvailability[]>>({});

  const load = () => {
    setLoading(true);
    Promise.all([fetchTournaments(), fetchAllProfiles(), fetchFixtures(), fetchDuties()])
      .then(async ([t, p, f, d]) => {
        setTournaments(t); setProfiles(p); setFixtures(f); setDuties(d);
        setSelTid((cur) => (cur && t.some((x) => x.id === cur) ? cur : t[0]?.id ?? ""));
        setCounts(await fetchAvailabilityCounts(f.map((x) => x.id)).catch(() => new Map()));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.full_name || "Unnamed"]));
    return (id: string | null) => (id ? m.get(id) ?? "Unknown" : null);
  }, [profiles]);

  const selT = tournaments.find((t) => t.id === selTid);
  const myFixtures = useMemo(() => fixtures.filter((f) => f.tournament_id === selTid), [fixtures, selTid]);

  const addMutWarn = useMemo(() => matchDutyClashes(mForm.match_date, mForm.match_time, duties), [mForm.match_date, mForm.match_time, duties]);
  const editMutWarn = useMemo(() => matchDutyClashes(mEdit.match_date, mEdit.match_time, duties), [mEdit.match_date, mEdit.match_time, duties]);

  // ── tournaments ──
  const tClean = (v: typeof T_EMPTY) => ({
    name: v.name.trim(), format: v.format.trim() || null, season: v.season ? parseInt(v.season, 10) : null,
    start_date: v.start_date || null, fee_sek: v.fee ? parseInt(v.fee, 10) : null, paid_by: v.paid_by || null,
  });
  const tToForm = (t: Tournament) => ({ name: t.name, format: t.format ?? "", season: t.season?.toString() ?? "", start_date: t.start_date ?? "", fee: t.fee_sek?.toString() ?? "", paid_by: t.paid_by ?? "" });

  const addTournament = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!tForm.name.trim()) return setError("Tournament name is required.");
    setTSaving(true);
    try {
      await createTournament(tClean(tForm));
      const t = await fetchTournaments(); setTournaments(t);
      const created = t.find((x) => x.name === tForm.name.trim()); if (created) setSelTid(created.id);
      setTForm({ ...T_EMPTY }); setShowNewT(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add."); }
    finally { setTSaving(false); }
  };
  const saveTournament = async () => {
    if (!tEdit.name.trim()) return setError("Tournament name is required.");
    try { await updateTournament(selTid, tClean(tEdit)); setTEditing(false); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };
  const removeTournament = async () => {
    if (!selT) return;
    if (!confirm(`Delete "${selT.name}"? Its matches, availability and selections will be removed too.`)) return;
    try { await deleteTournament(selTid); setSelTid(""); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  // ── matches ──
  const mClean = (v: typeof M_EMPTY) => ({
    tournament_id: selTid, opponent: v.opponent.trim() || null, match_date: v.match_date, match_time: v.match_time || null,
    ground: v.ground.trim() || null, notes: v.notes.trim() || null,
    result: (v.result || null) as "won" | "lost" | "tied" | "no_result" | null, result_note: v.result_note.trim() || null,
  });
  const mToForm = (f: Fixture) => ({ opponent: f.opponent ?? "", match_date: f.match_date, match_time: f.match_time?.slice(0, 5) ?? "", ground: f.ground ?? "", notes: f.notes ?? "", result: f.result ?? "", result_note: f.result_note ?? "" });

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!selTid) return setError("Pick a tournament first.");
    if (!mForm.match_date) return setError("Date is required.");
    setMSaving(true);
    try { await createFixture(mClean(mForm)); setMForm({ ...M_EMPTY }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add match."); }
    finally { setMSaving(false); }
  };
  const saveMatch = async (id: string) => {
    if (!mEdit.match_date) return setError("Date is required.");
    try { await updateFixture(id, mClean(mEdit)); setEditId(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };
  const removeMatch = async (id: string) => {
    if (!confirm("Delete this match? Player availability and any selected XI for it will be removed too.")) return;
    try { await deleteFixture(id); setFixtures((p) => p.filter((f) => f.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };
  const toggleAvail = async (fixtureId: string) => {
    if (openId === fixtureId) { setOpenId(null); return; }
    setOpenId(fixtureId);
    if (!avail[fixtureId]) {
      try { const rows = await fetchFixtureAvailability(fixtureId); setAvail((m) => ({ ...m, [fixtureId]: rows })); }
      catch (err) { setError(err instanceof Error ? err.message : "Could not load availability."); }
    }
  };
  const setStatus = async (fixtureId: string, playerId: number, status: MatchAvailStatus) => {
    try {
      await setMatchAvailability({ fixture_id: fixtureId, player_id: playerId, status, set_by: user?.id ?? null });
      setAvail((m) => ({ ...m, [fixtureId]: [...(m[fixtureId] ?? []).filter((r) => r.player_id !== playerId), { id: "", fixture_id: fixtureId, player_id: playerId, status, set_by: user?.id ?? null }] }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not set status."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Trophy className="w-6 h-6 text-falcon-gold" /> Tournaments &amp; Fixtures
      </h1>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {/* Tournament bar */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {tournaments.length > 0 && (
            <select value={selTid} onChange={(e) => { setSelTid(e.target.value); setTEditing(false); setEditId(null); }}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40 sm:max-w-xs">
              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}{t.season ? ` (${t.season})` : ""}</option>)}
            </select>
          )}
          {selT && (
            <div className="flex-1 text-xs text-falcon-cream/50">
              {[selT.format, selT.season, selT.fee_sek != null ? `${selT.fee_sek} SEK` : null, selT.paid_by ? `paid by ${nameOf(selT.paid_by)}` : null].filter(Boolean).join(" · ") || "—"}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowNewT((s) => !s); setTEditing(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-falcon-gold/10 text-falcon-gold border border-falcon-gold/20 hover:bg-falcon-gold/15">
              <Plus className="w-3.5 h-3.5" /> New tournament
            </button>
            {selT && <button onClick={() => { setTEditing((s) => !s); setTEdit(tToForm(selT)); setShowNewT(false); }} className="p-2 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>}
            {selT && <button onClick={removeTournament} className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>

        {showNewT && (
          <form onSubmit={addTournament} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <Field ph="Name *" val={tForm.name} on={(v) => setTForm({ ...tForm, name: v })} />
            <Field ph="Format (e.g. T20)" val={tForm.format} on={(v) => setTForm({ ...tForm, format: v })} />
            <Field ph="Season (year)" type="number" val={tForm.season} on={(v) => setTForm({ ...tForm, season: v })} />
            <Field ph="Start date" type="date" val={tForm.start_date} on={(v) => setTForm({ ...tForm, start_date: v })} />
            <Field ph="Fee (SEK)" type="number" val={tForm.fee} on={(v) => setTForm({ ...tForm, fee: v })} />
            <PaidBySelect val={tForm.paid_by} on={(v) => setTForm({ ...tForm, paid_by: v })} profiles={profiles} />
            <button type="submit" disabled={tSaving} className="lg:col-span-3 sm:w-auto px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {tSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create tournament
            </button>
          </form>
        )}
        {tEditing && selT && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <Field ph="Name *" val={tEdit.name} on={(v) => setTEdit({ ...tEdit, name: v })} />
            <Field ph="Format" val={tEdit.format} on={(v) => setTEdit({ ...tEdit, format: v })} />
            <Field ph="Season" type="number" val={tEdit.season} on={(v) => setTEdit({ ...tEdit, season: v })} />
            <Field ph="Start date" type="date" val={tEdit.start_date} on={(v) => setTEdit({ ...tEdit, start_date: v })} />
            <Field ph="Fee (SEK)" type="number" val={tEdit.fee} on={(v) => setTEdit({ ...tEdit, fee: v })} />
            <PaidBySelect val={tEdit.paid_by} on={(v) => setTEdit({ ...tEdit, paid_by: v })} profiles={profiles} />
            <div className="flex gap-2 lg:col-span-3">
              <button onClick={saveTournament} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
              <button onClick={() => setTEditing(false)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-8" />
      ) : tournaments.length === 0 ? (
        <p className="text-falcon-cream/50 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No tournaments yet — create one above to start adding matches.</p>
      ) : (
        <>
          {/* Season tree for the selected tournament */}
          {myFixtures.length > 0 && (
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Season map</h2>
              <TournamentTree groups={groupByTournament(myFixtures)} matchHref={() => "/admin/availability"} counts={counts} />
            </div>
          )}

          {/* Add a match (to the selected tournament) */}
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add a match{selT ? ` to ${selT.name}` : ""}
            </h2>
            <form onSubmit={addMatch} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field ph="Against (opponent)" val={mForm.opponent} on={(v) => setMForm({ ...mForm, opponent: v })} />
              <Field ph="Ground / venue" val={mForm.ground} on={(v) => setMForm({ ...mForm, ground: v })} />
              <Field ph="Date" type="date" val={mForm.match_date} on={(v) => setMForm({ ...mForm, match_date: v })} />
              <Field ph="Time" type="time" val={mForm.match_time} on={(v) => setMForm({ ...mForm, match_time: v })} />
              <Field ph="Notes (optional)" val={mForm.notes} on={(v) => setMForm({ ...mForm, notes: v })} />
              <button type="submit" disabled={mSaving} className="px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {mSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add match
              </button>
            </form>
            {addMutWarn.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {addMutWarn.map((m, i) => <div key={i} className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg"><Gavel className="w-3.5 h-3.5 shrink-0" /> {m} — consider reassigning it.</div>)}
              </div>
            )}
          </div>

          {/* Matches in the selected tournament */}
          {myFixtures.length === 0 ? (
            <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No matches in this tournament yet.</p>
          ) : (
            <div className="space-y-3">
              {myFixtures.map((f) => {
                const rows = avail[f.id] ?? [];
                const byStatus = (s: MatchAvailStatus) => rows.filter((r) => r.status === s).length;
                const statusOf = (pid: number) => rows.find((r) => r.player_id === pid)?.status;
                return (
                  <div key={f.id} className="bg-[#0d1424] border border-white/5 rounded-xl overflow-hidden">
                    {editId === f.id ? (
                      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <Field ph="Against" val={mEdit.opponent} on={(v) => setMEdit({ ...mEdit, opponent: v })} />
                        <Field ph="Ground" val={mEdit.ground} on={(v) => setMEdit({ ...mEdit, ground: v })} />
                        <Field ph="Date" type="date" val={mEdit.match_date} on={(v) => setMEdit({ ...mEdit, match_date: v })} />
                        <Field ph="Time" type="time" val={mEdit.match_time} on={(v) => setMEdit({ ...mEdit, match_time: v })} />
                        <Field ph="Notes" val={mEdit.notes} on={(v) => setMEdit({ ...mEdit, notes: v })} />
                        <select value={mEdit.result} onChange={(e) => setMEdit({ ...mEdit, result: e.target.value })}
                          className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
                          <option value="">Result —</option><option value="won">Won</option><option value="lost">Lost</option><option value="tied">Tied</option><option value="no_result">No result</option>
                        </select>
                        <Field ph="Result note (e.g. won by 5 wkts)" val={mEdit.result_note} on={(v) => setMEdit({ ...mEdit, result_note: v })} />
                        <div className="flex gap-2 lg:col-span-3">
                          <button onClick={() => saveMatch(f.id)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
                          <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
                        </div>
                        {editMutWarn.map((m, i) => <div key={i} className="lg:col-span-3 flex items-center gap-2 text-xs text-amber-300"><Gavel className="w-3.5 h-3.5 shrink-0" /> {m} — consider reassigning it.</div>)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-falcon-gold font-semibold text-sm">{fmtDate(f.match_date).split(",")[0]}</div>
                          <div className="text-falcon-cream/40 text-xs">{fmtDate(f.match_date).split(", ")[1]}{f.match_time ? ` · ${f.match_time.slice(0, 5)}` : ""}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-falcon-cream text-sm font-medium truncate flex items-center gap-2">
                            <span className="truncate">{f.opponent ? <>vs {f.opponent}</> : "Match"}</span>
                            {f.result && <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${f.result === "won" ? "text-emerald-300 bg-emerald-500/15" : f.result === "lost" ? "text-red-300 bg-red-500/15" : "text-amber-300 bg-amber-500/15"}`}>{f.result === "no_result" ? "No result" : f.result}</span>}
                          </div>
                          <div className="text-xs text-falcon-cream/40 truncate">{[f.ground, f.result_note, f.notes].filter(Boolean).join(" · ")}</div>
                        </div>
                        <button onClick={() => toggleAvail(f.id)} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-falcon-cream/60 hover:text-falcon-gold hover:border-falcon-gold/30 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Availability <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openId === f.id ? "rotate-180" : ""}`} />
                        </button>
                        <button onClick={() => { setEditId(f.id); setMEdit(mToForm(f)); }} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => removeMatch(f.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>
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
                                    className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${cur === s.key ? s.active : "border-white/10 text-falcon-cream/40 hover:text-falcon-cream/70"}`}>{s.label}</button>
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
        </>
      )}
    </div>
  );
}
