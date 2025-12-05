import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { BottomNavBarBrand } from "@/components/mobile/BottomNavBarBrand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Briefcase, Inbox, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface BrandEntity {
  id: string;
  name: string;
  logo_url: string | null;
  type: string;
}

interface MatchedArtist {
  artist_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  total_score: number;
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brandEntity, setBrandEntity] = useState<BrandEntity | null>(null);
  const [matchedArtists, setMatchedArtists] = useState<MatchedArtist[]>([]);
  const [stats, setStats] = useState({
    opportunities: 0,
    applications: 0,
    interests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBrandData();
    }
  }, [user]);

  const loadBrandData = async () => {
    if (!user) return;

    try {
      // Get brand entity for this user
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) {
        navigate("/brand/onboarding");
        return;
      }

      const { data: entity } = await supabase
        .from("collab_entities")
        .select("*")
        .eq("id", adminData.collab_entity_id)
        .single();

      if (entity) {
        setBrandEntity(entity);

        // Get stats
        const [oppsResult, appsResult, interestsResult] = await Promise.all([
          supabase
            .from("collab_opportunities")
            .select("id", { count: "exact" })
            .eq("collab_entity_id", entity.id),
          supabase
            .from("collab_applications")
            .select("id", { count: "exact" })
            .eq("opportunity_id", entity.id),
          supabase
            .from("collab_interest")
            .select("id", { count: "exact" })
            .eq("collab_entity_id", entity.id),
        ]);

        setStats({
          opportunities: oppsResult.count || 0,
          applications: appsResult.count || 0,
          interests: interestsResult.count || 0,
        });

        // Get top matched artists
        const { data: artists } = await supabase.rpc("get_top_artists_for_entity", {
          _collab_entity_id: entity.id,
          _limit: 5,
        });

        if (artists) {
          setMatchedArtists(artists);
        }
      }
    } catch (error) {
      console.error("Error loading brand data:", error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background flex w-full">
      <BrandSidebar />

      <main className="flex-1 p-6 pb-24 md:pb-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {brandEntity?.name || "Brand"}
              </h1>
              <p className="text-muted-foreground">
                Manage your artist partnerships and opportunities
              </p>
            </div>
            <Button asChild className="bg-gradient-gold">
              <Link to="/brand/opportunities">
                <Plus className="h-4 w-4 mr-2" />
                Create Opportunity
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.opportunities}</p>
                    <p className="text-sm text-muted-foreground">Active Opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Inbox className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.applications}</p>
                    <p className="text-sm text-muted-foreground">Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.interests}</p>
                    <p className="text-sm text-muted-foreground">Artist Interests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Matched Artists */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Matched Artists
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/brand/discovery">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {matchedArtists.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Complete your profile to see matched artists
                </p>
              ) : (
                <div className="space-y-4">
                  {matchedArtists.map((artist) => (
                    <div
                      key={artist.artist_id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={artist.avatar_url || undefined} />
                          <AvatarFallback>
                            {artist.artist_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{artist.artist_name}</p>
                          {artist.genre && (
                            <Badge variant="secondary" className="text-xs">
                              {artist.genre}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">
                            {artist.total_score}% match
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/artist/${artist.artist_id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/brand/discovery")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Discover Artists</p>
                    <p className="text-sm text-muted-foreground">
                      Browse artists that match your brand
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/brand/applications")}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Inbox className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Review Applications</p>
                    <p className="text-sm text-muted-foreground">
                      See artists who applied to your opportunities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavBarBrand />
    </div>
  );
}
