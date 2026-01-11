import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrientation } from "@/hooks/useOrientation";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useLiveReactions } from "@/hooks/useLiveReactions";
import { useStreamControls } from "@/hooks/useStreamControls";
import { useSessionSupport } from "@/hooks/useSessionSupport";
import { useFanInvites } from "@/hooks/useFanInvites";
import { useStageRequests } from "@/hooks/useStageRequests";
import { LiveLayout } from "@/components/live/LiveLayout";
import { SafeVideoStage } from "@/components/live/SafeVideoStage";
import { HLSPlayer } from "@/components/live/HLSPlayer";
import { RaiseHandButton } from "@/components/live/RaiseHandButton";
import { FanOnStage } from "@/components/live/FanOnStage";
import { GiftOverlayZone } from "@/components/live/GiftOverlayZone";
import { ReactionBurst, ReactionButtons } from "@/components/live/ReactionBurst";
import { LiveChatPanel } from "@/components/artist/LiveChatPanel";
import { LiveGiftButton } from "@/components/live/LiveGiftButton";
import { LiveViewerCount } from "@/components/artist/LiveViewerCount";
import { LiveSpotlightBoost } from "@/components/live/LiveSpotlightBoost";
import { CorePerformanceControls } from "@/components/live/artist/CorePerformanceControls";
import { FanInteractionControls } from "@/components/live/artist/FanInteractionControls";
import { SessionAwareness } from "@/components/live/artist/SessionAwareness";
import { InviteFanSheet } from "@/components/live/artist/InviteFanSheet";
import { StreamPausedOverlay } from "@/components/live/artist/StreamErrorBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

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
  is_paused?: boolean;
  artist_profiles?: {
    artist_name: string;
    avatar_url?: string;
    user_id: string;
  };
}

