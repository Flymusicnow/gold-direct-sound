import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { useBoostTokens } from '@/hooks/useBoostTokens';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BoostButtonProps {
  artistId: string;
  artistName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function BoostButton({ artistId, artistName, variant = 'outline', size = 'sm' }: BoostButtonProps) {
  const { user } = useAuth();
  const { tokensAvailable, useBoost } = useBoostTokens();
  const [isBoosting, setIsBoosting] = useState(false);

  const handleBoost = async (boostType: 'discover' | 'trending' | 'spotlight' | 'feed') => {
    if (!user) {
      toast.error('Sign in to boost artists');
      return;
    }

    if (tokensAvailable <= 0) {
      toast.error('No boost tokens available this week');
      return;
    }

    setIsBoosting(true);
    const success = await useBoost(artistId, boostType);
    
    if (success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#E8BF1A', '#F4D67A'],
      });
      toast.success(`Boosted ${artistName} in ${boostType}!`);
    }
    
    setIsBoosting(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isBoosting || tokensAvailable <= 0}
          className="gap-1.5"
        >
          <Rocket className="h-4 w-4" />
          Boost ({tokensAvailable})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleBoost('discover')}>
          Boost in Discover
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBoost('trending')}>
          Boost in Trending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBoost('spotlight')}>
          Boost in Spotlight
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleBoost('feed')}>
          Boost in Fan Feed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
