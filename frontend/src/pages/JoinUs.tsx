import { SEO } from "@/components/SEO";
import { JoinSection } from "@/components/JoinSection";

export default function JoinUsPage() {
  return (
    <div className="pt-20">
      <SEO
        title="Join Us"
        description="Want to play for Falcons Cricket Club? If you're passionate about cricket and value commitment, get in touch."
        path="/join"
      />
      <JoinSection />
    </div>
  );
}
