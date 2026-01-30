import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Share2, MessageCircle } from "lucide-react";
import SpotlightVoteButton from "./SpotlightVoteButton";
import SpotlightShareModal from "./SpotlightShareModal";
import SpotlightEntryComments from "./SpotlightEntryComments";
import { supabase } from "@/integrations/supabase/client";
import { useFlightdeck, FlightdeckItem } from "@/contexts/FlightdeckContext";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  track_id: string;
  title: string | null;
  description: string | null;
  total_votes: number;
  tracks: {
    title: string;
    cover_url: string | null;
    audio_url: string;
  };
  artist_profiles: {
    id: string;
    artist_name: string;
    user_id?: string;
  };
}

interface SpotlightEntryCardProps {
  entry: Entry;
  onVoteSuccess: () => void;
  campaignId?: string;
}

export default function SpotlightEntryCard({ entry, onVoteSuccess, campaignId }: SpotlightEntryCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const { playNow } = useFlightdeck();

  // Fetch initial comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      const { count } = await supabase
        .from('spotlight_entry_comments')
        .select('*', { count: 'exact', head: true })
        .eq('entry_id', entry.id)
        .eq('is_deleted', false);
      
      setCommentCount(count || 0);
    };
    fetchCommentCount();
  }, [entry.id]);

  useEffect(() => {
    const fetchCampaignName = async () => {
      if (!campaignId) return;
      
      const { data } = await supabase
        .from('spotlight_campaigns')
        .select('name')
        .eq('id', campaignId)
        .maybeSingle();
      
      if (data) {
        setCampaignName(data.name);
      }
    };

    fetchCampaignName();
  }, [campaignId]);

  const handlePlay = () => {
    const flightdeckItem: FlightdeckItem = {
      id: entry.track_id,
      type: 'track',
      title: entry.title || entry.tracks.title,
      artistId: entry.artist_profiles.id,
      artistName: entry.artist_profiles.artist_name,
      artistUserId: entry.artist_profiles.user_id || entry.artist_profiles.id,
      coverUrl: entry.tracks.cover_url || undefined,
      mediaUrl: entry.tracks.audio_url,
    };
    playNow(flightdeckItem);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-muted">
        {entry.tracks.cover_url ? (
          <img
            src={entry.tracks.cover_url}
            alt={entry.title || entry.tracks.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 rounded-full bg-[#E8BF1A] flex items-center justify-center">
            <Play className="h-8 w-8 text-black fill-black ml-1" />
          </div>
        </button>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {entry.title || entry.tracks.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {entry.artist_profiles.artist_name}
        </p>
        {entry.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {entry.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline">{entry.total_votes} votes</Badge>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCommentsExpanded(!commentsExpanded)}
              className={cn("h-9 w-9", commentsExpanded && "text-primary")}
            >
              <MessageCircle className={cn("h-4 w-4", commentsExpanded && "fill-current")} />
              {commentCount > 0 && (
                <span className="ml-0.5 text-xs">{commentCount}</span>
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <SpotlightVoteButton
              entryId={entry.id}
              artistUserId={entry.artist_profiles.user_id}
              onVoteSuccess={onVoteSuccess}
            />
          </div>
        </div>

        {/* Expandable comments section */}
        {commentsExpanded && (
          <SpotlightEntryComments
            entryId={entry.id}
            onCommentCountChange={setCommentCount}
          />
        )}
      </CardContent>

      {campaignId && (
        <SpotlightShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          entry={{
            id: entry.id,
            title: entry.title || entry.tracks.title,
            artistName: entry.artist_profiles.artist_name,
            campaignName: campaignName,
            votes: entry.total_votes,
          }}
          campaignId={campaignId}
        />
      )}
    </Card>
  );
}