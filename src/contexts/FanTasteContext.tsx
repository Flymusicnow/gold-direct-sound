import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface TasteProfile {
  genres: Record<string, number>;
  moods: Record<string, number>;
  top_artists: Array<{ artist_id: string; affinity: number }>;
  top_tags: Record<string, number>;
  last_updated: string;
}

interface FanTasteContextType {
  tasteProfile: TasteProfile | null;
  loading: boolean;
  refreshTasteProfile: () => Promise<void>;
  updateTasteFromAction: (
    artistId: string,
    interaction: string,
    trackId?: string,
    videoId?: string
  ) => Promise<void>;
}

const FanTasteContext = createContext<FanTasteContextType | undefined>(undefined);

export function FanTasteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTasteProfile = async () => {
    if (!user) {
      setTasteProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fan_taste_profile')
        .select('*')
        .eq('fan_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTasteProfile({
          genres: data.genres as Record<string, number>,
          moods: data.moods as Record<string, number>,
          top_artists: data.top_artists as Array<{ artist_id: string; affinity: number }>,
          top_tags: data.top_tags as Record<string, number>,
          last_updated: data.last_updated,
        });
      }
    } catch (error) {
      console.error('Error fetching taste profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTasteFromAction = async (
    artistId: string,
    interaction: string,
    trackId?: string,
    videoId?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_taste_profile', {
        _fan_user_id: user.id,
        _artist_id: artistId,
        _interaction: interaction,
        _track_id: trackId || null,
        _video_id: videoId || null,
      });

      if (error) throw error;

      // Refresh profile after update
      await fetchTasteProfile();
    } catch (error) {
      console.error('Error updating taste profile:', error);
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchTasteProfile();
  }, [user]);

  // Refresh every 4 hours
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasteProfile();
    }, 4 * 60 * 60 * 1000); // 4 hours

    return () => clearInterval(interval);
  }, [user]);

  return (
    <FanTasteContext.Provider
      value={{
        tasteProfile,
        loading,
        refreshTasteProfile: fetchTasteProfile,
        updateTasteFromAction,
      }}
    >
      {children}
    </FanTasteContext.Provider>
  );
}

export function useFanTaste() {
  const context = useContext(FanTasteContext);
  if (context === undefined) {
    throw new Error('useFanTaste must be used within a FanTasteProvider');
  }
  return context;
}
