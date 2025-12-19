import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Reply, Trash2, BadgeCheck, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import SupporterBadge from "@/components/supporter/SupporterBadge";
import { PaidSupporterBadge } from "@/components/supporter/PaidSupporterBadge";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { z } from "zod";
import { getDisplayName, getAvatarFallback } from "@/lib/displayName";
import { formatDate } from "@/lib/dateFormat";

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
  isCommenterArtist?: boolean;
  commenterArtistId?: string | null;
}

// Note: getDisplayName and getAvatarFallback are now imported from @/lib/displayName

export const CommentItem = ({ comment, currentUserId, artistId, isArtistComment, supporterLevel = 'none', paidTier = null, isCommenterArtist = false, commenterArtistId = null }: CommentItemProps) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  
  // Local state for likes to enable optimistic UI updates
  const [likes, setLikes] = useState<{ id: string; user_id: string }[]>(comment.comment_likes || []);

  const isLiked = likes.some((like) => like.user_id === currentUserId);
  const likeCount = likes.length;
  const displayName = getDisplayName(comment.profiles);

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
      // Find the like to remove
      const likeToRemove = likes.find((like) => like.user_id === currentUserId);
      if (likeToRemove) {
        // Optimistic UI update - remove like locally first
        setLikes(prev => prev.filter(like => like.user_id !== currentUserId));
        
        const { error } = await supabase.from("comment_likes").delete().eq("id", likeToRemove.id);
        if (error) {
          // Rollback on error
          setLikes(prev => [...prev, likeToRemove]);
          toast.error("Failed to unlike");
        }
      }
    } else {
      // Optimistic UI update - add like locally first
      const tempLike = { id: 'temp-' + Date.now(), user_id: currentUserId };
      setLikes(prev => [...prev, tempLike]);
      
      const { data, error } = await supabase.from("comment_likes").insert({
        comment_id: comment.id,
        user_id: currentUserId,
      }).select('id, user_id').single();
      
      if (error) {
        // Rollback on error
        setLikes(prev => prev.filter(like => like.id !== tempLike.id));
        toast.error("Failed to like");
      } else if (data) {
        // Replace temp like with real one
        setLikes(prev => prev.map(like => 
          like.id === tempLike.id ? data : like
        ));
      }
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

    if (repliesData && repliesData.length > 0) {
      const userIds = repliesData.map((r) => r.user_id);
      
      // Batch fetch profiles and artist profiles
      const [profilesResult, artistProfilesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, email" as any)
          .in("id", userIds),
        supabase
          .from('artist_profiles')
          .select('id, user_id')
          .in('user_id', userIds)
          .eq('status', 'approved')
      ]);

      const artistMap = new Map(
        artistProfilesResult.data?.map(a => [a.user_id, a.id]) || []
      );

      // Merge profiles with replies
      const repliesWithProfiles = repliesData.map((reply) => ({
        ...reply,
        profiles: (profilesResult.data as any)?.find((p: any) => p.id === reply.user_id) || { full_name: null, avatar_url: null, email: null },
        isCommenterArtist: artistMap.has(reply.user_id),
        commenterArtistId: artistMap.get(reply.user_id) || null,
      }));

      setReplies(repliesWithProfiles);
    } else {
      setReplies([]);
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
            {isCommenterArtist && commenterArtistId ? (
              <Link 
                to={`/artist/${commenterArtistId}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {displayName}
              </Link>
            ) : (
              <span className="font-semibold text-foreground">
                {displayName}
              </span>
            )}
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
              {formatDate(comment.created_at)}
            </span>
          </div>

          <p className="text-foreground/90 whitespace-pre-wrap mb-3">{comment.text}</p>

          {/* Actions - Mobile optimized touch targets */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1.5 min-h-[44px] min-w-[44px] px-3 ${isLiked ? "text-primary" : "text-muted-foreground"} hover:text-primary active:scale-95 transition-transform`}
            >
              <Heart className={`w-5 h-5 sm:w-4 sm:h-4 ${isLiked ? "fill-primary" : ""}`} />
              <span className="text-sm">{likeCount > 0 && likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReply(!showReply)}
              className="gap-1.5 min-h-[44px] min-w-[44px] px-3 text-muted-foreground hover:text-primary active:scale-95 transition-transform"
            >
              <Reply className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-sm">Reply</span>
            </Button>

            {currentUserId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="gap-1 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive ml-auto active:scale-95 transition-transform"
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
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
                      isCommenterArtist={reply.isCommenterArtist || false}
                      commenterArtistId={reply.commenterArtistId || null}
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