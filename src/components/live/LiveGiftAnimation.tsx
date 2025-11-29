import { useEffect, useState } from 'react';
import { Heart, Sparkles, Flame, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Gift {
  id: string;
  type: string;
  timestamp: number;
}

interface LiveGiftAnimationProps {
  streamId: string;
}

const giftIcons = {
  heart: Heart,
  gold_sparkle: Sparkles,
  fire: Flame,
  star: Star,
};

const giftColors = {
  heart: 'text-red-500',
  gold_sparkle: 'text-primary',
  fire: 'text-orange-500',
  star: 'text-yellow-500',
};

export function LiveGiftAnimation({ streamId }: LiveGiftAnimationProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);

  useEffect(() => {
    // Listen for real-time gift events
    const channel = supabase
      .channel(`live-gifts-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_gifts',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const newGift: Gift = {
            id: payload.new.id,
            type: payload.new.gift_type,
            timestamp: Date.now(),
          };
          setGifts((prev) => [...prev, newGift]);

          // Remove gift after animation
          setTimeout(() => {
            setGifts((prev) => prev.filter((g) => g.id !== newGift.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {gifts.map((gift) => {
          const Icon = giftIcons[gift.type as keyof typeof giftIcons];
          const colorClass = giftColors[gift.type as keyof typeof giftColors];
          const startX = Math.random() * window.innerWidth;

          return (
            <motion.div
              key={gift.id}
              initial={{
                opacity: 0,
                x: startX,
                y: window.innerHeight,
                scale: 0.5,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -100,
                scale: [0.5, 1.2, 1, 0.8],
                x: startX + (Math.random() - 0.5) * 200,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3,
                ease: 'easeOut',
              }}
              className="absolute"
            >
              <Icon className={`h-12 w-12 ${colorClass} drop-shadow-lg`} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
