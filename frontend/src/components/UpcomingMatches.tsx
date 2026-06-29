import { useEffect, useState } from "react";
import { fetchUpcomingFixtures, type Fixture } from "@/lib/db";
import { TournamentTree, groupByTournament } from "@/components/TournamentTree";

export function UpcomingMatches() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchUpcomingFixtures()
      .then(setFixtures)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Render nothing if there are no upcoming matches (keeps the page clean).
  if (!loaded || fixtures.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-falcon-navy/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-falcon-gold text-sm font-semibold tracking-[0.2em] uppercase mb-2">Fixtures</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-falcon-cream">Upcoming Matches</h2>
        </div>
        <TournamentTree groups={groupByTournament(fixtures)} />
      </div>
    </section>
  );
}
