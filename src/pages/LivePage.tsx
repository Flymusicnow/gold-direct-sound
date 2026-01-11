import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrientation } from "@/hooks/useOrientation";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useLiveReactions } from "@/hooks/useLiveReactions";
import { LiveLayout } from "@/components/live/LiveLayout";
import { SafeVideoStage } from "@/components/live/SafeVideoStage";
import { HLSPlayer } from "@/components/live/HLSPlayer";
import { RaiseHandButton } from "@/components/live/RaiseHandButton";
import { StageRequestQueue } from "@/components/live/StageRequestQueue";
import { FanOnStage } from "@/components/live/FanOnStage";
import { GiftOverlayZone } from "@/components/live/GiftOverlayZone";
import { ReactionBurst, ReactionButtons } from "@/components/live/ReactionBurst";
import { LiveChatPanel } from "@/components/artist/LiveChatPanel";
import { LiveGiftButton } from "@/components/live/LiveGiftButton";
import { LiveViewerCount } from "@/components/artist/LiveViewerCount";
import { LiveSpotlightBoost } from "@/components/live/LiveSpotlightBoost";
import { StreamControlPanel } from "@/components/live/StreamControlPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: string;
  stream_url?: string;
  hls_url?: string;
  stream_mode: 'hls' | 'webrtc_interactive' | 'webrtc_sfu';
  available_qualities?: string[];
  actual_start?: string;
  scheduled_start?: string;
  artist_id: string;
  viewer_count?: number;
  artist_profiles?: {
    artist_name: string;
    avatar_url?: string;
    user_id: string;
  };
}

export default function LivePage() {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  const { orientation } = useOrientation();
  const liveOsV2Enabled = useFeatureFlag('LIVE_OS_V2_ENABLED');
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArtist, setIsArtist] = useState(false);
  const [fanOnStageStream, setFanOnStageStream] = useState<MediaStream | null>(null);
  
  // Artist video ref for fan-on-stage
  const artistVideoRef = useRef<HTMLVideoElement>(null);

  // Live reactions
  const { recentReactions, sendReaction, isRateLimited } = useLiveReactions(stream?.id || '');

  useEffect(() => {
    if (artistId) {
      fetchActiveStream();
    }
  }, [artistId]);

  const fetchActiveStream = async () => {
    try {
      setIsLoading(true);
      
      // Find active stream for this artist
      const { data: streamData, error: streamError } = await supabase
        .from("artist_live_streams")
        .select("*")
        .eq("artist_id", artistId)
        .eq("status", "live")
        .order("actual_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (streamError) throw streamError;
      if (!streamData) {
        setStream(null);
        return;
      }

      // Fetch artist profile
      const { data: artistProfile } = await supabase
        .from("artist_profiles")
        .select("artist_name, avatar_url, user_id")
        .eq("id", artistId)
        .single();

      const streamWithProfile: LiveStream = {
        ...streamData,
        stream_mode: (streamData.stream_mode as LiveStream['stream_mode']) || 'hls',
        available_qualities: (streamData.available_qualities as string[]) || ['auto', '360p', '480p', '720p', '1080p'],
        artist_profiles: artistProfile || undefined,
      };

      setStream(streamWithProfile);
      
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
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-center space-y-4 px-4">
          <h2 className="text-2xl font-bold">No Active Stream</h2>
          <p className="text-muted-foreground">
            This artist is not currently live.
          </p>
          <Link to={`/artist/${artistId}`}>
            <Button>View Artist Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hlsUrl = stream.hls_url || stream.stream_url;

  return (
    <LiveLayout orientation={orientation}>
      {/* Control Strip - Top bar with stream info and controls */}
      <LiveLayout.ControlStrip>
        <Link to={`/artist/${artistId}`} className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {stream.artist_profiles?.avatar_url ? (
            <img
              src={stream.artist_profiles.avatar_url}
              alt={stream.artist_profiles.artist_name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              {stream.artist_profiles?.artist_name?.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{stream.artist_profiles?.artist_name}</p>
            <p className="text-xs text-muted-foreground truncate">{stream.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-red-500 text-white text-xs animate-pulse">
            LIVE
          </Badge>
          <LiveViewerCount streamId={stream.id} />
          
          {isArtist && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </LiveLayout.ControlStrip>

      {/* Stage - Video zone */}
      <LiveLayout.Stage>
        <SafeVideoStage layout={fanOnStageStream ? (orientation === 'portrait' ? 'pip' : 'split') : 'solo'}>
          {/* Default: HLS player for audience */}
          {stream.stream_mode === 'hls' && hlsUrl && !fanOnStageStream && (
            <HLSPlayer hlsUrl={hlsUrl} />
          )}
          
          {/* WebRTC Interactive: Show fan-on-stage if active */}
          {fanOnStageStream && (
            <FanOnStage
              artistVideoRef={artistVideoRef}
              fanStream={fanOnStageStream}
              layout={orientation === 'portrait' ? 'pip' : 'split'}
              pipPosition="bottom-right"
            />
          )}
          
          {/* Fallback for webrtc_interactive without fan */}
          {stream.stream_mode === 'webrtc_interactive' && !fanOnStageStream && hlsUrl && (
            <HLSPlayer hlsUrl={hlsUrl} />
          )}
        </SafeVideoStage>
        
        {/* Gift overlay (zone-constrained) */}
        {liveOsV2Enabled && <GiftOverlayZone streamId={stream.id} />}
        
        {/* Reactions overlay */}
        <ReactionBurst reactions={recentReactions} />
      </LiveLayout.Stage>

      {/* Interaction Rail - Chat, gifts, reactions */}
      <LiveLayout.InteractionRail>
        <div className="flex flex-col h-full">
          {/* Chat takes most space */}
          <div className="flex-1 min-h-0">
            <LiveChatPanel 
              streamId={stream.id} 
              isArtist={isArtist} 
              artistId={stream.artist_id} 
            />
          </div>
          
          {/* Action bar */}
          <div className="p-3 border-t border-border/50 space-y-3">
            {/* Reaction buttons for fans */}
            {!isArtist && (
              <ReactionButtons 
                onReact={sendReaction} 
                isRateLimited={isRateLimited} 
              />
            )}
            
            {/* Fan actions */}
            {!isArtist && (
              <div className="flex items-center gap-2">
                {liveOsV2Enabled && <LiveGiftButton streamId={stream.id} />}
                <RaiseHandButton streamId={stream.id} />
                <LiveSpotlightBoost streamId={stream.id} artistId={stream.artist_id} />
              </div>
            )}
            
            {/* Artist controls */}
            {isArtist && (
              <div className="space-y-3">
                <StageRequestQueue streamId={stream.id} />
                <StreamControlPanel streamId={stream.id} />
              </div>
            )}
          </div>
        </div>
      </LiveLayout.InteractionRail>
    </LiveLayout>
  );
}
