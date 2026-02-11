import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle, ChevronRight, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CommentComposer } from './CommentComposer';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAuthorIdentities, type AuthorIdentity } from '@/hooks/useAuthorIdentity';
import { useAuth } from '@/contexts/AuthContext';
import { useFlightRecorder } from '@/contexts/FlightRecorderContext';
import { usePostCommentLikes } from '@/hooks/usePostCommentLikes';
import { toast } from 'sonner';

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_type?: 'artist' | 'fan' | 'moderator';
  content: string;
  created_at: string;
}

interface InlineCommentsProps {
  postId: string;
  communityArtistUserId?: string;
  maxVisible?: number;
  onViewAll: () => void;
  showComposer?: boolean;
}

// Role badge component
const RoleBadge: React.FC<{ role: 'artist' | 'fan' | 'moderator' | null }> = ({ role }) => {
  if (!role || role === 'fan') return null;

  if (role === 'artist') {
    return (
      <Badge variant="default" className="text-xs px-1.5 py-0 h-5 bg-primary/20 text-primary border-primary/30">
        Artist
      </Badge>
    );
  }

  return null;
};

export const InlineComments: React.FC<InlineCommentsProps> = ({
  postId,
  communityArtistUserId,
  maxVisible = 3,
  onViewAll,
  showComposer = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { step } = useFlightRecorder();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [identityMap, setIdentityMap] = useState<Map<string, AuthorIdentity>>(new Map());
  const [optimisticComment, setOptimisticComment] = useState<Comment | null>(null);
  
  // Get comment IDs for likes
  const commentIds = useMemo(() => comments.map(c => c.id), [comments]);
  const { getLikeData, toggleLike } = usePostCommentLikes(commentIds);

  const fetchComments = useCallback(async () => {
    try {
      // Get total count first
      const { count } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('is_deleted', false);

      setTotalCount(count || 0);

      // Fetch latest comments (most recent first, limited)
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, post_id, author_id, author_type, content, created_at')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .is('parent_comment_id', null) // Only top-level for inline
        .order('created_at', { ascending: false })
        .limit(maxVisible);

      if (error) throw error;

      const commentsData = (data || []).reverse(); // Show oldest first within visible set

      // Batch fetch author identities
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      if (authorIds.length > 0) {
        const identities = await fetchAuthorIdentities(authorIds, communityArtistUserId);
        setIdentityMap(identities);
      }

      setComments(commentsData.map(c => ({
        id: c.id,
        post_id: c.post_id,
        author_id: c.author_id,
        author_type: c.author_type as Comment['author_type'],
        content: c.content,
        created_at: c.created_at,
      })));
    } catch (err) {
      console.error('Error fetching inline comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, communityArtistUserId, maxVisible]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentCreated = useCallback(() => {
    setOptimisticComment(null);
    fetchComments();
    step('community_reply_submit_success', 'ok', { postId });
  }, [fetchComments, step, postId]);

  const handleProfileClick = (authorId: string, identity: AuthorIdentity | undefined) => {
    // Check if user is anonymous
    const isAnonymous = !identity || identity.displayName === 'Fan' || identity.displayName === 'Unknown User';
    
    if (isAnonymous) return; // Don't navigate for anonymous users
    
    if (identity?.artistProfileId) {
      navigate(`/artist/${identity.artistProfileId}`);
    } else {
      navigate(`/fan/profile/${authorId}`);
    }
  };

  const handleViewAll = () => {
    step('community_post_open_detail', 'ok', { postId, source: 'view_all_link' });
    onViewAll();
  };

  // Focus input externally
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Expose focus method via ref
  React.useImperativeHandle(
    React.useRef(null),
    () => ({ focusInput }),
    [focusInput]
  );

  const displayComments = optimisticComment 
    ? [...comments, optimisticComment]
    : comments;

  const hasMoreComments = totalCount > maxVisible;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {/* Comments list */}
      {displayComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {displayComments.map((comment) => {
            const identity = identityMap.get(comment.author_id);
            const displayName = identity?.displayName || 'User';
            const avatarUrl = identity?.avatarUrl;
            const roleBadge = identity?.roleBadge || comment.author_type || null;
            const isOptimistic = optimisticComment?.id === comment.id;
            const isAnonymous = !identity || displayName === 'Fan' || displayName === 'Unknown User';
            const { likeCount, hasLiked } = getLikeData(comment.id);

            return (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-2",
                  isOptimistic && "opacity-70"
                )}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isAnonymous ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {displayName}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleProfileClick(comment.author_id, identity)}
                        className="text-xs font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
                      >
                        {displayName}
                      </button>
                    )}
                    <RoleBadge role={roleBadge} />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 break-words">
                    {comment.content}
                  </p>
                  {/* Like button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 px-1.5 gap-1 mt-1",
                      hasLiked ? "text-primary" : "text-muted-foreground"
                    )}
                    onClick={() => user ? toggleLike(comment.id) : toast.error('Please sign in to like')}
                  >
                    <Heart className={cn("h-3 w-3", hasLiked && "fill-current")} />
                    {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View all link */}
      {hasMoreComments && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={handleViewAll}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
          View all {totalCount} comments
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      )}

      {/* Quick reply composer */}
      {showComposer && user && (
        <div className="pt-2 border-t border-border/50">
          <CommentComposer
            postId={postId}
            onCommentCreated={handleCommentCreated}
          />
        </div>
      )}
    </div>
  );
};

// Export focus helper type
export type InlineCommentsRef = {
  focusInput: () => void;
};
