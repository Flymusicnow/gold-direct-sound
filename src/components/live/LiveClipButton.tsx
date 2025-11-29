import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LiveClipButtonProps {
  streamId: string;
  streamUrl: string;
}

export function LiveClipButton({ streamId, streamUrl }: LiveClipButtonProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createClip = async () => {
    if (!user) {
      toast.error('You must be logged in to create clips');
      return;
    }

    setCreating(true);
    try {
      // In a real implementation, this would:
      // 1. Capture last 15 seconds of stream buffer
      // 2. Upload to Supabase Storage
      // 3. Create clip record in database
      
      // MVP: Just create a placeholder clip record
      const { error } = await supabase.from('live_clips').insert({
        stream_id: streamId,
        creator_user_id: user.id,
        video_url: streamUrl, // In production, this would be the clip URL
        title: `Clip from ${new Date().toLocaleTimeString()}`,
        start_time_seconds: 0,
        duration_seconds: 15,
      });

      if (error) throw error;

      toast.success('Clip created! It will appear in Discover soon.');
    } catch (error: any) {
      console.error('Error creating clip:', error);
      toast.error('Failed to create clip');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={createClip}
      disabled={creating}
    >
      <Scissors className="mr-2 h-4 w-4" />
      {creating ? 'Creating...' : 'Clip (15s)'}
    </Button>
  );
}
