import { SEO } from "@/components/SEO";
import { Squad2027Section } from "@/components/Squad2027Section";

export default function TeamPage() {
  return (
    <div className="pt-20">
      <SEO
        title="The Squad"
        description="Meet the Falcons 2027 squad — the players carrying the badge into the new season."
        path="/team"
      />
      <Squad2027Section />
    </div>
  );
}
