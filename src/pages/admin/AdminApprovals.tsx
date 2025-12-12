import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { Check, X, User, Building2, Music, MapPin } from "lucide-react";

interface PendingArtist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

interface PendingBrand {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  company_type: string;
  campaign_goals: string | null;
  created_at: string;
}

export default function AdminApprovals() {
  const { logActivity } = useAdminActivityLog();
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [pendingBrands, setPendingBrands] = useState<PendingBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const [artistsRes, brandsRes] = await Promise.all([
        supabase
          .from("artist_profiles")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("brand_applications")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

      setPendingArtists(artistsRes.data || []);
      setPendingBrands(brandsRes.data || []);
    } catch (error) {
      console.error("Error fetching pending items:", error);
      toast.error("Failed to load pending items");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArtist = async (artist: PendingArtist) => {
    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({ status: "approved" })
        .eq("id", artist.id);

      if (error) throw error;

      await logActivity("artist_approve", "artist", artist.id, { artist_name: artist.artist_name });
      toast.success(`${artist.artist_name} approved!`);
      fetchPendingItems();
    } catch (error) {
      console.error("Error approving artist:", error);
      toast.error("Failed to approve artist");
    }
  };

  const handleRejectArtist = async (artist: PendingArtist) => {
    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({ status: "rejected" })
        .eq("id", artist.id);

      if (error) throw error;

      await logActivity("artist_reject", "artist", artist.id, { artist_name: artist.artist_name });
      toast.success(`${artist.artist_name} rejected`);
      fetchPendingItems();
    } catch (error) {
      console.error("Error rejecting artist:", error);
      toast.error("Failed to reject artist");
    }
  };

  const handleApproveBrand = async (brand: PendingBrand) => {
    try {
      const { error } = await supabase
        .from("brand_applications")
        .update({ status: "approved" })
        .eq("id", brand.id);

      if (error) throw error;

      await logActivity("brand_approve", "brand", brand.id, { company_name: brand.company_name });
      toast.success(`${brand.company_name} approved!`);
      fetchPendingItems();
    } catch (error) {
      console.error("Error approving brand:", error);
      toast.error("Failed to approve brand");
    }
  };

  const handleRejectBrand = async (brand: PendingBrand) => {
    try {
      const { error } = await supabase
        .from("brand_applications")
        .update({ status: "rejected" })
        .eq("id", brand.id);

      if (error) throw error;

      await logActivity("brand_reject", "brand", brand.id, { company_name: brand.company_name });
      toast.success(`${brand.company_name} rejected`);
      fetchPendingItems();
    } catch (error) {
      console.error("Error rejecting brand:", error);
      toast.error("Failed to reject brand");
    }
  };

  const totalPending = pendingArtists.length + pendingBrands.length;

  return (
    <AdminLayout
      title="Pending Approvals"
      description={`${totalPending} item${totalPending !== 1 ? "s" : ""} awaiting review`}
    >
      <Tabs defaultValue="artists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="artists" className="gap-2">
            <User className="h-4 w-4" />
            Artists
            {pendingArtists.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingArtists.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-2">
            <Building2 className="h-4 w-4" />
            Brands
            {pendingBrands.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingBrands.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="artists">
          <Card>
            <CardHeader>
              <CardTitle>Pending Artist Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : pendingArtists.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No pending artist applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingArtists.map((artist) => (
                    <div key={artist.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{artist.artist_name}</h3>
                          {artist.bio && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{artist.bio}</p>
                          )}
                          <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                            {artist.genre && (
                              <span className="flex items-center gap-1">
                                <Music className="h-3 w-3" />
                                {artist.genre}
                              </span>
                            )}
                            {artist.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {artist.city}, {artist.country}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied {new Date(artist.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => handleApproveArtist(artist)}>
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleRejectArtist(artist)}>
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle>Pending Brand Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : pendingBrands.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No pending brand applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBrands.map((brand) => (
                    <div key={brand.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{brand.company_name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            Contact: {brand.contact_person} ({brand.email})
                          </p>
                          <Badge variant="outline" className="text-xs">{brand.company_type}</Badge>
                          {brand.campaign_goals && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              Goals: {brand.campaign_goals}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied {new Date(brand.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => handleApproveBrand(brand)}>
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleRejectBrand(brand)}>
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
