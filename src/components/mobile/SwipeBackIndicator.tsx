import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SwipeBackIndicatorProps {
  progress: number;
  isVisible: boolean;
}

export function SwipeBackIndicator({ progress, isVisible }: SwipeBackIndicatorProps) {
  const opacity = Math.min(progress / 30, 1);
  const scale = Math.min(0.6 + (progress / 100) * 0.4, 1);
  const translateX = Math.min(progress * 0.5, 50);

  return (
    <AnimatePresence>
      {isVisible && progress > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          style={{
            transform: `translate(${translateX}px, -50%)`,
          }}
        >
          <div
            className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-3 shadow-lg"
            style={{
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <ChevronLeft
              className="text-primary"
              style={{
                width: 20 + (progress / 100) * 4,
                height: 20 + (progress / 100) * 4,
              }}
            />
            {progress >= 80 && (
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Back
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
