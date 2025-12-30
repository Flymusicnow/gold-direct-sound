import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointer, UserPlus, ArrowDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunnelData {
  previewSessions: number;
  ctaClicks: number;
  signups: number;
}

export function PreviewConversionFunnel() {
  const [data, setData] = useState<FunnelData>({
    previewSessions: 0,
    ctaClicks: 0,
    signups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      // Query telemetry_events for preview flow data
      const { data: events } = await supabase
        .from('telemetry_events')
        .select('flow, step, status')
        .in('flow', ['preview_session', 'preview_conversion']);
      
      if (events) {
        const previewSessions = events.filter(e => 
          e.flow === 'preview_session' && e.step === 'page_view'
        ).length;
        
        const ctaClicks = events.filter(e => 
          e.flow === 'preview_session' && e.step === 'cta_click'
        ).length;
        
        const signups = events.filter(e => 
          e.flow === 'preview_conversion' && e.step === 'success'
        ).length;
        
        setData({ previewSessions, ctaClicks, signups });
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate conversion rates
  const ctaRate = data.previewSessions > 0 
    ? ((data.ctaClicks / data.previewSessions) * 100).toFixed(1) 
    : '0';
  const signupRate = data.ctaClicks > 0 
    ? ((data.signups / data.ctaClicks) * 100).toFixed(1) 
    : '0';
  const overallRate = data.previewSessions > 0 
    ? ((data.signups / data.previewSessions) * 100).toFixed(1) 
    : '0';

  const stages = [
    { icon: Eye, label: 'Preview Sessions', value: data.previewSessions, color: 'text-blue-500' },
    { icon: MousePointer, label: 'CTA Clicks', value: data.ctaClicks, rate: ctaRate, color: 'text-primary' },
    { icon: UserPlus, label: 'Beta Signups', value: data.signups, rate: signupRate, color: 'text-green-500' },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Preview → Signup Conversion
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <>
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
                Overall conversion rate: <span className="font-semibold text-green-500">{overallRate}%</span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
