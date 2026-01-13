import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ExternalLink, Copy, Pencil, Trash2, Star } from "lucide-react";
import { PresskitEditor } from "@/components/presskit/PresskitEditor";
import { toast } from "sonner";
import { format } from "date-fns";
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

export default function StudioPresskit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPresskit, setEditingPresskit] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch artist profile
  const { data: artistProfile } = useQuery({
    queryKey: ['artist-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch presskits
  const { data: presskits, isLoading } = useQuery({
    queryKey: ['presskits', artistProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_presskits')
        .select('*')
        .eq('artist_id', artistProfile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistProfile?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete media
      await supabase
        .from('artist_presskit_media')
        .delete()
        .eq('presskit_id', id);
      
      // Then delete presskit
      const { error } = await supabase
        .from('artist_presskits')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presskits'] });
      toast.success('Presskit deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete presskit');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First unset all defaults
      await supabase
        .from('artist_presskits')
        .update({ is_default: false })
        .eq('artist_id', artistProfile?.id);
      
      // Then set this one as default
      const { error } = await supabase
        .from('artist_presskits')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presskits'] });
      toast.success('Default presskit updated');
    },
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/epk/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleEdit = (presskit: any) => {
    setEditingPresskit(presskit);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPresskit(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingPresskit(null);
  };

  if (showEditor) {
    return (
      <PresskitEditor
        artistId={artistProfile?.id}
        presskit={editingPresskit}
        onClose={handleEditorClose}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['presskits'] });
          handleEditorClose();
        }}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex pt-16">
      <StudioSidebar />
      
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-4 md:p-8 pb-28 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Press Kits</h1>
              <p className="text-muted-foreground mt-1">
                Create professional EPKs to share with venues, brands, and festivals
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Presskit
            </Button>
          </div>

          {/* Presskits List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : presskits && presskits.length > 0 ? (
            <div className="space-y-4">
              {presskits.map((presskit) => (
                <Card key={presskit.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{presskit.title}</CardTitle>
                          {presskit.is_default && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {presskit.tagline || 'No tagline set'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(presskit.slug)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/epk/${presskit.slug}`, '_blank')}
                          title="Preview"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(presskit)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(presskit.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Created {format(new Date(presskit.created_at), 'MMM d, yyyy')}
                      </span>
                      <span className="text-primary/70">
                        flymusic.se/epk/{presskit.slug}
                      </span>
                      {!presskit.is_default && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-muted-foreground hover:text-primary"
                          onClick={() => setDefaultMutation.mutate(presskit.id)}
                        >
                          Set as default
                        </Button>
                      )}
                    </div>
                    {presskit.brand_tags && presskit.brand_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {presskit.brand_tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Press Kits Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first Electronic Press Kit to share with venues, brands, 
                  and festival promoters.
                </p>
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Presskit
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNavBarStudio />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Presskit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this presskit and all its media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
