import React from 'react';
import { Users, MessageSquare, Heart, TrendingUp, TrendingDown, Pin, EyeOff, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunityAnalytics } from '@/hooks/useCommunityAnalytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface CommunityAnalyticsDashboardProps {
  communityId: string | null;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && trend !== 0 && (
            <span
              className={cn(
                'text-xs flex items-center gap-0.5 mb-1',
                trend > 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </CardContent>
    </Card>
  );
};

export const CommunityAnalyticsDashboard: React.FC<CommunityAnalyticsDashboardProps> = ({
  communityId,
}) => {
  const { analytics, isLoading, error } = useCommunityAnalytics(communityId);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-8 text-center text-destructive">
          Failed to load analytics. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={analytics.totalMembers}
          subtitle={`+${analytics.newMembersThisWeek} this week`}
          trend={analytics.memberGrowthRate}
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Posts"
          value={analytics.totalPosts}
          subtitle={`${analytics.postsThisWeek} this week`}
          trend={analytics.postGrowthRate}
          icon={<FileText className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Comments"
          value={analytics.totalComments}
          subtitle={`${analytics.commentsThisWeek} this week`}
          icon={<MessageSquare className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Reactions"
          value={analytics.totalReactions}
          subtitle={`${analytics.reactionsThisWeek} this week`}
          icon={<Heart className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Growth</CardTitle>
          <CardDescription>Last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : analytics.memberGrowthHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.memberGrowthHistory}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Comments per Post</span>
              <span className="font-medium">{analytics.avgCommentsPerPost.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pinned Posts</span>
              <span className="font-medium flex items-center gap-1">
                <Pin className="h-3 w-3" />
                {analytics.pinnedPosts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hidden Comments</span>
              <span className="font-medium flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                {analytics.hiddenComments}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : analytics.membersByTier.length > 0 ? (
              <div className="space-y-2">
                {analytics.membersByTier.map(({ tier, count }) => (
                  <div key={tier} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{tier}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tier breakdown will appear as members join
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
