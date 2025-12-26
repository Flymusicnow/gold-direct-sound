import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandLayout } from "@/components/brand/BrandLayout";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Heart, ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface MatchedArtist {
  artist_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  total_score: number;
  genre_score: number;
  location_score: number;
  xp_score: number;
  supporters_score: number;
}

export default function BrandDiscovery() {
  const { user } = useAuth();
  const [artists, setArtists] = useState<MatchedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityId, setEntityId] = useState<string | null>(null);
  const [interestedArtists, setInterestedArtists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Get brand entity ID
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) return;

      setEntityId(adminData.collab_entity_id);

      // Get matched artists
      const { data: matchedArtists } = await supabase.rpc("get_top_artists_for_entity", {
        _collab_entity_id: adminData.collab_entity_id,
        _limit: 50,
      });

      if (matchedArtists) {
        setArtists(matchedArtists);
      }

      // Get existing interests
      const { data: interests } = await supabase
        .from("collab_interest")
        .select("artist_id")
        .eq("collab_entity_id", adminData.collab_entity_id);

      if (interests) {
        setInterestedArtists(new Set(interests.map((i) => i.artist_id)));
      }
    } catch (error) {
      console.error("Error loading artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async (artistId: string) => {
    if (!entityId) return;

    try {
      if (interestedArtists.has(artistId)) {
        // Remove interest
        await supabase
          .from("collab_interest")
          .delete()
          .eq("collab_entity_id", entityId)
          .eq("artist_id", artistId);

        setInterestedArtists((prev) => {
          const next = new Set(prev);
          next.delete(artistId);
          return next;
        });
        toast.success("Interest removed");
      } else {
        // Add interest
        await supabase.from("collab_interest").insert({
          collab_entity_id: entityId,
          artist_id: artistId,
          source: "discovery",
        });

        setInterestedArtists((prev) => new Set([...prev, artistId]));
        toast.success("Interest expressed!");
      }
    } catch (error) {
      console.error("Error toggling interest:", error);
      toast.error("Failed to update interest");
    }
  };

  const filteredArtists = artists.filter((artist) =>
    artist.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <BrandLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <p className="text-muted-foreground">Loading artists...</p>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="flex w-full">
        <BrandSidebar />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Discover Artists</h1>
              <p className="text-muted-foreground">
                Find artists that match your brand identity
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artists by name or genre..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Artists Grid */}
            {filteredArtists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No artists found matching your criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArtists.map((artist) => (
                  <Card key={artist.artist_id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={artist.avatar_url || undefined} />
                          <AvatarFallback className="text-lg">
                            {artist.artist_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{artist.artist_name}</h3>
                          {artist.genre && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {artist.genre}
                            </Badge>
                          )}
                          {(artist.city || artist.country) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {[artist.city, artist.country].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Match Score</span>
                          <span className="text-lg font-bold text-primary">
                            {artist.total_score}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                            style={{ width: `${artist.total_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant={interestedArtists.has(artist.artist_id) ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleExpressInterest(artist.artist_id)}
                        >
                          <Heart
                            className={`h-4 w-4 mr-1 ${
                              interestedArtists.has(artist.artist_id) ? "fill-current" : ""
                            }`}
                          />
                          {interestedArtists.has(artist.artist_id) ? "Interested" : "Express Interest"}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/artist/${artist.artist_id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </BrandLayout>
  );
}
