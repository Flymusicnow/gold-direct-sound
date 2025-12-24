import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { Search, Eye, Check, X, Music, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
  created_at: string;
  avatar_url: string | null;
}

export default function AdminArtists() {
  const navigate = useNavigate();
  const { logActivity } = useAdminActivityLog();
  const { t } = useLanguage();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (artist: Artist) => {
    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({ status: "approved" })
        .eq("id", artist.id);

      if (error) throw error;

      await logActivity("artist_approve", "artist", artist.id, { artist_name: artist.artist_name });
      toast.success(`${artist.artist_name} approved!`);
      fetchArtists();
    } catch (error) {
      console.error("Error approving artist:", error);
      toast.error("Failed to approve artist");
    }
  };

  const handleReject = async (artist: Artist) => {
    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({ status: "rejected" })
        .eq("id", artist.id);

      if (error) throw error;

      await logActivity("artist_reject", "artist", artist.id, { artist_name: artist.artist_name });
      toast.success(`${artist.artist_name} rejected`);
      fetchArtists();
    } catch (error) {
      console.error("Error rejecting artist:", error);
      toast.error("Failed to reject artist");
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch =
      artist.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || artist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t('admin.approved')}</Badge>;
      case "pending":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">{t('admin.pending')}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t('admin.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: artists.length,
    approved: artists.filter((a) => a.status === "approved").length,
    pending: artists.filter((a) => a.status === "pending").length,
    rejected: artists.filter((a) => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <AdminLayout title={t('admin.artistManagement')} description={t('admin.artistManagementDescription')}>
        <div className="space-y-6">
          {/* Stats skeleton - 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Filters skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-full md:w-[180px]" />
              </div>
            </CardContent>
          </Card>
          {/* Table skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                    {/* Avatar + name/bio */}
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    {/* Genre */}
                    <Skeleton className="h-5 w-16 rounded-full" />
                    {/* Location */}
                    <Skeleton className="h-4 w-24" />
                    {/* Status */}
                    <Skeleton className="h-5 w-20 rounded-full" />
                    {/* Date */}
                    <Skeleton className="h-4 w-20" />
                    {/* Actions */}
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('admin.artistManagement')} description={t('admin.artistManagementDescription')}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t('admin.totalArtists')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">{t('admin.approved')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{t('admin.pending')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">{t('admin.rejected')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder={t('admin.searchArtists')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('admin.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
                  <SelectItem value="approved">{t('admin.approved')}</SelectItem>
                  <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                  <SelectItem value="rejected">{t('admin.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Artists Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.allArtists')} ({filteredArtists.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.artist')}</TableHead>
                      <TableHead>{t('admin.genre')}</TableHead>
                      <TableHead>{t('admin.location')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.joined')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArtists.map((artist) => (
                      <TableRow key={artist.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {artist.avatar_url ? (
                              <img
                                src={artist.avatar_url}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Music className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{artist.artist_name}</p>
                              {artist.bio && (
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                  {artist.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {artist.genre ? (
                            <Badge variant="outline">{artist.genre}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {artist.city ? (
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {artist.city}, {artist.country}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(artist.status || "pending")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(artist.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/users/${artist.user_id}`)}
                              title="View User"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {artist.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(artist)}
                                  title="Approve"
                                  className="text-green-500 hover:text-green-600"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(artist)}
                                  title="Reject"
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
