import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Flame, TrendingUp, Award, Zap, Crosshair, CircleDot, Percent, Star, Shield } from "lucide-react";
import type { PlayerStatsEntry } from "@/data/stats";

interface PlayerStatsDialogProps {
  player: PlayerStatsEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  index: number;
}

function StatCard({ label, value, icon: Icon, color, index }: StatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      className="glass-dark rounded-xl p-3 text-center group hover:scale-105 transition-transform duration-200 cursor-default"
    >
      <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xl font-display font-bold text-falcon-cream">
        {value}
      </p>
      <p className="text-xs text-falcon-cream/50 uppercase tracking-wide">
        {label}
      </p>
    </motion.div>
  );
}

function val(v: number | string | undefined, fallback = "–"): string | number {
  return v != null && v !== 0 ? v : fallback;
}

export function PlayerStatsDialog({ player, open, onOpenChange }: PlayerStatsDialogProps) {
  if (!player) return null;

  const { batting: bat, bowling: bowl, fielding: field } = player;
  const hasBatting = bat && Object.keys(bat).length > 0;
  const hasBowling = bowl && Object.keys(bowl).length > 0;
  const hasFielding = field && Object.keys(field).length > 0;

  const battingStats = hasBatting
    ? [
        { label: "Runs", value: val(bat.runs), icon: TrendingUp, color: "from-emerald-400 to-green-500" },
        { label: "Average", value: val(bat.average), icon: Percent, color: "from-falcon-gold to-amber-500" },
        { label: "Strike Rate", value: val(bat.strike_rate), icon: Zap, color: "from-rose-400 to-red-500" },
        { label: "High Score", value: bat.highest_score_not_out ? `${bat.highest_score}*` : val(bat.highest_score), icon: Star, color: "from-violet-400 to-purple-500" },
        { label: "Innings", value: val(bat.innings), icon: Trophy, color: "from-cyan-400 to-blue-500" },
        { label: "50s", value: val(bat.fifties), icon: Award, color: "from-cyan-400 to-blue-500" },
        { label: "4s", value: val(bat.fours), icon: Crosshair, color: "from-orange-400 to-amber-500" },
        { label: "6s", value: val(bat.sixes), icon: Flame, color: "from-pink-400 to-rose-500" },
      ]
    : [];

  const bowlingStats = hasBowling
    ? [
        { label: "Wickets", value: val(bowl.wickets), icon: Target, color: "from-rose-400 to-red-500" },
        { label: "Economy", value: val(bowl.economy), icon: TrendingUp, color: "from-emerald-400 to-green-500" },
        { label: "Average", value: val(bowl.average), icon: Percent, color: "from-falcon-gold to-amber-500" },
        { label: "Best", value: val(bowl.best_figures), icon: Star, color: "from-violet-400 to-purple-500" },
        { label: "Innings", value: val(bowl.innings), icon: Trophy, color: "from-cyan-400 to-blue-500" },
        { label: "Overs", value: val(bowl.overs), icon: CircleDot, color: "from-orange-400 to-amber-500" },
        { label: "Maidens", value: val(bowl.maidens), icon: Shield, color: "from-teal-400 to-cyan-500" },
        { label: "Runs Given", value: val(bowl.runs_conceded), icon: Zap, color: "from-pink-400 to-rose-500" },
      ]
    : [];

  const fieldingStats = hasFielding
    ? [
        { label: "Catches", value: val(field.catches), icon: Target, color: "from-cyan-400 to-blue-500" },
        { label: "Run Outs", value: val(field.run_outs), icon: Zap, color: "from-orange-400 to-red-500" },
        { label: "Stumpings", value: val(field.stumpings), icon: Shield, color: "from-teal-400 to-cyan-500" },
        { label: "Dismissals", value: val(field.total_dismissals), icon: Award, color: "from-violet-400 to-purple-500" },
      ]
    : [];

  const defaultTab = hasBatting ? "batting" : hasBowling ? "bowling" : "fielding";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-falcon-navy/95 backdrop-blur-2xl border-falcon-gold/20 text-falcon-cream overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-falcon-gold/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-falcon-gold/5 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-md opacity-60" />
              {player.profile_photo && !player.profile_photo.includes("default") ? (
                <img
                  src={player.profile_photo}
                  alt={player.name}
                  className="relative w-20 h-20 rounded-full object-cover border-2 border-falcon-gold/50"
                />
              ) : (
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-falcon-gold/40 to-falcon-gold/20 flex items-center justify-center border-2 border-falcon-gold/50">
                  <span className="font-display text-3xl font-bold text-falcon-gold">
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
            </motion.div>

            <div>
              <DialogTitle className="text-2xl font-display text-falcon-cream">
                {player.name}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 mt-6"
        >
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-falcon-navy-light/50 border border-falcon-gold/20">
              {hasBatting && (
                <TabsTrigger
                  value="batting"
                  className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
                >
                  Batting
                </TabsTrigger>
              )}
              {hasBowling && (
                <TabsTrigger
                  value="bowling"
                  className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
                >
                  Bowling
                </TabsTrigger>
              )}
              {hasFielding && (
                <TabsTrigger
                  value="fielding"
                  className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
                >
                  Fielding
                </TabsTrigger>
              )}
              {!hasBatting && <TabsTrigger value="_" disabled className="text-falcon-cream/30">Batting</TabsTrigger>}
              {!hasBowling && <TabsTrigger value="_b" disabled className="text-falcon-cream/30">Bowling</TabsTrigger>}
              {!hasFielding && <TabsTrigger value="_f" disabled className="text-falcon-cream/30">Fielding</TabsTrigger>}
            </TabsList>

            {hasBatting && (
              <TabsContent value="batting" className="mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="batting"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {battingStats.map((stat, index) => (
                      <StatCard key={stat.label} {...stat} index={index} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            )}

            {hasBowling && (
              <TabsContent value="bowling" className="mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="bowling"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {bowlingStats.map((stat, index) => (
                      <StatCard key={stat.label} {...stat} index={index} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            )}

            {hasFielding && (
              <TabsContent value="fielding" className="mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="fielding"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {fieldingStats.map((stat, index) => (
                      <StatCard key={stat.label} {...stat} index={index} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
