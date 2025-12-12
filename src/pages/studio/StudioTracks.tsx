import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFileName } from "@/lib/utils";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { EmptyStateCard } from "@/components/artist/EmptyStateCard";
import { toast } from "sonner";
import { Upload, Music, Trash2, UserPlus, Lock, Crown, FolderUp } from "lucide-react";
import { MultiUploadDialog } from "@/components/artist/MultiUploadDialog";
import { LockedFeatureModal } from "@/components/artist/LockedFeatureModal";
import { useAchievements } from "@/hooks/useAchievements";
import { CollaboratorSelector } from "@/components/artist/CollaboratorSelector";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupporterExclusiveBadge } from "@/components/supporter/SupporterExclusiveBadge";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  is_supporter_only: boolean;
  required_tier: string | null;
}

export default function StudioTracks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSupporterOnly, setIsSupporterOnly] = useState(false);
  const [requiredTier, setRequiredTier] = useState<string>("basic");
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showMultiUpload, setShowMultiUpload] = useState(false);
  const { checkAndUnlockAchievements } = useAchievements();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.status !== 'approved') {
      navigate('/studio/profile');
      return;
    }

    setArtistProfile(profile);

    const { data: tracksData } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', profile.id)
      .order('created_at', { ascending: false });

    if (tracksData) setTracks(tracksData);
    setLoading(false);
  };

  const handleTrackUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !artistProfile) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    // Check upload limit (5 tracks for free tier)
    if (tracks.length >= 5) {
      setShowLockedModal(true);
      return;
    }

    setUploading(true);

    try {
      let coverUrl = null;
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}_${sanitizeFileName(coverFile.name)}`;
        const { error: coverError } = await supabase.storage
          .from('covers')
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(coverPath);

        coverUrl = publicUrl;
      }

      const audioPath = `${user.id}/${Date.now()}_${sanitizeFileName(audioFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(audioPath, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(audioPath);

      const { error: insertError } = await supabase.from('tracks').insert({
        artist_id: artistProfile.id,
        title: trackTitle,
        description: trackDescription || null,
        audio_url: publicUrl,
        cover_url: coverUrl,
        is_supporter_only: isSupporterOnly,
        required_tier: isSupporterOnly ? requiredTier : null,
      });

      if (insertError) throw insertError;

      toast.success("Track uploaded successfully!");
      setTrackTitle("");
      setTrackDescription("");
      setCoverFile(null);
      setIsSupporterOnly(false);
      setRequiredTier("basic");
      form.reset();
      
      // Update onboarding progress
      await supabase
        .from("artist_onboarding_progress")
        .update({ has_uploaded_track: true })
        .eq("user_id", user.id);
      
      // Check achievements
      await checkAndUnlockAchievements();
      
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error uploading track");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    const { error } = await supabase.from('tracks').delete().eq('id', trackId);

    if (error) {
      toast.error("Error deleting track");
    } else {
      toast.success("Track deleted");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen pt-16">
        <StudioSidebar />
        <MobileStudioNav />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Manage Tracks</h1>
              <p className="text-sm text-muted-foreground">Upload and manage your music releases</p>
            </div>
          </div>

          {/* Upload Options */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowMultiUpload(true)}
              className="flex-1 gap-2 h-auto py-4"
              variant="outline"
            >
              <FolderUp className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Upload Multiple Songs</p>
                <p className="text-xs text-muted-foreground">Batch upload with bulk metadata</p>
              </div>
            </Button>
          </div>

          {/* Single Upload Track */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Single Track</h2>
            <form onSubmit={handleTrackUpload} className="space-y-4">
              <div>
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={trackDescription}
                  onChange={(e) => setTrackDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="cover">Cover Image (optional)</Label>
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="audio">Audio File *</Label>
                <Input
                  id="audio"
                  name="audio"
                  type="file"
                  accept="audio/*"
                  required
                />
              </div>
              
              {/* Supporter Exclusive Settings */}
              <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="supporter-only" className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      Supporter Exclusive
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Restrict this track to supporters only
                    </p>
                  </div>
                  <Switch
                    id="supporter-only"
                    checked={isSupporterOnly}
                    onCheckedChange={setIsSupporterOnly}
                  />
                </div>
                
                {isSupporterOnly && (
                  <div>
                    <Label htmlFor="required-tier">Required Tier</Label>
                    <Select value={requiredTier} onValueChange={setRequiredTier}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Supporter (49 kr/mo)</SelectItem>
                        <SelectItem value="gold">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-primary" />
                            Gold Supporter (99 kr/mo)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Button type="submit" disabled={uploading} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Track"}
              </Button>
            </form>
          </Card>

          {/* Track List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
            {tracks.length === 0 ? (
              <div className="py-8">
                <EmptyStateCard
                  icon={Music}
                  title="No tracks yet"
                  description="Upload your first song and start building your music catalog."
                  ctaText="Upload your first track above"
                  onCtaClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  variant="gold"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{track.title}</p>
                        {track.is_supporter_only && track.required_tier && (
                          <SupporterExclusiveBadge tier={track.required_tier as "basic" | "gold"} />
                        )}
                      </div>
                      {track.description && (
                        <p className="text-sm text-muted-foreground truncate">{track.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTrackId(track.id);
                          setShowCollaboratorSelector(true);
                        }}
                        className="flex-shrink-0 gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Collaborator
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTrack(track.id)}
                        className="flex-shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Locked Feature Modal */}
      <LockedFeatureModal
        open={showLockedModal}
        onOpenChange={setShowLockedModal}
        featureName="Unlimited Tracks"
        featureDescription="You've reached the 5 track limit for Early Access. Upgrade to FlyMusic Gold for unlimited uploads."
        tierRequired="gold"
        onSuccess={fetchData}
      />

      {/* Collaborator Selector */}
      {selectedTrackId && (
        <CollaboratorSelector
          open={showCollaboratorSelector}
          onOpenChange={setShowCollaboratorSelector}
          trackId={selectedTrackId}
          onSuccess={fetchData}
        />
      )}

      {/* Multi Upload Dialog */}
      {artistProfile && (
        <MultiUploadDialog
          open={showMultiUpload}
          onOpenChange={setShowMultiUpload}
          type="songs"
          artistId={artistProfile.id}
          onSuccess={fetchData}
        />
      )}
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
