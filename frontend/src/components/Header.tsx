import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import falconsLogo from "@/assets/falcons-logo.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "The Squad" },
  { to: "/matches", label: "Matches" },
  { to: "/gallery", label: "Gallery" },
  { to: "/join", label: "Join Us" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleNavClick = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? "bg-falcon-navy/95 backdrop-blur-xl shadow-[0_4px_30px_-10px_hsl(220_50%_5%_/_0.3)]"
          : "bg-transparent"
      }`}
    >
      <div className="falcon-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/" className="flex items-center gap-2">
              <img src={falconsLogo} alt="Falcons Cricket Club" className="h-12 md:h-14 w-auto" />
            </Link>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link, index) => {
              const isActive = location.pathname === link.to;
              return (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={link.to}
                    className={`relative px-4 py-2 transition-colors duration-200 font-medium text-sm group ${
                      isActive ? "text-falcon-gold" : "text-falcon-cream/80 hover:text-falcon-gold"
                    }`}
                  >
                    {link.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-falcon-gold transition-all duration-300 ${
                      isActive ? "w-3/4" : "w-0 group-hover:w-3/4"
                    }`} />
                  </Link>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Button variant="gold" size="sm" className="ml-4 glow-gold-subtle" asChild>
                <Link to="/contact">Get in Touch</Link>
              </Button>
            </motion.div>
          </nav>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-falcon-cream hover:text-falcon-gold transition-colors glass-dark rounded-lg"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden pb-6 overflow-hidden"
            >
              <div className="flex flex-col gap-2 glass-dark rounded-2xl p-4 mt-2">
                {navLinks.map((link, index) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          isActive ? "text-falcon-gold bg-falcon-navy-light/50" : "text-falcon-cream/80 hover:text-falcon-gold hover:bg-falcon-navy-light/50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
                <Button variant="gold" className="mt-4" asChild>
                  <Link to="/contact" onClick={() => setIsOpen(false)}>Get in Touch</Link>
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
