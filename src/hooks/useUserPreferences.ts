import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  id: string;
  user_id: string;
  pause_music_on_video: boolean;
  pip_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES = {
  pause_music_on_video: true,
  pip_enabled: true,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch preferences on mount
  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }
    
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
          console.warn('user_preferences table does not exist yet');
          setLoading(false);
          return;
        }
        throw error;
      }
      
      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating preferences:', insertError);
        } else {
          setPreferences(newPrefs as UserPreferences);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback(async <K extends keyof Pick<UserPreferences, 'pause_music_on_video' | 'pip_enabled'>>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!user) return false;
    
    try {
      // Optimistic update
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);
      
      if (error) {
        // Revert on error
        await fetchPreferences();
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  }, [user]);

  return { 
    preferences, 
    loading, 
    updatePreference,
    // Convenience getters with defaults
    pauseMusicOnVideo: preferences?.pause_music_on_video ?? DEFAULT_PREFERENCES.pause_music_on_video,
    pipEnabled: preferences?.pip_enabled ?? DEFAULT_PREFERENCES.pip_enabled,
  };
}
