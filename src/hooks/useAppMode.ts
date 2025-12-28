import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppMode = 'PRIVATE_BETA' | 'PUBLIC_AUTH' | 'MAINTENANCE';

interface UseAppModeResult {
  mode: AppMode;
  loading: boolean;
  setMode: (newMode: AppMode) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAppMode(): UseAppModeResult {
  const { hasRole } = useAuth();
  const [mode, setModeState] = useState<AppMode>('PRIVATE_BETA');
  const [loading, setLoading] = useState(true);

  const fetchMode = async () => {
    try {
      const { data, error } = await supabase.rpc('get_app_mode');
      
      if (error) {
        console.error('Error fetching app mode:', error);
        return;
      }
      
      if (data && ['PRIVATE_BETA', 'PUBLIC_AUTH', 'MAINTENANCE'].includes(data)) {
        setModeState(data as AppMode);
      }
    } catch (err) {
      console.error('Error in fetchMode:', err);
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (newMode: AppMode): Promise<boolean> => {
    if (!hasRole('admin') && !hasRole('super_admin')) {
      console.error('Only admins can change app mode');
      return false;
    }

    try {
      const { error } = await supabase.rpc('set_app_mode', { _mode: newMode });
      
      if (error) {
        console.error('Error setting app mode:', error);
        return false;
      }
      
      setModeState(newMode);
      return true;
    } catch (err) {
      console.error('Error in setMode:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchMode();
  }, []);

  return { mode, loading, setMode, refetch: fetchMode };
}
