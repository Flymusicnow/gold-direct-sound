import { useState } from 'react';
import { Crown, Heart, Sparkles, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupporterTiers, SupporterTier } from '@/hooks/useSupporterTiers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupportTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  basic: <Heart className="h-6 w-6" />,
  gold: <Crown className="h-6 w-6" />,
};

export function SupportTierModal({
  open,
  onOpenChange,
  artistId,
  artistName,
}: SupportTierModalProps) {
  const { tiers, loading } = useSupporterTiers(artistId);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (tier: SupporterTier) => {
    try {
      setSubscribing(tier.slug);
      console.log('[SupportTierModal] Starting subscription for tier:', tier.slug, 'artistId:', artistId);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('[SupportTierModal] Session check:', { hasSession: !!sessionData.session, error: sessionError });
      
      if (!sessionData.session) {
        toast.error('Please sign in to subscribe');
        return;
      }

      console.log('[SupportTierModal] Invoking create-supporter-checkout with:', {
        artistId,
        tier: tier.slug,
        tierId: tier.id.startsWith('default-') ? null : tier.id,
      });

      const { data, error } = await supabase.functions.invoke('create-supporter-checkout', {
        body: { 
          artistId, 
          tier: tier.slug,
          tierId: tier.id.startsWith('default-') ? null : tier.id,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('[SupportTierModal] Edge function response:', { data, error });

      if (error) {
        console.error('[SupportTierModal] Edge function error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('[SupportTierModal] Data error:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[SupportTierModal] Redirecting to Stripe checkout:', data.url);
        // Open in new tab for better mobile experience
        window.open(data.url, '_blank');
        toast.success('Opening Stripe checkout...');
      } else {
        console.error('[SupportTierModal] No URL in response:', data);
        toast.error('Failed to get checkout URL');
      }
    } catch (err) {
      console.error('[SupportTierModal] Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start subscription';
      toast.error(errorMessage);
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(priceCents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Support {artistName}
          </DialogTitle>
          <DialogDescription>
            Choose a tier to support and get exclusive benefits
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 py-4">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={`p-6 relative overflow-hidden transition-all hover:border-primary/50 ${
                  tier.slug === 'gold' ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                {tier.slug === 'gold' && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    tier.slug === 'gold' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tierIcons[tier.slug] || <Heart className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tier.name}</h3>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(tier.price_cents, tier.currency)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{tier.interval}
                      </span>
                    </p>
                  </div>
                </div>

                {tier.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {tier.description}
                  </p>
                )}

                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    tier.slug === 'gold' 
                      ? 'bg-gradient-gold hover:opacity-90' 
                      : ''
                  }`}
                  variant={tier.slug === 'gold' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(tier)}
                  disabled={subscribing !== null}
                >
                  {subscribing === tier.slug ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Subscribe to ${tier.name}`
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          70% of your subscription goes directly to {artistName}
        </p>
      </DialogContent>
    </Dialog>
  );
}
