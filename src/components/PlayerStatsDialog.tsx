import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Flame, TrendingUp, Award, Zap, Crosshair, CircleDot, Percent, Clock, Star, Shield } from "lucide-react";

export interface PlayerStats {
  name: string;
  role: string;
  stat: string;
  // Overall
  matches?: number;
  catches?: number;
  runOuts?: number;
  manOfMatch?: number;
  // Batting
  runs?: number;
  battingAverage?: number;
  strikeRate?: number;
  highScore?: string;
  fifties?: number;
  fours?: number;
  sixes?: number;
  notOuts?: number;
  // Bowling
  wickets?: number;
  bowlingAverage?: number;
  economy?: number;
  bestBowling?: string;
  threeWickets?: number;
  maidens?: number;
  dotBalls?: number;
  speciality?: string;
}

interface PlayerStatsDialogProps {
  player: PlayerStats | null;
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

export function PlayerStatsDialog({ player, open, onOpenChange }: PlayerStatsDialogProps) {
  if (!player) return null;

  const overallStats = [
    { label: "Matches", value: player.matches ?? "–", icon: Trophy, color: "from-falcon-gold to-amber-500" },
    { label: "Catches", value: player.catches ?? "–", icon: Target, color: "from-cyan-400 to-blue-500" },
    { label: "Run Outs", value: player.runOuts ?? "–", icon: Zap, color: "from-orange-400 to-red-500" },
    { label: "Man of Match", value: player.manOfMatch ?? "–", icon: Award, color: "from-violet-400 to-purple-500" },
  ];

  const battingStats = [
    { label: "Runs", value: player.runs ?? "–", icon: TrendingUp, color: "from-emerald-400 to-green-500" },
    { label: "Average", value: player.battingAverage ?? "–", icon: Percent, color: "from-falcon-gold to-amber-500" },
    { label: "Strike Rate", value: player.strikeRate ?? "–", icon: Zap, color: "from-rose-400 to-red-500" },
    { label: "High Score", value: player.highScore ?? "–", icon: Star, color: "from-violet-400 to-purple-500" },
    { label: "50s", value: player.fifties ?? "–", icon: Award, color: "from-cyan-400 to-blue-500" },
    { label: "4s", value: player.fours ?? "–", icon: Crosshair, color: "from-orange-400 to-amber-500" },
    { label: "6s", value: player.sixes ?? "–", icon: Flame, color: "from-pink-400 to-rose-500" },
    { label: "Not Outs", value: player.notOuts ?? "–", icon: Shield, color: "from-teal-400 to-cyan-500" },
  ];

  const bowlingStats = [
    { label: "Wickets", value: player.wickets ?? "–", icon: Target, color: "from-rose-400 to-red-500" },
    { label: "Average", value: player.bowlingAverage ?? "–", icon: Percent, color: "from-falcon-gold to-amber-500" },
    { label: "Economy", value: player.economy ?? "–", icon: TrendingUp, color: "from-emerald-400 to-green-500" },
    { label: "Best", value: player.bestBowling ?? "–", icon: Star, color: "from-violet-400 to-purple-500" },
    { label: "3W Hauls", value: player.threeWickets ?? "–", icon: Award, color: "from-cyan-400 to-blue-500" },
    { label: "Maidens", value: player.maidens ?? "–", icon: Shield, color: "from-teal-400 to-cyan-500" },
    { label: "Dot Balls", value: player.dotBalls ?? "–", icon: CircleDot, color: "from-orange-400 to-amber-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-falcon-navy/95 backdrop-blur-2xl border-falcon-gold/20 text-falcon-cream overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-falcon-gold/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-falcon-gold/5 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            {/* Large Avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-md opacity-60" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-falcon-gold/40 to-falcon-gold/20 flex items-center justify-center border-2 border-falcon-gold/50">
                <span className="font-display text-3xl font-bold text-falcon-gold">
                  {player.name.charAt(0)}
                </span>
              </div>
            </motion.div>

            <div>
              <DialogTitle className="text-2xl font-display text-falcon-cream">
                {player.name}
              </DialogTitle>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-falcon-gold font-medium"
              >
                {player.role}
              </motion.p>
            </div>
          </div>

          {/* Quote */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-dark rounded-xl p-4 mt-4"
          >
            <p className="text-falcon-cream/70 italic text-sm leading-relaxed">
              "{player.stat}"
            </p>
            {player.speciality && (
              <p className="text-falcon-gold/80 text-xs mt-2 font-medium">
                Speciality: {player.speciality}
              </p>
            )}
          </motion.div>
        </DialogHeader>

        {/* Tabbed Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 mt-6"
        >
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-falcon-navy-light/50 border border-falcon-gold/20">
              <TabsTrigger 
                value="overall" 
                className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
              >
                Overall
              </TabsTrigger>
              <TabsTrigger 
                value="batting"
                className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
              >
                Batting
              </TabsTrigger>
              <TabsTrigger 
                value="bowling"
                className="data-[state=active]:bg-falcon-gold/20 data-[state=active]:text-falcon-gold text-falcon-cream/70"
              >
                Bowling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="overall"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {overallStats.map((stat, index) => (
                    <StatCard key={stat.label} {...stat} index={index} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

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
          </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
