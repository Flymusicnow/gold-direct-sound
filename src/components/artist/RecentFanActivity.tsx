import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  created_at: string;
  actor_user: {
    full_name: string | null;
    email: string;
  } | null;
  track: {
    title: string;
  } | null;
}

interface RecentFanActivityProps {
  artistId: string;
}

export function RecentFanActivity({ artistId }: RecentFanActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [artistId]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('artist_activities')
      .select(`
        id,
        type,
        created_at,
        actor_user:profiles!artist_activities_actor_user_id_fkey(full_name, email),
        track:tracks(title)
      `)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setActivities(data as Activity[]);
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_follower': return <UserPlus className="h-4 w-4 text-primary" />;
      case 'track_liked': return <Heart className="h-4 w-4 text-primary" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    const fanName = activity.actor_user?.full_name || activity.actor_user?.email || 'Someone';
    
    switch (activity.type) {
      case 'new_follower':
        return `${fanName} started following you`;
      case 'track_liked':
        return `${fanName} liked ${activity.track?.title || 'your track'}`;
      case 'comment':
        return `${fanName} left a comment`;
      default:
        return 'New activity';
    }
  };

  if (loading) {
    return <Card className="p-6"><p className="text-muted-foreground">Loading...</p></Card>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Fan Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity yet. Share your profile to get followers!</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{getActivityText(activity)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
