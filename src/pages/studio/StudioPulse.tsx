import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye, BarChart3, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useArtistSpotlightManagement } from "@/hooks/useArtistSpotlight";
import { useSpotlightStats } from "@/hooks/useSpotlightStats";
import { StudioLayout } from "@/components/layouts/StudioLayout";
import { SpotlightMediaList } from "@/components/studio/spotlight/SpotlightMediaList";
import { SpotlightUploadZone } from "@/components/studio/spotlight/SpotlightUploadZone";
import { SpotlightAnalyticsCard } from "@/components/studio/spotlight/SpotlightAnalyticsCard";
import { SpotlightTemplateGallery } from "@/components/studio/spotlight/SpotlightTemplateGallery";
import { DeepLinkGenerator } from "@/components/studio/spotlight/DeepLinkGenerator";

export default function StudioPulse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: artistProfile } = useArtistProfile();
  const { data: spotlightMedia, refetch } = useArtistSpotlightManagement(artistProfile?.id);
  const { data: stats } = useSpotlightStats(artistProfile?.id);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, duration: number) => {
    if (!artistProfile || !user) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('artist-spotlight')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artist-spotlight')
        .getPublicUrl(fileName);

      // Determine media type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      // Get next display order
      const nextOrder = (spotlightMedia?.length || 0) + 1;

      // Insert into database
      const { error: insertError } = await supabase
        .from('artist_spotlight_media')
        .insert({
          artist_id: artistProfile.id,
          media_url: publicUrl,
          media_type: mediaType,
          display_order: nextOrder,
          display_duration_seconds: duration,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success('Spotlight media uploaded!');
      refetch();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string, mediaUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('artist_spotlight_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      // Try to delete from storage (extract path from URL)
      try {
        const urlParts = mediaUrl.split('/artist-spotlight/');
        if (urlParts[1]) {
          await supabase.storage.from('artist-spotlight').remove([urlParts[1]]);
        }
      } catch (storageError) {
        console.warn('Could not delete from storage:', storageError);
      }

      toast.success('Media deleted');
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete media');
    }
  };

  const handleReorder = async (items: { id: string; display_order: number }[]) => {
    try {
      for (const item of items) {
        await supabase
          .from('artist_spotlight_media')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
      }
      refetch();
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder');
    }
  };

  const handleUpdateMedia = async (mediaId: string, updates: {
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
    link_type?: string;
    link_url?: string | null;
    link_platform?: string | null;
    link_label?: string | null;
  }) => {
    try {
      const { error } = await supabase
        .from('artist_spotlight_media')
        .update(updates)
        .eq('id', mediaId);

      if (error) throw error;
      
      toast.success('Media updated');
      refetch();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update');
    }
  };

  return (
    <StudioLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Spotlight / Pulse
            </h1>
            <p className="text-muted-foreground">
              Highlight your current moments - releases, tours, merch
            </p>
          </div>
          {artistProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/artist/${artistProfile.user_id}`)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          )}
        </div>

        <Tabs defaultValue="media" className="w-full">
          <TabsList>
            <TabsTrigger value="media" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="deeplinks" className="gap-2">
              <Link2 className="h-4 w-4" />
              Deep Links
            </TabsTrigger>
          </TabsList>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            {/* Upload Zone */}
            <SpotlightUploadZone 
              onUpload={handleUpload} 
              uploading={uploading}
            />

            {/* Template Gallery Trigger */}
            <SpotlightTemplateGallery />

            {/* Media List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Spotlight Media</CardTitle>
                <CardDescription>
                  Drag to reorder. Set schedules for automatic activation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {spotlightMedia && spotlightMedia.length > 0 ? (
                  <SpotlightMediaList
                    items={spotlightMedia}
                    onDelete={handleDelete}
                    onReorder={handleReorder}
                    onUpdate={handleUpdateMedia}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No spotlight media yet</p>
                    <p className="text-sm">Upload your first promo above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <SpotlightAnalyticsCard stats={stats} />
          </TabsContent>

          {/* Deep Links Tab */}
          <TabsContent value="deeplinks">
            {artistProfile && (
              <DeepLinkGenerator 
                artistId={artistProfile.id}
                artistUserId={artistProfile.user_id}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudioLayout>
  );
}
