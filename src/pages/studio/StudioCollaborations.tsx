import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Users, Music } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Collaboration {
  id: string;
  track_id: string;
  role: string;
  status: string;
  invited_at: string;
  tracks?: {
    title: string;
    cover_url: string | null;
  };
  artist_profiles?: {
    artist_name: string;
    avatar_url: string | null;
  };
  collaborator_profiles?: {
    artist_name: string;
    avatar_url: string | null;
  };
}

export default function StudioCollaborations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<Collaboration[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<Collaboration[]>([]);
  const [myCollaborations, setMyCollaborations] = useState<Collaboration[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      fetchData();
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        navigate("/role-selection");
        return;
      }

      setArtistId(profile.id);

      // Fetch incoming invites (where I'm the collaborator)
      const { data: incomingRaw } = await supabase
        .from("track_collaborators")
        .select("*")
        .eq("collaborator_artist_id", profile.id)
        .eq("status", "pending")
        .order("invited_at", { ascending: false });

      // Fetch related track and artist data for incoming invites
      if (incomingRaw && incomingRaw.length > 0) {
        const trackIds = incomingRaw.map(i => i.track_id);
        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, title, cover_url, artist_id")
          .in("id", trackIds);

        const artistIds = tracks?.map(t => t.artist_id) || [];
        const { data: artistProfiles } = await supabase
          .from("artist_profiles")
          .select("id, artist_name, avatar_url")
          .in("id", artistIds);

        const trackMap = new Map(tracks?.map(t => [t.id, t]) || []);
        const artistMap = new Map(artistProfiles?.map(p => [p.id, p]) || []);

        const incomingWithData = incomingRaw.map(invite => {
          const track = trackMap.get(invite.track_id);
          return {
            ...invite,
            tracks: track,
            artist_profiles: track ? artistMap.get(track.artist_id) : undefined,
          };
        });

        setIncomingInvites(incomingWithData);
      } else {
        setIncomingInvites([]);
      }

      // Fetch outgoing invites (where I'm the track owner)
      const { data: myTracks } = await supabase
        .from("tracks")
        .select("id")
        .eq("artist_id", profile.id);

      const trackIds = myTracks?.map(t => t.id) || [];

      if (trackIds.length > 0) {
        const { data: outgoing } = await supabase
          .from("track_collaborators")
          .select("*")
          .in("track_id", trackIds)
          .order("invited_at", { ascending: false });

        // Fetch related data separately
        if (outgoing && outgoing.length > 0) {
          const collabIds = outgoing.map(c => c.collaborator_artist_id);
          const { data: collabProfiles } = await supabase
            .from("artist_profiles")
            .select("id, artist_name, avatar_url")
            .in("id", collabIds);

          const { data: tracks } = await supabase
            .from("tracks")
            .select("id, title, cover_url")
            .in("id", trackIds);

          const profileMap = new Map(collabProfiles?.map(p => [p.id, p]) || []);
          const trackMap = new Map(tracks?.map(t => [t.id, t]) || []);

          const outgoingWithData = outgoing.map(collab => ({
            ...collab,
            collaborator_profiles: profileMap.get(collab.collaborator_artist_id),
            tracks: trackMap.get(collab.track_id),
          }));

          setOutgoingInvites(outgoingWithData);
        }
      }

      // Fetch accepted collaborations
      const { data: accepted } = await supabase
        .from("track_collaborators")
        .select("*")
        .eq("collaborator_artist_id", profile.id)
        .eq("status", "accepted")
        .order("invited_at", { ascending: false });

      if (accepted && accepted.length > 0) {
        const acceptedTrackIds = accepted.map(c => c.track_id);
        const { data: tracks } = await supabase
          .from("tracks")
          .select("id, title, cover_url, artist_id")
          .in("id", acceptedTrackIds);

        const artistIds = tracks?.map(t => t.artist_id) || [];
        const { data: artistProfiles } = await supabase
          .from("artist_profiles")
          .select("id, artist_name, avatar_url")
          .in("id", artistIds);

        const trackMap = new Map(tracks?.map(t => [t.id, t]) || []);
        const artistMap = new Map(artistProfiles?.map(p => [p.id, p]) || []);

        const acceptedWithData = accepted.map(collab => {
          const track = trackMap.get(collab.track_id);
          return {
            ...collab,
            tracks: track,
            artist_profiles: track ? artistMap.get(track.artist_id) : undefined,
          };
        });

        setMyCollaborations(acceptedWithData);
      } else {
        setMyCollaborations([]);
      }
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      toast({
        title: "Error",
        description: "Failed to load collaborations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (collaborationId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from("track_collaborators")
        .update({
          status: accept ? "accepted" : "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", collaborationId);

      if (error) throw error;

      toast({
        title: accept ? "Collaboration accepted!" : "Invitation declined",
        description: accept
          ? "You're now a collaborator on this track"
          : "The invitation has been declined",
      });

      fetchData();
    } catch (error) {
      console.error("Error responding to collaboration:", error);
      toast({
        title: "Error",
        description: "Failed to respond to invitation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen overflow-hidden flex bg-background pt-16">
        <StudioSidebar />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide">
          <MobileStudioNav />

          <main className="container mx-auto px-4 py-8 pt-20 lg:pt-24 pb-20 md:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Collaborations</h1>
            <p className="text-muted-foreground">
              Manage your track collaborations and invitations
            </p>
          </div>

          <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="incoming">
                Incoming
                {incomingInvites.length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {incomingInvites.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="outgoing">Sent</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>

            {/* Incoming Invites */}
            <TabsContent value="incoming" className="mt-6">
              {incomingInvites.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No pending invitations</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      When artists invite you to collaborate, they'll appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {incomingInvites.map((invite) => (
                    <Card key={invite.id} className="bg-card/50 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {invite.tracks?.cover_url ? (
                              <img
                                src={invite.tracks.cover_url}
                                alt={invite.tracks.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">
                              {invite.tracks?.title || "Unknown Track"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Invited by {invite.artist_profiles?.artist_name || "Unknown Artist"}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline">{invite.role}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(invite.invited_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleResponse(invite.id, true)}
                                className="gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResponse(invite.id, false)}
                                className="gap-2"
                              >
                                <X className="w-4 h-4" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Outgoing Invites */}
            <TabsContent value="outgoing" className="mt-6">
              {outgoingInvites.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No sent invitations</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Invite artists to collaborate on your tracks from the Tracks page
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {outgoingInvites.map((invite) => (
                    <Card key={invite.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {invite.tracks?.cover_url ? (
                                <img
                                  src={invite.tracks.cover_url}
                                  alt={invite.tracks.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="font-semibold mb-1">
                                {invite.tracks?.title || "Unknown Track"}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                Invited {invite.collaborator_profiles?.artist_name || "Unknown"}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{invite.role}</Badge>
                                <Badge
                                  className={
                                    invite.status === "accepted"
                                      ? "bg-green-500/20 text-green-400"
                                      : invite.status === "rejected"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                  }
                                >
                                  {invite.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Active Collaborations */}
            <TabsContent value="active" className="mt-6">
              {myCollaborations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No active collaborations</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Your accepted collaborations will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myCollaborations.map((collab) => (
                    <Card key={collab.id} className="bg-card/50 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {collab.tracks?.cover_url ? (
                              <img
                                src={collab.tracks.cover_url}
                                alt={collab.tracks.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              {collab.tracks?.title || "Unknown Track"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              with {collab.artist_profiles?.artist_name || "Unknown Artist"}
                            </p>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {collab.role}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
