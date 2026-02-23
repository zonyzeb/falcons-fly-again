import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { TeamSection } from "@/components/TeamSection";
import { MatchesSection } from "@/components/MatchesSection";
import { GallerySection } from "@/components/GallerySection";
import { JoinSection } from "@/components/JoinSection";
import { SponsorsSection } from "@/components/SponsorsSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <TeamSection />
        <MatchesSection />
        <GallerySection />
        <JoinSection />
        <SponsorsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
