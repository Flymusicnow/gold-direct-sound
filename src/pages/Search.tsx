import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, MapPin, Music2, Mic2 } from "lucide-react";
import { toast } from "sonner";
import { TrackCard } from "@/components/TrackCard";
import { AudioPlayer } from "@/components/AudioPlayer";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
}

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  created_at: string;
  artist_profiles: {
    id: string;
    user_id: string;
    artist_name: string;
  };
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ url: string; title: string; artist: string } | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setArtistResults([]);
      setTrackResults([]);
      return;
    }

    try {
      setLoading(true);
      const trimmedQuery = searchQuery.trim();

      // Search artists
      const { data: artists, error: artistError } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("status", "approved")
        .ilike("artist_name", `%${trimmedQuery}%`)
        .limit(20);

      if (artistError) throw artistError;

      // Search tracks
      const { data: tracks, error: trackError } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          description,
          audio_url,
          cover_url,
          created_at,
          artist_profiles!inner (
            id,
            user_id,
            artist_name,
            status
          )
        `)
        .eq("artist_profiles.status", "approved")
        .ilike("title", `%${trimmedQuery}%`)
        .limit(20);

      if (trackError) throw trackError;

      setArtistResults(artists || []);
      setTrackResults(tracks || []);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = (trackId: string, isLiked: boolean) => {
    setLikedTrackIds(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(trackId);
      } else {
        newSet.delete(trackId);
      }
      return newSet;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
            <SearchIcon className="h-10 w-10 text-primary" />
            Search Artists
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by name, genre, or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              maxLength={100}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>

        {/* Results Summary */}
        {query && !loading && (
          <p className="text-muted-foreground mb-6">
            {artistResults.length + trackResults.length} {artistResults.length + trackResults.length === 1 ? "result" : "results"} for "{query}"
          </p>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Searching...</p>
          </div>
        ) : artistResults.length === 0 && trackResults.length === 0 && query ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No results found for "{query}"
            </p>
            <p className="text-sm text-muted-foreground">
              Try searching for a different artist name or track title
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Artists Section */}
            {artistResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Mic2 className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Artists ({artistResults.length})</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {artistResults.map((artist) => (
                    <Card
                      key={artist.id}
                      className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {artist.avatar_url ? (
                            <img
                              src={artist.avatar_url}
                              alt={artist.artist_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                              <span className="text-2xl text-primary font-bold">
                                {artist.artist_name[0]}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {artist.artist_name}
                            </h3>

                            {artist.genre && (
                              <Badge
                                variant="secondary"
                                className="mb-2 text-xs bg-primary/10 text-primary"
                              >
                                {artist.genre}
                              </Badge>
                            )}

                            {(artist.city || artist.country) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {[artist.city, artist.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}

                            {artist.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                {artist.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Tracks Section */}
            {trackResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Music2 className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Tracks ({trackResults.length})</h2>
                </div>
                <div className="space-y-3">
                  {trackResults.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      artistName={track.artist_profiles.artist_name}
                      isLiked={likedTrackIds.has(track.id)}
                      onPlay={() => setCurrentTrack({
                        url: track.audio_url,
                        title: track.title,
                        artist: track.artist_profiles.artist_name
                      })}
                      onLikeChange={(isLiked) => handleLikeChange(track.id, isLiked)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {currentTrack && (
        <AudioPlayer
          audioUrl={currentTrack.url}
          title={currentTrack.title}
          artistName={currentTrack.artist}
        />
      )}
    </div>
  );
}
