import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CrossPromoteSectionProps {
  artistId: string;
}

interface CollaboratorArtist {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  user_id: string;
  collaborationCount: number;
}

export function CrossPromoteSection({ artistId }: CrossPromoteSectionProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborators();
  }, [artistId]);

  const fetchCollaborators = async () => {
    try {
      // Get all tracks by this artist
      const { data: artistTracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", artistId);

      if (!artistTracks || artistTracks.length === 0) {
        setLoading(false);
        return;
      }

      const trackIds = artistTracks.map((t) => t.id);

      // Get all accepted collaborations on these tracks
      const { data: collaborations } = await supabase
        .from("track_collaborators")
        .select("collaborator_artist_id")
        .in("track_id", trackIds)
        .eq("status", "accepted");

      if (!collaborations || collaborations.length === 0) {
        setLoading(false);
        return;
      }

      // Count collaborations per artist
      const collabCounts = new Map<string, number>();
      collaborations.forEach((c) => {
        const count = collabCounts.get(c.collaborator_artist_id) || 0;
        collabCounts.set(c.collaborator_artist_id, count + 1);
      });

      const uniqueCollaboratorIds = Array.from(collabCounts.keys());

      // Fetch artist profiles
      const { data: artistProfiles } = await supabase
        .from("artist_profiles")
        .select("id, artist_name, avatar_url, user_id")
        .in("id", uniqueCollaboratorIds);

      if (artistProfiles) {
        const collaboratorsWithCount = artistProfiles.map((profile) => ({
          ...profile,
          collaborationCount: collabCounts.get(profile.id) || 0,
        }));

        // Sort by collaboration count
        collaboratorsWithCount.sort(
          (a, b) => b.collaborationCount - a.collaborationCount
        );

        setCollaborators(collaboratorsWithCount.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || collaborators.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Also Collaborated With</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {collaborators.map((artist) => (
          <Link key={artist.id} to={`/artist/${artist.user_id}`}>
            <Card className="group hover:border-primary/50 hover:bg-card/80 transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.artist_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-medium text-primary">
                        {artist.artist_name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {artist.artist_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {artist.collaborationCount} track
                      {artist.collaborationCount !== 1 ? "s" : ""} together
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
