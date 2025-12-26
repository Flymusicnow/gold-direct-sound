import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "@/components/CommentItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useSupportScore } from "@/hooks/useSupportScore";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { ChevronDown, ChevronUp } from "lucide-react";
import { z } from "zod";
import { getDisplayName } from "@/lib/displayName";
import { LoginPromptOverlay } from "@/components/LoginPromptOverlay";

const INITIAL_COMMENTS = 5;
const LOAD_MORE_COUNT = 10;

const commentSchema = z.object({
  text: z.string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be less than 1000 characters" })
});

interface Comment {
  id: string;
  artist_id: string;
  user_id: string;
  text: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url?: string | null;
  };
  comment_likes: { id: string; user_id: string }[];
}

interface CommentsSectionProps {
  artistId: string;
  currentUserId?: string;
}

// Note: getDisplayName is now imported from @/lib/displayName

export const CommentsSection = ({ artistId, currentUserId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { updateSupportScore } = useSupportScore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("comments-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `artist_id=eq.${artistId}` },
        () => fetchComments()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, sortBy]);

  const fetchComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select(`*, comment_likes(id, user_id)`)
      .eq("artist_id", artistId)
      .is("parent_comment_id", null);

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    if (!commentsData) {
      setComments([]);
      return;
    }

    // Fetch profiles for all comment authors (including avatar_url and email)
    const userIds = commentsData.map((c) => c.user_id);
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email" as any)
      .in("id", userIds);

    // Fetch artist profiles to know which commenters are artists
    const { data: artistProfiles } = await supabase
      .from('artist_profiles')
      .select('id, user_id')
      .in('user_id', userIds)
      .eq('status', 'approved');

    const artistMap = new Map(
      artistProfiles?.map(a => [a.user_id, a.id]) || []
    );

    // Fetch supporter levels (XP-based)
    const { data: supportScores } = await supabase
      .from('fan_support_scores')
      .select('fan_user_id, level')
      .eq('artist_id', artistId)
      .in('fan_user_id', userIds);

    const supporterLevels = new Map(
      supportScores?.map(s => [s.fan_user_id, s.level as 'bronze' | 'silver' | 'gold']) || []
    );

    // Fetch paid subscriptions
    const { data: paidSubscriptions } = await supabase
      .from('supporter_subscriptions')
      .select('fan_user_id, tier')
      .eq('artist_id', artistId)
      .eq('status', 'active')
      .in('fan_user_id', userIds);

    const paidTiers = new Map(
      paidSubscriptions?.map(s => [s.fan_user_id, s.tier as 'basic' | 'gold']) || []
    );

    // Merge profiles with comments
    const commentsWithProfiles = commentsData.map((comment) => {
      const profile = (profilesData as any)?.find((p: any) => p.id === comment.user_id);
      return {
        ...comment,
        profiles: profile || { full_name: null, avatar_url: null },
        supporterLevel: supporterLevels.get(comment.user_id) || 'none',
        paidTier: paidTiers.get(comment.user_id) || null,
        isCommenterArtist: artistMap.has(comment.user_id),
        commenterArtistId: artistMap.get(comment.user_id) || null,
      };
    });

    let sortedData = commentsWithProfiles;
    if (sortBy === "top") {
      sortedData.sort((a, b) => (b.comment_likes?.length || 0) - (a.comment_likes?.length || 0));
    } else {
      sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setComments(sortedData as any);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    // Validate with zod schema
    const validation = commentSchema.safeParse({ text: newComment });
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid comment");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      artist_id: artistId,
      user_id: user.id,
      text: validation.data.text,
    });

    if (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } else {
      setNewComment("");
      toast.success("Comment posted!");
      
      // Update support score
      updateSupportScore(artistId, 'comment');
    }
    setLoading(false);
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMoreComments = comments.length > visibleCount;
  const remainingCount = Math.min(LOAD_MORE_COUNT, comments.length - visibleCount);

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-primary">Comments</h2>
          <span className="text-sm text-muted-foreground">({comments.length})</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? "Hide" : "Show"}
            </Button>
          </CollapsibleTrigger>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>

        <CollapsibleContent>
          {/* Comment Input */}
          {user ? (
            <div className="mb-8 space-y-3">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-card border-border focus:border-primary"
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)} />
                  <span className="text-sm text-muted-foreground">{newComment.length}/1000</span>
                </div>
                <Button onClick={handleSubmit} disabled={loading || !newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="mb-8 p-4 bg-card/50 border border-border rounded-lg text-center cursor-pointer hover:bg-card/70 transition-colors"
              onClick={() => setShowLoginPrompt(true)}
            >
              <p className="text-muted-foreground">Create an account to join the conversation</p>
            </div>
          )}

          {/* Sort Tabs */}
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "top")} className="mb-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Newest
              </TabsTrigger>
              <TabsTrigger value="top" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Top
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <>
                {visibleComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id}
                    artistId={artistId}
                    isArtistComment={comment.user_id === currentUserId}
                    supporterLevel={(comment as any).supporterLevel || 'none'}
                    paidTier={(comment as any).paidTier || null}
                    isCommenterArtist={(comment as any).isCommenterArtist || false}
                    commenterArtistId={(comment as any).commenterArtistId || null}
                  />
                ))}
                
                {/* Show more/less buttons */}
                <div className="flex gap-2 justify-center pt-4">
                  {hasMoreComments && (
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                    >
                      Show {remainingCount} more comments
                    </Button>
                  )}
                  {visibleCount > INITIAL_COMMENTS && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setVisibleCount(INITIAL_COMMENTS)}
                    >
                      Show less
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <LoginPromptOverlay
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        action="comment"
        redirectPath={location.pathname}
      />
    </div>
  );
};