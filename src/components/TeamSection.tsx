import { motion } from "framer-motion";
import { useState } from "react";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { PlayerStatsDialog, PlayerStats } from "@/components/PlayerStatsDialog";

const players: PlayerStats[] = [
  { 
    name: "Sherin", role: "Batsman", stat: "Reliable at the crease when it matters",
    matches: 24, catches: 8, runOuts: 3, manOfMatch: 2,
    runs: 486, battingAverage: 32.4, strikeRate: 118.5, highScore: "78*", fifties: 4, fours: 52, sixes: 12, notOuts: 5,
    wickets: 2, bowlingAverage: 45.0, economy: 8.2, bestBowling: "1/18", threeWickets: 0, maidens: 0, dotBalls: 8,
    speciality: "Cover drives & back-foot punches"
  },
  { 
    name: "Jeevan", role: "Captain / All-rounder", stat: "Leads from the front, on and off the field",
    matches: 32, catches: 14, runOuts: 6, manOfMatch: 5,
    runs: 624, battingAverage: 34.7, strikeRate: 125.3, highScore: "92", fifties: 5, fours: 68, sixes: 18, notOuts: 4,
    wickets: 18, bowlingAverage: 22.4, economy: 6.8, bestBowling: "3/22", threeWickets: 3, maidens: 2, dotBalls: 86,
    speciality: "Leadership & match awareness"
  },
  { 
    name: "Jithu", role: "All-rounder / Fast", stat: "Brings pace, power, and energy",
    matches: 28, catches: 6, runOuts: 2, manOfMatch: 4,
    runs: 312, battingAverage: 22.3, strikeRate: 142.8, highScore: "45", fifties: 0, fours: 28, sixes: 22, notOuts: 2,
    wickets: 26, bowlingAverage: 18.6, economy: 7.2, bestBowling: "4/18", threeWickets: 4, maidens: 1, dotBalls: 102,
    speciality: "Yorkers & big hitting"
  },
  { 
    name: "Sony", role: "Fast Bowler", stat: "Hits the deck hard, every spell",
    matches: 26, catches: 4, runOuts: 1, manOfMatch: 3,
    runs: 48, battingAverage: 8.0, strikeRate: 95.0, highScore: "18", fifties: 0, fours: 6, sixes: 1, notOuts: 2,
    wickets: 34, bowlingAverage: 16.2, economy: 6.4, bestBowling: "5/24", threeWickets: 6, maidens: 4, dotBalls: 142,
    speciality: "Swing bowling & bouncers"
  },
  { 
    name: "Ritwik", role: "Batsman / Wicketkeeper", stat: "Safe hands behind the stumps",
    matches: 30, catches: 22, runOuts: 8, manOfMatch: 2,
    runs: 398, battingAverage: 28.4, strikeRate: 112.6, highScore: "67*", fifties: 3, fours: 42, sixes: 8, notOuts: 6,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Glovework & quick stumpings"
  },
  { 
    name: "Deepu", role: "Batsman / Wicketkeeper", stat: "Calm keeper, dependable bat",
    matches: 22, catches: 18, runOuts: 5, manOfMatch: 1,
    runs: 342, battingAverage: 31.1, strikeRate: 108.2, highScore: "54", fifties: 2, fours: 38, sixes: 6, notOuts: 4,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Reading spinners & calm under pressure"
  },
  { 
    name: "Sid", role: "Batsman", stat: "Solid technique, steady runs",
    matches: 20, catches: 5, runOuts: 2, manOfMatch: 2,
    runs: 456, battingAverage: 38.0, strikeRate: 105.4, highScore: "82*", fifties: 4, fours: 48, sixes: 10, notOuts: 5,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Classical shots & patience"
  },
  { 
    name: "Anoop", role: "Batsman", stat: "Anchors the innings with patience",
    matches: 25, catches: 7, runOuts: 3, manOfMatch: 2,
    runs: 512, battingAverage: 36.6, strikeRate: 98.7, highScore: "71", fifties: 5, fours: 54, sixes: 8, notOuts: 3,
    wickets: 1, bowlingAverage: 42.0, economy: 7.8, bestBowling: "1/22", threeWickets: 0, maidens: 0, dotBalls: 6,
    speciality: "Building partnerships"
  },
  { 
    name: "Umesh", role: "All-rounder", stat: "Does a bit of everything, well",
    matches: 24, catches: 9, runOuts: 4, manOfMatch: 2,
    runs: 286, battingAverage: 26.0, strikeRate: 122.4, highScore: "48", fifties: 0, fours: 30, sixes: 14, notOuts: 2,
    wickets: 14, bowlingAverage: 24.6, economy: 7.1, bestBowling: "3/28", threeWickets: 2, maidens: 1, dotBalls: 62,
    speciality: "Adaptability & team balance"
  },
  { 
    name: "Divin", role: "All-rounder", stat: "Always ready when the team needs him",
    matches: 18, catches: 6, runOuts: 2, manOfMatch: 1,
    runs: 224, battingAverage: 24.9, strikeRate: 118.5, highScore: "42", fifties: 0, fours: 22, sixes: 10, notOuts: 2,
    wickets: 12, bowlingAverage: 26.8, economy: 7.4, bestBowling: "2/19", threeWickets: 0, maidens: 0, dotBalls: 48,
    speciality: "Clutch performances"
  },
  { 
    name: "Fahsan", role: "All-rounder", stat: "Adds balance to the side",
    matches: 20, catches: 8, runOuts: 3, manOfMatch: 1,
    runs: 198, battingAverage: 22.0, strikeRate: 115.1, highScore: "38", fifties: 0, fours: 18, sixes: 8, notOuts: 1,
    wickets: 16, bowlingAverage: 23.4, economy: 6.9, bestBowling: "3/32", threeWickets: 2, maidens: 1, dotBalls: 72,
    speciality: "Medium pace variations"
  },
  { 
    name: "Tinu", role: "Bowler", stat: "Keeps it tight, asks the right questions",
    matches: 22, catches: 3, runOuts: 1, manOfMatch: 2,
    runs: 34, battingAverage: 6.8, strikeRate: 82.4, highScore: "12", fifties: 0, fours: 4, sixes: 0, notOuts: 1,
    wickets: 22, bowlingAverage: 18.8, economy: 5.8, bestBowling: "4/26", threeWickets: 4, maidens: 3, dotBalls: 118,
    speciality: "Economy & line/length"
  },
  { 
    name: "Kannan", role: "Bowler", stat: "Consistent lines, competitive spells",
    matches: 24, catches: 5, runOuts: 2, manOfMatch: 2,
    runs: 42, battingAverage: 7.5, strikeRate: 88.0, highScore: "14", fifties: 0, fours: 5, sixes: 1, notOuts: 1,
    wickets: 28, bowlingAverage: 17.2, economy: 6.2, bestBowling: "4/21", threeWickets: 5, maidens: 2, dotBalls: 128,
    speciality: "Seam movement"
  },
  { 
    name: "Yashas", role: "Bowler", stat: "Brings control and discipline",
    matches: 18, catches: 2, runOuts: 1, manOfMatch: 1,
    runs: 28, battingAverage: 7.0, strikeRate: 78.5, highScore: "11", fifties: 0, fours: 3, sixes: 0, notOuts: 1,
    wickets: 18, bowlingAverage: 20.4, economy: 6.0, bestBowling: "3/18", threeWickets: 3, maidens: 2, dotBalls: 92,
    speciality: "Spin variations"
  },
  { 
    name: "Ajas", role: "Bowler", stat: "Never afraid of a long spell",
    matches: 20, catches: 4, runOuts: 1, manOfMatch: 1,
    runs: 22, battingAverage: 6.5, strikeRate: 72.0, highScore: "9", fifties: 0, fours: 2, sixes: 0, notOuts: 1,
    wickets: 20, bowlingAverage: 19.6, economy: 5.6, bestBowling: "4/32", threeWickets: 3, maidens: 4, dotBalls: 108,
    speciality: "Stamina & consistency"
  },
  { 
    name: "Aman", role: "All-rounder", stat: "Plays with heart and intent",
    matches: 16, catches: 5, runOuts: 2, manOfMatch: 2,
    runs: 178, battingAverage: 22.3, strikeRate: 128.4, highScore: "52*", fifties: 1, fours: 16, sixes: 12, notOuts: 3,
    wickets: 10, bowlingAverage: 28.2, economy: 7.6, bestBowling: "2/24", threeWickets: 0, maidens: 0, dotBalls: 42,
    speciality: "Power hitting & fielding"
  },
  { 
    name: "Ramasamy", role: "Batsman", stat: "Experience that steadies the team",
    matches: 28, catches: 6, runOuts: 4, manOfMatch: 3,
    runs: 542, battingAverage: 33.9, strikeRate: 102.8, highScore: "76", fifties: 5, fours: 58, sixes: 12, notOuts: 4,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Experience & mentorship"
  },
  { 
    name: "Shabhaz", role: "Batsman", stat: "Positive approach, quick scoring",
    matches: 22, catches: 4, runOuts: 2, manOfMatch: 2,
    runs: 398, battingAverage: 28.4, strikeRate: 138.5, highScore: "68", fifties: 3, fours: 42, sixes: 22, notOuts: 2,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Aggressive stroke play"
  },
  { 
    name: "Sushant", role: "All-rounder / Spin", stat: "Clever spin and sharp cricket brain",
    matches: 26, catches: 11, runOuts: 3, manOfMatch: 3,
    runs: 246, battingAverage: 20.5, strikeRate: 96.5, highScore: "44", fifties: 0, fours: 24, sixes: 6, notOuts: 2,
    wickets: 24, bowlingAverage: 21.2, economy: 6.4, bestBowling: "4/28", threeWickets: 4, maidens: 2, dotBalls: 98,
    speciality: "Flight & deception"
  },
  { 
    name: "Ankit", role: "Batsman", stat: "Trustworthy top-order presence",
    matches: 24, catches: 5, runOuts: 2, manOfMatch: 2,
    runs: 478, battingAverage: 31.9, strikeRate: 108.2, highScore: "72*", fifties: 4, fours: 50, sixes: 14, notOuts: 5,
    wickets: 0, bowlingAverage: 0, economy: 0, bestBowling: "–", threeWickets: 0, maidens: 0, dotBalls: 0,
    speciality: "Opening partnerships"
  },
  { 
    name: "Sohan", role: "All-rounder", stat: "Always up for the challenge",
    matches: 18, catches: 7, runOuts: 3, manOfMatch: 1,
    runs: 212, battingAverage: 23.6, strikeRate: 124.7, highScore: "46", fifties: 0, fours: 20, sixes: 10, notOuts: 2,
    wickets: 8, bowlingAverage: 30.4, economy: 7.8, bestBowling: "2/22", threeWickets: 0, maidens: 0, dotBalls: 34,
    speciality: "Athletic fielding & energy"
  },
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
