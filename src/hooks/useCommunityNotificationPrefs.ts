import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationPrefs {
  notifyNewPosts: boolean;
  notifyPinnedPosts: boolean;
  notifyArtistPosts: boolean;
  notifyMentions: boolean;
  notifyReplies: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  notifyNewPosts: true,
  notifyPinnedPosts: true,
  notifyArtistPosts: true,
  notifyMentions: true,
  notifyReplies: true,
  pushEnabled: true,
  emailEnabled: false,
};

export function useCommunityNotificationPrefs(communityId: string | null) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!communityId || !user?.id) {
      setPrefs(DEFAULT_PREFS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('community_notification_preferences')
        .select('*')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrefs({
          notifyNewPosts: data.notify_new_posts ?? true,
          notifyPinnedPosts: data.notify_pinned_posts ?? true,
          notifyArtistPosts: data.notify_artist_posts ?? true,
          notifyMentions: data.notify_mentions ?? true,
          notifyReplies: data.notify_replies ?? true,
          pushEnabled: data.push_enabled ?? true,
          emailEnabled: data.email_enabled ?? false,
        });
      } else {
        setPrefs(DEFAULT_PREFS);
      }
    } catch (err) {
      console.error('Error fetching notification prefs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communityId, user?.id]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePrefs = useCallback(async (updates: Partial<NotificationPrefs>) => {
    if (!communityId || !user?.id) return;

    setIsSaving(true);
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    try {
      const { error } = await supabase
        .from('community_notification_preferences')
        .upsert({
          community_id: communityId,
          user_id: user.id,
          notify_new_posts: newPrefs.notifyNewPosts,
          notify_pinned_posts: newPrefs.notifyPinnedPosts,
          notify_artist_posts: newPrefs.notifyArtistPosts,
          notify_mentions: newPrefs.notifyMentions,
          notify_replies: newPrefs.notifyReplies,
          push_enabled: newPrefs.pushEnabled,
          email_enabled: newPrefs.emailEnabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,community_id',
        });

      if (error) throw error;

      toast.success('Notification preferences saved');
    } catch (err) {
      console.error('Error updating notification prefs:', err);
      toast.error('Failed to save preferences');
      setPrefs(prefs); // Revert on error
    } finally {
      setIsSaving(false);
    }
  }, [communityId, user?.id, prefs]);

  const enableNotifications = useCallback(async () => {
    if (!communityId || !user?.id) return;

    try {
      const { error } = await supabase
        .from('community_notification_preferences')
        .upsert({
          community_id: communityId,
          user_id: user.id,
          notify_new_posts: true,
          notify_pinned_posts: true,
          notify_artist_posts: true,
          notify_mentions: true,
          notify_replies: true,
          push_enabled: true,
          email_enabled: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,community_id',
        });

      if (error) throw error;

      setPrefs(DEFAULT_PREFS);
      toast.success('Notifications enabled');
    } catch (err) {
      console.error('Error enabling notifications:', err);
      toast.error('Failed to enable notifications');
    }
  }, [communityId, user?.id]);

  return {
    prefs,
    updatePrefs,
    enableNotifications,
    isLoading,
    isSaving,
    isSubscribed: prefs.notifyNewPosts || prefs.notifyPinnedPosts || prefs.notifyArtistPosts,
  };
}
