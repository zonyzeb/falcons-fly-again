import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-cricket.jpg";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Enhanced Overlay with gradient mesh feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-falcon-navy/90 via-falcon-navy/75 to-falcon-navy/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-falcon-navy/40 via-transparent to-falcon-navy/40" />
      </div>

      {/* Animated Gradient Mesh */}
      <GradientMesh variant="hero" />

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-1/4 right-[15%] w-2 h-2 rounded-full bg-falcon-gold/60"
        animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/3 left-[10%] w-3 h-3 rounded-full bg-falcon-gold/40"
        animate={{ y: [0, 15, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 right-[8%] w-1.5 h-1.5 rounded-full bg-falcon-cream/30"
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10 falcon-container text-center pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Badge with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass-dark rounded-full px-5 py-2 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-falcon-gold animate-pulse" />
            <span className="text-falcon-gold font-semibold text-sm tracking-wide">Est. 2025</span>
          </motion.div>

          {/* Main Heading with staggered animation */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-6xl md:text-8xl lg:text-9xl font-bold text-falcon-cream mb-2 tracking-tight"
          >
            FALCONS
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative inline-block"
          >
            <span className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-gradient-gold">
              CRICKET CLUB
            </span>
            {/* Glow effect behind text */}
            <div className="absolute inset-0 blur-2xl bg-falcon-gold/20 -z-10" />
          </motion.div>

          {/* Tagline with premium styling */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-display text-xl md:text-2xl lg:text-3xl text-falcon-cream/90 font-medium mt-6 mb-8"
          >
            Play with Pride. Fly as One.
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-falcon-cream/60 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            We're the Falcons — a group of working professionals who refuse to hang up the boots.
            Between jobs, families, and responsibilities, we still turn up, compete hard, and play the game we love.
          </motion.p>

          {/* Highlight Line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-falcon-gold font-semibold text-lg md:text-xl mb-12"
          >
            Cricket keeps us sharp. Falcons keeps us together.
          </motion.p>

          {/* CTA Buttons with enhanced hover effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="xl" asChild className="group relative overflow-hidden">
              <a href="#matches">
                <span className="relative z-10">Match Schedule</span>
                <motion.div
                  className="absolute inset-0 bg-falcon-gold-light/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild className="group backdrop-blur-sm">
              <a href="#about">About the Falcons</a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-7 h-12 rounded-full border-2 border-falcon-cream/30 flex justify-center pt-2 backdrop-blur-sm"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], height: ["8px", "16px", "8px"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 bg-falcon-gold rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
