import { Trophy, TrendingUp, TrendingDown, Minus, MessageSquare, Heart, Reply } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFanLeaderboard, LeaderboardEntry } from '@/hooks/useFanLeaderboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FanLeaderboardProps {
  communityId: string | null;
  limit?: number;
  showMyRank?: boolean;
  className?: string;
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return <span className="text-lg">🥇</span>;
    case 2:
      return <span className="text-lg">🥈</span>;
    case 3:
      return <span className="text-lg">🥉</span>;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  }
}

function TrendIndicator({ trend }: { trend: LeaderboardEntry['trend'] }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function LeaderboardRow({ entry, isTop3 }: { entry: LeaderboardEntry; isTop3: boolean }) {
  const initials = entry.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50',
              isTop3 && 'bg-muted/30'
            )}
          >
            <div className="w-8 flex justify-center">
              {getRankBadge(entry.rank)}
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.avatarUrl || undefined} alt={entry.displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.displayName}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{entry.totalScore}</span>
              <TrendIndicator trend={entry.trend} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="p-3">
          <div className="space-y-2">
            <p className="font-medium">{entry.displayName}</p>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                <span>{entry.commentCount} comments</span>
              </div>
              <div className="flex items-center gap-2">
                <Reply className="h-3 w-3" />
                <span>{entry.replyCount} replies</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3" />
                <span>{entry.reactionGivenCount + entry.reactionReceivedCount} reactions</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FanLeaderboard({ communityId, limit = 5, className }: FanLeaderboardProps) {
  const { t } = useLanguage();
  const { leaderboard, isLoading } = useFanLeaderboard(communityId, { limit });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {t('community.leaderboard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {t('community.leaderboard')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('community.leaderboardEmpty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {t('community.leaderboard')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {leaderboard.map((entry) => (
          <LeaderboardRow 
            key={entry.userId} 
            entry={entry} 
            isTop3={entry.rank <= 3} 
          />
        ))}
      </CardContent>
    </Card>
  );
}
