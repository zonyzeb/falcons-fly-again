import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cricket.jpg";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-falcon-navy/80 via-falcon-navy/70 to-falcon-navy/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 falcon-container text-center pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-falcon-gold/20 border border-falcon-gold/40 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
            <span className="text-falcon-gold font-semibold text-sm">Est. 2025</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-falcon-cream mb-4 animate-fade-up">
            FALCONS
            <span className="block text-falcon-gold">CRICKET CLUB</span>
          </h1>

          {/* Tagline */}
          <p className="font-display text-xl md:text-2xl lg:text-3xl text-falcon-cream/90 font-medium mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Play with Pride. Fly as One.
          </p>

          {/* Description */}
          <p className="text-falcon-cream/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            We're the Falcons — a group of working professionals who refuse to hang up the boots.
            Between jobs, families, and responsibilities, we still turn up, compete hard, and play the game we love.
          </p>

          {/* Highlight Line */}
          <p className="text-falcon-gold font-semibold text-lg md:text-xl mb-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Cricket keeps us sharp. Falcons keeps us together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#matches">Match Schedule</a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#about">About the Falcons</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-falcon-cream/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-falcon-gold rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
