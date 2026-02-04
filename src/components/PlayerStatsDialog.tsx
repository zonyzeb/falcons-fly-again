import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Flame, TrendingUp, Award, Zap } from "lucide-react";

export interface PlayerStats {
  name: string;
  role: string;
  stat: string;
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  highScore?: string;
  bestBowling?: string;
  catches?: number;
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
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

export function PlayerStatsDialog({ player, open, onOpenChange }: PlayerStatsDialogProps) {
  if (!player) return null;

  const stats = [
    { label: "Matches", value: player.matches ?? "–", icon: Trophy, color: "from-falcon-gold to-amber-500" },
    { label: "Runs", value: player.runs ?? "–", icon: TrendingUp, color: "from-emerald-400 to-green-500" },
    { label: "Wickets", value: player.wickets ?? "–", icon: Target, color: "from-rose-400 to-red-500" },
    { label: "Average", value: player.average ?? "–", icon: Flame, color: "from-orange-400 to-amber-500" },
    { label: "Strike Rate", value: player.strikeRate ?? "–", icon: Zap, color: "from-violet-400 to-purple-500" },
    { label: "Catches", value: player.catches ?? "–", icon: Award, color: "from-cyan-400 to-blue-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-falcon-navy/95 backdrop-blur-2xl border-falcon-gold/20 text-falcon-cream overflow-hidden">
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
          </motion.div>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="relative z-10 mt-6">
          <motion.h4
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs uppercase tracking-wider text-falcon-cream/50 mb-3 font-semibold"
          >
            Season Statistics
          </motion.h4>
          
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  custom={index}
                  variants={statCardVariants}
                  initial="hidden"
                  animate="visible"
                  className="glass-dark rounded-xl p-3 text-center group hover:scale-105 transition-transform duration-200 cursor-default"
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-display font-bold text-falcon-cream">
                    {stat.value}
                  </p>
                  <p className="text-xs text-falcon-cream/50 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 mt-6 grid grid-cols-2 gap-3"
        >
          {player.highScore && (
            <div className="glass-dark rounded-xl p-3">
              <p className="text-xs text-falcon-cream/50 uppercase tracking-wide mb-1">High Score</p>
              <p className="text-lg font-display font-bold text-falcon-gold">{player.highScore}</p>
            </div>
          )}
          {player.bestBowling && (
            <div className="glass-dark rounded-xl p-3">
              <p className="text-xs text-falcon-cream/50 uppercase tracking-wide mb-1">Best Bowling</p>
              <p className="text-lg font-display font-bold text-falcon-gold">{player.bestBowling}</p>
            </div>
          )}
          {player.speciality && (
            <div className="glass-dark rounded-xl p-3 col-span-2">
              <p className="text-xs text-falcon-cream/50 uppercase tracking-wide mb-1">Speciality</p>
              <p className="text-sm font-medium text-falcon-cream">{player.speciality}</p>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
