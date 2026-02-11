import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle, Pin, ChevronDown, ChevronUp, CornerDownRight, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CommentComposer } from './CommentComposer';
import { ArtistControlMenu } from './ArtistControlMenu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAuthorIdentities, type AuthorIdentity } from '@/hooks/useAuthorIdentity';
import { toast } from 'sonner';
import { usePostCommentLikes } from '@/hooks/usePostCommentLikes';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_type?: 'artist' | 'fan' | 'moderator';
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  is_pinned?: boolean;
  is_hidden?: boolean;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentThreadProps {
  postId: string;
  maxDepth?: number;
  defaultVisibleReplies?: number;
  communityArtistUserId?: string;
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

  if (role === 'moderator') {
    return (
      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-blue-500/10 text-blue-500 border-blue-500/30">
        Mod
      </Badge>
    );
  }

  return null;
};

// Depth-based styling for threading visualization
const getDepthStyles = (depth: number) => {
  const colors = [
    'border-primary/50',
    'border-muted-foreground/40',
    'border-muted-foreground/20',
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const CommentItem: React.FC<{
  comment: Comment;
  depth: number;
  maxDepth: number;
  defaultVisibleReplies: number;
  onReply: (commentId: string, authorName: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  onCommentCreated: () => void;
  identityMap: Map<string, AuthorIdentity>;
  communityArtistUserId?: string;
  onProfileClick: (authorId: string, identity: AuthorIdentity | undefined) => void;
  getLikeData: (commentId: string) => { likeCount: number; hasLiked: boolean };
  toggleLike: (commentId: string) => void;
}> = ({
  comment, 
  depth, 
  maxDepth,
  defaultVisibleReplies,
  onReply, 
  replyingTo, 
  onCancelReply, 
  onCommentCreated,
  identityMap,
  communityArtistUserId,
  onProfileClick,
  getLikeData,
  toggleLike,
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  
  // Get like data for this comment
  const { likeCount, hasLiked } = getLikeData(comment.id);
  // Get resolved identity - never use generic names
  const identity = identityMap.get(comment.author_id);
  const displayName = identity?.displayName || comment.author?.full_name || 'User';
  const avatarUrl = identity?.avatarUrl || comment.author?.avatar_url;
  const roleBadge = identity?.roleBadge || comment.author_type || null;
  
  // Check if user is anonymous (no real name)
  const isAnonymous = !identity || displayName === 'Fan' || displayName === 'Unknown User';
  
  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length || 0;

  // Don't render hidden comments (unless we add admin view later)
  if (comment.is_hidden) return null;

  return (
    <div className={cn(
      "relative max-w-full w-full overflow-hidden",
      depth >= 1 && "ml-3"
    )}>
      {/* Threading visual connector - always visible */}
      {depth > 0 && (
        <div className={cn(
          "absolute -left-3 top-0 bottom-0 border-l-2",
          getDepthStyles(depth - 1)
        )} />
      )}
      
      {/* Reply connector line - always visible */}
      {depth > 0 && (
        <div className="absolute -left-3 top-4 w-2 border-t-2 border-muted-foreground/20" />
      )}

      <div className={cn(
        "py-3 space-y-1",
        comment.is_pinned && "bg-primary/5 -mx-2 px-2 rounded-lg"
      )}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs">{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {isAnonymous ? (
              <span className="text-sm font-medium text-muted-foreground">
                {displayName}
              </span>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileClick(comment.author_id, identity);
                }}
                className="text-sm font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
              >
                {displayName}
              </button>
            )}
            <RoleBadge role={roleBadge} />
            {comment.is_pinned && (
              <Pin className="h-3 w-3 text-primary" />
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            
            {/* Artist control menu */}
            <ArtistControlMenu
              type="comment"
              itemId={comment.id}
              isPinned={comment.is_pinned}
              isOwnContent={false}
            />
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
            {comment.content}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {/* Like button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-7 px-2 gap-1",
                hasLiked ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => user ? toggleLike(comment.id) : toast.error('Please sign in to like')}
            >
              <Heart className={cn("h-3.5 w-3.5", hasLiked && "fill-current")} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </Button>
            
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-7 px-2 text-muted-foreground"
                onClick={() => onReply(comment.id, displayName)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide replies
                  </>
                )}
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <CornerDownRight className="h-3 w-3" />
                Replying to {displayName}
              </div>
              <CommentComposer
                postId={comment.post_id}
                parentCommentId={comment.id}
                replyToAuthor={displayName}
                onCommentCreated={onCommentCreated}
                onCancelReply={onCancelReply}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies with gating */}
      {!isCollapsed && comment.replies && (() => {
        const visibleReplies = showAllReplies 
          ? comment.replies 
          : comment.replies.slice(0, defaultVisibleReplies);
        const hiddenCount = comment.replies.length - visibleReplies.length;
        
        return (
          <>
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                defaultVisibleReplies={defaultVisibleReplies}
                onReply={onReply}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
                onCommentCreated={onCommentCreated}
                identityMap={identityMap}
                communityArtistUserId={communityArtistUserId}
                onProfileClick={onProfileClick}
                getLikeData={getLikeData}
                toggleLike={toggleLike}
              />
            ))}
            {hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-3 text-xs text-muted-foreground h-7 mt-1"
                onClick={() => setShowAllReplies(true)}
              >
                View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </>
        );
      })()}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({ 
  postId, 
  maxDepth = 3,
  defaultVisibleReplies = 2,
  communityArtistUserId,
}) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [identityMap, setIdentityMap] = useState<Map<string, AuthorIdentity>>(new Map());
  
  // Get all comment IDs for likes hook (including nested)
  const allCommentIds = useMemo(() => {
    const ids: string[] = [];
    const collectIds = (commentList: Comment[]) => {
      commentList.forEach(c => {
        ids.push(c.id);
        if (c.replies) collectIds(c.replies);
      });
    };
    collectIds(comments);
    return ids;
  }, [comments]);
  
  const { getLikeData, toggleLike } = usePostCommentLikes(allCommentIds);

  const handleProfileClick = (authorId: string, identity: AuthorIdentity | undefined) => {
    if (identity?.artistProfileId) {
      navigate(`/artist/${identity.artistProfileId}`);
    } else {
      navigate(`/fan/profile/${authorId}`);
    }
  };

  const fetchComments = useCallback(async () => {
    try {
      // Fetch all comments for this post
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, post_id, author_id, author_type, parent_comment_id, content, created_at, is_deleted, is_pinned, is_hidden')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsData = data || [];

      // Batch fetch author identities
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      const identities = await fetchAuthorIdentities(authorIds, communityArtistUserId);
      setIdentityMap(identities);

      // Build nested structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // Sort pinned comments first
      const sortedData = [...commentsData].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });

      sortedData.forEach(c => {
        const comment: Comment = {
          id: c.id,
          post_id: c.post_id,
          author_id: c.author_id,
          author_type: c.author_type as Comment['author_type'],
          parent_comment_id: c.parent_comment_id,
          content: c.content,
          created_at: c.created_at,
          is_pinned: c.is_pinned || false,
          is_hidden: c.is_hidden || false,
          replies: [],
        };
        commentMap.set(c.id, comment);
      });

      commentMap.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, communityArtistUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleReply = (commentId: string, _authorName: string) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCommentCreated = () => {
    setReplyingTo(null);
    fetchComments();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No comments yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border max-w-full w-full overflow-hidden">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          maxDepth={maxDepth}
          defaultVisibleReplies={defaultVisibleReplies}
          onReply={handleReply}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onCommentCreated={handleCommentCreated}
          identityMap={identityMap}
          communityArtistUserId={communityArtistUserId}
          onProfileClick={handleProfileClick}
          getLikeData={getLikeData}
          toggleLike={toggleLike}
        />
      ))}
    </div>
  );
};
