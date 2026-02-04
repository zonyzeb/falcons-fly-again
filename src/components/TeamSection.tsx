import { motion } from "framer-motion";
import { useState } from "react";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { PlayerStatsDialog, PlayerStats } from "@/components/PlayerStatsDialog";

const players: PlayerStats[] = [
  { name: "Sherin", role: "Batsman", stat: "Reliable at the crease when it matters", matches: 24, runs: 486, wickets: 2, average: 32.4, strikeRate: 118.5, catches: 8, highScore: "78*", speciality: "Cover drives & back-foot punches" },
  { name: "Jeevan", role: "Captain / All-rounder", stat: "Leads from the front, on and off the field", matches: 32, runs: 624, wickets: 18, average: 34.7, strikeRate: 125.3, catches: 14, highScore: "92", bestBowling: "3/22", speciality: "Leadership & match awareness" },
  { name: "Jithu", role: "All-rounder / Fast", stat: "Brings pace, power, and energy", matches: 28, runs: 312, wickets: 26, average: 22.3, strikeRate: 142.8, catches: 6, highScore: "45", bestBowling: "4/18", speciality: "Yorkers & big hitting" },
  { name: "Sony", role: "Fast Bowler", stat: "Hits the deck hard, every spell", matches: 26, runs: 48, wickets: 34, average: 8.2, strikeRate: 95.0, catches: 4, bestBowling: "5/24", speciality: "Swing bowling & bouncers" },
  { name: "Ritwik", role: "Batsman / Wicketkeeper", stat: "Safe hands behind the stumps", matches: 30, runs: 398, wickets: 0, average: 28.4, strikeRate: 112.6, catches: 22, highScore: "67*", speciality: "Glovework & quick stumpings" },
  { name: "Deepu", role: "Batsman / Wicketkeeper", stat: "Calm keeper, dependable bat", matches: 22, runs: 342, wickets: 0, average: 31.1, strikeRate: 108.2, catches: 18, highScore: "54", speciality: "Reading spinners & calm under pressure" },
  { name: "Sid", role: "Batsman", stat: "Solid technique, steady runs", matches: 20, runs: 456, wickets: 0, average: 38.0, strikeRate: 105.4, catches: 5, highScore: "82*", speciality: "Classical shots & patience" },
  { name: "Anoop", role: "Batsman", stat: "Anchors the innings with patience", matches: 25, runs: 512, wickets: 1, average: 36.6, strikeRate: 98.7, catches: 7, highScore: "71", speciality: "Building partnerships" },
  { name: "Umesh", role: "All-rounder", stat: "Does a bit of everything, well", matches: 24, runs: 286, wickets: 14, average: 26.0, strikeRate: 122.4, catches: 9, highScore: "48", bestBowling: "3/28", speciality: "Adaptability & team balance" },
  { name: "Divin", role: "All-rounder", stat: "Always ready when the team needs him", matches: 18, runs: 224, wickets: 12, average: 24.9, strikeRate: 118.5, catches: 6, highScore: "42", bestBowling: "2/19", speciality: "Clutch performances" },
  { name: "Fahsan", role: "All-rounder", stat: "Adds balance to the side", matches: 20, runs: 198, wickets: 16, average: 22.0, strikeRate: 115.1, catches: 8, highScore: "38", bestBowling: "3/32", speciality: "Medium pace variations" },
  { name: "Tinu", role: "Bowler", stat: "Keeps it tight, asks the right questions", matches: 22, runs: 34, wickets: 22, average: 6.8, strikeRate: 82.4, catches: 3, bestBowling: "4/26", speciality: "Economy & line/length" },
  { name: "Kannan", role: "Bowler", stat: "Consistent lines, competitive spells", matches: 24, runs: 42, wickets: 28, average: 7.5, strikeRate: 88.0, catches: 5, bestBowling: "4/21", speciality: "Seam movement" },
  { name: "Yashas", role: "Bowler", stat: "Brings control and discipline", matches: 18, runs: 28, wickets: 18, average: 7.0, strikeRate: 78.5, catches: 2, bestBowling: "3/18", speciality: "Spin variations" },
  { name: "Ajas", role: "Bowler", stat: "Never afraid of a long spell", matches: 20, runs: 22, wickets: 20, average: 6.5, strikeRate: 72.0, catches: 4, bestBowling: "4/32", speciality: "Stamina & consistency" },
  { name: "Aman", role: "All-rounder", stat: "Plays with heart and intent", matches: 16, runs: 178, wickets: 10, average: 22.3, strikeRate: 128.4, catches: 5, highScore: "52*", bestBowling: "2/24", speciality: "Power hitting & fielding" },
  { name: "Ramasamy", role: "Batsman", stat: "Experience that steadies the team", matches: 28, runs: 542, wickets: 0, average: 33.9, strikeRate: 102.8, catches: 6, highScore: "76", speciality: "Experience & mentorship" },
  { name: "Shabhaz", role: "Batsman", stat: "Positive approach, quick scoring", matches: 22, runs: 398, wickets: 0, average: 28.4, strikeRate: 138.5, catches: 4, highScore: "68", speciality: "Aggressive stroke play" },
  { name: "Sushant", role: "All-rounder / Spin", stat: "Clever spin and sharp cricket brain", matches: 26, runs: 246, wickets: 24, average: 20.5, strikeRate: 96.5, catches: 11, highScore: "44", bestBowling: "4/28", speciality: "Flight & deception" },
  { name: "Ankit", role: "Batsman", stat: "Trustworthy top-order presence", matches: 24, runs: 478, wickets: 0, average: 31.9, strikeRate: 108.2, catches: 5, highScore: "72*", speciality: "Opening partnerships" },
  { name: "Sohan", role: "All-rounder", stat: "Always up for the challenge", matches: 18, runs: 212, wickets: 8, average: 23.6, strikeRate: 124.7, catches: 7, highScore: "46", bestBowling: "2/22", speciality: "Athletic fielding & energy" },
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
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePlayerClick = (player: PlayerStats) => {
    setSelectedPlayer(player);
    setDialogOpen(true);
  };

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
          {players.map((player) => (
            <motion.div key={player.name} variants={itemVariants}>
              <GlassCard 
                className="p-5 h-full bg-falcon-navy-light/30 cursor-pointer group" 
                glowColor="hsl(42 85% 55% / 0.2)"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar with gradient border */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center border border-falcon-gold/30 group-hover:border-falcon-gold/60 transition-colors">
                      <span className="font-display text-lg font-bold text-falcon-gold">
                        {player.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-falcon-cream group-hover:text-falcon-gold transition-colors">
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

      <PlayerStatsDialog
        player={selectedPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}
