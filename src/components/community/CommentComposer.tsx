import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CommentComposerProps {
  postId: string;
  parentCommentId?: string | null;
  replyToAuthor?: string;
  onCommentCreated?: () => void;
  onCancelReply?: () => void;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId,
  parentCommentId = null,
  replyToAuthor,
  onCommentCreated,
  onCancelReply,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_comment_id: parentCommentId,
          content: content.trim(),
        });

      if (insertError) throw insertError;

      setContent('');
      onCommentCreated?.();
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-2">
      {parentCommentId && replyToAuthor && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Replying to {replyToAuthor}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-2 pointer-events-auto">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
          className="min-h-[60px] resize-none flex-1 pointer-events-auto"
          disabled={isSubmitting}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};
