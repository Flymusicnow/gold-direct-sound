import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface CrowdPush {
  id: string;
  artist_id: string;
  target_supporters: number;
  current_supporters: number;
  status: 'active' | 'completed' | 'expired';
  activated_at: string | null;
  expires_at: string;
  created_at: string;
}

export function useCrowdPush(artistId?: string) {
  const { user } = useAuth();
  const [crowdPush, setCrowdPush] = useState<CrowdPush | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCrowdPush = useCallback(async () => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('crowd_pushes')
        .select('*')
        .eq('artist_id', artistId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCrowdPush(data as CrowdPush | null);

      if (data && user) {
        const { data: participation } = await supabase
          .from('crowd_push_participants')
          .select('id')
          .eq('crowd_push_id', data.id)
          .eq('user_id', user.id)
          .single();

        setHasJoined(!!participation);
      }
    } catch (error) {
      console.error('Error fetching crowd push:', error);
    } finally {
      setLoading(false);
    }
  }, [artistId, user]);

  useEffect(() => {
    fetchCrowdPush();
  }, [fetchCrowdPush]);

  const startCrowdPush = useCallback(async () => {
    if (!user || !artistId) return null;

    try {
      const { data, error } = await supabase
        .from('crowd_pushes')
        .insert({
          artist_id: artistId,
          target_supporters: 100,
          current_supporters: 1,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as first participant
      await supabase
        .from('crowd_push_participants')
        .insert({
          crowd_push_id: data.id,
          user_id: user.id,
        });

      setCrowdPush(data as CrowdPush);
      setHasJoined(true);
      toast.success('Crowd Push started! Rally supporters!');
      return data as CrowdPush;
    } catch (error) {
      console.error('Error starting crowd push:', error);
      toast.error('Failed to start Crowd Push');
      return null;
    }
  }, [user, artistId]);

  const joinCrowdPush = useCallback(async () => {
    if (!user || !crowdPush || hasJoined) return false;

    try {
      const { error: participantError } = await supabase
        .from('crowd_push_participants')
        .insert({
          crowd_push_id: crowdPush.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      const newCount = crowdPush.current_supporters + 1;
      const isCompleted = newCount >= crowdPush.target_supporters;

      const { data: updated, error: updateError } = await supabase
        .from('crowd_pushes')
        .update({
          current_supporters: newCount,
          status: isCompleted ? 'completed' : 'active',
          activated_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', crowdPush.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCrowdPush(updated as CrowdPush);
      setHasJoined(true);

      if (isCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E8BF1A', '#F4D67A', '#C89F0A'],
        });
        toast.success('🚀 Crowd Push ACTIVATED! Artist boosted for 24h!');
      } else {
        toast.success('You joined the Crowd Push!');
      }

      return true;
    } catch (error) {
      console.error('Error joining crowd push:', error);
      toast.error('Failed to join Crowd Push');
      return false;
    }
  }, [user, crowdPush, hasJoined]);

  const progress = crowdPush 
    ? Math.round((crowdPush.current_supporters / crowdPush.target_supporters) * 100)
    : 0;

  return {
    crowdPush,
    hasJoined,
    loading,
    progress,
    startCrowdPush,
    joinCrowdPush,
    refetch: fetchCrowdPush,
  };
}
