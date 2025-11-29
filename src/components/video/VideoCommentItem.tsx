import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, Reply, Trash2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import SupporterBadge from "@/components/supporter/SupporterBadge";

function DeleteButton({ commentUserId, onDelete }: { commentUserId: string; onDelete: () => void }) {
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCanDelete(user?.id === commentUserId);
    };
    checkUser();
  }, [commentUserId]);

  if (!canDelete) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDelete}
      className="gap-1 h-8 text-destructive"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

interface VideoComment {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface VideoCommentItemProps {
  comment: VideoComment;
  allComments: VideoComment[];
  artistId: string;
  videoId: string;
  onReply: () => void;
  depth?: number;
  supporterLevel?: 'none' | 'bronze' | 'silver' | 'gold';
}

export function VideoCommentItem({
  comment,
  allComments,
  artistId,
  videoId,
  onReply,
  depth = 0,
  supporterLevel = 'none',
}: VideoCommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const replies = allComments.filter(c => c.parent_comment_id === comment.id);
  const displayName = comment.profiles?.full_name || comment.profiles?.email || "Anonymous";

  // Check if commenter is the artist
  const [isArtist, setIsArtist] = useState(false);

  useEffect(() => {
    const checkIfArtist = async () => {
      const { data } = await supabase
        .from('artist_profiles')
        .select('user_id')
        .eq('id', artistId)
        .single();
      
      setIsArtist(data?.user_id === comment.user_id);
    };
    checkIfArtist();
  }, [artistId, comment.user_id]);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('video_comment_likes')
        .select('user_id')
        .eq('comment_id', comment.id);

      if (data) {
        setLikes(data.map(l => l.user_id));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setHasLiked(data.some(l => l.user_id === user.id));
        }
      }
    };
    fetchLikes();
  }, [comment.id]);

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to like comments",
          variant: "destructive",
        });
        return;
      }

      if (hasLiked) {
        await supabase
          .from('video_comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
        setHasLiked(false);
        setLikes(likes.filter(id => id !== user.id));
      } else {
        await supabase
          .from('video_comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user.id,
          });
        setHasLiked(true);
        setLikes([...likes, user.id]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          text: replyText.trim(),
          parent_comment_id: comment.id,
        });

      setReplyText("");
      setShowReplyForm(false);
      onReply();
      toast({
        title: "Reply posted",
        description: "Your reply has been added",
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== comment.user_id) return;

      await supabase
        .from('video_comments')
        .delete()
        .eq('id', comment.id);

      onReply();
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-8 pl-4 border-l-2 border-primary/20' : ''}`}>
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{displayName}</span>
            {isArtist && (
              <span title="Artist">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </span>
            )}
            {!isArtist && supporterLevel && supporterLevel !== 'none' && (
              <SupporterBadge level={supporterLevel} variant="mini" />
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-foreground/90">{comment.text}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1 h-8 ${hasLiked ? 'text-primary' : ''}`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              {likes.length > 0 && likes.length}
            </Button>

            {depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="gap-1 h-8"
              >
                <Reply className="w-4 h-4" />
                Reply
              </Button>
            )}

            <DeleteButton commentUserId={comment.user_id} onDelete={handleDelete} />
          </div>
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReply} className="space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px]"
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !replyText.trim()}>
              Post Reply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {replies.map((reply) => (
        <VideoCommentItem
          key={reply.id}
          comment={reply}
          allComments={allComments}
          artistId={artistId}
          videoId={videoId}
          onReply={onReply}
          depth={depth + 1}
          supporterLevel="none"
        />
      ))}
    </div>
  );
}
