import { Calendar, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";

const matches = [
  {
    date: "Feb 15, 2025",
    time: "2:00 PM",
    venue: "City Sports Ground",
    opponent: "Thunder XI",
    status: "upcoming",
    result: null,
  },
  {
    date: "Feb 8, 2025",
    time: "10:00 AM",
    venue: "Metro Cricket Club",
    opponent: "Strikers CC",
    status: "completed",
    result: { won: true, score: "186/4 vs 142/10", highlight: "Raj Sharma: 67* (48)" },
  },
  {
    date: "Feb 1, 2025",
    time: "2:30 PM",
    venue: "Green Park Stadium",
    opponent: "Weekend Warriors",
    status: "completed",
    result: { won: true, score: "203/6 vs 178/9", highlight: "Amit Singh: 4/28" },
  },
  {
    date: "Jan 25, 2025",
    time: "9:30 AM",
    venue: "Riverside Ground",
    opponent: "Corporate XI",
    status: "completed",
    result: { won: false, score: "156/8 vs 162/3", highlight: "Close fight till the end" },
  },
];

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
            Matches & Fixtures
          </span>
          <h2 className="falcon-heading text-foreground mt-4 mb-6">
            When Work Ends,{" "}
            <span className="text-gradient-gold">Cricket Begins</span> 🏏
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This is where our competitive side comes alive. Check upcoming fixtures,
            past results, and match highlights.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {matches.map((match, index) => (
            <motion.div key={index} variants={itemVariants}>
              <GlassCard className="p-6" interactive={true}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 md:w-44">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-falcon-gold/20 blur-md" />
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-falcon-gold/20 to-falcon-gold/5 flex items-center justify-center border border-falcon-gold/20">
                        <Calendar className="w-5 h-5 text-falcon-gold" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{match.date}</p>
                      <p className="text-sm text-muted-foreground">{match.time}</p>
                    </div>
                  </div>

                  {/* Opponent */}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">vs</p>
                    <p className="font-display text-xl font-semibold text-foreground">
                      {match.opponent}
                    </p>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 text-muted-foreground md:w-48">
                    <MapPin className="w-4 h-4 text-falcon-gold/60" />
                    <span className="text-sm">{match.venue}</span>
                  </div>

                  {/* Status/Result */}
                  <div className="md:w-52 md:text-right">
                    {match.status === "upcoming" ? (
                      <Badge className="bg-falcon-gold/20 text-falcon-gold border-falcon-gold/30 hover:bg-falcon-gold/30 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-falcon-gold animate-pulse mr-2" />
                        Upcoming
                      </Badge>
                    ) : match.result ? (
                      <div>
                        <Badge
                          className={
                            match.result.won
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-sm"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/30 backdrop-blur-sm"
                          }
                        >
                          {match.result.won ? "Victory" : "Defeat"}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{match.result.score}</p>
                        {match.result.highlight && (
                          <p className="text-xs text-falcon-gold mt-1.5 flex items-center gap-1.5 md:justify-end">
                            <Trophy className="w-3 h-3" />
                            {match.result.highlight}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