export default function LivePage() {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orientation } = useOrientation();
  const liveOsV2Enabled = useFeatureFlag('LIVE_OS_V2_ENABLED');
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArtist, setIsArtist] = useState(false);
  const [fanOnStageStream, setFanOnStageStream] = useState<MediaStream | null>(null);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  
  // Artist video ref for fan-on-stage
  const artistVideoRef = useRef<HTMLVideoElement>(null);

  // Hooks
  const { recentReactions, sendReaction, isRateLimited } = useLiveReactions(stream?.id || '');
  const streamControls = useStreamControls(stream?.id || null);
  const { topSupporters, giftCount } = useSessionSupport(stream?.id || null);
  const fanInvites = useFanInvites(stream?.id || null, stream?.artist_id || null);
  const { requests, onStage, approve, deny, kick } = useStageRequests(stream?.id || null);

  useEffect(() => {
    if (artistId) {
      fetchActiveStream();
    }
  }, [artistId]);

  // Handle stream end navigation
  useEffect(() => {
    if (stream?.status === 'ended') {
      navigate(`/artist/${artistId}`);
    }
  }, [stream?.status, artistId, navigate]);

  const fetchActiveStream = async () => {
    try {
      setIsLoading(true);
      
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

  const handleEndStream = async () => {
    const success = await streamControls.endStream();
    if (success) {
      navigate(`/artist/${artistId}`);
    }
    return success;
  };

  // Map stage requests to the format expected by FanInteractionControls
  const stageRequestsFormatted = requests.map(r => ({
    id: r.id,
    userId: r.user_id,
    displayName: r.user_id.substring(0, 8),
    avatarUrl: undefined,
    requestedAt: r.created_at,
  }));

  const onStageUsersFormatted = onStage.map(u => ({
    id: u.id,
    userId: u.user_id,
    displayName: u.user_id.substring(0, 8),
    avatarUrl: undefined,
    isMuted: false,
  }));

  // Convert topSupporters for InviteFanSheet
  const formattedTopSupporters = topSupporters.map(s => ({
    userId: s.userId,
    displayName: s.displayName,
    avatarUrl: s.avatarUrl || undefined,
    amount: s.amount,
  }));

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
      {/* Control Strip - Top bar */}
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
        </div>
      </LiveLayout.ControlStrip>

      {/* Stage - Video zone */}
      <LiveLayout.Stage>
        <SafeVideoStage layout={fanOnStageStream ? (orientation === 'portrait' ? 'pip' : 'split') : 'solo'}>
          {stream.stream_mode === 'hls' && hlsUrl && !fanOnStageStream && (
            <HLSPlayer hlsUrl={hlsUrl} />
          )}
          
          {fanOnStageStream && (
            <FanOnStage
              artistVideoRef={artistVideoRef}
              fanStream={fanOnStageStream}
              layout={orientation === 'portrait' ? 'pip' : 'split'}
              pipPosition="bottom-right"
            />
          )}
          
          {stream.stream_mode === 'webrtc_interactive' && !fanOnStageStream && hlsUrl && (
            <HLSPlayer hlsUrl={hlsUrl} />
          )}
        </SafeVideoStage>
        
        {/* Paused overlay for viewers */}
        {stream.is_paused && !isArtist && (
          <StreamPausedOverlay artistName={stream.artist_profiles?.artist_name} />
        )}
        
        {liveOsV2Enabled && <GiftOverlayZone streamId={stream.id} />}
        <ReactionBurst reactions={recentReactions} />
      </LiveLayout.Stage>

      {/* Interaction Rail */}
      <LiveLayout.InteractionRail>
        <div className="flex flex-col h-full">
          {/* Artist-only: Session Awareness (read-only info) */}
          {isArtist && (
            <div className="p-3 border-b border-border/50">
              <SessionAwareness
                streamStartTime={stream.actual_start || null}
                isLive={stream.status === 'live'}
                viewerCount={stream.viewer_count || 0}
                sessionSupportTotal={giftCount}
              />
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <LiveChatPanel 
              streamId={stream.id} 
              isArtist={isArtist} 
              artistId={stream.artist_id} 
            />
          </div>
          
          {/* Action bar */}
          <div className="p-3 border-t border-border/50 space-y-3">
            {/* Fan actions */}
            {!isArtist && (
              <>
                <ReactionButtons 
                  onReact={sendReaction} 
                  isRateLimited={isRateLimited} 
                />
                <div className="flex items-center gap-2">
                  {liveOsV2Enabled && <LiveGiftButton streamId={stream.id} />}
                  <RaiseHandButton streamId={stream.id} />
                  <LiveSpotlightBoost streamId={stream.id} artistId={stream.artist_id} />
                </div>
              </>
            )}
            
            {/* Artist Controls - Organized by Zone */}
            {isArtist && (
              <div className="space-y-4">
                {/* Zone 2: Fan Interaction Controls */}
                <FanInteractionControls
                  stageRequests={stageRequestsFormatted}
                  onStageUsers={onStageUsersFormatted}
                  onInviteFan={() => setShowInviteSheet(true)}
                  onViewSupporters={() => setShowInviteSheet(true)}
                  onApproveRequest={(id) => approve(id)}
                  onDenyRequest={(id) => deny(id)}
                  onMuteFan={() => {}} // TODO: Implement fan mute
                  onRemoveFan={(userId) => {
                    const req = onStage.find(u => u.user_id === userId);
                    if (req) kick(req.id);
                  }}
                  onClearAllFromStage={() => {
                    onStage.forEach(u => kick(u.id));
                  }}
                />

                <Separator />

                {/* Zone 1: Core Performance Controls */}
                <CorePerformanceControls
                  isMuted={streamControls.isMuted}
                  isCameraOff={streamControls.isCameraOff}
                  isPaused={streamControls.isPaused}
                  isEnding={streamControls.isEnding}
                  onToggleMute={streamControls.toggleMute}
                  onToggleCamera={streamControls.toggleCamera}
                  onPause={streamControls.pauseStream}
                  onResume={streamControls.resumeStream}
                  onEndStream={handleEndStream}
                />
              </div>
            )}
          </div>
        </div>
      </LiveLayout.InteractionRail>

      {/* Fan Invite Sheet */}
      <InviteFanSheet
        open={showInviteSheet}
        onOpenChange={setShowInviteSheet}
        topSupporters={formattedTopSupporters}
        recentSupporters={[]}
        onInvite={fanInvites.inviteFan}
        isLoading={fanInvites.isLoading}
      />
    </LiveLayout>
  );
}
