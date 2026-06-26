import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { fetchUpcomingFixtures, type Fixture } from "@/lib/db";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.map((f) => (
            <div key={f.id} className="bg-falcon-navy/60 border border-falcon-gold/15 rounded-2xl p-5 hover:border-falcon-gold/40 transition-colors">
              <div className="flex items-center gap-2 text-falcon-gold text-sm font-semibold mb-3">
                <CalendarDays className="w-4 h-4" />
                {fmtDate(f.match_date)}
              </div>
              <h3 className="font-display text-lg font-bold text-falcon-cream leading-tight">
                {f.opponent ? <>Falcons <span className="text-falcon-gold/70">vs</span> {f.opponent}</> : f.tournament?.name}
              </h3>
              {f.opponent && f.tournament?.name && <p className="text-falcon-cream/50 text-sm mt-0.5">{f.tournament.name}</p>}
              <div className="mt-4 space-y-1.5 text-sm text-falcon-cream/60">
                {f.match_time && (
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-falcon-gold/60" /> {f.match_time.slice(0, 5)}</div>
                )}
                {f.ground && (
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-falcon-gold/60" /> {f.ground}</div>
                )}
                {f.tournament?.format && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-md bg-falcon-gold/10 text-falcon-gold/80">{f.tournament.format}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
