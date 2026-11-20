import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Loader2, Plus, Trash2, Pencil, Check, X, Eye, EyeOff, Search, ArrowUp, ArrowDown } from "lucide-react";
import { players } from "@/data/stats";
import {
  fetchSquad2027, createSquad2027Member, updateSquad2027Member, deleteSquad2027Member,
  type Squad2027Member, type Squad2027Input, type SquadStatus,
} from "@/lib/db";

const ROLES = [
  { v: "", l: "Role…" },
  { v: "BAT", l: "Batsman" },
  { v: "BOWL", l: "Bowler" },
  { v: "ALL", l: "All-rounder" },
  { v: "WK", l: "Wicketkeeper" },
];
const ROLE_LABEL: Record<string, string> = { BAT: "Batsman", BOWL: "Bowler", ALL: "All-rounder", WK: "Wicketkeeper" };

const EMPTY = {
  player_id: null as number | null, name: "", role: "", tagline: "", photo_url: "",
  jersey_number: "", status: "in_talks" as SquadStatus, sort_order: "",
};
type Form = typeof EMPTY;

const displayName = (m: { player_id: number | null; name: string | null }) =>
  m.name || players.find((p) => p.player_id === m.player_id)?.name || (m.player_id ? `#${m.player_id}` : "—");

function PlayerPicker({ form, set }: { form: Form; set: (f: Form) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return players.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 8);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative lg:col-span-2" ref={ref}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg">
        <Search className="w-4 h-4 text-falcon-cream/30 shrink-0" />
        <input
          value={form.player_id != null && !q ? displayName({ player_id: form.player_id, name: form.name }) : q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search existing player, or type a recruit name below"
          className="flex-1 bg-transparent text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none" />
        {form.player_id != null && (
          <button type="button" onClick={() => { set({ ...form, player_id: null }); setQ(""); }} className="text-falcon-cream/40 hover:text-red-400"><X className="w-4 h-4" /></button>
        )}
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-[#121a2e] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {matches.map((p) => (
            <button key={p.player_id} type="button"
              onClick={() => {
                set({ ...form, player_id: p.player_id, name: form.name || p.name, role: form.role || (ROLE_LABEL[p.sub_title] ? p.sub_title : ""), photo_url: form.photo_url || p.profile_pic_url || "" });
                setQ(""); setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-falcon-cream/80 hover:bg-white/5 flex items-center gap-2">
              {p.profile_pic_url && !p.profile_pic_url.includes("default") && <img src={p.profile_pic_url} className="w-6 h-6 rounded-full object-cover" alt="" />}
              {p.name} <span className="text-falcon-cream/30 text-xs">{ROLE_LABEL[p.sub_title] || p.sub_title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Squad2027Page() {
  const [members, setMembers] = useState<Squad2027Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Form>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Form>({ ...EMPTY });

  const load = () => {
    setLoading(true);
    fetchSquad2027()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const clean = (v: Form): Squad2027Input => ({
    player_id: v.player_id,
    name: v.name.trim() || null,
    role: v.role || null,
    tagline: v.tagline.trim() || null,
    photo_url: v.photo_url.trim() || null,
    jersey_number: v.jersey_number ? parseInt(v.jersey_number, 10) : null,
    is_captain: false,
    is_vice_captain: false,
    status: v.status,
    sort_order: v.sort_order ? parseInt(v.sort_order, 10) : members.length,
    published: false,
  });
  const toForm = (m: Squad2027Member): Form => ({
    player_id: m.player_id, name: m.name ?? "", role: m.role ?? "", tagline: m.tagline ?? "",
    photo_url: m.photo_url ?? "", jersey_number: m.jersey_number?.toString() ?? "", status: m.status,
    sort_order: m.sort_order.toString(),
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (form.player_id == null && !form.name.trim()) return setError("Pick a player or enter a name.");
    setSaving(true);
    try { await createSquad2027Member(clean(form)); setForm({ ...EMPTY }); setShowNew(false); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add."); }
    finally { setSaving(false); }
  };
  const save = async (id: string) => {
    if (edit.player_id == null && !edit.name.trim()) return setError("Pick a player or enter a name.");
    // preserve captain/VC/published (managed via the card toggles, not the form)
    const m = members.find((x) => x.id === id);
    const patch: Partial<Squad2027Input> = { ...clean(edit), is_captain: m?.is_captain ?? false, is_vice_captain: m?.is_vice_captain ?? false, published: m?.published ?? false };
    try { await updateSquad2027Member(id, patch); setEditId(null); load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
  };
  const remove = async (id: string) => {
    if (!confirm("Remove this player from the 2027 squad?")) return;
    try { await deleteSquad2027Member(id); setMembers((p) => p.filter((m) => m.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete."); }
  };

  const patchLocal = (id: string, patch: Partial<Squad2027Member>) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const togglePublished = async (m: Squad2027Member) => {
    patchLocal(m.id, { published: !m.published });
    try { await updateSquad2027Member(m.id, { published: !m.published }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update."); patchLocal(m.id, { published: m.published }); }
  };
  const setStatus = async (m: Squad2027Member, status: SquadStatus) => {
    patchLocal(m.id, { status });
    try { await updateSquad2027Member(m.id, { status }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update."); load(); }
  };
  // Single captain / single vice-captain across the squad.
  const toggleRole = async (m: Squad2027Member, key: "is_captain" | "is_vice_captain") => {
    const turnOn = !m[key];
    setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, [key]: turnOn } : (turnOn ? { ...x, [key]: false } : x)));
    try {
      await Promise.all([
        updateSquad2027Member(m.id, { [key]: turnOn } as Partial<Squad2027Input>),
        ...(turnOn ? members.filter((x) => x.id !== m.id && x[key]).map((x) => updateSquad2027Member(x.id, { [key]: false } as Partial<Squad2027Input>)) : []),
      ]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update."); load(); }
  };
  const move = async (m: Squad2027Member, dir: -1 | 1) => {
    const ordered = [...members].sort((a, b) => a.sort_order - b.sort_order);
    const i = ordered.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const a = ordered[i], b = ordered[j];
    patchLocal(a.id, { sort_order: b.sort_order });
    patchLocal(b.id, { sort_order: a.sort_order });
    try { await Promise.all([updateSquad2027Member(a.id, { sort_order: b.sort_order }), updateSquad2027Member(b.id, { sort_order: a.sort_order })]); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not reorder."); load(); }
  };

  const formGrid = (v: Form, set: (f: Form) => void, isEdit: boolean) => (
    <>
      <PlayerPicker form={v} set={set} />
      <input value={v.name} onChange={(e) => set({ ...v, name: e.target.value })} placeholder="Display name / recruit name"
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
      <select value={v.role} onChange={(e) => set({ ...v, role: e.target.value })}
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
        {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
      </select>
      <input type="number" value={v.jersey_number} onChange={(e) => set({ ...v, jersey_number: e.target.value })} placeholder="Jersey #"
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
      <select value={v.status} onChange={(e) => set({ ...v, status: e.target.value as SquadStatus })}
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
        <option value="in_talks">In talks</option>
        <option value="confirmed">Confirmed</option>
      </select>
      <input value={v.photo_url} onChange={(e) => set({ ...v, photo_url: e.target.value })} placeholder="Photo URL (optional)"
        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
      <input value={v.tagline} onChange={(e) => set({ ...v, tagline: e.target.value })} placeholder="Tagline (optional)"
        className="lg:col-span-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
      <div className="flex gap-2 lg:col-span-3">
        {isEdit ? (
          <>
            <button type="button" onClick={() => save(editId!)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Save</button>
            <button type="button" onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/50 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
          </>
        ) : (
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add to squad
          </button>
        )}
      </div>
    </>
  );

  const ordered = useMemo(() => [...members].sort((a, b) => a.sort_order - b.sort_order), [members]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
            <Users className="w-6 h-6 text-falcon-gold" /> 2027 Squad
          </h1>
          <p className="text-falcon-cream/40 text-sm mt-1">Curate the squad shown publicly at <span className="text-falcon-gold">/team</span>. Only <b>confirmed</b> &amp; <b>published</b> players appear.</p>
        </div>
        <button onClick={() => { setShowNew((s) => !s); setEditId(null); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-falcon-gold/10 text-falcon-gold border border-falcon-gold/20 hover:bg-falcon-gold/15 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add player
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      {showNew && (
        <form onSubmit={add} className="bg-[#0d1424] border border-white/5 rounded-xl p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formGrid(form, setForm, false)}
        </form>
      )}

      {loading ? (
        <Loader2 className="w-6 h-6 text-falcon-gold animate-spin mx-auto my-8" />
      ) : members.length === 0 ? (
        <p className="text-falcon-cream/50 text-sm bg-[#0d1424] border border-white/5 rounded-xl p-6 text-center">No players yet — add your 2027 squad above.</p>
      ) : (
        <div className="space-y-2">
          {ordered.map((m, idx) => (
            <div key={m.id} className="bg-[#0d1424] border border-white/5 rounded-xl overflow-hidden">
              {editId === m.id ? (
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{formGrid(edit, setEdit, true)}</div>
              ) : (
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="flex flex-col shrink-0">
                    <button onClick={() => move(m, -1)} disabled={idx === 0} className="text-falcon-cream/30 hover:text-falcon-gold disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => move(m, 1)} disabled={idx === ordered.length - 1} className="text-falcon-cream/30 hover:text-falcon-gold disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                  </div>
                  {(() => {
                    const photo = m.photo_url || players.find((p) => p.player_id === m.player_id)?.profile_pic_url;
                    return photo && !photo.includes("default")
                      ? <img src={photo} className="w-10 h-10 rounded-full object-cover border border-falcon-gold/20 shrink-0" alt="" />
                      : <div className="w-10 h-10 rounded-full bg-falcon-gold/10 border border-falcon-gold/20 flex items-center justify-center text-falcon-gold font-bold shrink-0">{displayName(m).charAt(0)}</div>;
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="text-falcon-cream text-sm font-medium truncate flex items-center gap-1.5">
                      {m.jersey_number != null && <span className="text-falcon-cream/30">#{m.jersey_number}</span>}
                      {displayName(m)}
                      {m.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-falcon-gold/20 text-falcon-gold border border-falcon-gold/40 font-bold">C</span>}
                      {m.is_vice_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">VC</span>}
                    </div>
                    <div className="text-xs text-falcon-cream/40 truncate">{[m.role ? ROLE_LABEL[m.role] : null, m.tagline].filter(Boolean).join(" · ") || "—"}</div>
                  </div>

                  {/* status */}
                  <button onClick={() => setStatus(m, m.status === "confirmed" ? "in_talks" : "confirmed")}
                    className={`px-2 py-1 text-[11px] rounded-md border shrink-0 ${m.status === "confirmed" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-amber-500/15 border-amber-500/40 text-amber-300"}`}>
                    {m.status === "confirmed" ? "Confirmed" : "In talks"}
                  </button>
                  {/* C / VC */}
                  <button onClick={() => toggleRole(m, "is_captain")} title="Captain"
                    className={`w-7 h-7 text-[11px] rounded-md border shrink-0 font-bold ${m.is_captain ? "bg-falcon-gold/20 border-falcon-gold/40 text-falcon-gold" : "border-white/10 text-falcon-cream/40 hover:text-falcon-cream/70"}`}>C</button>
                  <button onClick={() => toggleRole(m, "is_vice_captain")} title="Vice-captain"
                    className={`w-8 h-7 text-[11px] rounded-md border shrink-0 font-bold ${m.is_vice_captain ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "border-white/10 text-falcon-cream/40 hover:text-falcon-cream/70"}`}>VC</button>
                  {/* publish */}
                  <button onClick={() => togglePublished(m)} title={m.published ? "Published (visible)" : "Hidden"}
                    className={`p-1.5 rounded-lg shrink-0 ${m.published ? "text-emerald-400 hover:bg-emerald-400/10" : "text-falcon-cream/30 hover:text-falcon-cream/60 hover:bg-white/5"}`}>
                    {m.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setEditId(m.id); setEdit(toForm(m)); setShowNew(false); }} className="p-1.5 rounded-lg text-falcon-cream/40 hover:text-falcon-gold hover:bg-white/5 shrink-0"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
