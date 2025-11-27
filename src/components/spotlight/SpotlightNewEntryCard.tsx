import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Vote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NewEntry {
  id: string;
  title: string | null;
  campaign_id: string;
  created_at: string;
  tracks: {
    title: string;
    cover_url: string | null;
    audio_url: string;
  };
  artist_profiles: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

interface SpotlightNewEntryCardProps {
  onPlayTrack?: (audioUrl: string, title: string, artistName: string, coverUrl?: string) => void;
}

export function SpotlightNewEntryCard({ onPlayTrack }: SpotlightNewEntryCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newEntries, setNewEntries] = useState<NewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNewEntries();
    }
  }, [user]);

  const fetchNewEntries = async () => {
    if (!user) return;

    try {
      // Get followed artists
      const { data: follows } = await supabase
        .from('follows')
        .select('artist_id')
        .eq('fan_id', user.id);

      if (!follows || follows.length === 0) {
        setLoading(false);
        return;
      }

      const followedArtistIds = follows.map(f => f.artist_id);

      // Get active campaign
      const { data: campaign } = await supabase
        .from('spotlight_campaigns')
        .select('id')
        .eq('status', 'active')
        .single();

      if (!campaign) {
        setLoading(false);
        return;
      }

      // Get new entries from followed artists (created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: entries, error } = await supabase
        .from('spotlight_entries')
        .select(`
          *,
          tracks (title, cover_url, audio_url),
          artist_profiles (id, artist_name, avatar_url)
        `)
        .eq('campaign_id', campaign.id)
        .eq('status', 'approved')
        .in('artist_id', followedArtistIds)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNewEntries(entries || []);
    } catch (error) {
      console.error('Error fetching new entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || newEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {newEntries.map((entry) => (
        <Card key={entry.id} className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              New Spotlight Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
                {entry.artist_profiles.avatar_url ? (
                  <img
                    src={entry.artist_profiles.avatar_url}
                    alt={entry.artist_profiles.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">
                      {entry.artist_profiles.artist_name[0]}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{entry.artist_profiles.artist_name}</span>
                  {" submitted a track to FlyMusic Spotlight"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entry.title || entry.tracks.title}
                </p>
                
                <div className="flex gap-2 mt-3">
                  {onPlayTrack && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPlayTrack(
                        entry.tracks.audio_url,
                        entry.title || entry.tracks.title,
                        entry.artist_profiles.artist_name,
                        entry.tracks.cover_url || undefined
                      )}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-gold"
                    onClick={() => navigate(`/spotlight/${entry.campaign_id}`)}
                  >
                    <Vote className="h-3 w-3 mr-1" />
                    Vote Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}