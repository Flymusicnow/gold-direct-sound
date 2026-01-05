import { BarChart3, Eye, MousePointer, Clock, TrendingUp, ExternalLink, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotlightStats } from "@/hooks/useSpotlightStats";

interface SpotlightAnalyticsCardProps {
  stats: SpotlightStats | undefined;
}

export function SpotlightAnalyticsCard({ stats }: SpotlightAnalyticsCardProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No analytics data yet. Views will appear once fans start viewing your spotlight.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Last 7 Days</span>
            </div>
            <p className="text-2xl font-bold">{stats.viewsLast7Days.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Click Rate</span>
            </div>
            <p className="text-2xl font-bold">{stats.clickThroughRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(stats.averageViewDuration)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Click Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Link Clicks</CardTitle>
          <CardDescription>
            Internal FlyMusic links vs external platform links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.internalClicks}</p>
                <p className="text-sm text-muted-foreground">FlyMusic Links</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.externalClicks}</p>
                <p className="text-sm text-muted-foreground">External Links</p>
              </div>
            </div>
          </div>

          {stats.externalClicks > stats.internalClicks && (
            <p className="text-xs text-amber-600 mt-4 bg-amber-500/10 p-2 rounded">
              Tip: Internal FlyMusic links keep fans in your ecosystem and boost engagement.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Per-Media Performance */}
      {stats.viewsByMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.viewsByMedia.map((item, index) => (
                <div key={item.mediaId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">
                    Media #{index + 1}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{item.views} views</span>
                    <span className="text-muted-foreground">{item.clicks} clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
