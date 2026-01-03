import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubscriptionCTAProps {
  artistId: string;
  artistName: string;
  onSubscribe?: () => void;
}

export const SubscriptionCTA: React.FC<SubscriptionCTAProps> = ({
  artistId,
  artistName,
  onSubscribe
}) => {
  const { t } = useLanguage();
  const { isSubscribed, isArtistOwner, getMinimumPrice } = useSubscriptionAccess(artistId);
  const [minPrice, setMinPrice] = useState<number | null>(null);

  useEffect(() => {
    const loadPrice = async () => {
      const price = await getMinimumPrice();
      setMinPrice(price);
    };
    loadPrice();
  }, [getMinimumPrice]);

  // Don't show for subscribers or artist owners
  if (isSubscribed || isArtistOwner) return null;

  const priceDisplay = minPrice ? `${(minPrice / 100).toFixed(0)} SEK/month` : 'from 49 SEK/month';

  return (
    <Card className="sticky top-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Join {artistName}'s Community</p>
            <p className="text-xs text-muted-foreground">Unlock exclusive content</p>
          </div>
        </div>
        
        <Button 
          onClick={onSubscribe} 
          className="w-full"
          size="sm"
        >
          Subscribe – {priceDisplay}
        </Button>
      </CardContent>
    </Card>
  );
};
