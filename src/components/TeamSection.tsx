const players = [
  { name: "Sherin" },
  { name: "Jeevan" },
  { name: "Jithu" },
  { name: "Sony" },
  { name: "Ritwik" },
  { name: "Deepu" },
  { name: "Sid" },
  { name: "Anoop" },
  { name: "Umesh" },
  { name: "Divin" },
  { name: "Fahsan" },
  { name: "Tinu" },
  { name: "Kannan" },
  { name: "Yashas" },
  { name: "Ajas" },
  { name: "Aman" },
  { name: "Ramasamy" },
  { name: "Shabhaz" },
  { name: "Sushant" },
  { name: "Ankitx" },
  { name: "Sohan" },
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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="group flex flex-col items-center text-center p-4 bg-falcon-navy-light/50 border border-falcon-grey/20 rounded-xl hover:border-falcon-gold/40 hover:bg-falcon-navy-light transition-all duration-300"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* Avatar Placeholder */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center group-hover:from-falcon-gold/40 group-hover:to-falcon-gold/20 transition-all">
                <span className="font-display text-lg font-bold text-falcon-gold">
                  {player.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-display text-base font-semibold text-falcon-cream">
                {player.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
