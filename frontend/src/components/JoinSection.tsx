import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GradientMesh } from "@/components/ui/GradientMesh";

export function JoinSection() {
  return (
    <section id="join" className="falcon-section bg-falcon-navy relative">
      <GradientMesh variant="dark" />
      
      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass-dark px-4 py-1.5 rounded-full mb-4">
            Join the Falcons
          </span>
          <h2 className="falcon-heading text-falcon-cream mt-4 mb-8">
            Think You've Got One More{" "}
            <span className="text-gradient-gold">Season in You?</span>
          </h2>
          <p className="text-falcon-cream/60 text-lg mb-6 leading-relaxed">
            If you're passionate about cricket, value commitment, and want to play
            competitive matches alongside like-minded people — Falcons might be your kind of team.
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-falcon-gold font-semibold text-xl mb-12"
          >
            We're not about numbers. We're about fit — on and off the field.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="lg" className="glow-gold relative overflow-hidden group">
              <span className="relative z-10">Get in Touch</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-falcon-gold-light/0 via-falcon-gold-light/30 to-falcon-gold-light/0"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </Button>
            <Button variant="hero-outline" size="lg" className="backdrop-blur-sm">
              Play a Trial Match
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
