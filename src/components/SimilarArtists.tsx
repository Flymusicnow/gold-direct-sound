import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
}

interface SimilarArtistsProps {
  currentArtistId: string;
  currentGenre: string | null;
}

export const SimilarArtists = ({ currentArtistId, currentGenre }: SimilarArtistsProps) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSimilarArtists();
    if (user) {
      checkFollowStatus();
    }
  }, [currentArtistId, currentGenre, user]);

  const fetchSimilarArtists = async () => {
    let query = supabase
      .from("artist_profiles")
      .select("*")
      .eq("status", "approved")
      .neq("id", currentArtistId)
      .limit(5);

    if (currentGenre) {
      query = query.ilike("genre", `%${currentGenre}%`);
    }

    const { data } = await query;
    setArtists(data || []);
  };

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("follows")
      .select("artist_id")
      .eq("fan_id", user.id)
      .in("artist_id", artists.map(a => a.id));

    const followMap: Record<string, boolean> = {};
    data?.forEach((f) => {
      followMap[f.artist_id] = true;
    });
    setFollowing(followMap);
  };

  const handleFollow = async (artistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to follow artists");
      return;
    }

    const isFollowing = following[artistId];

    if (isFollowing) {
      await supabase.from("follows").delete().eq("fan_id", user.id).eq("artist_id", artistId);
      setFollowing({ ...following, [artistId]: false });
    } else {
      await supabase.from("follows").insert({ fan_id: user.id, artist_id: artistId });
      setFollowing({ ...following, [artistId]: true });
      
      // Record activity for artist
      await supabase.from("artist_activities").insert({
        artist_id: artistId,
        type: "new_follower",
        actor_user_id: user.id,
      });
    }
  };

  if (artists.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-primary">Similar Artists</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {artists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => navigate(`/artist/${artist.user_id}`)}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.artist_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl text-primary font-bold">{artist.artist_name[0]}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-foreground">{artist.artist_name}</h3>
                {artist.genre && (
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {artist.genre}
                  </Badge>
                )}
              </div>

              {/* Follow Button */}
              <Button
                size="sm"
                variant={following[artist.id] ? "outline" : "default"}
                onClick={(e) => handleFollow(artist.id, e)}
                className="w-full"
              >
                {following[artist.id] ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
