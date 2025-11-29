import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Reply, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import SupporterBadge from "@/components/supporter/SupporterBadge";

interface CommentItemProps {
  comment: {
    id: string;
    user_id: string;
    text: string;
    created_at: string;
    profiles: {
      full_name: string | null;
    };
    comment_likes: { id: string; user_id: string }[];
  };
  currentUserId?: string;
  artistId: string;
  isArtistComment?: boolean;
  supporterLevel?: 'none' | 'bronze' | 'silver' | 'gold';
}

export const CommentItem = ({ comment, currentUserId, artistId, isArtistComment, supporterLevel = 'none' }: CommentItemProps) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isLiked = comment.comment_likes?.some((like) => like.user_id === currentUserId);
  const likeCount = comment.comment_likes?.length || 0;

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to like comments");
      return;
    }

    if (isLiked) {
      const likeToRemove = comment.comment_likes.find((like) => like.user_id === currentUserId);
      if (likeToRemove) {
        await supabase.from("comment_likes").delete().eq("id", likeToRemove.id);
      }
    } else {
      await supabase.from("comment_likes").insert({
        comment_id: comment.id,
        user_id: currentUserId,
      });
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || comment.user_id !== currentUserId) return;

    const { error } = await supabase.from("comments").delete().eq("id", comment.id);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
    }
  };

  const handleReply = async () => {
    if (!currentUserId || !replyText.trim()) return;

    const { error } = await supabase.from("comments").insert({
      artist_id: artistId,
      user_id: currentUserId,
      text: replyText.trim(),
      parent_comment_id: comment.id,
    });

    if (error) {
      toast.error("Failed to post reply");
    } else {
      setReplyText("");
      setShowReply(false);
      toast.success("Reply posted!");
      loadReplies();
    }
  };

  const loadReplies = async () => {
    setLoadingReplies(true);
    const { data: repliesData } = await supabase
      .from("comments")
      .select(`*, comment_likes(id, user_id)`)
      .eq("parent_comment_id", comment.id)
      .order("created_at", { ascending: true });

    if (repliesData) {
      // Fetch profiles for all reply authors
      const userIds = repliesData.map((r) => r.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Merge profiles with replies
      const repliesWithProfiles = repliesData.map((reply) => ({
        ...reply,
        profiles: profilesData?.find((p) => p.id === reply.user_id) || { full_name: null },
      }));

      setReplies(repliesWithProfiles);
    }
    setLoadingReplies(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold">
            {comment.profiles?.full_name?.[0]?.toUpperCase() || "U"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-foreground">
              {comment.profiles?.full_name || "Anonymous"}
            </span>
            {isArtistComment && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary" />
            )}
            {!isArtistComment && supporterLevel && supporterLevel !== 'none' && (
              <SupporterBadge level={supporterLevel} variant="mini" />
            )}
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-foreground/90 whitespace-pre-wrap mb-3">{comment.text}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1 ${isLiked ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-primary" : ""}`} />
              <span>{likeCount > 0 && likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReply(!showReply)}
              className="gap-1 text-muted-foreground hover:text-primary"
            >
              <Reply className="w-4 h-4" />
              Reply
            </Button>

            {currentUserId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="gap-1 text-muted-foreground hover:text-destructive ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {showReply && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px]"
                maxLength={1000}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowReply(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-3">
        {replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            currentUserId={currentUserId}
            artistId={artistId}
            isArtistComment={reply.user_id === currentUserId}
            supporterLevel="none"
          />
        ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
