import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";

const players = [
  { name: "Sherin", role: "Batsman", stat: "Reliable at the crease when it matters" },
  { name: "Jeevan", role: "Captain / All-rounder", stat: "Leads from the front, on and off the field" },
  { name: "Jithu", role: "All-rounder / Fast", stat: "Brings pace, power, and energy" },
  { name: "Sony", role: "Fast Bowler", stat: "Hits the deck hard, every spell" },
  { name: "Ritwik", role: "Batsman / Wicketkeeper", stat: "Safe hands behind the stumps" },
  { name: "Deepu", role: "Batsman / Wicketkeeper", stat: "Calm keeper, dependable bat" },
  { name: "Sid", role: "Batsman", stat: "Solid technique, steady runs" },
  { name: "Anoop", role: "Batsman", stat: "Anchors the innings with patience" },
  { name: "Umesh", role: "All-rounder", stat: "Does a bit of everything, well" },
  { name: "Divin", role: "All-rounder", stat: "Always ready when the team needs him" },
  { name: "Fahsan", role: "All-rounder", stat: "Adds balance to the side" },
  { name: "Tinu", role: "Bowler", stat: "Keeps it tight, asks the right questions" },
  { name: "Kannan", role: "Bowler", stat: "Consistent lines, competitive spells" },
  { name: "Yashas", role: "Bowler", stat: "Brings control and discipline" },
  { name: "Ajas", role: "Bowler", stat: "Never afraid of a long spell" },
  { name: "Aman", role: "All-rounder", stat: "Plays with heart and intent" },
  { name: "Ramasamy", role: "Batsman", stat: "Experience that steadies the team" },
  { name: "Shabhaz", role: "Batsman", stat: "Positive approach, quick scoring" },
  { name: "Sushant", role: "All-rounder / Spin", stat: "Clever spin and sharp cricket brain" },
  { name: "Ankit", role: "Batsman", stat: "Trustworthy top-order presence" },
  { name: "Sohan", role: "All-rounder", stat: "Always up for the challenge" },
];

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
            cricket with real life needs teamwork off the field too.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {players.map((player) => (
            <motion.div key={player.name} variants={itemVariants}>
              <GlassCard className="p-5 h-full bg-falcon-navy-light/30" glowColor="hsl(42 85% 55% / 0.2)">
                <div className="flex items-start gap-4">
                  {/* Avatar with gradient border */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-sm opacity-50" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center border border-falcon-gold/30">
                      <span className="font-display text-lg font-bold text-falcon-gold">
                        {player.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-falcon-cream">
                      {player.name}
                    </h3>
                    <p className="text-falcon-gold text-sm font-medium">
                      {player.role}
                    </p>
                    <p className="text-falcon-cream/50 text-sm italic mt-1.5 leading-relaxed">
                      "{player.stat}"
                    </p>
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
