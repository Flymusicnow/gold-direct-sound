import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap, Heart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeightedScoreDisplayProps {
  supporterScore: number;
  momentumScore: number;
  tasteMatch: number;
  engagementScore: number;
  compact?: boolean;
}

export function WeightedScoreDisplay({ 
  supporterScore, 
  momentumScore, 
  tasteMatch, 
  engagementScore,
  compact = false 
}: WeightedScoreDisplayProps) {
  // Calculate weighted total
  const totalScore = Math.round(
    (supporterScore * 0.4) +
    (momentumScore * 0.3) +
    (tasteMatch * 0.2) +
    (engagementScore * 0.1)
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-primary border-primary/30">
              <TrendingUp className="h-3 w-3" />
              {totalScore}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="w-48">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Supporters</span>
                <span>{Math.round(supporterScore * 0.4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Momentum</span>
                <span>{Math.round(momentumScore * 0.3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Taste Match</span>
                <span>{Math.round(tasteMatch * 0.2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Engagement</span>
                <span>{Math.round(engagementScore * 0.1)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Reach Score</span>
        <Badge className="bg-primary text-primary-foreground">{totalScore}</Badge>
      </div>
      <div className="space-y-1.5 text-xs">
        <ScoreRow icon={<Users className="h-3 w-3" />} label="Supporters (40%)" value={supporterScore} weight={0.4} />
        <ScoreRow icon={<Zap className="h-3 w-3" />} label="Momentum (30%)" value={momentumScore} weight={0.3} />
        <ScoreRow icon={<Heart className="h-3 w-3" />} label="Taste Match (20%)" value={tasteMatch} weight={0.2} />
        <ScoreRow icon={<TrendingUp className="h-3 w-3" />} label="Engagement (10%)" value={engagementScore} weight={0.1} />
      </div>
    </div>
  );
}

function ScoreRow({ icon, label, value, weight }: { icon: React.ReactNode; label: string; value: number; weight: number }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="flex items-center gap-1.5">{icon} {label}</span>
      <span className="text-foreground">{Math.round(value * weight)}</span>
    </div>
  );
}
