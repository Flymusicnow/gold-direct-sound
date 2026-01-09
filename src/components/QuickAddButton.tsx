import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Loader2, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePinnedStack } from '@/hooks/usePinnedStack';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function QuickAddButton() {
  const { user } = useAuth();
  const { currentItem } = useFlightdeck();
  const { pinnedStack, addToQuickStack, loading: stackLoading } = usePinnedStack();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Don't render if no user, no current track, or stack is loading
  if (!user || !currentItem || stackLoading) return null;

  // Don't render if no pinned stack
  if (!pinnedStack) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              className={cn(
                "fixed bottom-24 right-4 z-50",
                "w-14 h-14 rounded-full shadow-lg",
                "flex items-center justify-center",
                "bg-muted text-muted-foreground",
                "border-2 border-dashed border-muted-foreground/30"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListMusic className="h-6 w-6" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Pin a stack for Quick Add</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleQuickAdd = async () => {
    if (isAdding || showSuccess) return;

    setIsAdding(true);
    const success = await addToQuickStack(currentItem.id, currentItem.title);
    setIsAdding(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleQuickAdd}
            disabled={isAdding || showSuccess}
            className={cn(
              "fixed bottom-24 right-4 z-50",
              "w-14 h-14 rounded-full shadow-lg",
              "flex items-center justify-center",
              "transition-colors duration-200",
              showSuccess 
                ? "bg-green-500 text-white" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="h-6 w-6" />
                </motion.div>
              ) : isAdding ? (
                <motion.div
                  key="loader"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Loader2 className="h-6 w-6 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Plus className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Add to "{pinnedStack.name}"</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
