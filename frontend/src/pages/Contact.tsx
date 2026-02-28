import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="pt-20">
      <SEO
        title="Contact"
        description="Get in touch with Falcons Cricket Club. Schedule a match, join the team, or connect with us."
        path="/contact"
      />
      <section className="falcon-section bg-falcon-navy relative min-h-[60vh] flex items-center">
        <div className="falcon-container text-center">
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider glass-dark px-4 py-1.5 rounded-full mb-4">
            Contact Us
          </span>
          <h1 className="falcon-heading text-falcon-cream mt-4 mb-6">
            Get in <span className="text-gradient-gold">Touch</span>
          </h1>
          <p className="text-falcon-cream/60 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Want to play, support, or schedule a friendly match? Drop us a message.
          </p>
          <a
            href="mailto:hello@falconscc.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-falcon-gold to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-falcon-gold/20 transition-all"
          >
            hello@falconscc.com
          </a>
        </div>
      </section>
    </div>
  );
}
