import { SEO } from "@/components/SEO";
import { AboutSection } from "@/components/AboutSection";

export default function AboutPage() {
  return (
    <div className="pt-20">
      <SEO
        title="About"
        description="Learn about Falcons Cricket Club — a brotherhood of passionate cricketers in their mid-30s to 40s. Commitment, competitive spirit, and love for the game."
        path="/about"
      />
      <AboutSection />
    </div>
  );
}
