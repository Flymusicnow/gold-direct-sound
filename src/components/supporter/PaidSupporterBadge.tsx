import { Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PaidSupporterBadgeProps {
  tier: 'basic' | 'gold';
  tierName?: string;
  variant?: 'default' | 'mini';
}

export function PaidSupporterBadge({ tier, tierName, variant = 'default' }: PaidSupporterBadgeProps) {
  const isGold = tier === 'gold';
  const displayName = tierName || (isGold ? 'Gold' : 'Basic');
  
  if (variant === 'mini') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center">
              {isGold ? (
                <Crown className="h-4 w-4 text-primary fill-primary/20" />
              ) : (
                <Star className="h-4 w-4 text-primary fill-primary/20" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayName} Supporter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge 
      variant={isGold ? 'default' : 'secondary'}
      className={isGold 
        ? 'bg-gradient-gold text-primary-foreground gap-1' 
        : 'bg-primary/10 text-primary border-primary/20 gap-1'
      }
    >
      {isGold ? (
        <Crown className="h-3 w-3" />
      ) : (
        <Star className="h-3 w-3" />
      )}
      {displayName}
    </Badge>
  );
}
