import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, User, ArrowRight, Trophy, Gavel } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { fetchUpcomingFixtures, fetchPlayerAvailability, fetchMyDuties, type MatchAvailStatus, type Duty, type Fixture } from "@/lib/db";
import { teamStats, matches } from "@/data/stats";

const STATUS_LABEL: Record<MatchAvailStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "text-emerald-400" },
  maybe: { label: "Maybe", cls: "text-amber-400" },
  unavailable: { label: "Can't play", cls: "text-red-400" },
};

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const [nextFixture, setNextFixture] = useState<Fixture | null>(null);
  const [fixtureStatus, setFixtureStatus] = useState<MatchAvailStatus | null>(null);
  const [nextDuty, setNextDuty] = useState<Duty | null>(null);
  const nextMatch = matches[0];
  const playerId = profile?.player_id ?? null;

  useEffect(() => {
    if (!user) return;
    fetchUpcomingFixtures()
      .then(async (fs) => {
        const next = fs[0] ?? null;
        setNextFixture(next);
        if (next && playerId != null) {
          const rows = await fetchPlayerAvailability(playerId);
          setFixtureStatus(rows.find((r) => r.fixture_id === next.id)?.status ?? null);
        }
      })
      .catch(() => {});
    fetchMyDuties(user.id)
      .then((ds) => {
        const today = new Date().toISOString().slice(0, 10);
        setNextDuty(ds.find((d) => d.duty_date >= today) ?? ds[ds.length - 1] ?? null);
      })
      .catch(() => {});
  }, [user, playerId]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "Falcon";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Welcome back, {firstName} 👋</h1>
        <p className="text-falcon-cream/40 text-sm mt-1">Play with Pride. Fly as One.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/dashboard/availability"
          className="group bg-[#0d1424] border border-white/5 rounded-xl p-5 hover:border-falcon-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <CalendarCheck className="w-5 h-5 text-falcon-gold" />
            <span className="font-semibold">My Availability</span>
          </div>
          <p className="text-sm text-falcon-cream/50">
            {nextFixture ? (
              <>
                Next match:{" "}
                {fixtureStatus ? (
                  <span className={STATUS_LABEL[fixtureStatus].cls}>{STATUS_LABEL[fixtureStatus].label}</span>
                ) : (
                  <span className="text-falcon-cream/30">tap to respond</span>
                )}
              </>
            ) : (
              <span className="text-falcon-cream/30">No upcoming matches</span>
            )}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-falcon-gold/70 group-hover:text-falcon-gold">
            Update <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          to="/dashboard/duties"
          className="group bg-[#0d1424] border border-white/5 rounded-xl p-5 hover:border-falcon-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <Gavel className="w-5 h-5 text-falcon-gold" />
            <span className="font-semibold">My Umpiring Duties</span>
          </div>
          <p className="text-sm text-falcon-cream/50">
            {nextDuty ? (
              <>Next: <span className="text-falcon-cream/80">{new Date(nextDuty.duty_date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></>
            ) : (
              <span className="text-falcon-cream/30">None assigned</span>
            )}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-falcon-gold/70 group-hover:text-falcon-gold">
            View <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          to="/dashboard/profile"
          className="group bg-[#0d1424] border border-white/5 rounded-xl p-5 hover:border-falcon-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <User className="w-5 h-5 text-falcon-gold" />
            <span className="font-semibold">My Profile</span>
          </div>
          <p className="text-sm text-falcon-cream/50">
            {profile?.player_id ? "Linked to a squad player" : "Update your name & details"}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs text-falcon-gold/70 group-hover:text-falcon-gold">
            View <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {nextMatch && (
        <div className="bg-[#0d1424] border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-falcon-cream/50 mb-2">
            <Trophy className="w-4 h-4 text-falcon-gold" /> Latest result
          </div>
          <p className="font-medium">{nextMatch.result}</p>
          <p className="text-sm text-falcon-cream/40 mt-1">
            {nextMatch.tournament} · {nextMatch.date}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {teamStats.slice(0, 3).map((s) => (
          <div key={s.label} className="bg-[#0d1424] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-falcon-cream">{s.value}</p>
            <p className="text-xs text-falcon-cream/40">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
