import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModeratorPermissions {
  canHideComments: boolean;
  canPinComments: boolean;
  canHidePosts: boolean;
  canPinPosts: boolean;
}

interface CommunityViewContextValue {
  // View mode - artist always sees fan view but has authority
  viewMode: 'fan';
  
  // Authority flags
  isOwner: boolean;
  isModerator: boolean;
  canModerate: boolean;
  moderatorPermissions: ModeratorPermissions | null;
  
  // Community info
  artistId: string | null;
  artistUserId: string | null;
  communityId: string | null;
  
  // Loading state
  isLoading: boolean;
  
  // Moderation actions
  hidePost: (postId: string) => Promise<void>;
  pinPost: (postId: string, isPinned: boolean) => Promise<void>;
  hideComment: (commentId: string) => Promise<void>;
  pinComment: (commentId: string, isPinned: boolean) => Promise<void>;
  
  // Refresh
  refresh: () => void;
}

const defaultPermissions: ModeratorPermissions = {
  canHideComments: false,
  canPinComments: false,
  canHidePosts: false,
  canPinPosts: false,
};

const CommunityViewContext = createContext<CommunityViewContextValue | null>(null);

interface CommunityViewProviderProps {
  children: ReactNode;
  communityId: string | null;
  artistId: string | null;
  artistUserId: string | null;
  currentUserId: string | null;
}

export function CommunityViewProvider({
  children,
  communityId,
  artistId,
  artistUserId,
  currentUserId,
}: CommunityViewProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [moderatorPermissions, setModeratorPermissions] = useState<ModeratorPermissions | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isOwner = currentUserId === artistUserId;
  const canModerate = isOwner || isModerator;

  // Fetch moderator status
  React.useEffect(() => {
    if (!communityId || !currentUserId || isOwner) {
      setIsModerator(false);
      setModeratorPermissions(isOwner ? {
        canHideComments: true,
        canPinComments: true,
        canHidePosts: true,
        canPinPosts: true,
      } : null);
      return;
    }

    async function checkModeratorStatus() {
      try {
        const { data } = await supabase
          .from('community_moderators')
          .select('can_hide_comments, can_pin_comments, can_hide_posts, can_pin_posts')
          .eq('community_id', communityId)
          .eq('user_id', currentUserId)
          .eq('is_active', true)
          .maybeSingle();

        if (data) {
          setIsModerator(true);
          setModeratorPermissions({
            canHideComments: data.can_hide_comments || false,
            canPinComments: data.can_pin_comments || false,
            canHidePosts: data.can_hide_posts || false,
            canPinPosts: data.can_pin_posts || false,
          });
        } else {
          setIsModerator(false);
          setModeratorPermissions(null);
        }
      } catch (error) {
        console.error('Error checking moderator status:', error);
      }
    }

    checkModeratorStatus();
  }, [communityId, currentUserId, isOwner, refreshKey]);

  const hidePost = useCallback(async (postId: string) => {
    if (!canModerate) {
      toast.error('You do not have permission to hide posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_archived: true })
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post hidden');
    } catch (error) {
      console.error('Error hiding post:', error);
      toast.error('Failed to hide post');
    }
  }, [canModerate]);

  const pinPost = useCallback(async (postId: string, isPinned: boolean) => {
    if (!canModerate) {
      toast.error('You do not have permission to pin posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_pinned: isPinned })
        .eq('id', postId);

      if (error) throw error;
      toast.success(isPinned ? 'Post pinned' : 'Post unpinned');
    } catch (error) {
      console.error('Error pinning post:', error);
      toast.error('Failed to update post');
    }
  }, [canModerate]);

  const hideComment = useCallback(async (commentId: string) => {
    if (!canModerate && !moderatorPermissions?.canHideComments) {
      toast.error('You do not have permission to hide comments');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ 
          is_hidden: true,
          hidden_by: currentUserId,
          hidden_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment hidden');
    } catch (error) {
      console.error('Error hiding comment:', error);
      toast.error('Failed to hide comment');
    }
  }, [canModerate, moderatorPermissions, currentUserId]);

  const pinComment = useCallback(async (commentId: string, isPinned: boolean) => {
    if (!canModerate && !moderatorPermissions?.canPinComments) {
      toast.error('You do not have permission to pin comments');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ is_pinned: isPinned })
        .eq('id', commentId);

      if (error) throw error;
      toast.success(isPinned ? 'Comment pinned' : 'Comment unpinned');
    } catch (error) {
      console.error('Error pinning comment:', error);
      toast.error('Failed to update comment');
    }
  }, [canModerate, moderatorPermissions]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <CommunityViewContext.Provider
      value={{
        viewMode: 'fan',
        isOwner,
        isModerator,
        canModerate,
        moderatorPermissions: isOwner ? {
          canHideComments: true,
          canPinComments: true,
          canHidePosts: true,
          canPinPosts: true,
        } : moderatorPermissions,
        artistId,
        artistUserId,
        communityId,
        isLoading,
        hidePost,
        pinPost,
        hideComment,
        pinComment,
        refresh,
      }}
    >
      {children}
    </CommunityViewContext.Provider>
  );
}

export function useCommunityView() {
  const context = useContext(CommunityViewContext);
  if (!context) {
    throw new Error('useCommunityView must be used within a CommunityViewProvider');
  }
  return context;
}

export function useCommunityViewOptional() {
  return useContext(CommunityViewContext);
}
