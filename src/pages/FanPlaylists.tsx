import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus, ListMusic, Loader2 } from "lucide-react";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import CreatePlaylistDialog from "@/components/playlists/CreatePlaylistDialog";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { PageTransition } from "@/components/ui/PageTransition";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  track_count: number;
  cover_url?: string | null;
}

export default function FanPlaylists() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlaylists();
  }, [user, navigate]);

  const fetchPlaylists = async () => {
    if (!user) return;

    try {
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select("id, name, description, is_public, created_at, cover_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get track count for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist: any) => {
          const { count } = await supabase
            .from("playlist_tracks")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          return {
            ...playlist,
            track_count: count || 0,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error(t('toast.failedToLoadPlaylists'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <PageBreadcrumb role="fan" />

            {loading ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
            <PageTransition>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ListMusic className="h-10 w-10 text-primary" />
                  <h1 className="text-4xl font-bold">{t('playlist.myStacks')}</h1>
                  <InfoTooltip
                    title={t('playlist.whatAreStacks')}
                    description={t('playlist.stacksDescription')}
                    forRole="fan"
                    learnLink="/learn?tab=fan#stacks"
                  />
                </div>
                <p className="text-muted-foreground">
                  {t('playlist.organizeYourFavorites')}
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('playlist.createPlaylist')}
              </Button>
            </div>

            {/* Playlists Grid */}
            {playlists.length === 0 ? (
              <div className="text-center py-16">
                <ListMusic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('playlist.noPlaylistsYet')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('playlist.createFirstPlaylist')}
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('playlist.createYourFirstPlaylist')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    id={playlist.id}
                    name={playlist.name}
                    description={playlist.description}
                    isPublic={playlist.is_public}
                    trackCount={playlist.track_count}
                    coverUrl={playlist.cover_url}
                  />
                ))}
              </div>
            )}

            <CreatePlaylistDialog
              isOpen={createDialogOpen}
              onClose={() => setCreateDialogOpen(false)}
              onSuccess={fetchPlaylists}
            />
            </PageTransition>
            )}
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
