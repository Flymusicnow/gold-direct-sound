import { TrendingUp, MessageSquare, Heart, Reply } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserEngagementScore } from '@/hooks/useUserEngagementScore';
import { useLanguage } from '@/contexts/LanguageContext';

interface MyEngagementCardProps {
  communityId: string | null;
  className?: string;
}

export function MyEngagementCard({ communityId, className }: MyEngagementCardProps) {
  const { t } = useLanguage();
  const { engagement, isLoading } = useUserEngagementScore(communityId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('community.yourRank')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (engagement.rank === null) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('community.yourRank')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
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
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('community.yourRank')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">#{engagement.rank}</span>
          <span className="text-sm text-muted-foreground">
            Top {engagement.percentile}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('community.leaderboardScore')}</span>
            <span className="font-medium">{engagement.totalScore} pts</span>
          </div>
          <Progress value={Math.min(engagement.percentile, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
            </div>
            <p className="text-lg font-semibold">{engagement.breakdown.comments}</p>
            <p className="text-xs text-muted-foreground">Comments</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Reply className="h-3 w-3" />
            </div>
            <p className="text-lg font-semibold">{engagement.breakdown.replies}</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
            </div>
            <p className="text-lg font-semibold">{engagement.breakdown.reactions}</p>
            <p className="text-xs text-muted-foreground">Reactions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
