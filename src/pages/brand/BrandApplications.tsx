import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BrandLayout } from "@/components/brand/BrandLayout";
import { BrandSidebar } from "@/components/brand/BrandSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Check, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Application {
  id: string;
  artist_id: string;
  opportunity_id: string;
  message: string | null;
  status: string;
  match_score: number | null;
  created_at: string;
  artist_profiles: {
    artist_name: string;
    avatar_url: string | null;
    genre: string | null;
  };
  collab_opportunities: {
    title: string;
  };
}

export default function BrandApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;

    try {
      const { data: adminData } = await supabase
        .from("collab_entity_admins")
        .select("collab_entity_id")
        .eq("user_id", user.id)
        .single();

      if (!adminData) return;

      const { data: opps } = await supabase
        .from("collab_opportunities")
        .select("id")
        .eq("collab_entity_id", adminData.collab_entity_id);

      if (!opps || opps.length === 0) {
        setLoading(false);
        return;
      }

      const oppIds = opps.map((o) => o.id);

      const { data: apps } = await supabase
        .from("collab_applications")
        .select(`
          *,
          artist_profiles!collab_applications_artist_id_fkey(artist_name, avatar_url, genre),
          collab_opportunities!collab_applications_opportunity_id_fkey(title)
        `)
        .in("opportunity_id", oppIds)
        .order("created_at", { ascending: false });

      if (apps) {
        setApplications(apps as unknown as Application[]);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("collab_applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      toast.success(`Application ${status}`);
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "pending") return app.status === "pending";
    if (activeTab === "accepted") return app.status === "accepted";
    if (activeTab === "rejected") return app.status === "rejected";
    return true;
  });

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="flex w-full">
        <BrandSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Applications</h1>
              <p className="text-muted-foreground">
                Review artist applications to your opportunities
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending ({applications.filter((a) => a.status === "pending").length})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  Accepted ({applications.filter((a) => a.status === "accepted").length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({applications.filter((a) => a.status === "rejected").length})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredApplications.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No {activeTab === "all" ? "" : activeTab} applications
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((app) => (
                      <Card key={app.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={app.artist_profiles?.avatar_url || undefined}
                              />
                              <AvatarFallback>
                                {app.artist_profiles?.artist_name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">
                                  {app.artist_profiles?.artist_name}
                                </h3>
                                <Badge
                                  variant={
                                    app.status === "accepted"
                                      ? "default"
                                      : app.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {app.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Applied for: {app.collab_opportunities?.title}
                              </p>
                              {app.artist_profiles?.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {app.artist_profiles.genre}
                                </Badge>
                              )}
                              {app.message && (
                                <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/30 rounded-lg">
                                  "{app.message}"
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2">
                              {app.match_score && (
                                <div className="text-center p-2 bg-primary/10 rounded-lg">
                                  <p className="text-lg font-bold text-primary">
                                    {app.match_score}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">Match</p>
                                </div>
                              )}
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/artist/${app.artist_id}`}>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Profile
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {app.status === "pending" && (
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => updateStatus(app.id, "accepted")}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => updateStatus(app.id, "rejected")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </BrandLayout>
  );
}
