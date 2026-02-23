import { Calendar, MapPin, Trophy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { matches as matchesData, isWin } from "@/data/stats";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function MatchesSection() {
  return (
    <section id="matches" className="falcon-section bg-background relative">
      <GradientMesh variant="section" />
      
      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass px-4 py-1.5 rounded-full mb-4">
            Matches & Results
          </span>
          <h2 className="falcon-heading text-foreground mt-4 mb-6">
            When Work Ends,{" "}
            <span className="text-gradient-gold">Cricket Begins</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This is where our competitive side comes alive. Check past results and match highlights.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {matchesData.map((match, index) => {
            const won = isWin(match);
            return (
              <motion.div key={index} variants={itemVariants}>
                <GlassCard className="p-6" interactive={true}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3 md:w-44">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-xl bg-falcon-gold/20 blur-md" />
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-falcon-gold/20 to-falcon-gold/5 flex items-center justify-center border border-falcon-gold/20">
                          <Calendar className="w-5 h-5 text-falcon-gold" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{match.date}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{match.tournament}</p>
                      </div>
                    </div>

                    <div className="flex-1">
                      {match.score.map((line, i) => (
                        <p key={i} className={`text-sm ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground mt-0.5"}`}>
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground md:w-40">
                      <MapPin className="w-4 h-4 text-falcon-gold/60 flex-shrink-0" />
                      <span className="text-sm truncate">{match.venue}</span>
                    </div>

                    <div className="md:w-48 md:text-right flex items-center md:justify-end gap-2">
                      <Badge
                        className={
                          won
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-sm"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/30 backdrop-blur-sm"
                        }
                      >
                        <Trophy className="w-3 h-3 mr-1" />
                        {won ? "Won" : "Lost"}
                      </Badge>
                      {match.url && (
                        <a
                          href={match.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-falcon-gold/60 hover:text-falcon-gold transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
