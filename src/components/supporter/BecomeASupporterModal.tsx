import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupporterTiers } from '@/hooks/useSupporterTiers';

interface BecomeASupporterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
}

export function BecomeASupporterModal({
  open,
  onOpenChange,
  artistId,
  artistName,
}: BecomeASupporterModalProps) {
  const [loading, setLoading] = useState(false);
  const { tiers, loading: tiersLoading } = useSupporterTiers(artistId);

  const handleSubscribe = async (tierId: string, tierSlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supporter-checkout', {
        body: { artistId, tier: tierSlug, tierId },
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

  const formatPrice = (priceCents: number, currency: string) => {
    return `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;
  };

  const getTierIcon = (slug: string) => {
    return slug === 'gold' ? Crown : Star;
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

        {tiersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={`grid gap-6 mt-6 ${tiers.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {tiers.filter(t => t.is_active).map((tier) => {
              const Icon = getTierIcon(tier.slug);
              const isHighlight = tier.slug === 'gold';
              const features = Array.isArray(tier.features) ? tier.features : [];
              
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-xl border p-6 ${
                    isHighlight
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  {isHighlight && (
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
                      <span className="text-3xl font-bold">
                        {formatPrice(tier.price_cents, tier.currency)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        /{tier.interval || 'month'}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{String(feature)}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(tier.id, tier.slug)}
                    disabled={loading}
                    className={`w-full ${
                      isHighlight ? 'bg-gradient-gold' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Subscribe'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            70% of your subscription goes directly to the artist. You can cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
