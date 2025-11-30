import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ViewActivity {
  id: string;
  video_id: string;
  created_at: string;
  video_caption: string | null;
}

interface LiveViewerActivityWidgetProps {
  artistId: string;
}

export function LiveViewerActivityWidget({ artistId }: LiveViewerActivityWidgetProps) {
  const [activities, setActivities] = useState<ViewActivity[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchRecentActivity();

    // Real-time subscription
    const channel = supabase
      .channel('live-viewer-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_views',
        },
        async (payload) => {
          // Fetch video details for the new view
          const { data: videoData } = await supabase
            .from('artist_video_posts')
            .select('caption, artist_id')
            .eq('id', payload.new.video_id)
            .single();

          // Only add if it's this artist's video
          if (videoData?.artist_id === artistId) {
            const newActivity: ViewActivity = {
              id: payload.new.id,
              video_id: payload.new.video_id,
              created_at: payload.new.created_at,
              video_caption: videoData.caption,
            };

            setActivities((current) => [newActivity, ...current].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId]);

  const fetchRecentActivity = async () => {
    try {
      // Get recent video views for this artist
      const { data: videoIds } = await supabase
        .from('artist_video_posts')
        .select('id')
        .eq('artist_id', artistId);

      if (!videoIds || videoIds.length === 0) return;

      const { data: views } = await supabase
        .from('video_views')
        .select(`
          id,
          video_id,
          created_at,
          artist_video_posts!inner (caption)
        `)
        .in('video_id', videoIds.map(v => v.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (views) {
        const formattedActivities = views.map((view: any) => ({
          id: view.id,
          video_id: view.video_id,
          created_at: view.created_at,
          video_caption: view.artist_video_posts?.caption || null,
        }));
        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent views yet
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 truncate">
                    Someone watching "{activity.video_caption || 'Video'}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
