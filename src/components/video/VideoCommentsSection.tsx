import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoCommentItem } from "./VideoCommentItem";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { useSupportScore } from "@/hooks/useSupportScore";

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
  const { toast } = useToast();
  const { updateSupportScore } = useSupportScore();

  useEffect(() => {
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
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        // Fetch supporter levels
        const { data: supportScores } = await supabase
          .from('fan_support_scores')
          .select('fan_user_id, level')
          .eq('artist_id', artistId)
          .in('fan_user_id', userIds);

        const supporterLevels = new Map(
          supportScores?.map(s => [s.fan_user_id, s.level as 'bronze' | 'silver' | 'gold']) || []
        );

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id),
          supporterLevel: supporterLevels.get(comment.user_id) || 'none',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="w-5 h-5 text-primary" />
        <span>Comments ({comments.length})</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] bg-background/50 border-border"
          disabled={loading}
        />
        <Button 
          type="submit" 
          disabled={loading || !newComment.trim()}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Post Comment
        </Button>
      </form>

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <VideoCommentItem
            key={comment.id}
            comment={comment}
            allComments={comments}
            artistId={artistId}
            videoId={videoId}
            onReply={fetchComments}
            supporterLevel={(comment as any).supporterLevel || 'none'}
          />
        ))}

        {topLevelComments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
