import { forwardRef } from "react";
import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";

const sponsors = [
  { name: "TechFlow Solutions", type: "Gold Sponsor" },
  { name: "Metro Sports Gear", type: "Equipment Partner" },
  { name: "Cafe Central", type: "Refreshments" },
  { name: "FitLife Gym", type: "Fitness Partner" },
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

export const SponsorsSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="falcon-section bg-background relative">
      <GradientMesh variant="section" />
      
      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass px-4 py-1.5 rounded-full mb-4">
            Sponsors & Supporters
          </span>
          <h2 className="falcon-heading text-foreground mt-4 mb-6">
            Those Who{" "}
            <span className="text-gradient-gold">Back the Falcons</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            We're grateful to the friends, families, and supporters who make it possible
            for us to keep playing.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {sponsors.map((sponsor) => (
            <motion.div key={sponsor.name} variants={itemVariants}>
              <GlassCard className="p-6 text-center h-full">
                {/* Logo placeholder with gradient */}
                <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-falcon-navy/10 to-falcon-navy/5 flex items-center justify-center mb-5 border border-border/50">
                  <span className="font-display text-xl font-bold text-gradient-gold">
                    {sponsor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  {/* Subtle glow */}
                  <div className="absolute inset-0 rounded-2xl bg-falcon-gold/5 blur-md -z-10" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {sponsor.name}
                </h3>
                <p className="text-sm text-falcon-gold font-medium">{sponsor.type}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

SponsorsSection.displayName = "SponsorsSection";
