import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Heart, Sparkles, Flame, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface LiveGiftButtonProps {
  streamId: string;
  onGiftSent?: (giftType: string) => void;
}

const gifts = [
  { type: 'heart', icon: Heart, label: 'Heart', xp: 1, color: 'text-red-500' },
  { type: 'gold_sparkle', icon: Sparkles, label: 'Gold Sparkle', xp: 3, color: 'text-primary' },
  { type: 'fire', icon: Flame, label: 'Fire', xp: 5, color: 'text-orange-500' },
  { type: 'star', icon: Star, label: 'Star', xp: 10, color: 'text-yellow-500' },
];

export function LiveGiftButton({ streamId, onGiftSent }: LiveGiftButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const sendGift = async (giftType: string, xpValue: number) => {
    if (!user) {
      toast.error('You must be logged in to send gifts');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('live_gifts').insert({
        stream_id: streamId,
        sender_user_id: user.id,
        gift_type: giftType,
        xp_value: xpValue,
      });

      if (error) throw error;

      toast.success(`Sent ${giftType}! +${xpValue} XP to artist`);
      setOpen(false);
      onGiftSent?.(giftType);
    } catch (error: any) {
      console.error('Error sending gift:', error);
      toast.error('Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Gift className="mr-2 h-4 w-4" />
          Send Gift
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold">Send a Gift</h4>
          <div className="grid grid-cols-2 gap-2">
            {gifts.map((gift) => {
              const Icon = gift.icon;
              return (
                <Button
                  key={gift.type}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => sendGift(gift.type, gift.xp)}
                  disabled={sending}
                >
                  <Icon className={`h-6 w-6 ${gift.color}`} />
                  <div className="text-center">
                    <div className="text-sm font-medium">{gift.label}</div>
                    <div className="text-xs text-muted-foreground">+{gift.xp} XP</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
