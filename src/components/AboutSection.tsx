import { Target, Users, Trophy, Heart } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Commitment over excuses",
    description: "We show up when it matters.",
  },
  {
    icon: Trophy,
    title: "Competitive spirit",
    description: "Always respectful, always hungry.",
  },
  {
    icon: Users,
    title: "Team before individual",
    description: "One badge, one goal.",
  },
  {
    icon: Heart,
    title: "Love the game",
    description: "Win or lose, we play with heart.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="falcon-section bg-background">
      <div className="falcon-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div>
            <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
              Who We Are
            </span>
            <h2 className="falcon-heading text-foreground mt-2 mb-6">
              More Than a Team.
              <span className="text-falcon-gold"> A Brotherhood.</span>
            </h2>
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                Falcons is a single, close-knit cricket team made up of passionate individuals
                in their mid-30s to 40s. We're engineers, managers, entrepreneurs, and
                problem-solvers by day — <strong className="text-foreground">cricketers by heart.</strong>
              </p>
              <p>
                We don't train every day. We don't talk big.
                But when match day comes, we show up ready to compete.
              </p>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="falcon-card group hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-falcon-gold/10 flex items-center justify-center mb-4 group-hover:bg-falcon-gold/20 transition-colors">
                  <value.icon className="w-6 h-6 text-falcon-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
