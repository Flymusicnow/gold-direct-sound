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
import { useNavigate } from "react-router-dom";

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
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case "pending":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
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

  return (
    <AdminLayout title="Artist Management" description="View and manage all artists on the platform">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Artists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
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
                  placeholder="Search by name, genre, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Artists Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Artists ({filteredArtists.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading artists...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artist</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
