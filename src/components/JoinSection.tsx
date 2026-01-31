import { Button } from "@/components/ui/button";

export function JoinSection() {
  return (
    <section id="join" className="falcon-section bg-falcon-navy relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-falcon-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-falcon-gold/5 rounded-full blur-3xl" />
      
      <div className="falcon-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-falcon-gold font-semibold text-sm uppercase tracking-wider">
            Join the Falcons
          </span>
          <h2 className="falcon-heading text-falcon-cream mt-2 mb-6">
            Think You've Got One More
            <span className="text-falcon-gold"> Season in You?</span>
          </h2>
          <p className="text-falcon-cream/70 text-lg mb-4 leading-relaxed">
            If you're passionate about cricket, value commitment, and want to play
            competitive matches alongside like-minded people — Falcons might be your kind of team.
          </p>
          <p className="text-falcon-gold font-semibold text-lg mb-10">
            We're not about numbers. We're about fit — on and off the field.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Get in Touch
            </Button>
            <Button variant="hero-outline" size="lg">
              Play a Trial Match
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
