import { Mail, MapPin, Instagram, Twitter, Facebook } from "lucide-react";
import falconsLogo from "@/assets/falcons-logo.png";
export function Footer() {
  return (
    <footer id="contact" className="bg-falcon-navy py-16 px-4">
      <div className="falcon-container">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="font-display text-2xl font-bold text-falcon-cream mb-6">
              Let's Talk Cricket
            </h3>
            <p className="text-falcon-cream/70 mb-6">
              Want to play, support, or schedule a friendly match?
              Drop us a message — we'll get back to you (probably after office hours).
            </p>
            <div className="space-y-3">
              <a
                href="mailto:hello@falconscc.com"
                className="flex items-center gap-3 text-falcon-cream/70 hover:text-falcon-gold transition-colors"
              >
                <Mail className="w-5 h-5" />
                hello@falconscc.com
              </a>
              <div className="flex items-center gap-3 text-falcon-cream/70">
                <MapPin className="w-5 h-5" />
                City Sports Ground, Metro City
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold text-falcon-cream mb-6">
              Quick Links
            </h3>
            <nav className="space-y-3">
              {["About", "The Squad", "Matches", "Gallery", "Join Us"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  className="block text-falcon-cream/70 hover:text-falcon-gold transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h3 className="font-display text-lg font-semibold text-falcon-cream mb-6">
              Follow the Falcons
            </h3>
            <div className="flex gap-4 mb-8">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-falcon-navy-light flex items-center justify-center text-falcon-cream/70 hover:text-falcon-gold hover:bg-falcon-navy-light/80 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-falcon-navy-light flex items-center justify-center text-falcon-cream/70 hover:text-falcon-gold hover:bg-falcon-navy-light/80 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-falcon-navy-light flex items-center justify-center text-falcon-cream/70 hover:text-falcon-gold hover:bg-falcon-navy-light/80 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            <p className="text-falcon-cream/50 text-sm">
              Follow us for match updates, behind-the-scenes content, and cricket banter.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-falcon-grey/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={falconsLogo} alt="Falcons Cricket Club" className="h-12 w-auto" />
          <p className="text-falcon-cream/50 text-sm text-center md:text-right">
            © 2026 Falcons Cricket Club. Play with Pride. Fly as One.
          </p>
        </div>
      </div>
    </footer>
  );
}
