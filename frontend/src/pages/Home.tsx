import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { TeamSection } from "@/components/TeamSection";
import { MatchesSection } from "@/components/MatchesSection";
import { GallerySection } from "@/components/GallerySection";
import { JoinSection } from "@/components/JoinSection";
import { SponsorsSection } from "@/components/SponsorsSection";

export default function HomePage() {
  return (
    <>
      <SEO
        title="Home"
        description="Falcons Cricket Club — a team of working professionals who play competitive cricket. Play with Pride. Fly as One."
        path="/"
      />
      <HeroSection />
      <AboutSection />
      <TeamSection />
      <MatchesSection />
      <GallerySection />
      <JoinSection />
      <SponsorsSection />
    </>
  );
}
