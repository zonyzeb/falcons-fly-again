import { useState, useMemo } from "react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Swords, GripVertical, Crown, Star, Shield, AlertTriangle, Check, Plus, Trash2, Save, Wand2 } from "lucide-react";
import { loadState, saveState, getPlayerStats, loadSetup, getFormatConfig, getMinBowlersForCount, generateSmartXI, aggressionIndex, stabilityScore, finishingPower } from "@/admin/store";
import type { SquadPlayer, TeamCombination, CombinationPlayer } from "@/admin/store";

function SortablePlayer({
  cp, squad, onUpdate, onRemove,
}: {
  cp: CombinationPlayer;
  squad: SquadPlayer[];
  onUpdate: (id: number, u: Partial<CombinationPlayer>) => void;
  onRemove: (id: number) => void;
}) {
  const sp = squad.find((s) => s.player_id === cp.player_id);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cp.player_id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const phaseBg = cp.battingPhase === "top" ? "border-l-rose-400" : cp.battingPhase === "middle" ? "border-l-emerald-400" : "border-l-violet-400";

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-[#0d1424] border border-white/5 border-l-2 ${phaseBg} rounded-xl px-3 py-2 group hover:border-falcon-gold/20 transition-colors`}>
      <button {...attributes} {...listeners} className="text-falcon-cream/20 hover:text-falcon-cream/50 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="w-6 text-center text-xs font-bold text-falcon-gold">{cp.battingOrder}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {sp?.photo && !sp.photo.includes("default") ? (
          <img src={sp.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold text-xs font-bold">
            {sp?.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <span className="text-falcon-cream text-sm font-medium truncate block">{sp?.name}</span>
          <span className="text-[10px] text-falcon-cream/30">{sp?.role} · {cp.battingPhase || "—"} · {cp.bowlingPhase || "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate(cp.player_id, { isCaptain: !cp.isCaptain, isViceCaptain: false })} title="Captain"
          className={`p-1.5 rounded-lg transition-colors ${cp.isCaptain ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}>
          <Crown className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onUpdate(cp.player_id, { isViceCaptain: !cp.isViceCaptain, isCaptain: false })} title="Vice Captain"
          className={`p-1.5 rounded-lg transition-colors ${cp.isViceCaptain ? "bg-violet-500/20 text-violet-400" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}>
          <Star className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onUpdate(cp.player_id, { isKeeper: !cp.isKeeper })} title="Wicketkeeper"
          className={`p-1.5 rounded-lg transition-colors ${cp.isKeeper ? "bg-cyan-500/20 text-cyan-400" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}>
          <Shield className="w-3.5 h-3.5" />
        </button>
        <select
          value={cp.battingPhase || ""}
          onChange={(e) => onUpdate(cp.player_id, { battingPhase: e.target.value as CombinationPlayer["battingPhase"] })}
          className="bg-white/5 border border-white/10 rounded-md px-1 py-0.5 text-[10px] text-falcon-cream focus:outline-none w-14"
        >
          <option value="top">Top</option>
          <option value="middle">Mid</option>
          <option value="finisher">Fin</option>
        </select>
        <button onClick={() => onRemove(cp.player_id)} className="p-1.5 rounded-lg text-falcon-cream/20 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CombinationsPage() {
  const [state, setState] = useState(loadState);
  const setup = loadSetup();
  const config = getFormatConfig(setup);
  const [xi, setXi] = useState<CombinationPlayer[]>([]);
  const [comboName, setComboName] = useState("");
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const targetCount = setup.playerCount;

  const availablePlayers = useMemo(
    () => state.squad.filter((p) => p.active && p.available && p.fitness === "Fit" && !xi.some((x) => x.player_id === p.player_id)),
    [state.squad, xi]
  );

  const addPlayer = (p: SquadPlayer) => {
    if (xi.length >= targetCount) return;
    setXi((prev) => [
      ...prev,
      {
        player_id: p.player_id,
        battingOrder: prev.length + 1,
        bowlingPriority: 0,
        isCaptain: false,
        isViceCaptain: false,
        isKeeper: p.role === "WK",
        battingPhase: prev.length < 3 ? "top" : prev.length < 7 ? "middle" : "finisher",
        bowlingPhase: (p.role === "BOWL" || p.role === "ALL") ? "middle" : "",
      },
    ]);
  };

  const removePlayer = (id: number) => {
    setXi((prev) => prev.filter((p) => p.player_id !== id).map((p, i) => ({ ...p, battingOrder: i + 1 })));
  };

  const updatePlayer = (id: number, updates: Partial<CombinationPlayer>) => {
    setXi((prev) => {
      let next = prev.map((p) => (p.player_id === id ? { ...p, ...updates } : p));
      if (updates.isCaptain) next = next.map((p) => (p.player_id !== id ? { ...p, isCaptain: false } : p));
      if (updates.isViceCaptain) next = next.map((p) => (p.player_id !== id ? { ...p, isViceCaptain: false } : p));
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setXi((prev) => {
        const oldIndex = prev.findIndex((p) => p.player_id === active.id);
        const newIndex = prev.findIndex((p) => p.player_id === over.id);
        return arrayMove(prev, oldIndex, newIndex).map((p, i) => ({ ...p, battingOrder: i + 1 }));
      });
    }
  };

  // Generate smart XIs
  const handleGenerate = (variant: "balanced" | "aggressive" | "defensive") => {
    const result = generateSmartXI(state.squad, setup, variant);
    setXi(result.players);
    setComboName(result.label);
  };

  const bowlerCount = xi.filter((p) => {
    const sp = state.squad.find((s) => s.player_id === p.player_id);
    return sp && (sp.role === "BOWL" || sp.role === "ALL");
  }).length;
  const keeperCount = xi.filter((p) => p.isKeeper).length;
  const minBowlers = getMinBowlersForCount(targetCount, config);

  const totalAggr = xi.reduce((s, p) => s + aggressionIndex(p.player_id), 0);
  const totalStab = xi.reduce((s, p) => s + stabilityScore(p.player_id), 0);
  const totalFin = xi.reduce((s, p) => s + finishingPower(p.player_id), 0);
  const maxScore = Math.max(totalAggr, totalStab, totalFin) || 1;

  const validations = [
    { ok: xi.length === targetCount, label: `${targetCount} players selected`, warn: `${xi.length}/${targetCount} selected` },
    { ok: bowlerCount >= minBowlers, label: `${minBowlers}+ bowling options`, warn: `${bowlerCount}/${minBowlers} bowlers` },
    { ok: keeperCount >= 1, label: "Wicketkeeper assigned", warn: "No keeper" },
    { ok: xi.some((p) => p.isCaptain), label: "Captain assigned", warn: "No captain" },
  ];

  const saveCombination = () => {
    if (!comboName.trim() || xi.length === 0) return;
    const combo: TeamCombination = {
      id: selectedCombo || Date.now().toString(),
      name: comboName,
      created: new Date().toISOString(),
      players: xi,
      notes: "",
      format: setup.format,
      playerCount: setup.playerCount,
    };
    const next = {
      ...state,
      combinations: selectedCombo
        ? state.combinations.map((c) => (c.id === selectedCombo ? combo : c))
        : [...state.combinations, combo],
    };
    setState(next);
    saveState(next);
    setSelectedCombo(combo.id);
  };

  const loadCombo = (combo: TeamCombination) => {
    setXi(combo.players);
    setComboName(combo.name);
    setSelectedCombo(combo.id);
  };

  const deleteCombo = (id: string) => {
    const next = { ...state, combinations: state.combinations.filter((c) => c.id !== id) };
    setState(next);
    saveState(next);
    if (selectedCombo === id) { setSelectedCombo(null); setXi([]); setComboName(""); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
            <Swords className="w-6 h-6 text-falcon-gold" /> XI Builder
          </h1>
          <p className="text-falcon-cream/40 text-sm mt-1">{config.label} · {targetCount} players · Max {config.maxPerBowler} ov/bowler</p>
        </div>
        <div className="flex gap-2">
          {(["balanced", "aggressive", "defensive"] as const).map((v) => (
            <button key={v} onClick={() => handleGenerate(v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-falcon-gold/10 border border-white/10 hover:border-falcon-gold/30 rounded-lg text-xs font-medium text-falcon-cream/60 hover:text-falcon-gold transition-all">
              <Wand2 className="w-3.5 h-3.5" />
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Players */}
        <div className="lg:col-span-3 bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Available ({availablePlayers.length})</h2>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {availablePlayers.map((p) => {
              const stats = getPlayerStats(p.player_id);
              return (
                <button key={p.player_id} onClick={() => addPlayer(p)} disabled={xi.length >= targetCount}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors disabled:opacity-30">
                  {p.photo && !p.photo.includes("default") ? (
                    <img src={p.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold text-[10px] font-bold">{p.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-falcon-cream text-xs block truncate">{p.name}</span>
                    <span className="text-[10px] text-falcon-cream/30">{stats?.batting?.runs || 0}r · {stats?.bowling?.wickets || 0}w</span>
                  </div>
                  <span className="text-falcon-cream/20 text-[10px]">{p.role}</span>
                  <Plus className="w-3 h-3 text-falcon-cream/20" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Playing XI */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <input value={comboName} onChange={(e) => setComboName(e.target.value)} placeholder="Combination name..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40" />
            <button onClick={saveCombination} disabled={!comboName.trim() || xi.length === 0}
              className="px-3 py-2 bg-falcon-gold/20 text-falcon-gold rounded-lg text-sm font-medium hover:bg-falcon-gold/30 transition-colors disabled:opacity-30">
              <Save className="w-4 h-4" />
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={xi.map((p) => p.player_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {xi.map((cp) => (
                  <SortablePlayer key={cp.player_id} cp={cp} squad={state.squad} onUpdate={updatePlayer} onRemove={removePlayer} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {xi.length === 0 && (
            <div className="text-center py-8 text-falcon-cream/20 text-sm">Use Auto-Generate or click players to build your XI</div>
          )}
        </div>

        {/* Validation & Scores */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Validation</h2>
            {validations.map((v) => (
              <div key={v.label} className={`flex items-center gap-2 text-sm ${v.ok ? "text-emerald-400" : "text-amber-400"}`}>
                {v.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {v.ok ? v.label : v.warn}
              </div>
            ))}
          </div>

          {/* Team Scores */}
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Team Scores</h2>
            {[
              { label: "Aggression Index", value: totalAggr, color: "bg-rose-500", recommended: config.aggression === "extreme" || config.aggression === "high" },
              { label: "Stability Score", value: totalStab, color: "bg-emerald-500", recommended: config.aggression === "medium" || config.aggression === "low" },
              { label: "Finishing Power", value: totalFin, color: "bg-violet-500", recommended: true },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-falcon-cream/50">{s.label} {s.recommended && <span className="text-falcon-gold">★</span>}</span>
                  <span className="text-falcon-cream font-semibold">{s.value}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color}/50 rounded-full transition-all`} style={{ width: `${Math.min(100, (s.value / maxScore) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Saved Combinations */}
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Saved ({state.combinations.length})</h2>
            {state.combinations.length === 0 && <p className="text-falcon-cream/20 text-xs">No combinations saved yet</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {state.combinations.map((c) => (
                <div key={c.id} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedCombo === c.id ? "bg-falcon-gold/10 border border-falcon-gold/20" : "hover:bg-white/5"}`}>
                  <button onClick={() => loadCombo(c)} className="text-falcon-cream text-sm flex-1 text-left truncate">
                    {c.name}
                    {c.format && <span className="text-falcon-cream/30 text-xs ml-1">({c.format})</span>}
                  </button>
                  <button onClick={() => deleteCombo(c.id)} className="text-falcon-cream/20 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
