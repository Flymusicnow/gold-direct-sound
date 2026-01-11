import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedRankBadgeProps {
  rank: number;
  previousRank?: number;
  showChange?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AnimatedRankBadge({
  rank,
  previousRank,
  showChange = true,
  size = "md",
}: AnimatedRankBadgeProps) {
  const change = previousRank ? previousRank - rank : 0;
  const isTop3 = rank <= 3;

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className={cn(iconSizes[size], "text-[#FFD700]")} />;
      case 2:
        return <Medal className={cn(iconSizes[size], "text-[#C0C0C0]")} />;
      case 3:
        return <Award className={cn(iconSizes[size], "text-[#CD7F32]")} />;
      default:
        return null;
    }
  };

  const rankIcon = getRankIcon();

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={rank}
          initial={{ y: change > 0 ? 20 : change < 0 ? -20 : 0, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: change > 0 ? -20 : change < 0 ? 20 : 0, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "flex items-center justify-center rounded-full font-bold",
            sizeClasses[size],
            isTop3
              ? "bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/30"
              : "bg-muted text-foreground"
          )}
        >
          {rankIcon || `#${rank}`}
        </motion.div>
      </AnimatePresence>

      {/* Change Indicator */}
      <AnimatePresence>
        {showChange && change !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={cn(
              "absolute -top-1 -right-1 flex items-center gap-0.5 text-xs font-bold px-1 py-0.5 rounded-full",
              change > 0
                ? "bg-green-500/20 text-green-500"
                : "bg-red-400/20 text-red-400"
            )}
          >
            {change > 0 ? (
              <>
                <ArrowUp className="h-3 w-3" />
                <span>{change}</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3 w-3" />
                <span>{Math.abs(change)}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
