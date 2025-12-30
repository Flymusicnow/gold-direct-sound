import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCommentsAnalytics } from "@/hooks/useCommentsAnalytics";
import { useCommentModeration } from "@/hooks/useCommentModeration";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  MessageSquare, Send, TrendingUp, TrendingDown, 
  Pin, EyeOff, AlertTriangle, Users, BarChart3,
  MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  text: string;
  created_at: string;
  is_pinned?: boolean;
  is_hidden?: boolean;
  reported_at?: string | null;
  user: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
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
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useIsMobile();
  
  const { analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useCommentsAnalytics(artistProfile?.id);
  const { pinComment, hideComment, reportComment } = useCommentModeration();

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
        is_pinned,
        is_hidden,
        reported_at,
        user:profiles!comments_user_id_fkey(id, full_name, avatar_url),
        track:tracks(title)
      `)
      .eq('artist_id', profile.id)
      .is('parent_comment_id', null)
      .order('is_pinned', { ascending: false })
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
      refetchAnalytics();
    } catch (error: any) {
      toast.error(error.message || "Error sending reply");
    } finally {
      setSending(false);
    }
  };

  const handleModeration = async (commentId: string, action: 'pin' | 'hide' | 'report', currentValue?: boolean) => {
    let success = false;
    
    if (action === 'pin') {
      success = await pinComment(commentId, !currentValue, 'comments');
    } else if (action === 'hide') {
      success = await hideComment(commentId, !currentValue, 'comments');
    } else if (action === 'report') {
      success = await reportComment(commentId, 'comments');
    }

    if (success) {
      fetchData();
      refetchAnalytics();
    }
  };

  const getFilteredComments = () => {
    switch (activeTab) {
      case 'pinned':
        return comments.filter(c => c.is_pinned);
      case 'hidden':
        return comments.filter(c => c.is_hidden);
      case 'reported':
        return comments.filter(c => c.reported_at);
      default:
        return comments;
    }
  };

  const filteredComments = getFilteredComments();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen pt-16 lg:ml-64">
        <StudioSidebar />
        <MobileStudioNav />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold">Comments</h1>
                  {analytics && analytics.totalComments > 0 && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {analytics.totalComments}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Engage with your fans and manage feedback</p>
              </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Total Comments</span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.totalComments}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.weekOverWeekChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${analytics.weekOverWeekChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {analytics.weekOverWeekChange >= 0 ? '+' : ''}{analytics.weekOverWeekChange}% this week
                    </span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Reply Rate</span>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.replyRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.totalReplies} replies sent
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Avg/Day</span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{analytics.averageCommentsPerDay}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Top Fan</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {analytics.topCommenters.length > 0 ? (
                    <>
                      <p className="text-lg font-bold truncate">{analytics.topCommenters[0].name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics.topCommenters[0].commentCount} comments
                        {analytics.topCommenters[0].isSupporter && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">Supporter</Badge>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No commenters yet</p>
                  )}
                </Card>
              </div>
            )}

            {/* Top Commenters Section */}
            {analytics && analytics.topCommenters.length > 1 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Top Commenters
                </h3>
                <div className="flex flex-wrap gap-3">
                  {analytics.topCommenters.slice(0, 5).map((commenter, idx) => (
                    <div key={commenter.userId} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={commenter.avatarUrl || ''} />
                        <AvatarFallback className="text-xs">
                          {commenter.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{commenter.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {commenter.commentCount}
                      </Badge>
                      {commenter.isSupporter && (
                        <Badge variant="outline" className="text-[10px] px-1 border-primary text-primary">
                          ★
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Comments Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pinned" className="flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned {analytics && analytics.pinnedCount > 0 && `(${analytics.pinnedCount})`}
                </TabsTrigger>
                <TabsTrigger value="hidden" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden {analytics && analytics.hiddenCount > 0 && `(${analytics.hiddenCount})`}
                </TabsTrigger>
                <TabsTrigger value="reported" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Reported {analytics && analytics.reportedCount > 0 && `(${analytics.reportedCount})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredComments.length === 0 ? (
                  <Card className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      {activeTab === 'all' ? 'No comments yet' : `No ${activeTab} comments`}
                    </h2>
                    <p className="text-muted-foreground">
                      {activeTab === 'all' 
                        ? "When fans leave comments on your profile, they'll appear here."
                        : `Comments you've ${activeTab} will appear here.`}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <Card 
                        key={comment.id} 
                        className={`p-6 ${comment.is_pinned ? 'border-primary/50 bg-primary/5' : ''} ${comment.is_hidden ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={comment.user[0]?.avatar_url || ''} />
                            <AvatarFallback>
                              {(comment.user[0]?.full_name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{comment.user[0]?.full_name || 'Unknown'}</p>
                              {comment.is_pinned && (
                                <Badge variant="outline" className="text-xs border-primary text-primary">
                                  <Pin className="h-3 w-3 mr-1" /> Pinned
                                </Badge>
                              )}
                              {comment.is_hidden && (
                                <Badge variant="outline" className="text-xs">
                                  <EyeOff className="h-3 w-3 mr-1" /> Hidden
                                </Badge>
                              )}
                              {comment.reported_at && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Reported
                                </Badge>
                              )}
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
                            
                            <div className="flex items-center gap-2">
                              {replyingTo === comment.id ? (
                                <div className="flex-1 space-y-2">
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
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReplyingTo(comment.id)}
                                  >
                                    Reply
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleModeration(comment.id, 'pin', comment.is_pinned)}>
                                        <Pin className="h-4 w-4 mr-2" />
                                        {comment.is_pinned ? 'Unpin' : 'Pin'} Comment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleModeration(comment.id, 'hide', comment.is_hidden)}>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        {comment.is_hidden ? 'Show' : 'Hide'} Comment
                                      </DropdownMenuItem>
                                      {!comment.reported_at && (
                                        <DropdownMenuItem 
                                          onClick={() => handleModeration(comment.id, 'report')}
                                          className="text-destructive"
                                        >
                                          <AlertTriangle className="h-4 w-4 mr-2" />
                                          Report Comment
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
