import { motion } from "framer-motion";

interface GradientMeshProps {
  className?: string;
  variant?: "hero" | "section" | "dark";
}

export function GradientMesh({ className = "", variant = "hero" }: GradientMeshProps) {
  const variants = {
    hero: {
      colors: [
        "hsl(42 85% 55% / 0.15)",
        "hsl(220 50% 25% / 0.3)",
        "hsl(42 75% 45% / 0.1)",
      ],
    },
    section: {
      colors: [
        "hsl(42 85% 55% / 0.08)",
        "hsl(220 50% 40% / 0.05)",
        "hsl(42 75% 65% / 0.06)",
      ],
    },
    dark: {
      colors: [
        "hsl(42 85% 55% / 0.12)",
        "hsl(220 50% 20% / 0.4)",
        "hsl(42 75% 45% / 0.08)",
      ],
    },
  };

  const { colors } = variants[variant];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{ background: colors[0], top: "-20%", right: "-10%" }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
        style={{ background: colors[1], bottom: "-15%", left: "-5%" }}
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[60px]"
        style={{ background: colors[2], top: "40%", left: "30%" }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
