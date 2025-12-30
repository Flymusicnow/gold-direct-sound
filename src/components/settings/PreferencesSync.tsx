import { useEffect } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAudioFocus } from '@/contexts/AudioFocusContext';

/**
 * Syncs user preferences from database to AudioFocusContext
 * This component renders nothing but keeps the context in sync with saved preferences
 */
export function PreferencesSync() {
  const { pauseMusicOnVideo, pipEnabled, loading } = useUserPreferences();
  const { setPauseMusicOnVideo, setPipEnabled } = useAudioFocus();

  useEffect(() => {
    if (!loading) {
      setPauseMusicOnVideo(pauseMusicOnVideo);
      setPipEnabled(pipEnabled);
    }
  }, [pauseMusicOnVideo, pipEnabled, loading, setPauseMusicOnVideo, setPipEnabled]);

  return null;
}
