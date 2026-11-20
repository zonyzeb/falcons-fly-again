import { SEO } from "@/components/SEO";
import { TeamSection } from "@/components/TeamSection";

export default function TennisBallTeamPage() {
  return (
    <div className="pt-20">
      <SEO
        title="Tennis Ball Team"
        description="Meet the Falcons tennis-ball squad — our roster of players with stats, roles, and individual profiles."
        path="/tennis-ball-team"
      />
      <TeamSection />
    </div>
  );
}
