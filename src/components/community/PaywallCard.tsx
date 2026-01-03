import React from 'react';
import { Lock, Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaywallCardProps {
  requiredTier: string;
  artistName: string;
  artistId: string;
  minPrice?: number | null;
  onSubscribe?: () => void;
  onSeeTiers?: () => void;
  variant?: 'inline' | 'overlay';
}

const TIER_DISPLAY: Record<string, { label: string; color: string }> = {
  bronze: { label: 'Bronze', color: 'bg-amber-700 text-white' },
  silver: { label: 'Silver', color: 'bg-slate-400 text-slate-900' },
  gold: { label: 'Gold', color: 'bg-yellow-500 text-yellow-900' },
  diamond: { label: 'Diamond', color: 'bg-cyan-400 text-cyan-900' },
};

export const PaywallCard: React.FC<PaywallCardProps> = ({
  requiredTier,
  artistName,
  artistId,
  minPrice,
  onSubscribe,
  onSeeTiers,
  variant = 'inline',
}) => {
  const { t } = useLanguage();
  const tierInfo = TIER_DISPLAY[requiredTier] || { label: requiredTier, color: 'bg-muted text-muted-foreground' };
  const priceDisplay = minPrice ? `${Math.floor(minPrice / 100)} SEK/month` : '49 SEK/month';

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/95 via-background/80 to-background/60 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Unlock with <Badge className={tierInfo.color}>{tierInfo.label}</Badge> or higher
          </p>
          <p className="text-xs text-muted-foreground mb-4">From {priceDisplay}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={onSubscribe} size="sm" className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Join Community
            </Button>
            <Button onClick={onSeeTiers} variant="ghost" size="sm" className="w-full">
              See tiers
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-6">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Exclusive Content</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Unlock this post with <Badge className={tierInfo.color}>{tierInfo.label}</Badge> or higher
          </p>
          <p className="text-sm text-muted-foreground mb-4">From {priceDisplay}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={onSubscribe} className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Join {artistName}'s Community
            </Button>
            <Button onClick={onSeeTiers} variant="outline" className="w-full">
              See tiers
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
