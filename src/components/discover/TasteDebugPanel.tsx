import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TasteProfile {
  genres: Record<string, number>;
  moods: Record<string, number>;
  top_artists: Array<{ artist_id: string; affinity: number }>;
  top_tags: Record<string, number>;
  last_updated: string;
}

interface ArtistInfo {
  id: string;
  artist_name: string;
  avatar_url: string | null;
}

export const TasteDebugPanel = () => {
  const isDev = import.meta.env.DEV;
  const { user } = useAuth();
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [artistInfo, setArtistInfo] = useState<Map<string, ArtistInfo>>(new Map());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isDev) return;
    if (!user || !isOpen) return;
    fetchTasteProfile();
  }, [isDev, user, isOpen]);

  const fetchTasteProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fan_taste_profile')
        .select('*')
        .eq('fan_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profile: TasteProfile = {
          genres: data.genres as Record<string, number>,
          moods: data.moods as Record<string, number>,
          top_artists: data.top_artists as Array<{ artist_id: string; affinity: number }>,
          top_tags: data.top_tags as Record<string, number>,
          last_updated: data.last_updated,
        };
        setTasteProfile(profile);

        // Fetch artist info for top artists
        if (profile.top_artists && profile.top_artists.length > 0) {
          const artistIds = profile.top_artists.slice(0, 5).map(a => a.artist_id);
          const { data: artists } = await supabase
            .from('artist_profiles')
            .select('id, artist_name, avatar_url')
            .in('id', artistIds);

          if (artists) {
            const map = new Map(artists.map(a => [a.id, a]));
            setArtistInfo(map);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching taste profile:', error);
    }
  };

  // Only show in development mode
  if (!isDev) {
    return null;
  }

  const getTopGenres = () => {
    if (!tasteProfile?.genres) return [];
    return Object.entries(tasteProfile.genres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getTopArtists = () => {
    if (!tasteProfile?.top_artists) return [];
    return tasteProfile.top_artists
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 5);
  };

  const getTopTags = () => {
    if (!tasteProfile?.top_tags) return [];
    return Object.entries(tasteProfile.top_tags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  return (
    <div className="fixed bottom-32 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-between gap-2 p-3"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  Taste Engine V1.5 [DEV]
                </span>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 space-y-4 max-w-sm">
              {!tasteProfile ? (
                <p className="text-xs text-muted-foreground">No taste profile found</p>
              ) : (
                <>
                  {/* Top Genres */}
                  <div>
                    <h4 className="text-xs font-semibold text-primary mb-2">Top 5 Genres</h4>
                    <div className="space-y-1">
                      {getTopGenres().map(([genre, score]) => (
                        <div key={genre} className="flex justify-between items-center text-xs">
                          <span className="text-foreground">{genre}</span>
                          <span className="text-muted-foreground font-mono">{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Artists */}
                  <div>
                    <h4 className="text-xs font-semibold text-primary mb-2">Top 5 Artists</h4>
                    <div className="space-y-1">
                      {getTopArtists().map((artist) => {
                        const info = artistInfo.get(artist.artist_id);
                        return (
                          <div key={artist.artist_id} className="flex justify-between items-center text-xs">
                            <span className="text-foreground truncate">
                              {info?.artist_name || artist.artist_id.slice(0, 8)}
                            </span>
                            <span className="text-muted-foreground font-mono">{artist.affinity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Tags */}
                  {getTopTags().length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-primary mb-2">Top 5 Tags</h4>
                      <div className="space-y-1">
                        {getTopTags().map(([tag, score]) => (
                          <div key={tag} className="flex justify-between items-center text-xs">
                            <span className="text-foreground">{tag}</span>
                            <span className="text-muted-foreground font-mono">{score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(tasteProfile.last_updated).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
