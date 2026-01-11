import { BarChart3, Clock, MousePointerClick, TrendingUp, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTemplateAnalytics } from "@/hooks/useTemplateAnalytics";
import { cn } from "@/lib/utils";

interface TemplateAnalyticsCardProps {
  artistId: string | undefined;
}

export function TemplateAnalyticsCard({ artistId }: TemplateAnalyticsCardProps) {
  const { data: templateStats, isLoading } = useTemplateAnalytics(artistId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading template analytics...
        </CardContent>
      </Card>
    );
  }

  if (!templateStats || templateStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Template Performance
          </CardTitle>
          <CardDescription>
            See which template types perform best with your fans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No template data yet</p>
            <p className="text-sm">Create spotlights using templates to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestTemplate = templateStats[0];
  const bestClickRate = templateStats.reduce((best, t) => 
    t.clickRate > best.clickRate ? t : best, templateStats[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Template Performance
        </CardTitle>
        <CardDescription>
          See which template types perform best with your fans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Template</th>
                <th className="text-right py-2 font-medium">Views</th>
                <th className="text-right py-2 font-medium">Avg Duration</th>
                <th className="text-right py-2 font-medium">Click Rate</th>
              </tr>
            </thead>
            <tbody>
              {templateStats.map((stat, index) => (
                <tr key={stat.templateId} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span>{stat.templateName}</span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Most Views
                        </Badge>
                      )}
                      {stat.templateId === bestClickRate.templateId && stat.clickRate > 0 && (
                        <Badge className="text-xs bg-primary/20 text-primary">
                          Best CTR
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3">
                    <span className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      {stat.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="text-right py-3">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {(stat.avgDurationMs / 1000).toFixed(1)}s
                    </span>
                  </td>
                  <td className="text-right py-3">
                    <span className={cn(
                      "flex items-center justify-end gap-1",
                      stat.clickRate > 10 && "text-green-600"
                    )}>
                      <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                      {stat.clickRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insight */}
        {bestClickRate.clickRate > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Insight</p>
              <p className="text-muted-foreground">
                Your <span className="font-medium">{bestClickRate.templateName}</span> templates 
                get the highest click-through rate at {bestClickRate.clickRate.toFixed(1)}%. 
                Consider using this template more often!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
