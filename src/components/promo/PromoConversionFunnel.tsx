import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, UserPlus, Heart, ArrowDown } from 'lucide-react';

interface PromoConversionFunnelProps {
  views: number;
  follows: number;
  supporters: number;
}

export function PromoConversionFunnel({ views, follows, supporters }: PromoConversionFunnelProps) {
  const viewToFollowRate = views > 0 ? ((follows / views) * 100).toFixed(1) : '0';
  const followToSupportRate = follows > 0 ? ((supporters / follows) * 100).toFixed(1) : '0';
  const overallRate = views > 0 ? ((supporters / views) * 100).toFixed(1) : '0';

  const stages = [
    { icon: Eye, label: 'Views', value: views, color: 'text-blue-500' },
    { icon: UserPlus, label: 'Follows', value: follows, rate: viewToFollowRate, color: 'text-primary' },
    { icon: Heart, label: 'Supporters', value: supporters, rate: followToSupportRate, color: 'text-pink-500' },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="w-full">
              <div
                className="relative mx-auto flex items-center justify-center gap-3 py-4 px-6 rounded-lg bg-secondary/50"
                style={{
                  width: `${100 - index * 15}%`,
                  minWidth: '60%',
                }}
              >
                <stage.icon className={`h-5 w-5 ${stage.color}`} />
                <span className="font-bold text-lg">{stage.value.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">{stage.label}</span>
                {stage.rate && (
                  <span className="absolute right-3 text-xs text-muted-foreground">
                    {stage.rate}%
                  </span>
                )}
              </div>
              {index < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Overall conversion rate: <span className="font-semibold text-primary">{overallRate}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
