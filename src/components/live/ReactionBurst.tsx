import { motion, AnimatePresence } from "framer-motion";
import { Flame, Heart, ThumbsUp, Sparkles, Laugh } from "lucide-react";
import { ReactionType } from "@/hooks/useLiveReactions";
import { cn } from "@/lib/utils";

interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  createdAt: string;
}

interface ReactionBurstProps {
  reactions: Reaction[];
  className?: string;
}

const reactionConfig: Record<ReactionType, { icon: React.ElementType; color: string }> = {
  fire: { icon: Flame, color: 'text-orange-500' },
  heart: { icon: Heart, color: 'text-red-500' },
  clap: { icon: ThumbsUp, color: 'text-blue-500' },
  wow: { icon: Sparkles, color: 'text-yellow-500' },
  laugh: { icon: Laugh, color: 'text-green-500' },
};

/**
 * ReactionBurst - Floating reaction animations
 * Shows reactions floating up from bottom of container
 */
export function ReactionBurst({ reactions, className }: ReactionBurstProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <AnimatePresence>
        {reactions.map((reaction, index) => {
          const config = reactionConfig[reaction.type];
          const Icon = config.icon;
          
          // Random horizontal position
          const xOffset = 20 + Math.random() * 60; // 20-80%
          
          return (
            <motion.div
              key={reaction.id}
              initial={{ 
                opacity: 0, 
                y: '100%', 
                x: `${xOffset}%`,
                scale: 0.5 
              }}
              animate={{ 
                opacity: 1, 
                y: '-100%', 
                scale: 1,
                transition: { 
                  duration: 2.5,
                  ease: 'easeOut',
                }
              }}
              exit={{ 
                opacity: 0,
                transition: { duration: 0.3 }
              }}
              className="absolute bottom-0"
              style={{ left: `${xOffset}%` }}
            >
              <motion.div
                animate={{
                  x: [0, 10, -10, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <Icon className={cn("h-6 w-6", config.color)} />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface ReactionButtonsProps {
  onReact: (type: ReactionType) => void;
  isRateLimited: boolean;
  className?: string;
}

/**
 * ReactionButtons - Quick reaction bar for fans
 */
export function ReactionButtons({ onReact, isRateLimited, className }: ReactionButtonsProps) {
  const reactions: ReactionType[] = ['fire', 'heart', 'clap', 'wow', 'laugh'];
  
  return (
    <div className={cn("flex gap-2", className)}>
      {reactions.map((type) => {
        const config = reactionConfig[type];
        const Icon = config.icon;
        
        return (
          <button
            key={type}
            onClick={() => onReact(type)}
            disabled={isRateLimited}
            className={cn(
              "p-2 rounded-full transition-all",
              "hover:bg-muted/50 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              config.color
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
