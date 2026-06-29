import { useState, useMemo, useEffect } from "react";
import { CalendarCheck, AlertTriangle, Star, Loader2, Users, ChevronUp, ChevronDown, X, Plus, Check, Send, Sparkles, Mail } from "lucide-react";
import { loadState, getPlayerStats } from "@/admin/store";
import type { SquadPlayer } from "@/admin/store";
import {
  fetchUpcomingFixtures, fetchFixtureAvailability, fetchSelection, saveSelection, setXiPublished, sendNotification,
  type Fixture, type MatchAvailStatus,
} from "@/lib/db";

type Resp = MatchAvailStatus | "none";
type Sel = { player_id: number; is_captain: boolean; is_keeper: boolean };

const STATUS_PILL: Record<Resp, { label: string; cls: string }> = {
  available: { label: "Available", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  maybe: { label: "Maybe", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  unavailable: { label: "Out", cls: "text-red-400 bg-red-500/10 border-red-500/30" },
  none: { label: "No reply", cls: "text-falcon-cream/30 bg-white/[0.03] border-white/10" },
};
const STATUS_ORDER: Record<Resp, number> = { available: 0, maybe: 1, none: 2, unavailable: 3 };

function computeFormScore(p: SquadPlayer): number {
  const s = getPlayerStats(p.player_id);
  if (!s) return 0;
  let score = 0;
  if (s.batting?.runs) score += s.batting.runs * 0.2;
  if (s.batting?.average) score += s.batting.average * 1.5;
  if (s.batting?.strike_rate) score += s.batting.strike_rate * 0.3;
  if (s.bowling?.wickets) score += s.bowling.wickets * 4;
  if (s.bowling?.economy) score += Math.max(0, 10 - s.bowling.economy) * 2;
  if (s.fielding?.catches) score += s.fielding.catches * 2;
  return Math.round(score);
}

function suggestEleven(squad: SquadPlayer[]): SquadPlayer[] {
  const eligible = squad
    .filter((p) => p.active && p.available && p.fitness === "Fit")
    .map((p) => ({ ...p, form: computeFormScore(p) }))
    .sort((a, b) => b.form - a.form);
  const selected: typeof eligible = [];
  const remaining = [...eligible];
  const pick = (filter: (p: SquadPlayer) => boolean, count: number) => {
    let n = 0;
    for (let i = remaining.length - 1; i >= 0 && n < count; i--) {
      if (filter(remaining[i])) { selected.push(remaining[i]); remaining.splice(i, 1); n++; }
    }
  };
  pick((p) => p.role === "WK", 1);
  pick((p) => p.role === "BOWL", 3);
  pick((p) => p.role === "ALL", 2);
  selected.push(...remaining.sort((a, b) => b.form - a.form).slice(0, Math.max(0, 11 - selected.length)));
  return selected.slice(0, 11);
}

function fmtFixture(f: Fixture) {
  const d = new Date(f.match_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f.tournament?.name ?? "Match"}${f.opponent ? ` vs ${f.opponent}` : ""} · ${d}`;
}

export default function AvailabilityPage() {
  const squad = useMemo(() => loadState().squad, []);
  const squadById = useMemo(() => new Map(squad.map((p) => [p.player_id, p])), [squad]);

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixtureId, setFixtureId] = useState("");
  const [availMap, setAvailMap] = useState<Map<number, MatchAvailStatus>>(new Map());
  const [selected, setSelected] = useState<Sel[]>([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [emailing, setEmailing] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(() => {
    fetchUpcomingFixtures()
      .then((fs) => { setFixtures(fs); if (fs[0]) setFixtureId(fs[0].id); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load fixtures."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!fixtureId) return;
    setError(""); setSaved(false);
    setPublished(fixtures.find((f) => f.id === fixtureId)?.xi_published ?? false);
    Promise.all([fetchFixtureAvailability(fixtureId), fetchSelection(fixtureId)])
      .then(([avail, sel]) => {
        setAvailMap(new Map(avail.map((r) => [r.player_id, r.status])));
        setSelected(sel.map((s) => ({ player_id: s.player_id, is_captain: s.is_captain, is_keeper: s.is_keeper })));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, [fixtureId, fixtures]);

  const statusOf = (pid: number): Resp => availMap.get(pid) ?? "none";
  const activeSquad = useMemo(() => squad.filter((p) => p.active), [squad]);
  const mergedSquad = useMemo(
    () => squad.map((p) => ({ ...p, available: availMap.get(p.player_id) === "available" })),
    [squad, availMap]
  );

  const sortedPlayers = useMemo(
    () => [...activeSquad].sort((a, b) => {
      const d = STATUS_ORDER[statusOf(a.player_id)] - STATUS_ORDER[statusOf(b.player_id)];
      return d !== 0 ? d : computeFormScore(b) - computeFormScore(a);
    }),
    [activeSquad, availMap]
  );
  const countOf = (s: Resp) => activeSquad.filter((p) => statusOf(p.player_id) === s).length;

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.player_id)), [selected]);
  const pool = useMemo(
    () => sortedPlayers.filter((p) => !selectedIds.has(p.player_id) && statusOf(p.player_id) !== "unavailable"),
    [sortedPlayers, selectedIds, availMap]
  );

  // ── editing ──
  const useSuggested = () => {
    const xi = suggestEleven(mergedSquad);
    const keeperId = xi.find((p) => p.role === "WK")?.player_id;
    setSelected(xi.map((p, i) => ({ player_id: p.player_id, is_captain: i === 0, is_keeper: p.player_id === keeperId })));
    setSaved(false);
  };
  const add = (pid: number) => { if (selected.length < 15) { setSelected((s) => [...s, { player_id: pid, is_captain: false, is_keeper: false }]); setSaved(false); } };
  const remove = (pid: number) => { setSelected((s) => s.filter((x) => x.player_id !== pid)); setSaved(false); };
  const move = (i: number, dir: -1 | 1) => {
    setSelected((s) => {
      const j = i + dir; if (j < 0 || j >= s.length) return s;
      const next = [...s]; [next[i], next[j]] = [next[j], next[i]]; return next;
    });
    setSaved(false);
  };
  const toggleCaptain = (pid: number) => { setSelected((s) => s.map((x) => ({ ...x, is_captain: x.player_id === pid ? !x.is_captain : false }))); setSaved(false); };
  const toggleKeeper = (pid: number) => { setSelected((s) => s.map((x) => ({ ...x, is_keeper: x.player_id === pid ? !x.is_keeper : false }))); setSaved(false); };

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (selected.length !== 11) w.push(`${selected.length}/11 selected`);
    if (!selected.some((s) => s.is_captain)) w.push("No captain set");
    if (!selected.some((s) => s.is_keeper)) w.push("No wicketkeeper set");
    const unconfirmed = selected.filter((s) => statusOf(s.player_id) !== "available").length;
    if (unconfirmed > 0) w.push(`${unconfirmed} selected player(s) not confirmed available`);
    return w;
  }, [selected, availMap]);

  const persist = async (): Promise<boolean> => {
    setBusy(true); setError("");
    try {
      await saveSelection(fixtureId, selected.map((s, i) => ({ player_id: s.player_id, batting_order: i + 1, is_captain: s.is_captain, is_keeper: s.is_keeper })));
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); return false; }
    finally { setBusy(false); }
  };
  const save = async () => { if (await persist()) { setSaved(true); setTimeout(() => setSaved(false), 2500); } };
  const togglePublish = async () => {
    if (!published && selected.length !== 11) { setError("Pick 11 players before publishing."); return; }
    setBusy(true); setError("");
    try {
      if (!published) { await persist(); }
      await setXiPublished(fixtureId, !published);
      setPublished(!published);
      setFixtures((fs) => fs.map((f) => (f.id === fixtureId ? { ...f, xi_published: !published } : f)));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not publish."); }
    finally { setBusy(false); }
  };

  const selectedFixture = fixtures.find((f) => f.id === fixtureId);
  const fixtureLabel = selectedFixture ? fmtFixture(selectedFixture) : "";

  const requestAvailability = async (scope: "all" | "pending") => {
    setEmailing(scope); setError(""); setEmailMsg("");
    try {
      const r = await sendNotification({ kind: "availability", fixtureId, fixtureLabel, scope });
      setEmailMsg(r.sent > 0 ? `Availability request sent to ${r.sent} member(s).` : "No matching members to email.");
    } catch (e) { setError(e instanceof Error ? e.message : "Email failed."); }
    finally { setEmailing(null); }
  };
  const emailTeam = async () => {
    setEmailing("team"); setError(""); setEmailMsg("");
    try {
      const team = selected.map((s, i) => ({ order: i + 1, name: squadById.get(s.player_id)?.name ?? `#${s.player_id}`, captain: s.is_captain, keeper: s.is_keeper }));
      const r = await sendNotification({ kind: "team", fixtureId, fixtureLabel, team });
      setEmailMsg(r.sent > 0 ? `Team emailed to ${r.sent} member(s).` : "No members to email.");
    } catch (e) { setError(e instanceof Error ? e.message : "Email failed."); }
    finally { setEmailing(null); }
  };

  const Tag = ({ on, label, cls, onClick }: { on: boolean; label: string; cls: string; onClick: () => void }) => (
    <button onClick={onClick} className={`px-1.5 py-0.5 text-[10px] font-bold rounded border transition-colors ${on ? cls : "border-white/10 text-falcon-cream/30 hover:text-falcon-cream/60"}`}>{label}</button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-falcon-gold" /> Availability &amp; Selection
      </h1>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
        <label className="text-xs uppercase tracking-wide text-falcon-cream/50">Select match</label>
        {loading ? (
          <Loader2 className="w-5 h-5 text-falcon-gold animate-spin mt-2" />
        ) : fixtures.length === 0 ? (
          <p className="text-falcon-cream/40 text-sm mt-2">No upcoming matches. Add one on the Fixtures page first.</p>
        ) : (
          <select value={fixtureId} onChange={(e) => setFixtureId(e.target.value)}
            className="mt-2 w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream focus:outline-none focus:border-falcon-gold/40">
            {fixtures.map((f) => <option key={f.id} value={f.id}>{fmtFixture(f)}</option>)}
          </select>
        )}
        {fixtureId && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-falcon-cream/40">Request availability:</span>
            <button onClick={() => requestAvailability("all")} disabled={!!emailing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/70 border border-white/10 hover:bg-white/10 disabled:opacity-50">
              {emailing === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} All members
            </button>
            <button onClick={() => requestAvailability("pending")} disabled={!!emailing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/70 border border-white/10 hover:bg-white/10 disabled:opacity-50">
              {emailing === "pending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} No-reply only
            </button>
            {emailMsg && <span className="text-xs text-emerald-400">{emailMsg}</span>}
          </div>
        )}
      </div>

      {fixtureId && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {([["available", "Available", "text-emerald-400"], ["maybe", "Maybe", "text-amber-400"], ["unavailable", "Out", "text-red-400"], ["none", "No reply", "text-falcon-cream/50"]] as [Resp, string, string][]).map(([key, label, cls]) => (
              <div key={key} className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
                <p className={`text-2xl font-display font-bold ${cls}`}>{countOf(key)}</p>
                <p className="text-xs text-falcon-cream/40">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Responses */}
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Player responses</h2>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {sortedPlayers.map((p) => {
                  const pill = STATUS_PILL[statusOf(p.player_id)];
                  return (
                    <div key={p.player_id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02]">
                      <span className="text-falcon-cream text-sm flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] text-falcon-cream/30">{p.role}</span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${pill.cls}`}>{pill.label}</span>
                      {!selectedIds.has(p.player_id) && statusOf(p.player_id) !== "unavailable" && (
                        <button onClick={() => add(p.player_id)} className="p-0.5 rounded text-falcon-cream/40 hover:text-falcon-gold"><Plus className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team sheet */}
            <div className="bg-[#0d1424] border border-falcon-gold/15 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide flex items-center gap-2"><Star className="w-4 h-4 text-falcon-gold" /> Team sheet ({selected.length}/11)</h2>
                {published && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Published</span>}
              </div>
              <div className="flex gap-2 mb-3">
                <button onClick={useSuggested} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-falcon-gold/10 text-falcon-gold border border-falcon-gold/20 hover:bg-falcon-gold/15"><Sparkles className="w-3.5 h-3.5" /> Suggested XI</button>
                <button onClick={save} disabled={busy} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-white/5 text-falcon-cream/70 border border-white/10 hover:bg-white/10 disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null} {saved ? "Saved" : "Save"}
                </button>
                <button onClick={togglePublish} disabled={busy} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border disabled:opacity-50 ${published ? "bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/15" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"}`}>
                  <Send className="w-3.5 h-3.5" /> {published ? "Unpublish" : "Publish"}
                </button>
                {published && (
                  <button onClick={emailTeam} disabled={!!emailing || selected.length === 0} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-falcon-gold/10 text-falcon-gold border border-falcon-gold/20 hover:bg-falcon-gold/15 disabled:opacity-50">
                    {emailing === "team" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Email XI
                  </button>
                )}
              </div>
              {warnings.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {warnings.map((w, i) => (
                    <span key={i} className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3" /> {w}</span>
                  ))}
                </div>
              )}
              {selected.length === 0 ? (
                <p className="text-falcon-cream/20 text-xs text-center py-10">No XI yet — tap “Suggested XI” or add players from the left.</p>
              ) : (
                <div className="space-y-1.5">
                  {selected.map((s, i) => {
                    const p = squadById.get(s.player_id);
                    const avail = statusOf(s.player_id);
                    return (
                      <div key={s.player_id} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/[0.02]">
                        <span className="w-5 text-center text-xs font-bold text-falcon-gold">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-falcon-cream text-sm truncate">{p?.name ?? s.player_id}</div>
                          <div className="text-[10px] text-falcon-cream/30">{p?.role}{avail !== "available" ? ` · ${STATUS_PILL[avail].label}` : ""}</div>
                        </div>
                        <Tag on={s.is_captain} label="C" cls="bg-falcon-gold/20 border-falcon-gold/40 text-falcon-gold" onClick={() => toggleCaptain(s.player_id)} />
                        <Tag on={s.is_keeper} label="WK" cls="bg-cyan-500/20 border-cyan-500/40 text-cyan-300" onClick={() => toggleKeeper(s.player_id)} />
                        <div className="flex flex-col">
                          <button onClick={() => move(i, -1)} className="text-falcon-cream/30 hover:text-falcon-cream"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => move(i, 1)} className="text-falcon-cream/30 hover:text-falcon-cream"><ChevronDown className="w-3.5 h-3.5" /></button>
                        </div>
                        <button onClick={() => remove(s.player_id)} className="p-0.5 text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add pool */}
            <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Add players</h2>
              {pool.length === 0 ? (
                <p className="text-falcon-cream/20 text-xs text-center py-8">Everyone available is selected.</p>
              ) : (
                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                  {pool.map((p) => {
                    const pill = STATUS_PILL[statusOf(p.player_id)];
                    return (
                      <button key={p.player_id} onClick={() => add(p.player_id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-falcon-gold/30 text-left">
                        <Plus className="w-3.5 h-3.5 text-falcon-gold/70" />
                        <span className="text-falcon-cream text-sm flex-1 truncate">{p.name}</span>
                        <span className="text-[10px] text-falcon-cream/30">{p.role}</span>
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${pill.cls}`}>{pill.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
