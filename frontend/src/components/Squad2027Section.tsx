import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { GlassCard } from "@/components/ui/GlassCard";
import { players as playersData, getPlayerBySlug } from "@/data/stats";
import { fetchSquad2027Public, type Squad2027Member } from "@/lib/db";

const ROLE_LABELS: Record<string, string> = { BAT: "Batsman", BOWL: "Bowler", ALL: "All-rounder", WK: "Wicketkeeper" };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Resolved {
  id: string;
  name: string;
  role: string;
  tagline: string | null;
  photo: string | null;
  jersey: number | null;
  isCaptain: boolean;
  isVice: boolean;
  slug: string | null;
  runs: number | null;
  wickets: number | null;
}

function resolve(m: Squad2027Member): Resolved {
  const linked = m.player_id != null ? playersData.find((p) => p.player_id === m.player_id) : undefined;
  const slug = linked?.slug ?? null;
  const stats = slug ? getPlayerBySlug(slug) : undefined;
  return {
    id: m.id,
    name: m.name || linked?.name || "Player",
    role: m.role ? ROLE_LABELS[m.role] ?? m.role : linked?.sub_title ? ROLE_LABELS[linked.sub_title] ?? linked.sub_title : "",
    tagline: m.tagline,
    photo: m.photo_url || linked?.profile_pic_url || null,
    jersey: m.jersey_number,
    isCaptain: m.is_captain,
    isVice: m.is_vice_captain,
    slug,
    runs: stats?.batting?.runs ?? null,
    wickets: stats?.bowling?.wickets ?? null,
  };
}

export function Squad2027Section() {
  const [members, setMembers] = useState<Squad2027Member[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSquad2027Public().then(setMembers).catch(() => { setError(true); setMembers([]); });
  }, []);

  const roster = (members ?? []).map(resolve);

  return (
    <section id="team" className="falcon-section bg-falcon-navy relative">
      <GradientMesh variant="dark" />

      <div className="falcon-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-falcon-gold font-semibold text-sm uppercase tracking-wider mb-3 glass-dark px-4 py-1.5 rounded-full">
            The 2027 Squad
          </span>
          <h2 className="falcon-heading text-falcon-cream mt-4 mb-6">
            One Team. One Badge.{" "}
            <span className="text-gradient-gold">One Goal.</span>
          </h2>
          <p className="text-falcon-cream/60 text-lg max-w-2xl mx-auto leading-relaxed">
            The players carrying the Falcons badge into 2027 — built on trust, experience and understanding.
          </p>
        </motion.div>

        {members === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-falcon-navy-light/30 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : roster.length === 0 ? (
          <p className="text-center text-falcon-cream/40 text-sm bg-falcon-navy-light/30 border border-white/5 rounded-2xl p-8 max-w-md mx-auto">
            {error ? "Couldn't load the squad right now — please try again later." : "The 2027 squad will be announced soon."}
          </p>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {roster.map((p) => {
              const card = (
                <GlassCard className="p-5 h-full bg-falcon-navy-light/30 cursor-pointer group" glowColor="hsl(42 85% 55% / 0.2)">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-falcon-gold to-falcon-gold-light blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
                      {p.photo && !p.photo.includes("default") ? (
                        <img src={p.photo} alt={p.name} className="relative w-12 h-12 rounded-full object-cover border border-falcon-gold/30 group-hover:border-falcon-gold/60 transition-colors" />
                      ) : (
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-falcon-gold/30 to-falcon-gold/10 flex items-center justify-center border border-falcon-gold/30 group-hover:border-falcon-gold/60 transition-colors">
                          <span className="font-display text-lg font-bold text-falcon-gold">{p.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-falcon-cream group-hover:text-falcon-gold transition-colors flex items-center gap-1.5">
                        <span className="truncate">{p.name}</span>
                        {p.isCaptain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-falcon-gold/20 text-falcon-gold border border-falcon-gold/40 font-bold shrink-0">C</span>}
                        {p.isVice && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shrink-0">VC</span>}
                      </h3>
                      <p className="text-falcon-gold text-sm font-medium">
                        {p.role}{p.jersey != null ? <span className="text-falcon-cream/40"> · #{p.jersey}</span> : null}
                      </p>
                      {p.tagline ? (
                        <p className="text-falcon-cream/50 text-xs mt-1.5 line-clamp-2">{p.tagline}</p>
                      ) : p.runs != null ? (
                        <p className="text-falcon-cream/50 text-xs mt-1.5">{p.runs} runs{p.wickets ? ` · ${p.wickets} wkts` : ""}</p>
                      ) : null}
                    </div>
                  </div>
                </GlassCard>
              );
              return (
                <motion.div key={p.id} variants={itemVariants}>
                  {p.slug ? <Link to={`/player/${p.slug}`}>{card}</Link> : card}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
