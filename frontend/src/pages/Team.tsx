import { SEO } from "@/components/SEO";
import { TeamSection } from "@/components/TeamSection";

export default function TeamPage() {
  return (
    <div className="pt-20">
      <SEO
        title="The Squad"
        description="Meet the Falcons squad — our full roster of players with stats, roles, and individual profiles."
        path="/team"
      />
      <TeamSection />
    </div>
  );
}
