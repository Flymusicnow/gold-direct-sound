import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/TrackCard";
import { StaggeredList } from "@/components/ui/StaggeredList";
import { Play, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { FlightdeckItem } from "@/contexts/FlightdeckContext";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  created_at: string;
  artist_profiles: {
    artist_name: string;
    user_id: string;
  };
}

interface FeedMusicTabProps {
  tracks: Track[];
  likedTrackIds: Set<string>;
  onPlayAll: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onLikeChange: (trackId: string, isLiked: boolean) => void;
}

export function FeedMusicTab({
  tracks,
  likedTrackIds,
  onPlayAll,
  onPlayTrack,
  onAddToQueue,
  onLikeChange,
}: FeedMusicTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (tracks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('fan.noNewTracksYet')}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {t('fan.followArtistsToSeeMusic')}
        </p>
        <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
          {t('fan.discoverArtists')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Play All */}
      <div className="flex items-center justify-between">
        <Button 
          onClick={onPlayAll}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          <Play className="h-4 w-4 mr-2" />
          {t('actions.playAll')} ({tracks.length})
        </Button>
      </div>

      {/* Track List */}
      <StaggeredList className="space-y-3.5" staggerDelay={0.04}>
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            artistName={track.artist_profiles.artist_name}
            isLiked={likedTrackIds.has(track.id)}
            onPlay={() => onPlayTrack(track)}
            onAddToQueue={() => onAddToQueue(track)}
            onLikeChange={(isLiked) => onLikeChange(track.id, isLiked)}
          />
        ))}
      </StaggeredList>
    </div>
  );
}
