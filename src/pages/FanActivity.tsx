import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, MessageSquare, Users } from "lucide-react";

interface Activity {
  type: 'like' | 'comment' | 'follow';
  timestamp: string;
  details: string;
  link?: string;
}

export default function FanActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAllActivity();
  }, [user, navigate]);

  const fetchAllActivity = async () => {
    if (!user) return;

    const allActivities: Activity[] = [];

    // Fetch likes
    const { data: likes } = await supabase
      .from('likes')
      .select(`
        created_at,
        tracks (
          title,
          artist_profiles (
            user_id,
            artist_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (likes) {
      likes.forEach((like: any) => {
        allActivities.push({
          type: 'like',
          timestamp: like.created_at,
          details: `Liked "${like.tracks.title}" by ${like.tracks.artist_profiles.artist_name}`,
          link: `/artist/${like.tracks.artist_profiles.user_id}`
        });
      });
    }

    // Fetch comments
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        created_at,
        text,
        artist_profiles (
          user_id,
          artist_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (comments) {
      comments.forEach((comment: any) => {
        allActivities.push({
          type: 'comment',
          timestamp: comment.created_at,
          details: `Commented on ${comment.artist_profiles.artist_name}'s profile: "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
          link: `/artist/${comment.artist_profiles.user_id}`
        });
      });
    }

    // Fetch follows
    const { data: follows } = await supabase
      .from('follows')
      .select(`
        created_at,
        artist_profiles (
          user_id,
          artist_name
        )
      `)
      .eq('fan_id', user.id)
      .order('created_at', { ascending: false });

    if (follows) {
      follows.forEach((follow: any) => {
        allActivities.push({
          type: 'follow',
          timestamp: follow.created_at,
          details: `Started following ${follow.artist_profiles.artist_name}`,
          link: `/artist/${follow.artist_profiles.user_id}`
        });
      });
    }

    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(allActivities);
    setLoading(false);
  };

  const filterActivities = (type?: 'like' | 'comment' | 'follow') => {
    return type ? activities.filter(a => a.type === type) : activities;
  };

  const ActivityList = ({ items }: { items: Activity[] }) => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No activity found</p>
      ) : (
        items.map((activity, index) => (
          <Card
            key={index}
            className="p-4 hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => activity.link && navigate(activity.link)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {activity.type === 'like' && <Heart className="h-5 w-5 text-primary" />}
                {activity.type === 'comment' && <MessageSquare className="h-5 w-5 text-primary" />}
                {activity.type === 'follow' && <Users className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-sm">{activity.details}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/fan')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Activity</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ActivityList items={filterActivities()} />
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            <ActivityList items={filterActivities('like')} />
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <ActivityList items={filterActivities('comment')} />
          </TabsContent>

          <TabsContent value="follows" className="mt-6">
            <ActivityList items={filterActivities('follow')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
