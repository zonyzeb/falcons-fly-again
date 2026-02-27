import { useState, useMemo } from "react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Swords, GripVertical, Crown, Star, Shield, AlertTriangle, Check, Plus, Trash2, Save } from "lucide-react";
import { loadState, saveState, getPlayerStats } from "@/admin/store";
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
  const stats = getPlayerStats(cp.player_id);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cp.player_id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-[#0d1424] border border-white/5 rounded-xl px-3 py-2.5 group hover:border-falcon-gold/20 transition-colors">
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
        <span className="text-falcon-cream text-sm font-medium truncate">{sp?.name}</span>
        <span className="text-falcon-cream/30 text-xs">{sp?.role}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate(cp.player_id, { isCaptain: !cp.isCaptain, isViceCaptain: false })}
          title="Captain"
          className={`p-1.5 rounded-lg transition-colors ${cp.isCaptain ? "bg-falcon-gold/20 text-falcon-gold" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}
        >
          <Crown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdate(cp.player_id, { isViceCaptain: !cp.isViceCaptain, isCaptain: false })}
          title="Vice Captain"
          className={`p-1.5 rounded-lg transition-colors ${cp.isViceCaptain ? "bg-violet-500/20 text-violet-400" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}
        >
          <Star className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdate(cp.player_id, { isKeeper: !cp.isKeeper })}
          title="Wicketkeeper"
          className={`p-1.5 rounded-lg transition-colors ${cp.isKeeper ? "bg-cyan-500/20 text-cyan-400" : "text-falcon-cream/20 hover:text-falcon-cream/50"}`}
        >
          <Shield className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onRemove(cp.player_id)} className="p-1.5 rounded-lg text-falcon-cream/20 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CombinationsPage() {
  const [state, setState] = useState(loadState);
  const [xi, setXi] = useState<CombinationPlayer[]>([]);
  const [comboName, setComboName] = useState("");
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const availablePlayers = useMemo(
    () => state.squad.filter((p) => p.active && p.available && p.fitness === "Fit" && !xi.some((x) => x.player_id === p.player_id)),
    [state.squad, xi]
  );

  const addPlayer = (p: SquadPlayer) => {
    if (xi.length >= 11) return;
    setXi((prev) => [
      ...prev,
      {
        player_id: p.player_id,
        battingOrder: prev.length + 1,
        bowlingPriority: 0,
        isCaptain: false,
        isViceCaptain: false,
        isKeeper: p.role === "WK",
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

  const bowlerCount = xi.filter((p) => {
    const sp = state.squad.find((s) => s.player_id === p.player_id);
    return sp && (sp.role === "BOWL" || sp.role === "ALL");
  }).length;
  const keeperCount = xi.filter((p) => p.isKeeper).length;
  const batStrength = xi.reduce((sum, p) => sum + (getPlayerStats(p.player_id)?.batting?.runs || 0), 0);
  const bowlStrength = xi.reduce((sum, p) => sum + (getPlayerStats(p.player_id)?.bowling?.wickets || 0), 0);
  const totalStrength = batStrength + bowlStrength || 1;

  const validations = [
    { ok: xi.length === 11, label: "11 players selected", warn: `${xi.length}/11 selected` },
    { ok: bowlerCount >= 5, label: "5+ bowling options", warn: `${bowlerCount}/5 bowlers` },
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
      <h1 className="text-2xl font-display font-bold text-falcon-cream flex items-center gap-3">
        <Swords className="w-6 h-6 text-falcon-gold" /> Playing XI Builder
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Players */}
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide mb-3">Available ({availablePlayers.length})</h2>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {availablePlayers.map((p) => (
              <button
                key={p.player_id}
                onClick={() => addPlayer(p)}
                disabled={xi.length >= 11}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors disabled:opacity-30"
              >
                {p.photo && !p.photo.includes("default") ? (
                  <img src={p.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-falcon-gold/20 flex items-center justify-center text-falcon-gold text-xs font-bold">
                    {p.name.charAt(0)}
                  </div>
                )}
                <span className="text-falcon-cream text-sm flex-1 truncate">{p.name}</span>
                <span className="text-falcon-cream/30 text-xs">{p.role}</span>
                <Plus className="w-3.5 h-3.5 text-falcon-cream/20" />
              </button>
            ))}
          </div>
        </div>

        {/* Playing XI */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder="Combination name..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-falcon-cream placeholder:text-falcon-cream/30 focus:outline-none focus:border-falcon-gold/40"
            />
            <button
              onClick={saveCombination}
              disabled={!comboName.trim() || xi.length === 0}
              className="px-3 py-2 bg-falcon-gold/20 text-falcon-gold rounded-lg text-sm font-medium hover:bg-falcon-gold/30 transition-colors disabled:opacity-30"
            >
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
            <div className="text-center py-8 text-falcon-cream/20 text-sm">Click players to add them to the XI</div>
          )}
        </div>

        {/* Validation & Strength */}
        <div className="space-y-4">
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Validation</h2>
            {validations.map((v) => (
              <div key={v.label} className={`flex items-center gap-2 text-sm ${v.ok ? "text-emerald-400" : "text-amber-400"}`}>
                {v.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {v.ok ? v.label : v.warn}
              </div>
            ))}
          </div>

          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Team Balance</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-falcon-cream/50">
                <span>Batting</span><span>Bowling</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500/60 transition-all" style={{ width: `${(batStrength / totalStrength) * 100}%` }} />
                <div className="bg-rose-500/60 transition-all" style={{ width: `${(bowlStrength / totalStrength) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">{batStrength} runs</span>
                <span className="text-rose-400">{bowlStrength} wkts</span>
              </div>
            </div>
          </div>

          {/* Saved Combinations */}
          <div className="bg-[#0d1424] border border-white/5 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-falcon-cream/60 uppercase tracking-wide">Saved ({state.combinations.length})</h2>
            {state.combinations.length === 0 && <p className="text-falcon-cream/20 text-xs">No combinations saved yet</p>}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {state.combinations.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedCombo === c.id ? "bg-falcon-gold/10 border border-falcon-gold/20" : "hover:bg-white/5"}`}
                >
                  <button onClick={() => loadCombo(c)} className="text-falcon-cream text-sm flex-1 text-left truncate">{c.name}</button>
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
