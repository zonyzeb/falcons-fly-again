import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { players as playersData, getPlayerBySlug } from "@/data/stats";

const ROLE_LABELS: Record<string, string> = {
  BAT: "Batsman",
  BOWL: "Bowler",
  ALL: "All-rounder",
  WK: "Wicketkeeper",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function TeamSection() {
  const teamPlayers = useMemo(
    () =>
      playersData.map((p) => ({
        ...p,
        role: ROLE_LABELS[p.sub_title] || p.sub_title,
        stats: getPlayerBySlug(p.slug),
      })),
    []
  );

  return (
    <section id="team" className="falcon-section bg-falcon-navy relative">
      <GradientMesh variant="dark" />
      
      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider mb-3 glass-dark px-4 py-1.5 rounded-full">
            The Falcons Squad
          </span>
          <h2 className="falcon-heading text-falcon-cream mt-4 mb-6">
            One Team. One Badge.{" "}
            <span className="text-gradient-gold">One Goal.</span>
          </h2>
          <p className="text-falcon-cream/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Our squad is built on trust, experience, and understanding — because balancing
            cricket with real life needs teamwork off the field too. <span className="text-falcon-gold/80">Click any player to view stats.</span>
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {teamPlayers.map((player) => (
            <motion.div key={player.name} variants={itemVariants}>
              <Link to={`/player/${player.slug}`}>
                <GlassCard 
                  className="p-5 h-full bg-falcon-navy-light/30 cursor-pointer group" 
                  glowColor="hsl(42 85% 55% / 0.2)"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
                      {player.profile_pic_url && !player.profile_pic_url.includes("default") ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.name}
                          className="relative w-12 h-12 rounded-full object-cover border border-falcon-gold/30 group-hover:border-falcon-gold/60 transition-colors"
                        />
                      ) : (
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center border border-falcon-gold/30 group-hover:border-falcon-gold/60 transition-colors">
                          <span className="font-display text-lg font-bold text-falcon-gold">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-falcon-cream group-hover:text-falcon-gold transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-falcon-gold text-sm font-medium">
                        {player.role}
                      </p>
                      {player.stats?.batting?.runs != null && (
                        <p className="text-falcon-cream/50 text-xs mt-1.5">
                          {player.stats.batting.runs} runs
                          {player.stats.bowling?.wickets ? ` · ${player.stats.bowling.wickets} wkts` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
