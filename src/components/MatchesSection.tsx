import { Calendar, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export function MatchesSection() {
  return (
    <section id="matches" className="falcon-section bg-background">
      <div className="falcon-container">
        <div className="text-center mb-12">
          <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
            Matches & Fixtures
          </span>
          <h2 className="falcon-heading text-foreground mt-2 mb-4">
            When Work Ends, Cricket Begins 🏏
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            This is where our competitive side comes alive. Check upcoming fixtures,
            past results, and match highlights.
          </p>
        </div>

        <div className="space-y-4">
          {matches.map((match, index) => (
            <div
              key={index}
              className="falcon-card flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
            >
              {/* Date & Time */}
              <div className="flex items-center gap-3 md:w-44">
                <div className="w-12 h-12 rounded-lg bg-falcon-gold/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-falcon-gold" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{match.date}</p>
                  <p className="text-sm text-muted-foreground">{match.time}</p>
                </div>
              </div>

              {/* Opponent */}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">vs</p>
                <p className="font-display text-xl font-semibold text-foreground">
                  {match.opponent}
                </p>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-2 text-muted-foreground md:w-48">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{match.venue}</span>
              </div>

              {/* Status/Result */}
              <div className="md:w-48 md:text-right">
                {match.status === "upcoming" ? (
                  <Badge className="bg-falcon-gold/20 text-falcon-gold border-falcon-gold/30 hover:bg-falcon-gold/30">
                    Upcoming
                  </Badge>
                ) : match.result ? (
                  <div>
                    <Badge
                      className={
                        match.result.won
                          ? "bg-green-500/20 text-green-600 border-green-500/30"
                          : "bg-red-500/20 text-red-600 border-red-500/30"
                      }
                    >
                      {match.result.won ? "Won" : "Lost"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{match.result.score}</p>
                    {match.result.highlight && (
                      <p className="text-xs text-falcon-gold mt-1 flex items-center gap-1 md:justify-end">
                        <Trophy className="w-3 h-3" />
                        {match.result.highlight}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
