import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSupportScore } from '@/hooks/useSupportScore';

interface LikesContextType {
  likedTracks: Record<string, boolean>;
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string, artistId: string) => Promise<void>;
  isUpdating: (trackId: string) => boolean;
  refreshLikes: () => Promise<void>;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { updateSupportScore } = useSupportScore();
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [updatingTracks, setUpdatingTracks] = useState<Record<string, boolean>>({});

  // Fetch all user's likes on mount and when user changes
  const fetchLikes = useCallback(async () => {
    if (!user) {
      setLikedTracks({});
      return;
    }

    const { data, error } = await supabase
      .from('likes')
      .select('track_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[LikesContext] Error fetching likes:', error);
      return;
    }

    const likesMap: Record<string, boolean> = {};
    data?.forEach(like => {
      likesMap[like.track_id] = true;
    });
    setLikedTracks(likesMap);
  }, [user]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  // Subscribe to realtime changes for likes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const trackId = (payload.new as { track_id: string }).track_id;
            setLikedTracks(prev => ({ ...prev, [trackId]: true }));
          } else if (payload.eventType === 'DELETE') {
            const trackId = (payload.old as { track_id: string }).track_id;
            setLikedTracks(prev => ({ ...prev, [trackId]: false }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isLiked = useCallback((trackId: string) => {
    return !!likedTracks[trackId];
  }, [likedTracks]);

  const isUpdating = useCallback((trackId: string) => {
    return !!updatingTracks[trackId];
  }, [updatingTracks]);

  const toggleLike = useCallback(async (trackId: string, artistId: string) => {
    if (!user) {
      toast.error('Please sign in to like tracks');
      return;
    }

    if (updatingTracks[trackId]) return;

    setUpdatingTracks(prev => ({ ...prev, [trackId]: true }));

    try {
      const currentlyLiked = likedTracks[trackId];

      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        if (error) throw error;
        
        setLikedTracks(prev => ({ ...prev, [trackId]: false }));
        toast.success('Removed from liked tracks');
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: trackId });

        if (error) throw error;
        
        setLikedTracks(prev => ({ ...prev, [trackId]: true }));
        toast.success('Added to liked tracks');
        
        // Update support score for the artist
        updateSupportScore(artistId, 'like_track');
      }
    } catch (error) {
      console.error('[LikesContext] Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setUpdatingTracks(prev => ({ ...prev, [trackId]: false }));
    }
  }, [user, likedTracks, updatingTracks, updateSupportScore]);

  return (
    <LikesContext.Provider value={{
      likedTracks,
      isLiked,
      toggleLike,
      isUpdating,
      refreshLikes: fetchLikes,
    }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
}
