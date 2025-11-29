import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BecomeASupporterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
}

const tiers = [
  {
    name: 'Basic Supporter',
    price: '49 kr',
    period: '/month',
    tier: 'basic',
    icon: Star,
    features: [
      '+25 XP bonus each month',
      'Supporter badge on comments',
      'Priority support from artist',
      'Early access to releases',
    ],
  },
  {
    name: 'Gold Supporter',
    price: '99 kr',
    period: '/month',
    tier: 'gold',
    icon: Crown,
    highlight: true,
    features: [
      '+75 XP bonus each month',
      'Gold supporter badge',
      'Exclusive content access',
      'Direct message privileges',
      'Monthly supporter shoutouts',
    ],
  },
];

export function BecomeASupporterModal({
  open,
  onOpenChange,
  artistId,
  artistName,
}: BecomeASupporterModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (tier: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supporter-checkout', {
        body: { artistId, tier },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Become a Supporter of {artistName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Support your favorite artist directly and unlock exclusive perks
          </p>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.tier}
                className={`relative rounded-xl border p-6 ${
                  tier.highlight
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-gold text-background text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(tier.tier)}
                  disabled={loading}
                  className={`w-full ${
                    tier.highlight ? 'bg-gradient-gold' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Subscribe'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            70% of your subscription goes directly to the artist. You can cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
