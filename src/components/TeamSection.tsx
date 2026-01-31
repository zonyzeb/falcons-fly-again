const players = [
  { name: "Raj Sharma", role: "Captain / All-rounder", stat: "Leads by example, every time" },
  { name: "Vikram Patel", role: "Opening Batsman", stat: "Still bowls with the old ball" },
  { name: "Amit Singh", role: "Fast Bowler", stat: "Plays after night shifts" },
  { name: "Sanjay Kumar", role: "Wicketkeeper", stat: "Never misses a stumping" },
  { name: "Deepak Reddy", role: "Spin Bowler", stat: "The crafty veteran" },
  { name: "Arjun Nair", role: "Middle-order Bat", stat: "Clutch performer under pressure" },
  { name: "Kiran Joshi", role: "All-rounder", stat: "Mr. Reliable" },
  { name: "Rahul Menon", role: "Opening Bowler", stat: "Early morning gym, then cricket" },
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="group bg-falcon-navy-light/50 border border-falcon-grey/20 rounded-xl p-5 hover:border-falcon-gold/40 hover:bg-falcon-navy-light transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Avatar Placeholder */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center mb-4 group-hover:from-falcon-gold/40 group-hover:to-falcon-gold/20 transition-all">
                <span className="font-display text-xl font-bold text-falcon-gold">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-falcon-cream mb-1">
                {player.name}
              </h3>
              <p className="text-falcon-gold text-sm font-medium mb-2">
                {player.role}
              </p>
              <p className="text-falcon-cream/60 text-sm italic">
                "{player.stat}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
