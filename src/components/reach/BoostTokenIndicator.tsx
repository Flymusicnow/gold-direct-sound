import React from 'react';
import { Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBoostTokens } from '@/hooks/useBoostTokens';

export function BoostTokenIndicator() {
  const { tokensAvailable, loading } = useBoostTokens();

  if (loading) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{tokensAvailable}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Boost tokens available this week</p>
          <p className="text-xs text-muted-foreground">Use them to boost artists you love</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
