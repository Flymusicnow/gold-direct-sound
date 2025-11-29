import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MessageCircleOff, Power, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StreamControlPanelProps {
  streamId: string;
}

export function StreamControlPanel({ streamId }: StreamControlPanelProps) {
  const [ending, setEnding] = useState(false);

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

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Stream Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="destructive"
          className="w-full"
          onClick={endStream}
          disabled={ending}
        >
          <Power className="mr-2 h-4 w-4" />
          {ending ? 'Ending...' : 'End Stream'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Advanced moderation tools (ban, mute) coming soon
        </p>
      </CardContent>
    </Card>
  );
}
