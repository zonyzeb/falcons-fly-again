import { SEO } from "@/components/SEO";
import { MatchesSection } from "@/components/MatchesSection";
import { UpcomingMatches } from "@/components/UpcomingMatches";

export default function MatchesPage() {
  return (
    <div className="pt-20">
      <SEO
        title="Matches & Results"
        description="Falcons Cricket Club match results, scores, and fixtures. See our competitive record across tournaments."
        path="/matches"
      />
      <UpcomingMatches />
      <MatchesSection />
    </div>
  );
}
