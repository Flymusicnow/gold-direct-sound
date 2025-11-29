import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTasteProfile(userId: string | undefined) {
  const [tasteProfile, setTasteProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('fan_taste_profile')
          .select('*')
          .eq('fan_user_id', userId)
          .maybeSingle();

        if (error) throw error;
        setTasteProfile(data);
      } catch (error) {
        console.error('Error fetching taste profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { tasteProfile, loading };
}
