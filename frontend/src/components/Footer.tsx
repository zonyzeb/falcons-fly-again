import { forwardRef } from "react";
import { Mail, MapPin, Instagram, Twitter, Facebook } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import falconsLogo from "@/assets/falcons-logo.png";

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const handleNavClick = (hash: string) => {
    if (isHome) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${hash}`);
    }
  };

  return (
    <footer ref={ref} id="contact" className="bg-falcon-navy py-20 px-4 relative overflow-hidden">
      {/* Subtle gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-falcon-gold/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-falcon-gold/5 rounded-full blur-[80px]" />
      
      <div className="falcon-container relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-display text-2xl font-bold text-falcon-cream mb-6">
              Let's Talk Cricket
            </h3>
            <p className="text-falcon-cream/60 mb-6 leading-relaxed">
              Want to play, support, or schedule a friendly match?
              Drop us a message — we'll get back to you (probably after office hours).
            </p>
            <div className="space-y-4">
              <motion.a
                href="mailto:hello@falconscc.com"
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-falcon-cream/60 hover:text-falcon-gold transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl glass-dark flex items-center justify-center group-hover:border-falcon-gold/30 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                hello@falconscc.com
              </motion.a>
              <div className="flex items-center gap-3 text-falcon-cream/60">
                <div className="w-10 h-10 rounded-xl glass-dark flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                City Sports Ground, Metro City
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-display text-lg font-semibold text-falcon-cream mb-6">
              Quick Links
            </h3>
            <nav className="space-y-3">
              {[
                { label: "About", hash: "about" },
                { label: "The Squad", hash: "team" },
                { label: "Matches", hash: "matches" },
                { label: "Gallery", hash: "gallery" },
                { label: "Join Us", hash: "join" },
              ].map((link, index) => (
                <motion.a
                  key={link.hash}
                  href={`/#${link.hash}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.hash); }}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="block text-falcon-cream/60 hover:text-falcon-gold transition-colors cursor-pointer"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>

          {/* Social & Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-display text-lg font-semibold text-falcon-cream mb-6">
              Follow the Falcons
            </h3>
            <div className="flex gap-3 mb-8">
              {[
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Facebook, href: "#" },
              ].map(({ icon: Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl glass-dark flex items-center justify-center text-falcon-cream/60 hover:text-falcon-gold hover:border-falcon-gold/30 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
            <p className="text-falcon-cream/40 text-sm leading-relaxed">
              Follow us for match updates, behind-the-scenes content, and cricket banter.
            </p>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-falcon-grey/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={falconsLogo}
            alt="Falcons Cricket Club"
            className="h-14 w-auto"
          />
          <p className="text-falcon-cream/40 text-sm text-center md:text-right">
            © 2026 Falcons Cricket Club.{" "}
            <span className="text-falcon-gold/60">Play with Pride. Fly as One.</span>
          </p>
        </motion.div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
