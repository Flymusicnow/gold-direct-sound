import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Power, Volume2, VolumeX, Users, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StreamControlPanelProps {
  streamId: string;
}

export function StreamControlPanel({ streamId }: StreamControlPanelProps) {
  const [ending, setEnding] = useState(false);
  const [slowMode, setSlowMode] = useState(false);
  const [subscriberOnly, setSubscriberOnly] = useState(false);

  const endStream = async () => {
    setEnding(true);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success('Stream ended successfully');
      setTimeout(() => {
        window.location.href = '/studio/live';
      }, 1500);
    } catch (error: any) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
      setEnding(false);
    }
  };

  const toggleSlowMode = () => {
    setSlowMode(!slowMode);
    toast.success(slowMode ? 'Slow mode disabled' : 'Slow mode enabled (30s cooldown)');
  };

  const toggleSubscriberOnly = () => {
    setSubscriberOnly(!subscriberOnly);
    toast.success(subscriberOnly ? 'Chat open to all' : 'Supporter-only chat enabled');
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Stream Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Slow Mode</span>
            </div>
            <Switch checked={slowMode} onCheckedChange={toggleSlowMode} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Supporters Only</span>
            </div>
            <Switch checked={subscriberOnly} onCheckedChange={toggleSubscriberOnly} />
          </div>
        </div>

        <div className="border-t border-border/50 pt-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={endStream}
            disabled={ending}
          >
            <Power className="mr-2 h-4 w-4" />
            {ending ? 'Ending...' : 'End Stream'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Ban/timeout coming soon
        </p>
      </CardContent>
    </Card>
  );
}
