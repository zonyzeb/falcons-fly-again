import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import falconsLogo from "@/assets/falcons-logo.png";
const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#team", label: "The Squad" },
  { href: "#matches", label: "Matches" },
  { href: "#gallery", label: "Gallery" },
  { href: "#join", label: "Join Us" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-falcon-navy/95 backdrop-blur-sm">
      <div className="falcon-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <img src={falconsLogo} alt="Falcons Cricket Club" className="h-12 md:h-14 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-falcon-cream/80 hover:text-falcon-gold transition-colors duration-200 font-medium text-sm"
              >
                {link.label}
              </a>
            ))}
            <Button variant="gold" size="sm" className="ml-4">
              Get in Touch
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-falcon-cream hover:text-falcon-gold transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="lg:hidden pb-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-falcon-cream/80 hover:text-falcon-gold hover:bg-falcon-navy-light/50 rounded-lg transition-colors duration-200 font-medium"
                >
                  {link.label}
                </a>
              ))}
              <Button variant="gold" className="mt-4">
                Get in Touch
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
