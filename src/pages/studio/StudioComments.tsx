import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
  }[];
  track: {
    title: string;
  }[] | null;
}

export default function StudioComments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.status !== 'approved') {
      navigate('/studio/profile');
      return;
    }

    setArtistProfile(profile);

    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user:profiles!comments_user_id_fkey(full_name, email),
        track:tracks(title)
      `)
      .eq('artist_id', profile.id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (commentsData) setComments(commentsData as Comment[]);
    setLoading(false);
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || !artistProfile) return;

    setSending(true);

    try {
      const { error } = await supabase.from('comments').insert({
        artist_id: artistProfile.id,
        user_id: user!.id,
        text: replyText.trim(),
        parent_comment_id: commentId,
      });

      if (error) throw error;

      toast.success("Reply sent!");
      setReplyText("");
      setReplyingTo(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error sending reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <StudioSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Comments</h1>
            {comments.length > 0 && (
              <Badge variant="secondary">{comments.length}</Badge>
            )}
          </div>

          {comments.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No comments yet</h2>
              <p className="text-muted-foreground">
                When fans leave comments on your profile or tracks, they'll appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {(comment.user[0]?.full_name || comment.user[0]?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{comment.user[0]?.full_name || comment.user[0]?.email || 'Unknown'}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {comment.track && comment.track[0] && (
                        <p className="text-xs text-muted-foreground mb-2">
                          On track: {comment.track[0].title}
                        </p>
                      )}
                      <p className="text-sm mb-3">{comment.text}</p>
                      
                      {replyingTo === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(comment.id)}
                              disabled={sending || !replyText.trim()}
                            >
                              <Send className="mr-2 h-3 w-3" />
                              {sending ? "Sending..." : "Send Reply"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
