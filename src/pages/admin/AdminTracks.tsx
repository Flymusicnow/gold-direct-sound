import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { Search, Play, Trash2, Music } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  play_count: number | null;
  created_at: string;
  artist_profiles: {
    artist_name: string;
    avatar_url: string | null;
  } | null;
}

export default function AdminTracks() {
  const { logActivity } = useAdminActivityLog();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select(`
          id,
          title,
          artist_id,
          audio_url,
          cover_url,
          genre,
          play_count,
          created_at,
          artist_profiles (
            artist_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracks((data as unknown as Track[]) || []);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async () => {
    if (!trackToDelete) return;

    try {
      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", trackToDelete.id);

      if (error) throw error;

      await logActivity("track_delete", "track", trackToDelete.id, { title: trackToDelete.title });
      toast.success("Track deleted");
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
      fetchTracks();
    } catch (error) {
      console.error("Error deleting track:", error);
      toast.error("Failed to delete track");
    }
  };

  const filteredTracks = tracks.filter((track) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(searchLower) ||
      track.artist_profiles?.artist_name?.toLowerCase().includes(searchLower) ||
      track.genre?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: tracks.length,
    totalPlays: tracks.reduce((acc, t) => acc + (t.play_count || 0), 0),
  };

  return (
    <AdminLayout title="Track Management" description="View and manage all tracks on the platform">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tracks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Plays</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, artist, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tracks ({filteredTracks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading tracks...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Track</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {track.cover_url ? (
                              <img
                                src={track.cover_url}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Music className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{track.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {track.artist_profiles?.avatar_url ? (
                              <img
                                src={track.artist_profiles.avatar_url}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted" />
                            )}
                            <span className="text-sm">{track.artist_profiles?.artist_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {track.genre ? (
                            <Badge variant="outline">{track.genre}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3 text-muted-foreground" />
                            <span>{(track.play_count || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(track.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setTrackToDelete(track);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive/80"
                            title="Delete Track"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{trackToDelete?.title}" by {trackToDelete?.artist_profiles?.artist_name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrack} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
