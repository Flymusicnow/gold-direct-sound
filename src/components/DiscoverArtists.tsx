import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
}

interface DiscoverArtistsProps {
  followedGenres: string[];
  followedArtistIds: string[];
  limit?: number;
}

export function DiscoverArtists({ followedGenres, followedArtistIds, limit = 6 }: DiscoverArtistsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedArtists();
  }, [followedGenres, followedArtistIds]);

  const fetchRecommendedArtists = async () => {
    try {
      let query = supabase
        .from('artist_profiles')
        .select('*')
        .eq('status', 'approved')
        .limit(limit);

      // Filter out already followed artists
      if (followedArtistIds.length > 0) {
        query = query.not('id', 'in', `(${followedArtistIds.join(',')})`);
      }

      // If user follows artists with genres, prioritize similar genres
      if (followedGenres.length > 0) {
        query = query.in('genre', followedGenres);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching recommended artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (artistId: string) => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    try {
      if (following[artistId]) {
        await supabase
          .from('follows')
          .delete()
          .eq('fan_id', user.id)
          .eq('artist_id', artistId);
        setFollowing({ ...following, [artistId]: false });
        toast.success("Unfollowed");
      } else {
        await supabase
          .from('follows')
          .insert({ fan_id: user.id, artist_id: artistId });
        setFollowing({ ...following, [artistId]: true });
        toast.success("Following!");
      }
    } catch (error) {
      console.error('Error updating follow:', error);
      toast.error("Failed to update follow status");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading recommendations...</p>;
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No recommendations available yet</p>
        <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
          Explore All Artists
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {artists.map((artist) => (
        <Card
          key={artist.id}
          className="p-4 hover:border-primary/50 transition-all cursor-pointer"
          onClick={() => navigate(`/artist/${artist.user_id}`)}
        >
          <div className="flex flex-col items-center text-center gap-3">
            {artist.avatar_url ? (
              <img
                src={artist.avatar_url}
                alt={artist.artist_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl text-primary font-bold">
                  {artist.artist_name[0]}
                </span>
              </div>
            )}
            
            <div className="flex-1 w-full">
              <h3 className="font-semibold truncate">{artist.artist_name}</h3>
              {artist.genre && (
                <Badge variant="outline" className="text-xs mt-2 border-primary/30">
                  {artist.genre}
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              variant={following[artist.id] ? "outline" : "default"}
              className={!following[artist.id] ? "bg-gradient-gold w-full" : "w-full"}
              onClick={(e) => {
                e.stopPropagation();
                handleFollow(artist.id);
              }}
            >
              {following[artist.id] ? "Following" : "Follow"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
