import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, Users, Music, Star, Activity } from "lucide-react";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { useLanguage } from "@/contexts/LanguageContext";

interface PendingArtist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logActivity } = useAdminActivityLog();
  const hasLoggedPageView = useRef(false);
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    pendingApprovals: 0,
    totalTracks: 0,
  });

  useEffect(() => {
    fetchData();
    // Log page view only once per mount
    if (!hasLoggedPageView.current) {
      hasLoggedPageView.current = true;
      logActivity("page_view", "admin_dashboard", undefined, { page: "dashboard" });
    }
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchPendingArtists(), fetchStats()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [profilesRes, artistsRes, tracksRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("artist_profiles").select("id", { count: "exact", head: true }),
        supabase.from("tracks").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalArtists: artistsRes.count || 0,
        pendingApprovals: pendingArtists.length,
        totalTracks: tracksRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPendingArtists = async () => {
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending artists:", error);
    } else {
      setPendingArtists(data || []);
    }
  };

  const handleApprove = async (artistId: string) => {
    const { error } = await supabase
      .from("artist_profiles")
      .update({ status: "approved" })
      .eq("id", artistId);

    if (error) {
      toast.error(t('admin.errorApprovingArtist'));
      console.error(error);
    } else {
      toast.success(t('admin.artistApproved'));
      fetchPendingArtists();
    }
  };

  const handleReject = async (artistId: string) => {
    const { error } = await supabase
      .from("artist_profiles")
      .update({ status: "rejected" })
      .eq("id", artistId);

    if (error) {
      toast.error(t('admin.errorRejectingArtist'));
      console.error(error);
    } else {
      toast.success(t('admin.artistRejected'));
      fetchPendingArtists();
    }
  };

  return (
    <AdminLayout title={t('admin.dashboard')} description={t('admin.platformOverview')}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/users")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">{t('admin.totalUsers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/artists")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalArtists}</p>
                <p className="text-sm text-muted-foreground">{t('admin.artists')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/tracks")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTracks}</p>
                <p className="text-sm text-muted-foreground">{t('admin.tracks')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/approvals")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingArtists.length}</p>
                <p className="text-sm text-muted-foreground">{t('admin.pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.pendingArtistApprovals')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : pendingArtists.length === 0 ? (
            <p className="text-muted-foreground">{t('admin.noPendingApprovals')}</p>
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
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {artist.genre && <span>{t('admin.genre')}: {artist.genre}</span>}
                        {artist.city && <span>{t('admin.location')}: {artist.city}, {artist.country}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(artist.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {t('actions.approve')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(artist.id)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        {t('actions.reject')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
