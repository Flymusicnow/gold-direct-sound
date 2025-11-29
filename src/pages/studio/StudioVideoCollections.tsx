import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoCollectionCard } from "@/components/video/VideoCollectionCard";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, FolderOpen } from "lucide-react";

interface VideoCollection {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  position: number;
  created_at: string;
  video_count?: number;
}

export default function StudioVideoCollections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [collections, setCollections] = useState<VideoCollection[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
  });

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

      // Fetch collections with video counts
      const { data: collectionsData, error } = await supabase
        .from("video_collections")
        .select(`
          *,
          video_collection_items(count)
        `)
        .eq("artist_id", profile.id)
        .order("position", { ascending: true });

      if (error) throw error;

      const collectionsWithCounts = (collectionsData || []).map(collection => ({
        ...collection,
        video_count: collection.video_collection_items?.[0]?.count || 0,
      }));

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId || !newCollection.name.trim()) return;

    try {
      const { error } = await supabase
        .from("video_collections")
        .insert({
          artist_id: artistId,
          name: newCollection.name.trim(),
          description: newCollection.description.trim() || null,
          position: collections.length,
        });

      if (error) throw error;

      toast({
        title: "Collection created",
        description: "Your video collection has been created",
      });

      setNewCollection({ name: "", description: "" });
      setShowCreateDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "Failed to create collection",
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
    <div className="flex min-h-screen bg-background">
      <StudioSidebar />

      <div className="flex-1 lg:ml-64">
        <MobileStudioNav />

        <main className="container mx-auto px-4 py-8 pt-20 lg:pt-24">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Video Collections</h1>
              <p className="text-muted-foreground">
                Organize your videos into collections
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Collection
            </Button>
          </div>

          {collections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Create collections to organize your videos into categories like "Behind The Scenes", "Live Performances", or "Q&A Sessions"
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Collection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <VideoCollectionCard
                  key={collection.id}
                  collection={collection}
                  artistId={artistId!}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Video Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Collection Name *
              </label>
              <Input
                value={newCollection.name}
                onChange={(e) =>
                  setNewCollection({ ...newCollection, name: e.target.value })
                }
                placeholder="e.g., Behind The Scenes"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <Textarea
                value={newCollection.description}
                onChange={(e) =>
                  setNewCollection({ ...newCollection, description: e.target.value })
                }
                placeholder="Describe what this collection is about..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newCollection.name.trim()}>
                Create Collection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
