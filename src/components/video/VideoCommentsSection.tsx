import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoCommentItem } from "./VideoCommentItem";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useSupportScore } from "@/hooks/useSupportScore";
import { EmojiPicker } from "@/components/ui/emoji-picker";

const INITIAL_COMMENTS = 5;
const LOAD_MORE_COUNT = 10;

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

interface VideoCommentsSectionProps {
  videoId: string;
  artistId: string;
}

export function VideoCommentsSection({ videoId, artistId }: VideoCommentsSectionProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS);
  const { toast } = useToast();
  const { updateSupportScore } = useSupportScore();

  useEffect(() => {
    // Reset state immediately when videoId changes to prevent stale data
    setComments([]);
    setVisibleCount(INITIAL_COMMENTS);
    
    fetchComments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`video_comments_${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_comments',
          filter: `video_id=eq.${videoId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        
        // Fetch profiles, artist profiles, and supporter levels in parallel
        const [profilesResult, artistProfilesResult, supportScoresResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds),
          supabase
            .from('artist_profiles')
            .select('id, user_id')
            .in('user_id', userIds)
            .eq('status', 'approved'),
          supabase
            .from('fan_support_scores')
            .select('fan_user_id, level')
            .eq('artist_id', artistId)
            .in('fan_user_id', userIds),
        ]);

        const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
        const artistMap = new Map(artistProfilesResult.data?.map(a => [a.user_id, a.id]) || []);
        const supporterLevels = new Map(
          supportScoresResult.data?.map(s => [s.fan_user_id, s.level as 'bronze' | 'silver' | 'gold']) || []
        );

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id),
          supporterLevel: supporterLevels.get(comment.user_id) || 'none',
          isCommenterArtist: artistMap.has(comment.user_id),
          commenterArtistId: artistMap.get(comment.user_id) || null,
        }));
        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to comment",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          text: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
      
      // Update support score
      updateSupportScore(artistId, 'comment');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const visibleComments = topLevelComments.slice(0, visibleCount);
  const hasMoreComments = topLevelComments.length > visibleCount;
  const remainingCount = Math.min(LOAD_MORE_COUNT, topLevelComments.length - visibleCount);

  return (
    <div className="space-y-6">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span>Comments ({comments.length})</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 ml-2">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? "Hide" : "Show"}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-6 mt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px] bg-background/50 border-border"
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)} />
              <Button 
                type="submit" 
                disabled={loading || !newComment.trim()}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Post Comment
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {visibleComments.map((comment) => (
              <VideoCommentItem
                key={comment.id}
                comment={comment}
                allComments={comments}
                artistId={artistId}
                videoId={videoId}
                onReply={fetchComments}
                supporterLevel={(comment as any).supporterLevel || 'none'}
                isCommenterArtist={(comment as any).isCommenterArtist || false}
                commenterArtistId={(comment as any).commenterArtistId || null}
              />
            ))}

            {topLevelComments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}

            {/* Show more/less buttons */}
            {topLevelComments.length > 0 && (
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
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
