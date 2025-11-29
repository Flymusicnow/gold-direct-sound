import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamCard } from "@/components/artist/LiveStreamCard";
import { GoLiveDialog } from "@/components/artist/GoLiveDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Radio } from "lucide-react";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduled_start?: string;
  actual_start?: string;
  viewer_count: number;
  thumbnail_url?: string;
  stream_url?: string;
}

export default function StudioLiveStreams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchArtistProfile();
    }
  }, [user]);

  const fetchArtistProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        setArtistId(profile.id);
        fetchStreams(profile.id);
      }
    } catch (error) {
      console.error("Error fetching artist profile:", error);
    }
  };

  const fetchStreams = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("artist_live_streams")
        .select("*")
        .eq("artist_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoLive = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({
          status: "live",
          actual_start: new Date().toISOString(),
        })
        .eq("id", streamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You are now live!",
      });

      if (artistId) fetchStreams(artistId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEndStream = async (streamId: string) => {
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", streamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stream ended",
      });

      if (artistId) fetchStreams(artistId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (streamId: string) => {
    if (!confirm("Are you sure you want to delete this stream?")) return;

    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .delete()
        .eq("id", streamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stream deleted successfully",
      });

      if (artistId) fetchStreams(artistId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading streams...</div>
      </div>
    );
  }

  const liveStreams = streams.filter((s) => s.status === "live");
  const scheduledStreams = streams.filter((s) => s.status === "scheduled");
  const pastStreams = streams.filter((s) => s.status === "ended");

  return (
    <>
      <div className="flex min-h-screen w-full">
        <StudioSidebar />
        <MobileStudioNav />
        <div className="flex-1 pt-16 md:pt-0">
          <div className="p-6 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="h-8 w-8 text-red-500" />
              Live Streams
            </h1>
            <p className="text-muted-foreground mt-2">
              Stream live performances to your fans
            </p>
          </div>
          
          {artistId && (
            <GoLiveDialog
              artistId={artistId}
              onSuccess={() => artistId && fetchStreams(artistId)}
            />
          )}
        </div>

        {/* Live Now */}
        {liveStreams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <div key={stream.id} className="space-y-2">
                  <LiveStreamCard
                    stream={stream}
                    isOwner
                    onDelete={() => handleDelete(stream.id)}
                  />
                  <Button
                    onClick={() => handleEndStream(stream.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    End Stream
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled */}
        {scheduledStreams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Scheduled Streams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledStreams.map((stream) => (
                <div key={stream.id} className="space-y-2">
                  <LiveStreamCard
                    stream={stream}
                    isOwner
                    onDelete={() => handleDelete(stream.id)}
                  />
                  {stream.stream_url && (
                    <Button
                      onClick={() => handleGoLive(stream.id)}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      Go Live
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Streams */}
        {pastStreams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Past Streams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastStreams.map((stream) => (
                <LiveStreamCard
                  key={stream.id}
                  stream={stream}
                  isOwner
                  onDelete={() => handleDelete(stream.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {streams.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Radio className="h-16 w-16 text-muted-foreground mx-auto opacity-30" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Streams Yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Schedule your first live stream to connect with your fans in real-time
              </p>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
