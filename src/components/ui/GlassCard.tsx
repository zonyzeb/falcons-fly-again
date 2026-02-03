import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "onMouseMove"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  glowColor = "hsl(42 85% 55% / 0.15)",
  interactive = true,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !interactive) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-card/60 backdrop-blur-xl",
        "border border-border/50",
        "shadow-[0_8px_32px_-8px_hsl(220_50%_15%_/_0.15)]",
        "transition-all duration-300",
        interactive && "hover:shadow-[0_20px_50px_-15px_hsl(42_85%_55%_/_0.25)]",
        interactive && "hover:border-accent/30",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Glow effect on hover */}
      {interactive && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, ${glowColor}, transparent 40%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
