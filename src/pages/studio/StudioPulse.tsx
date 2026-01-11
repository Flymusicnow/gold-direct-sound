import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye, BarChart3, Link2, Clock, FlaskConical, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/ScrollableTabs";
import { AnimatedTabTrigger } from "@/components/ui/AnimatedTabTrigger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useArtistSpotlightManagement } from "@/hooks/useArtistSpotlight";
import { useSpotlightStats } from "@/hooks/useSpotlightStats";
import { useScheduledSpotlights } from "@/hooks/useScheduledSpotlights";
import { useABTests } from "@/hooks/useABTests";
import { StudioLayout } from "@/components/layouts/StudioLayout";
import { SpotlightMediaList } from "@/components/studio/spotlight/SpotlightMediaList";
import { SpotlightUploadZone } from "@/components/studio/spotlight/SpotlightUploadZone";
import { SpotlightAnalyticsCard } from "@/components/studio/spotlight/SpotlightAnalyticsCard";
import { SpotlightTemplateGallery } from "@/components/studio/spotlight/SpotlightTemplateGallery";
import { DeepLinkGenerator } from "@/components/studio/spotlight/DeepLinkGenerator";
import { TemplateAnalyticsCard } from "@/components/studio/spotlight/TemplateAnalyticsCard";
import { ABTestCreator } from "@/components/studio/spotlight/ABTestCreator";
import { ABTestResults } from "@/components/studio/spotlight/ABTestResults";
import { ScheduledSpotlightsList } from "@/components/studio/spotlight/ScheduledSpotlightsList";

export default function StudioPulse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: artistProfile } = useArtistProfile();
  const { data: spotlightMedia, refetch } = useArtistSpotlightManagement(artistProfile?.id);
  const { data: stats } = useSpotlightStats(artistProfile?.id);
  const { data: scheduledSpotlights } = useScheduledSpotlights(artistProfile?.id);
  const { data: abTests } = useABTests(artistProfile?.id);
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

  const activeTests = abTests?.filter(t => t.status === 'active') || [];
  const completedTests = abTests?.filter(t => t.status === 'completed') || [];

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
          <ScrollableTabsList sticky={false}>
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0">
              <AnimatedTabTrigger value="media" icon={<Sparkles className="w-4 h-4" />} layoutId="studioPulseTabs">
                Media
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="scheduled" icon={<Clock className="w-4 h-4" />} layoutId="studioPulseTabs">
                Scheduled
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="abtests" icon={<FlaskConical className="w-4 h-4" />} layoutId="studioPulseTabs">
                A/B Tests
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="analytics" icon={<BarChart3 className="w-4 h-4" />} layoutId="studioPulseTabs">
                Analytics
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="deeplinks" icon={<Link2 className="w-4 h-4" />} layoutId="studioPulseTabs">
                Deep Links
              </AnimatedTabTrigger>
            </TabsList>
          </ScrollableTabsList>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            {/* Upload Zone */}
            <SpotlightUploadZone 
              onUpload={handleUpload} 
              uploading={uploading}
            />

            {/* Template Gallery Trigger */}
            <SpotlightTemplateGallery 
              artistId={artistProfile?.id}
              onPublish={refetch}
            />

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

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scheduled Spotlights
                </CardTitle>
                <CardDescription>
                  Upcoming spotlights that will publish automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduledSpotlightsList 
                  spotlights={scheduledSpotlights || []}
                  onUpdate={refetch}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* A/B Tests Tab */}
          <TabsContent value="abtests" className="space-y-6">
            {artistProfile && spotlightMedia && (
              <ABTestCreator 
                artistId={artistProfile.id}
                spotlightMedia={spotlightMedia}
              />
            )}

            {activeTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeTests.map(test => (
                    <ABTestResults 
                      key={test.id} 
                      test={test}
                      artistId={artistProfile?.id || ''}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {completedTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedTests.map(test => (
                    <ABTestResults 
                      key={test.id} 
                      test={test}
                      artistId={artistProfile?.id || ''}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {(!abTests || abTests.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No A/B tests yet</p>
                <p className="text-sm">Create a test to compare different spotlight versions</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <SpotlightAnalyticsCard stats={stats} />
            
            {artistProfile && (
              <TemplateAnalyticsCard artistId={artistProfile.id} />
            )}
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
