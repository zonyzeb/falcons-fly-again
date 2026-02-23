import { Target, Users, Trophy, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function AboutSection() {
  return (
    <section id="about" className="falcon-section bg-background relative">
      <GradientMesh variant="section" />
      
      <div className="falcon-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass px-4 py-1.5 rounded-full mb-4">
              Who We Are
            </span>
            <h2 className="falcon-heading text-foreground mt-4 mb-6">
              More Than a Team.
              <span className="text-gradient-gold block mt-1">A Brotherhood.</span>
            </h2>
            <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
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
          </motion.div>

          {/* Values Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {values.map((value) => (
              <motion.div key={value.title} variants={itemVariants}>
                <GlassCard className="p-6 h-full">
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-falcon-gold/20 to-falcon-gold/5 flex items-center justify-center mb-4 group-hover:from-falcon-gold/30 transition-all">
                    <value.icon className="w-6 h-6 text-falcon-gold" />
                    {/* Subtle glow */}
                    <div className="absolute inset-0 rounded-xl bg-falcon-gold/10 blur-md -z-10" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
