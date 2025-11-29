import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamPlayer } from "@/components/artist/LiveStreamPlayer";
import { LiveChatPanel } from "@/components/artist/LiveChatPanel";
import { LiveViewerCount } from "@/components/artist/LiveViewerCount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: string;
  stream_url?: string;
  actual_start?: string;
  scheduled_start?: string;
  artist_id: string;
  artist_profiles?: {
    artist_name: string;
    avatar_url?: string;
    user_id: string;
  };
}

export default function LiveStream() {
  const { streamId } = useParams<{ streamId: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArtist, setIsArtist] = useState(false);

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  const fetchStream = async () => {
    try {
      setIsLoading(true);
      const { data: streamData, error: streamError } = await supabase
        .from("artist_live_streams")
        .select("*")
        .eq("id", streamId)
        .single();

      if (streamError) throw streamError;

      // Fetch artist profile separately
      const { data: artistProfile } = await supabase
        .from("artist_profiles")
        .select("artist_name, avatar_url, user_id")
        .eq("id", streamData.artist_id)
        .single();

      const streamWithProfile = {
        ...streamData,
        artist_profiles: artistProfile || undefined,
      };

      setStream(streamWithProfile);
      
      // Check if current user is the artist
      if (user && artistProfile?.user_id === user.id) {
        setIsArtist(true);
      }
    } catch (error) {
      console.error("Error fetching stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading stream...</div>
      </div>
    );
  }

  if (!stream || stream.status !== "live" || !stream.stream_url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Stream Not Available</h2>
          <p className="text-muted-foreground">
            This stream is not live or doesn't exist.
          </p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stream Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player */}
            <div className="relative">
              <LiveStreamPlayer streamUrl={stream.stream_url} />
              
              {/* Viewer Count Overlay */}
              <div className="absolute top-4 right-4">
                <LiveViewerCount streamId={stream.id} />
              </div>
            </div>

            {/* Stream Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      🔴 LIVE
                    </Badge>
                    <h1 className="text-2xl font-bold">{stream.title}</h1>
                  </div>
                  
                  {stream.description && (
                    <p className="text-muted-foreground">{stream.description}</p>
                  )}
                </div>
              </div>

              {/* Artist Info */}
              <Link
                to={`/artist/${stream.artist_id}`}
                className="flex items-center gap-3 p-4 bg-card/50 border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
              >
                {stream.artist_profiles?.avatar_url ? (
                  <img
                    src={stream.artist_profiles.avatar_url}
                    alt={stream.artist_profiles.artist_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {stream.artist_profiles?.artist_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{stream.artist_profiles?.artist_name}</p>
                  <p className="text-sm text-muted-foreground">View Artist Profile</p>
                </div>
              </Link>

              {stream.actual_start && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Started {format(new Date(stream.actual_start), "PPp")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 h-[calc(100vh-8rem)]">
              <LiveChatPanel streamId={stream.id} isArtist={isArtist} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
