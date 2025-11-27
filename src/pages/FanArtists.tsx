import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
}

export default function FanArtists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFollowedArtists();
  }, [user, navigate]);

  useEffect(() => {
    const filtered = artists.filter(artist =>
      artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.genre?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredArtists(filtered);
  }, [searchQuery, artists]);

  const fetchFollowedArtists = async () => {
    if (!user) return;

    const { data: follows } = await supabase
      .from('follows')
      .select(`
        artist_id,
        artist_profiles (
          id,
          user_id,
          artist_name,
          avatar_url,
          genre,
          city,
          country
        )
      `)
      .eq('fan_id', user.id);

    if (follows) {
      const artistsList = follows.map((f: any) => f.artist_profiles).filter(Boolean);
      setArtists(artistsList);
      setFilteredArtists(artistsList);
    }
    setLoading(false);
  };

  const handleUnfollow = async (artistId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('fan_id', user.id)
      .eq('artist_id', artistId);

    if (error) {
      toast.error("Failed to unfollow");
    } else {
      toast.success("Unfollowed successfully");
      setArtists(prev => prev.filter(a => a.id !== artistId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/fan')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Artists</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredArtists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No artists found matching your search" : "You're not following any artists yet"}
            </p>
            <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
              Discover Artists
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <Card key={artist.id} className="p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center space-y-4">
                  {artist.avatar_url ? (
                    <img
                      src={artist.avatar_url}
                      alt={artist.artist_name}
                      className="w-24 h-24 rounded-full object-cover cursor-pointer"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                    >
                      <span className="text-3xl text-primary font-bold">
                        {artist.artist_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3
                      className="font-semibold text-lg cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                    >
                      {artist.artist_name}
                    </h3>
                    {artist.genre && (
                      <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {artist.genre}
                      </span>
                    )}
                    {(artist.city || artist.country) && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {[artist.city, artist.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(artist.id)}
                    className="gap-2 w-full"
                  >
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
