import { format } from "date-fns";
import { FlaskConical, TrendingUp, Clock, MousePointerClick, Trophy, StopCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ABTest, useABTestWithStats, useEndABTest } from "@/hooks/useABTests";
import { cn } from "@/lib/utils";

interface ABTestResultsProps {
  test: ABTest;
  artistId: string;
}

export function ABTestResults({ test, artistId }: ABTestResultsProps) {
  const { data: stats, isLoading } = useABTestWithStats(test.id);
  const endTest = useEndABTest();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading test results...
        </CardContent>
      </Card>
    );
  }

  const totalViews = stats.variant_a_views + stats.variant_b_views;
  const aPercentage = totalViews > 0 ? (stats.variant_a_views / totalViews) * 100 : 50;
  
  const aClickRate = stats.variant_a_views > 0 
    ? (stats.variant_a_clicks / stats.variant_a_views) * 100 
    : 0;
  const bClickRate = stats.variant_b_views > 0 
    ? (stats.variant_b_clicks / stats.variant_b_views) * 100 
    : 0;

  const aAvgDurationSec = stats.variant_a_avg_duration / 1000;
  const bAvgDurationSec = stats.variant_b_avg_duration / 1000;

  // Determine which is performing better
  const getWinningVariant = (): 'A' | 'B' | null => {
    if (totalViews < 20) return null; // Not enough data
    
    // Score based on click rate (weighted higher) and duration
    const aScore = aClickRate * 2 + aAvgDurationSec;
    const bScore = bClickRate * 2 + bAvgDurationSec;
    
    if (Math.abs(aScore - bScore) < 1) return null; // Too close to call
    return aScore > bScore ? 'A' : 'B';
  };

  const currentWinner = test.status === 'completed' ? test.winner_variant : getWinningVariant();

  const handleEndTest = (winner?: 'A' | 'B') => {
    endTest.mutate({
      testId: test.id,
      artistId,
      winnerVariant: winner,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{test.name}</CardTitle>
          </div>
          <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
            {test.status === 'active' ? 'Running' : test.status}
          </Badge>
        </div>
        <CardDescription>
          Started {format(new Date(test.start_date), 'MMM d, yyyy')}
          {test.end_date && test.status !== 'active' && (
            <> · Ended {format(new Date(test.end_date), 'MMM d, yyyy')}</>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Views Distribution */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Variant A: {stats.variant_a_views} views</span>
            <span>Variant B: {stats.variant_b_views} views</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-muted flex">
            <div 
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${aPercentage}%` }}
            />
            <div 
              className="bg-purple-500 h-full transition-all"
              style={{ width: `${100 - aPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="grid grid-cols-2 gap-6">
          {/* Variant A */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-colors",
            currentWinner === 'A' ? "border-blue-500 bg-blue-500/5" : "border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-blue-500">Variant A</span>
              {currentWinner === 'A' && (
                <Badge className="bg-blue-500 gap-1">
                  <Trophy className="h-3 w-3" />
                  {test.status === 'completed' ? 'Winner' : 'Leading'}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Views
                </span>
                <span className="font-medium">{stats.variant_a_views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Avg Duration
                </span>
                <span className="font-medium">{aAvgDurationSec.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  Click Rate
                </span>
                <span className="font-medium">{aClickRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Variant B */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-colors",
            currentWinner === 'B' ? "border-purple-500 bg-purple-500/5" : "border-border"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-purple-500">Variant B</span>
              {currentWinner === 'B' && (
                <Badge className="bg-purple-500 gap-1">
                  <Trophy className="h-3 w-3" />
                  {test.status === 'completed' ? 'Winner' : 'Leading'}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Views
                </span>
                <span className="font-medium">{stats.variant_b_views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Avg Duration
                </span>
                <span className="font-medium">{bAvgDurationSec.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  Click Rate
                </span>
                <span className="font-medium">{bClickRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {test.status === 'active' && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEndTest()}
              disabled={endTest.isPending}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              End Test
            </Button>
            {currentWinner && (
              <Button 
                size="sm"
                onClick={() => handleEndTest(currentWinner)}
                disabled={endTest.isPending}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Declare {currentWinner} as Winner
              </Button>
            )}
          </div>
        )}

        {/* Insight */}
        {totalViews < 20 && test.status === 'active' && (
          <p className="text-xs text-muted-foreground text-center">
            Need at least 20 total views for meaningful insights
          </p>
        )}
      </CardContent>
    </Card>
  );
}
