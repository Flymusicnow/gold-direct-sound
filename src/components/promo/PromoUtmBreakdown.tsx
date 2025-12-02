import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Instagram, Youtube, Music2, Mail, Globe, Hash } from 'lucide-react';

interface UtmData {
  utm_source: string;
  clicks: number;
  follows: number;
  supporters: number;
}

interface PromoUtmBreakdownProps {
  data: UtmData[];
  totalClicks: number;
}

const utmIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  email: Mail,
  direct: Globe,
};

const utmLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
  direct: 'Direct',
};

export function PromoUtmBreakdown({ data, totalClicks }: PromoUtmBreakdownProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No traffic data yet. Add UTM sources to your links to track where your fans come from.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.clicks - a.clicks);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedData.map((item) => {
          const Icon = utmIcons[item.utm_source.toLowerCase()] || Hash;
          const label = utmLabels[item.utm_source.toLowerCase()] || item.utm_source;
          const percentage = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0;
          const conversionRate = item.clicks > 0 ? ((item.follows / item.clicks) * 100).toFixed(1) : '0';

          return (
            <div key={item.utm_source} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.clicks} clicks
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {conversionRate}% convert
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.follows} follows</span>
                <span>{item.supporters} supporters</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
