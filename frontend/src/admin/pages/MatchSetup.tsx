import { useState, useMemo } from "react";
import { Settings, Zap, Users, Timer, Plus, Trash2, AlertTriangle } from "lucide-react";
import { loadSetup, saveSetup, getFormatConfig, FORMAT_CONFIGS, loadState } from "@/admin/store";
import type { MatchSetup, FormatType, ImpactSub, ImpactSubType } from "@/admin/store";

const FORMATS: { value: FormatType; label: string }[] = [
  { value: "T20", label: "T20 (20 overs)" },
  { value: "T15", label: "T15 (15 overs)" },
  { value: "T10", label: "T10 (10 overs)" },
  { value: "T5", label: "T5 (5 overs)" },
  { value: "CUSTOM", label: "Custom" },
];

const PLAYER_COUNTS = [11, 10, 9, 8, 7];
const IMPACT_TYPES: { value: ImpactSubType; label: string; color: string }[] = [
  { value: "batting", label: "Batting Impact", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "bowling", label: "Bowling Impact", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "flexible", label: "Flexible", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
];

export default function MatchSetupPage() {
  const [setup, setSetup] = useState<MatchSetup>(loadSetup);
  const state = loadState();
  const config = getFormatConfig(setup);

  const update = (patch: Partial<MatchSetup>) => {
    const next = { ...setup, ...patch };
    setSetup(next);
    saveSetup(next);
    window.dispatchEvent(new Event("matchSetupChanged"));
  };

  const availablePlayers = useMemo(
    () => state.squad.filter((p) => p.active && p.available && p.fitness === "Fit" && !setup.impactSubs.some((s) => s.player_id === p.player_id)),
    [state.squad, setup.impactSubs]
  );

  const addImpactSub = (playerId: number) => {
    if (setup.impactSubs.length >= 3) return;
    update({ impactSubs: [...setup.impactSubs, { player_id: playerId, type: "flexible" }] });
  };

  const removeImpactSub = (playerId: number) => {
    update({ impactSubs: setup.impactSubs.filter((s) => s.player_id !== playerId) });
  };

  const updateSubType = (playerId: number, type: ImpactSubType) => {
    update({ impactSubs: setup.impactSubs.map((s) => (s.player_id === playerId ? { ...s, type } : s)) });
  };

  const activationSuggestion = useMemo(() => {
    if (!setup.impactSubEnabled || setup.impactSubs.length === 0) return null;
    const overs = config.overs;
    const batSubs = setup.impactSubs.filter((s) => s.type === "batting").length;
    const bowlSubs = setup.impactSubs.filter((s) => s.type === "bowling").length;
    const suggestions: string[] = [];
    if (batSubs > 0) suggestions.push(`Activate batting impact after ${Math.floor(overs * 0.5)} overs if chasing 8+ RPO`);
    if (bowlSubs > 0) suggestions.push(`Activate bowling impact during death (over ${config.deathStart}+) if defending`);
    if (setup.impactSubs.some((s) => s.type === "flexible")) suggestions.push("Flexible sub: assess match situation at innings break");
    return suggestions;
  }, [setup, config]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
          <Settings className="w-6 h-6 text-falcon-gold" /> Match Setup
        </h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Configure format, players, and impact substitute rules before building your XI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format Selection */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide flex items-center gap-2">
            <Timer className="w-4 h-4" /> Match Format
          </h2>
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => update({ format: f.value })}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  setup.format === f.value
                    ? "bg-falcon-gold/15 text-falcon-gold border border-falcon-gold/30"
                    : "text-falcon-cream/60 hover:text-falcon-cream hover:bg-white/5 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {setup.format === "CUSTOM" && (
            <div className="pt-2">
              <label className="text-xs text-falcon-cream/40 mb-1 block">Custom Overs</label>
              <input
                type="number" min={2} max={50}
                value={setup.customOvers}
                onChange={(e) => update({ customOvers: Math.max(2, parseInt(e.target.value) || 2) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-falcon-cream text-sm focus:outline-none focus:border-falcon-gold/40"
              />
            </div>
          )}

          {/* Format details */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <p className="text-xs text-falcon-cream/50 italic">{config.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Total Overs", value: config.overs },
                { label: "Max/Bowler", value: config.maxPerBowler },
                { label: "Powerplay", value: `1–${config.powerplayOvers}` },
                { label: "Middle", value: `${config.middleStart}–${config.middleEnd}` },
                { label: "Death", value: `${config.deathStart}–${config.overs}` },
                { label: "Aggression", value: config.aggression.toUpperCase() },
              ].map((d) => (
                <div key={d.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
                  <div className="text-falcon-cream/30">{d.label}</div>
                  <div className="text-falcon-cream font-semibold">{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Count */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4" /> Number of Players
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {PLAYER_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => update({ playerCount: n })}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  setup.playerCount === n
                    ? "bg-falcon-gold/15 text-falcon-gold border border-falcon-gold/30"
                    : "bg-white/[0.03] text-falcon-cream/50 hover:text-falcon-cream hover:bg-white/5 border border-transparent"
                }`}
              >
                {n}
              </button>
            ))}
            <input
              type="number" min={5} max={15}
              value={![...PLAYER_COUNTS].includes(setup.playerCount) ? setup.playerCount : ""}
              placeholder="Other"
              onChange={(e) => { const v = parseInt(e.target.value); if (v >= 5 && v <= 15) update({ playerCount: v }); }}
              className="py-3 px-2 rounded-xl text-sm font-bold text-center bg-white/[0.03] text-falcon-cream border border-white/10 focus:outline-none focus:border-falcon-gold/40 placeholder:text-falcon-cream/20"
            />
          </div>

          {/* Calculated Requirements */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <h3 className="text-xs text-falcon-cream/40 uppercase">Requirements</h3>
            <div className="space-y-1.5 text-xs">
              {[
                { label: "Min bowling options", value: `${Math.min(config.minBowlers, setup.playerCount - 3)}` },
                { label: "Role balance", value: `${Math.max(1, Math.floor(setup.playerCount * 0.45))} bat · ${Math.max(1, Math.floor(setup.playerCount * 0.35))} bowl · ${Math.max(1, Math.floor(setup.playerCount * 0.2))} AR` },
                { label: "Phase coverage", value: setup.playerCount >= 10 ? "Full" : setup.playerCount >= 8 ? "Moderate" : "Limited" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between bg-white/[0.03] rounded-lg px-3 py-2">
                  <span className="text-falcon-cream/40">{r.label}</span>
                  <span className="text-falcon-cream font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {setup.playerCount < 11 && (
            <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Playing with {setup.playerCount} — bowling coverage will be tight. Consider using more all-rounders.</span>
            </div>
          )}
        </div>

        {/* Impact Substitute */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4" /> Impact Substitute
          </h2>

          <button
            onClick={() => update({ impactSubEnabled: !setup.impactSubEnabled, impactSubs: setup.impactSubEnabled ? [] : setup.impactSubs })}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              setup.impactSubEnabled
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-white/[0.03] text-falcon-cream/40 border border-white/10 hover:border-white/20"
            }`}
          >
            {setup.impactSubEnabled ? "Impact Sub: ON" : "Impact Sub: OFF"}
          </button>

          {setup.impactSubEnabled && (
            <>
              <div className="space-y-2">
                <h3 className="text-xs text-falcon-cream/40">Substitutes ({setup.impactSubs.length}/3)</h3>
                {setup.impactSubs.map((sub) => {
                  const sp = state.squad.find((p) => p.player_id === sub.player_id);
                  return (
                    <div key={sub.player_id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                      <span className="text-falcon-cream text-sm flex-1 truncate">{sp?.name}</span>
                      <select
                        value={sub.type}
                        onChange={(e) => updateSubType(sub.player_id, e.target.value as ImpactSubType)}
                        className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-falcon-cream focus:outline-none"
                      >
                        {IMPACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <button onClick={() => removeImpactSub(sub.player_id)} className="text-falcon-cream/20 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {setup.impactSubs.length < 3 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <h3 className="text-xs text-falcon-cream/40">Add player</h3>
                  {availablePlayers.slice(0, 10).map((p) => (
                    <button
                      key={p.player_id}
                      onClick={() => addImpactSub(p.player_id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-white/5 transition-colors text-xs"
                    >
                      <span className="text-falcon-cream flex-1">{p.name}</span>
                      <span className="text-falcon-cream/30">{p.role}</span>
                      <Plus className="w-3 h-3 text-falcon-cream/20" />
                    </button>
                  ))}
                </div>
              )}

              {/* Strategic suggestions */}
              {activationSuggestion && (
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <h3 className="text-xs text-falcon-cream/40 uppercase">When to Activate</h3>
                  {activationSuggestion.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-2 rounded-lg">
                      <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Format Comparison */}
      <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-4">Format Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-falcon-cream/40 border-b border-white/5">
                <th className="text-left py-2 px-3 font-medium">Format</th>
                <th className="text-center py-2 px-3 font-medium">Overs</th>
                <th className="text-center py-2 px-3 font-medium">Max/Bowler</th>
                <th className="text-center py-2 px-3 font-medium">Powerplay</th>
                <th className="text-center py-2 px-3 font-medium">Death</th>
                <th className="text-center py-2 px-3 font-medium">Anchors</th>
                <th className="text-center py-2 px-3 font-medium">Finishers</th>
                <th className="text-center py-2 px-3 font-medium">Aggression</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FORMAT_CONFIGS).map(([key, fc]) => (
                <tr key={key} className={`border-b border-white/[0.03] ${key === setup.format ? "bg-falcon-gold/5" : ""}`}>
                  <td className={`py-2.5 px-3 font-semibold ${key === setup.format ? "text-falcon-gold" : "text-falcon-cream"}`}>{key}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">{fc.overs}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">{fc.maxPerBowler}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">1–{fc.powerplayOvers}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">{fc.deathStart}–{fc.overs}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">{fc.anchorsNeeded}</td>
                  <td className="text-center py-2.5 px-3 text-falcon-cream/60">{fc.finishersNeeded}</td>
                  <td className="text-center py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-medium ${
                      fc.aggression === "extreme" ? "bg-red-500/15 text-red-400" :
                      fc.aggression === "high" ? "bg-amber-500/15 text-amber-400" :
                      "bg-emerald-500/15 text-emerald-400"
                    }`}>{fc.aggression.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
