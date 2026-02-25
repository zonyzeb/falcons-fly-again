import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Trophy, Target, Flame, TrendingUp, Award, Zap, Crosshair, CircleDot, Percent, Star, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { getPlayerBySlug, getRosterPlayer } from "@/data/stats";

const ROLE_LABELS: Record<string, string> = {
  BAT: "Batsman",
  BOWL: "Bowler",
  ALL: "All-rounder",
  WK: "Wicketkeeper",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  index: number;
}

function StatCard({ label, value, icon: Icon, color, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="glass-dark rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200"
    >
      <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-display font-bold text-falcon-cream">{value}</p>
      <p className="text-xs text-falcon-cream/50 uppercase tracking-wide mt-1">{label}</p>
    </motion.div>
  );
}

function val(v: number | string | undefined, fallback = "–"): string | number {
  return v != null && v !== 0 ? v : fallback;
}

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const stats = slug ? getPlayerBySlug(slug) : undefined;
  const roster = slug ? getRosterPlayer(slug) : undefined;

  if (!stats && !roster) {
    return (
      <div className="min-h-screen bg-falcon-navy">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-falcon-cream mb-4">Player not found</h1>
            <Link to="/" className="text-falcon-gold hover:underline">Back to home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const name = stats?.name || roster?.name || "";
  const photo = stats?.profile_photo || roster?.profile_pic_url || "";
  const hasPhoto = photo && !photo.includes("default");
  const role = roster ? (ROLE_LABELS[roster.sub_title] || roster.sub_title) : "";
  const profileUrl = roster?.profile_url || "";

  const bat = stats?.batting || {};
  const bowl = stats?.bowling || {};
  const field = stats?.fielding || {};
  const hasBatting = Object.keys(bat).length > 0;
  const hasBowling = Object.keys(bowl).length > 0;
  const hasFielding = Object.keys(field).length > 0;
  const hasAnyStats = hasBatting || hasBowling || hasFielding;

  const battingCards = hasBatting ? [
    { label: "Matches", value: val(bat.matches), icon: Trophy, color: "from-falcon-gold to-amber-500" },
    { label: "Innings", value: val(bat.innings), icon: Trophy, color: "from-amber-400 to-orange-500" },
    { label: "Runs", value: val(bat.runs), icon: TrendingUp, color: "from-emerald-400 to-green-500" },
    { label: "Average", value: val(bat.average), icon: Percent, color: "from-cyan-400 to-blue-500" },
    { label: "Strike Rate", value: val(bat.strike_rate), icon: Zap, color: "from-rose-400 to-red-500" },
    { label: "High Score", value: bat.highest_score_not_out ? `${bat.highest_score}${bat.highest_score_not_out}` : val(bat.highest_score), icon: Star, color: "from-violet-400 to-purple-500" },
    { label: "Not Outs", value: val(bat.not_outs), icon: Shield, color: "from-teal-400 to-cyan-500" },
    { label: "30s", value: val(bat.thirties), icon: Award, color: "from-lime-400 to-green-500" },
    { label: "50s", value: val(bat.fifties), icon: Award, color: "from-amber-400 to-orange-500" },
    { label: "100s", value: val(bat.hundreds), icon: Award, color: "from-falcon-gold to-yellow-500" },
    { label: "4s", value: val(bat.fours), icon: Crosshair, color: "from-orange-400 to-amber-500" },
    { label: "6s", value: val(bat.sixes), icon: Flame, color: "from-pink-400 to-rose-500" },
    { label: "Ducks", value: val(bat.ducks), icon: CircleDot, color: "from-slate-400 to-gray-500" },
  ] : [];

  const bowlingCards = hasBowling ? [
    { label: "Matches", value: val(bowl.matches), icon: Trophy, color: "from-falcon-gold to-amber-500" },
    { label: "Innings", value: val(bowl.innings), icon: Trophy, color: "from-amber-400 to-orange-500" },
    { label: "Wickets", value: val(bowl.wickets), icon: Target, color: "from-rose-400 to-red-500" },
    { label: "Overs", value: val(bowl.overs), icon: CircleDot, color: "from-slate-400 to-gray-500" },
    { label: "Economy", value: val(bowl.economy), icon: TrendingUp, color: "from-emerald-400 to-green-500" },
    { label: "Average", value: val(bowl.average), icon: Percent, color: "from-cyan-400 to-blue-500" },
    { label: "Strike Rate", value: val(bowl.strike_rate), icon: Zap, color: "from-orange-400 to-amber-500" },
    { label: "Best Figures", value: val(bowl.best_figures), icon: Star, color: "from-violet-400 to-purple-500" },
    { label: "Runs Given", value: val(bowl.runs_conceded), icon: Flame, color: "from-pink-400 to-rose-500" },
    { label: "Maidens", value: val(bowl.maidens), icon: Shield, color: "from-teal-400 to-cyan-500" },
    { label: "3 Wickets", value: val(bowl.three_wickets), icon: Award, color: "from-violet-400 to-indigo-500" },
    { label: "5 Wickets", value: val(bowl.five_wickets), icon: Award, color: "from-falcon-gold to-yellow-500" },
    { label: "Dot Balls", value: val(bowl.dot_balls), icon: CircleDot, color: "from-gray-400 to-slate-500" },
    { label: "Wides", value: val(bowl.wides), icon: Crosshair, color: "from-amber-400 to-orange-500" },
    { label: "No Balls", value: val(bowl.noballs), icon: Award, color: "from-red-400 to-rose-500" },
  ] : [];

  const fieldingCards = hasFielding ? [
    { label: "Matches", value: val(field.matches), icon: Trophy, color: "from-falcon-gold to-amber-500" },
    { label: "Catches", value: val(field.catches), icon: Target, color: "from-cyan-400 to-blue-500" },
    { label: "Caught Behind", value: val(field.caught_behind), icon: Target, color: "from-sky-400 to-blue-500" },
    { label: "Run Outs", value: val(field.run_outs), icon: Zap, color: "from-orange-400 to-red-500" },
    { label: "Stumpings", value: val(field.stumpings), icon: Shield, color: "from-teal-400 to-cyan-500" },
    { label: "Assisted Run Outs", value: val(field.assisted_run_outs), icon: Zap, color: "from-amber-400 to-orange-500" },
  ] : [];

  return (
    <div className="min-h-screen bg-falcon-navy">
      <Header />
      <div className="relative">
        <GradientMesh variant="hero" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/#team"
            className="inline-flex items-center gap-2 text-falcon-gold hover:text-falcon-gold-light transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Squad</span>
          </Link>
        </motion.div>

        {/* Player header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-6 mb-12"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-lg opacity-40" />
            {hasPhoto ? (
              <img
                src={photo}
                alt={name}
                className="relative w-28 h-28 rounded-full object-cover border-3 border-falcon-gold/50"
              />
            ) : (
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-falcon-gold/40 to-falcon-gold/20 flex items-center justify-center border-3 border-falcon-gold/50">
                <span className="font-display text-4xl font-bold text-falcon-gold">
                  {name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-falcon-cream">{name}</h1>
            {role && (
              <p className="text-falcon-gold text-lg font-medium mt-1">{role}</p>
            )}
            {profileUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-falcon-cream/50 hover:text-falcon-gold transition-colors mt-2"
              >
                CricHeroes Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </motion.div>

        {!hasAnyStats && (
          <GlassCard className="p-8 text-center">
            <p className="text-falcon-cream/60 text-lg">No statistics available yet for this player.</p>
          </GlassCard>
        )}

        {/* Batting */}
        {hasBatting && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="font-display text-2xl font-semibold text-falcon-cream mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Batting
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {battingCards.map((card, i) => (
                <StatCard key={card.label} {...card} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Bowling */}
        {hasBowling && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-10"
          >
            <h2 className="font-display text-2xl font-semibold text-falcon-cream mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              Bowling
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bowlingCards.map((card, i) => (
                <StatCard key={card.label} {...card} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Fielding */}
        {hasFielding && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <h2 className="font-display text-2xl font-semibold text-falcon-cream mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              Fielding
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {fieldingCards.map((card, i) => (
                <StatCard key={card.label} {...card} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
