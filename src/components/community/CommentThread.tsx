import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CommentComposer } from './CommentComposer';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommentThreadProps {
  postId: string;
  maxDepth?: number;
}

const CommentItem: React.FC<{
  comment: Comment;
  depth: number;
  maxDepth: number;
  onReply: (commentId: string, authorName: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  onCommentCreated: () => void;
}> = ({ comment, depth, maxDepth, onReply, replyingTo, onCancelReply, onCommentCreated }) => {
  const authorName = comment.author?.full_name || 'Anonymous';
  const canReply = depth < maxDepth;

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 mt-1 text-muted-foreground"
              onClick={() => onReply(comment.id, authorName)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <CommentComposer
                postId={comment.post_id}
                parentCommentId={comment.id}
                replyToAuthor={authorName}
                onCommentCreated={onCommentCreated}
                onCancelReply={onCancelReply}
              />
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          maxDepth={maxDepth}
          onReply={onReply}
          replyingTo={replyingTo}
          onCancelReply={onCancelReply}
          onCommentCreated={onCommentCreated}
        />
      ))}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({ postId, maxDepth = 3 }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      // Fetch all comments for this post
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, post_id, author_id, parent_comment_id, content, created_at, is_deleted')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsData = data || [];

      // Fetch author profiles
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      
      let profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);

        profileMap = new Map((profiles || []).map(p => [p.id, p]));
      }

      // Build nested structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      commentsData.forEach(c => {
        const comment: Comment = {
          id: c.id,
          post_id: c.post_id,
          author_id: c.author_id,
          parent_comment_id: c.parent_comment_id,
          content: c.content,
          created_at: c.created_at,
          author: profileMap.get(c.author_id),
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
  }, [postId]);

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
    <div className="divide-y divide-border">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          maxDepth={maxDepth}
          onReply={handleReply}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onCommentCreated={handleCommentCreated}
        />
      ))}
    </div>
  );
};
