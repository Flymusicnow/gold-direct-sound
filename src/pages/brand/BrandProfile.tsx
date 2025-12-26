import { useState, useEffect } from "react";
import { BrandLayout } from "@/components/brand/BrandLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Building2, MapPin, Globe, Users, Briefcase, Settings, Star } from "lucide-react";

interface CollabEntity {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  location: string | null;
  website: string | null;
  mission: string | null;
  brand_values: string | null;
  collab_types: string[] | null;
  style_tags: string[] | null;
  budget_range: string | null;
  is_active: boolean;
  created_at: string;
}

interface MatchedArtist {
  artist_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  total_score: number;
}

interface Opportunity {
  id: string;
  title: string;
  type: string;
  is_active: boolean;
  created_at: string;
  application_count?: number;
}

export default function BrandProfile() {
  const { user } = useAuth();
  const [entity, setEntity] = useState<CollabEntity | null>(null);
  const [matchedArtists, setMatchedArtists] = useState<MatchedArtist[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Get user's collab entity
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) {
        setLoading(false);
        return;
      }

      const { data: entityData } = await supabase
        .from("collab_entities")
        .select("*")
        .eq("id", adminData.collab_entity_id)
        .single();

      if (entityData) {
        setEntity(entityData);

        // Get matched artists using RPC
        const { data: artists } = await supabase.rpc("get_top_artists_for_entity", {
          _collab_entity_id: entityData.id,
          _limit: 6,
        });
        setMatchedArtists(artists || []);

        // Get opportunities
        const { data: opps } = await supabase
          .from("collab_opportunities")
          .select("*")
          .eq("collab_entity_id", entityData.id)
          .order("created_at", { ascending: false });

        // Get application counts for each opportunity
        if (opps) {
          const oppsWithCounts = await Promise.all(
            opps.map(async (opp) => {
              const { count } = await supabase
                .from("collab_applications")
                .select("*", { count: "exact", head: true })
                .eq("opportunity_id", opp.id);
              return { ...opp, application_count: count || 0 };
            })
          );
          setOpportunities(oppsWithCounts);
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BrandLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </BrandLayout>
    );
  }

  if (!entity) {
    return (
      <BrandLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Brand Profile Found</h3>
            <p className="text-muted-foreground mb-4">
              Complete your onboarding to create your brand profile.
            </p>
            <Button asChild>
              <Link to="/brand/onboarding">Complete Onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 rounded-xl">
                <AvatarImage src={entity.logo_url || undefined} />
                <AvatarFallback className="rounded-xl text-2xl bg-primary/10 text-primary">
                  {entity.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{entity.name}</h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {entity.type.replace(/_/g, " ")}
                      </Badge>
                      {entity.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {entity.location}
                        </span>
                      )}
                      {entity.website && (
                        <a
                          href={entity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/brand/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>

                {entity.mission && (
                  <p className="mt-4 text-sm text-muted-foreground">{entity.mission}</p>
                )}

                {entity.style_tags && entity.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entity.style_tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Matched Artists */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Matched Artists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchedArtists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No matched artists yet. Add style preferences to see matches.
                </p>
              ) : (
                <div className="space-y-3">
                  {matchedArtists.map((artist) => (
                    <div
                      key={artist.artist_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={artist.avatar_url || undefined} />
                        <AvatarFallback>{artist.artist_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{artist.artist_name}</p>
                        <p className="text-xs text-muted-foreground">{artist.genre || "No genre"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Star className="h-4 w-4" />
                        {artist.total_score}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/brand/discovery">View All Matches</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Posted Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No opportunities posted yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {opportunities.slice(0, 5).map((opp) => (
                    <div
                      key={opp.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{opp.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {opp.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={opp.is_active ? "default" : "secondary"}>
                          {opp.application_count} apps
                        </Badge>
                        <Badge variant={opp.is_active ? "outline" : "secondary"}>
                          {opp.is_active ? "Active" : "Closed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/brand/opportunities">Manage Opportunities</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Brand Values */}
        {entity.brand_values && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {entity.brand_values}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </BrandLayout>
  );
}
