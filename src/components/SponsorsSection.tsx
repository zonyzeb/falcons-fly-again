const sponsors = [
  { name: "TechFlow Solutions", type: "Gold Sponsor" },
  { name: "Metro Sports Gear", type: "Equipment Partner" },
  { name: "Cafe Central", type: "Refreshments" },
  { name: "FitLife Gym", type: "Fitness Partner" },
];

export function SponsorsSection() {
  return (
    <section className="falcon-section bg-background">
      <div className="falcon-container">
        <div className="text-center mb-10">
          <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
            Sponsors & Supporters
          </span>
          <h2 className="falcon-heading text-foreground mt-2 mb-4">
            Those Who Back the Falcons
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We're grateful to the friends, families, and supporters who make it possible
            for us to keep playing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="falcon-card text-center hover:-translate-y-1"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-falcon-navy/5 flex items-center justify-center mb-4">
                <span className="font-display text-xl font-bold text-falcon-navy">
                  {sponsor.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {sponsor.name}
              </h3>
              <p className="text-sm text-falcon-gold mt-1">{sponsor.type}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
