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

export function TeamSection() {
  return (
    <section id="team" className="falcon-section bg-falcon-navy">
      <div className="falcon-container">
        <div className="text-center mb-12">
          <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
            The Falcons Squad
          </span>
          <h2 className="falcon-heading text-falcon-cream mt-2 mb-4">
            One Team. One Badge. One Goal.
          </h2>
          <p className="text-falcon-cream/70 text-lg max-w-2xl mx-auto">
            Our squad is built on trust, experience, and understanding — because balancing
            cricket with real life needs teamwork off the field too.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="group bg-falcon-navy-light/50 border border-falcon-grey/20 rounded-xl p-5 hover:border-falcon-gold/40 hover:bg-falcon-navy-light transition-all duration-300"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center flex-shrink-0 group-hover:from-falcon-gold/40 group-hover:to-falcon-gold/20 transition-all">
                  <span className="font-display text-lg font-bold text-falcon-gold">
                    {player.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-falcon-cream">
                    {player.name}
                  </h3>
                  <p className="text-falcon-gold text-sm font-medium">
                    {player.role}
                  </p>
                  <p className="text-falcon-cream/60 text-sm italic mt-1">
                    "{player.stat}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
