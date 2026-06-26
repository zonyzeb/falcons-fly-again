import { useEffect, useMemo, useState } from "react";
import { Trophy, Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  fetchTournaments, createTournament, updateTournament, deleteTournament,
  fetchAllProfiles, type Tournament, type Profile,
} from "@/lib/db";

const EMPTY = { name: "", format: "", season: "", start_date: "", fee: "", paid_by: "" };

export default function TournamentsPage() {
  const [items, setItems] = useState<Tournament[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ ...EMPTY });

  const load = () => {
    setLoading(true);
    Promise.all([fetchTournaments(), fetchAllProfiles()])
      .then(([t, p]) => { setItems(t); setProfiles(p); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.full_name || "Unnamed"]));
    return (id: string | null) => (id ? m.get(id) ?? "Unknown" : null);
  }, [profiles]);

  const clean = (v: typeof EMPTY) => ({
    name: v.name.trim(),
    format: v.format.trim() || null,
    season: v.season ? parseInt(v.season, 10) : null,
    start_date: v.start_date || null,
    fee_sek: v.fee ? parseInt(v.fee, 10) : null,
    paid_by: v.paid_by || null,
  });

  const toForm = (t: Tournament) => ({
    name: t.name, format: t.format ?? "", season: t.season?.toString() ?? "", start_date: t.start_date ?? "",
    fee: t.fee_sek?.toString() ?? "", paid_by: t.paid_by ?? "",
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Tournament name is required.");
    setSaving(true);
    try { await createTournament(clean(form)); setForm({ ...EMPTY }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add."); }
    finally { setSaving(false); }
  };

  const saveEdit = async (id: string) => {
    if (!edit.name.trim()) return setError("Tournament name is required.");
    try { await updateTournament(id, clean(edit)); setEditId(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tournament? Its matches will be removed too.")) return;
    try { await deleteTournament(id); setItems((p) => p.filter((t) => t.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  const Field = ({ ph, type = "text", val, on, w }: { ph: string; type?: string; val: string; on: (v: string) => void; w?: string }) => (
    <input type={type} value={val} onChange={(e) => on(e.target.value)} placeholder={ph}
      className={`px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40 ${w ?? ""}`} />
  );

  const PaidBySelect = ({ val, on }: { val: string; on: (v: string) => void }) => (
    <select value={val} onChange={(e) => on(e.target.value)}
      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
      <option value="">Paid by…</option>
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Trophy className="w-6 h-6 text-falcon-gold" /> Tournaments
      </h1>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add a tournament
        </h2>
        <form onSubmit={add} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field ph="Name *" val={form.name} on={(v) => setForm({ ...form, name: v })} />
          <Field ph="Format (e.g. T20)" val={form.format} on={(v) => setForm({ ...form, format: v })} />
          <Field ph="Season (year)" type="number" val={form.season} on={(v) => setForm({ ...form, season: v })} />
          <Field ph="Start date" type="date" val={form.start_date} on={(v) => setForm({ ...form, start_date: v })} />
          <Field ph="Fee (SEK)" type="number" val={form.fee} on={(v) => setForm({ ...form, fee: v })} />
          <PaidBySelect val={form.paid_by} on={(v) => setForm({ ...form, paid_by: v })} />
          <button type="submit" disabled={saving}
            className="lg:col-span-3 sm:w-auto px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add tournament
          </button>
        </form>
      </div>

      {loading ? (
        <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-8" />
      ) : items.length === 0 ? (
        <p className="text-falcon-cream/30 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No tournaments yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              {editId === t.id ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 items-center">
                  <Field ph="Name *" val={edit.name} on={(v) => setEdit({ ...edit, name: v })} />
                  <Field ph="Format" val={edit.format} on={(v) => setEdit({ ...edit, format: v })} />
                  <Field ph="Season" type="number" val={edit.season} on={(v) => setEdit({ ...edit, season: v })} />
                  <Field ph="Start date" type="date" val={edit.start_date} on={(v) => setEdit({ ...edit, start_date: v })} />
                  <Field ph="Fee (SEK)" type="number" val={edit.fee} on={(v) => setEdit({ ...edit, fee: v })} />
                  <PaidBySelect val={edit.paid_by} on={(v) => setEdit({ ...edit, paid_by: v })} />
                  <div className="flex gap-2 lg:col-span-3">
                    <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-falcon-cream font-medium truncate">{t.name}</div>
                    <div className="text-xs text-falcon-cream/40">
                      {[t.format, t.season, t.start_date && new Date(t.start_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })].filter(Boolean).join(" · ") || "—"}
                    </div>
                    {(t.fee_sek != null || t.paid_by) && (
                      <div className="text-xs mt-0.5">
                        {t.fee_sek != null && <span className="text-falcon-gold/80 font-medium">{t.fee_sek} SEK</span>}
                        {t.paid_by && <span className="text-falcon-cream/40"> · paid by {nameOf(t.paid_by)}</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setEditId(t.id); setEdit(toForm(t)); }} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
