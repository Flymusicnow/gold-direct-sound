import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Moderator {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  assignedAt: string;
  assignedByName: string;
  canHideComments: boolean;
  canPinComments: boolean;
  canHidePosts: boolean;
  canPinPosts: boolean;
  isActive: boolean;
}

export interface ModeratorPermissions {
  canHideComments: boolean;
  canPinComments: boolean;
  canHidePosts: boolean;
  canPinPosts: boolean;
}

const DEFAULT_PERMISSIONS: ModeratorPermissions = {
  canHideComments: true,
  canPinComments: true,
  canHidePosts: false,
  canPinPosts: false,
};

export function useCommunityModerators(communityId: string | null) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModerators = useCallback(async () => {
    if (!communityId) {
      setModerators([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('community_moderators')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setModerators([]);
        return;
      }

      // Fetch user profiles for moderators
      const userIds = data.map((m) => m.user_id);
      const assignerIds = data.map((m) => m.assigned_by);
      const allUserIds = [...new Set([...userIds, ...assignerIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', allUserIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      const mappedModerators: Moderator[] = data.map((m) => {
        const userProfile = profileMap.get(m.user_id);
        const assignerProfile = profileMap.get(m.assigned_by);

        return {
          id: m.id,
          userId: m.user_id,
          displayName: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Unknown',
          avatarUrl: userProfile?.avatar_url || null,
          assignedAt: m.assigned_at || '',
          assignedByName: assignerProfile?.full_name || 'Artist',
          canHideComments: m.can_hide_comments || false,
          canPinComments: m.can_pin_comments || false,
          canHidePosts: m.can_hide_posts || false,
          canPinPosts: m.can_pin_posts || false,
          isActive: m.is_active || false,
        };
      });

      setModerators(mappedModerators);
    } catch (err) {
      console.error('Error fetching moderators:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch moderators'));
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchModerators();
  }, [fetchModerators]);

  const addModerator = useCallback(
    async (
      userId: string,
      permissions: ModeratorPermissions = DEFAULT_PERMISSIONS,
      assignedBy: string
    ) => {
      if (!communityId) {
        toast.error('No community selected');
        return false;
      }

      try {
        const { error: insertError } = await supabase
          .from('community_moderators')
          .insert({
            community_id: communityId,
            user_id: userId,
            assigned_by: assignedBy,
            can_hide_comments: permissions.canHideComments,
            can_pin_comments: permissions.canPinComments,
            can_hide_posts: permissions.canHidePosts,
            can_pin_posts: permissions.canPinPosts,
            is_active: true,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            toast.error('This user is already a moderator');
          } else {
            throw insertError;
          }
          return false;
        }

        toast.success('Moderator added');
        fetchModerators();
        return true;
      } catch (err) {
        console.error('Error adding moderator:', err);
        toast.error('Failed to add moderator');
        return false;
      }
    },
    [communityId, fetchModerators]
  );

  const updatePermissions = useCallback(
    async (moderatorId: string, permissions: Partial<ModeratorPermissions>) => {
      try {
        const updateData: Record<string, boolean> = {};
        if (permissions.canHideComments !== undefined) {
          updateData.can_hide_comments = permissions.canHideComments;
        }
        if (permissions.canPinComments !== undefined) {
          updateData.can_pin_comments = permissions.canPinComments;
        }
        if (permissions.canHidePosts !== undefined) {
          updateData.can_hide_posts = permissions.canHidePosts;
        }
        if (permissions.canPinPosts !== undefined) {
          updateData.can_pin_posts = permissions.canPinPosts;
        }

        const { error: updateError } = await supabase
          .from('community_moderators')
          .update(updateData)
          .eq('id', moderatorId);

        if (updateError) throw updateError;

        toast.success('Permissions updated');
        fetchModerators();
        return true;
      } catch (err) {
        console.error('Error updating permissions:', err);
        toast.error('Failed to update permissions');
        return false;
      }
    },
    [fetchModerators]
  );

  const revokeModerator = useCallback(
    async (moderatorId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('community_moderators')
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
          })
          .eq('id', moderatorId);

        if (updateError) throw updateError;

        toast.success('Moderator removed');
        fetchModerators();
        return true;
      } catch (err) {
        console.error('Error revoking moderator:', err);
        toast.error('Failed to remove moderator');
        return false;
      }
    },
    [fetchModerators]
  );

  return {
    moderators,
    isLoading,
    error,
    addModerator,
    updatePermissions,
    revokeModerator,
    refetch: fetchModerators,
  };
}

/**
 * Hook to check if the current user is a moderator for a community
 */
export function useIsModeratorFor(communityId: string | null, userId: string | null) {
  const [isModerator, setIsModerator] = useState(false);
  const [permissions, setPermissions] = useState<ModeratorPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!communityId || !userId) {
      setIsModerator(false);
      setPermissions(null);
      setIsLoading(false);
      return;
    }

    async function check() {
      try {
        const { data } = await supabase
          .from('community_moderators')
          .select('can_hide_comments, can_pin_comments, can_hide_posts, can_pin_posts')
          .eq('community_id', communityId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (data) {
          setIsModerator(true);
          setPermissions({
            canHideComments: data.can_hide_comments || false,
            canPinComments: data.can_pin_comments || false,
            canHidePosts: data.can_hide_posts || false,
            canPinPosts: data.can_pin_posts || false,
          });
        } else {
          setIsModerator(false);
          setPermissions(null);
        }
      } catch (err) {
        console.error('Error checking moderator status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [communityId, userId]);

  return { isModerator, permissions, isLoading };
}
