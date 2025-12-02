import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePromoEvents } from './usePromoEvents';
import { toast } from 'sonner';

export function usePromoFunnel(userId: string | undefined) {
  const navigate = useNavigate();
  const { getPromoContext, clearPromoContext, trackPromoEvent } = usePromoEvents();

  useEffect(() => {
    if (!userId) return;

    const processPromoFunnel = async () => {
      const context = getPromoContext();
      if (!context) return;

      try {
        // Check if user already follows this artist
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('fan_id', userId)
          .eq('artist_id', context.artist_id)
          .single();

        if (!existingFollow) {
          // Auto-follow the artist
          const { error: followError } = await supabase
            .from('follows')
            .insert({
              fan_id: userId,
              artist_id: context.artist_id,
            });

          if (!followError) {
            // Track follow success event
            await trackPromoEvent(
              context.promo_link_id,
              context.artist_id,
              'follow_success',
              userId,
              context.utm_source || undefined
            );

            // Log activity for artist dashboard
            await supabase.from('artist_activities').insert({
              artist_id: context.artist_id,
              type: 'new_follower',
              actor_user_id: userId,
            });

            // Update taste profile
            await supabase.rpc('update_taste_profile', {
              _fan_user_id: userId,
              _artist_id: context.artist_id,
              _interaction: 'follow',
            });

            toast.success('You are now following this artist!');
          }
        }

        // Clear the promo context
        clearPromoContext();

        // Redirect back to promo page or artist profile
        navigate(`/link/${context.slug}`);
      } catch (error) {
        console.error('Error processing promo funnel:', error);
        clearPromoContext();
      }
    };

    // Small delay to ensure auth state is fully settled
    const timer = setTimeout(processPromoFunnel, 500);
    return () => clearTimeout(timer);
  }, [userId]);
}
