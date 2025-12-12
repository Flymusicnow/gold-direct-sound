import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Reply, Trash2, BadgeCheck, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import SupporterBadge from "@/components/supporter/SupporterBadge";
import { PaidSupporterBadge } from "@/components/supporter/PaidSupporterBadge";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string()
    .trim()
    .min(1, { message: "Reply cannot be empty" })
    .max(1000, { message: "Reply must be less than 1000 characters" })
});

interface CommentItemProps {
  comment: {
    id: string;
    user_id: string;
    text: string;
    created_at: string;
    profiles: {
      full_name: string | null;
      avatar_url?: string | null;
    };
    comment_likes: { id: string; user_id: string }[];
  };
  currentUserId?: string;
  artistId: string;
  isArtistComment?: boolean;
  supporterLevel?: 'none' | 'bronze' | 'silver' | 'gold';
  paidTier?: 'basic' | 'gold' | null;
}

// Helper function to get display name with debug logging
const getDisplayName = (
  profiles: { full_name: string | null; avatar_url?: string | null; email?: string } | null | undefined,
  userId?: string
): string => {
  console.log('[CommentItem] getDisplayName called for userId:', userId, 'profiles:', profiles);
  
  if (!profiles) {
    console.log('[CommentItem] No profiles object found, returning "User"');
    return "User";
  }
  
  if (profiles.full_name && profiles.full_name.trim()) {
    console.log('[CommentItem] Found full_name:', profiles.full_name);
    return profiles.full_name;
  }
  
  // Try email prefix as fallback
  if ((profiles as any).email) {
    const emailPrefix = (profiles as any).email.split('@')[0];
    console.log('[CommentItem] Using email prefix as fallback:', emailPrefix);
    return emailPrefix;
  }
  
  console.log('[CommentItem] No display name found, returning "User"');
  return "User";
};

// Helper function to get avatar fallback
const getAvatarFallback = (profiles: { full_name: string | null } | null | undefined): string => {
  if (!profiles?.full_name) return "U";
  return profiles.full_name[0]?.toUpperCase() || "U";
};

export const CommentItem = ({ comment, currentUserId, artistId, isArtistComment, supporterLevel = 'none', paidTier = null }: CommentItemProps) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const isLiked = comment.comment_likes?.some((like) => like.user_id === currentUserId);
  const likeCount = comment.comment_likes?.length || 0;

  const displayName = getDisplayName(comment.profiles, comment.user_id);

  // Auto-load replies on mount
  useEffect(() => {
    if (!repliesLoaded) {
      loadReplies();
    }
  }, []);

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
    if (!currentUserId) {
      toast.error("Please sign in to reply");
      return;
    }

    // Validate with zod schema
    const validation = commentSchema.safeParse({ text: replyText });
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid reply");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      artist_id: artistId,
      user_id: currentUserId,
      text: validation.data.text,
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
      // Fetch profiles for all reply authors (including avatar_url and email)
      const userIds = repliesData.map((r) => r.user_id);
      console.log('[CommentItem] Fetching profiles for reply userIds:', userIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email" as any)
        .in("id", userIds);
      
      console.log('[CommentItem] Reply profiles fetched:', profilesData, 'Error:', profilesError);

      // Merge profiles with replies
      const repliesWithProfiles = repliesData.map((reply) => ({
        ...reply,
        profiles: (profilesData as any)?.find((p: any) => p.id === reply.user_id) || { full_name: null, avatar_url: null, email: null },
      }));

      setReplies(repliesWithProfiles);
    }
    setLoadingReplies(false);
    setRepliesLoaded(true);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {getAvatarFallback(comment.profiles)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link 
              to={`/artist/${comment.user_id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {displayName}
            </Link>
            {isArtistComment && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary" />
            )}
            {!isArtistComment && paidTier && (
              <PaidSupporterBadge tier={paidTier} variant="mini" />
            )}
            {!isArtistComment && !paidTier && supporterLevel && supporterLevel !== 'none' && (
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EmojiPicker onEmojiSelect={(emoji) => setReplyText(prev => prev + emoji)} />
                  <span className="text-xs text-muted-foreground">{replyText.length}/1000</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowReply(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplies(!showReplies)}
                className="gap-1 text-muted-foreground hover:text-primary mb-2"
              >
                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
              
              {showReplies && (
                <div className="pl-4 border-l-2 border-primary/20 space-y-3">
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
          )}
        </div>
      </div>
    </div>
  );
};