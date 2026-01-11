import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamCard } from "@/components/artist/LiveStreamCard";
import { GoLiveDialog } from "@/components/artist/GoLiveDialog";
import { EditStreamDialog } from "@/components/artist/EditStreamDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Radio } from "lucide-react";
import { StudioLayout } from "@/components/layouts/StudioLayout";

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
  const navigate = useNavigate();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Auto-navigate to Live Page
      if (artistId) {
        navigate(`/live/${artistId}`);
      }
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
    <StudioLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Radio className="h-8 w-8 text-red-500 shrink-0" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Live Streams</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Stream live performances to your fans
                </p>
              </div>
            </div>
            
            {artistId && (
              <div className="shrink-0">
                <GoLiveDialog
                  artistId={artistId}
                  onSuccess={() => artistId && fetchStreams(artistId)}
                />
              </div>
            )}
          </div>
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
                    artistId={artistId || undefined}
                    isOwner
                    onEdit={() => setEditingStream(stream)}
                    onDelete={() => handleDelete(stream.id)}
                  />
                  <Button
                    onClick={() => handleEndStream(stream.id)}
                    variant="destructive"
                    className="w-full min-h-[44px]"
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
                    artistId={artistId || undefined}
                    isOwner
                    onEdit={() => setEditingStream(stream)}
                    onDelete={() => handleDelete(stream.id)}
                  />
                  <Button
                    onClick={() => handleGoLive(stream.id)}
                    className="w-full min-h-[44px] bg-red-500 hover:bg-red-600"
                  >
                    Go Live
                  </Button>
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
                  artistId={artistId || undefined}
                  isOwner
                  onEdit={() => setEditingStream(stream)}
                  onDelete={() => handleDelete(stream.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Edit Stream Dialog */}
        <EditStreamDialog
          stream={editingStream}
          open={!!editingStream}
          onOpenChange={(open) => !open && setEditingStream(null)}
          onSuccess={() => {
            setEditingStream(null);
            if (artistId) fetchStreams(artistId);
          }}
        />

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
    </StudioLayout>
  );
}
