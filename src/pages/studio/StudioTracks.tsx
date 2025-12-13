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
import { Upload, Music, Trash2, UserPlus, Lock, Crown, FolderUp, ChevronDown, ChevronRight, Camera, Disc } from "lucide-react";
import { MultiUploadDialog } from "@/components/artist/MultiUploadDialog";
import { LockedFeatureModal } from "@/components/artist/LockedFeatureModal";
import { EditTrackCoverDialog } from "@/components/artist/EditTrackCoverDialog";
import { EditAlbumCoverDialog } from "@/components/artist/EditAlbumCoverDialog";
import { useAchievements } from "@/hooks/useAchievements";
import { CollaboratorSelector } from "@/components/artist/CollaboratorSelector";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupporterExclusiveBadge } from "@/components/supporter/SupporterExclusiveBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  is_supporter_only: boolean;
  required_tier: string | null;
  upload_batch_id: string | null;
  created_at: string;
}

interface TrackBatch {
  batchId: string | null;
  coverUrl: string | null;
  tracks: Track[];
  createdAt: string;
}

export default function StudioTracks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [batches, setBatches] = useState<TrackBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
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
  const [editCoverTrack, setEditCoverTrack] = useState<Track | null>(null);
  const [editAlbumBatch, setEditAlbumBatch] = useState<TrackBatch | null>(null);
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

    if (tracksData) {
      setTracks(tracksData);
      
      // Group tracks by batch
      const batchMap = new Map<string, Track[]>();
      const singleTracks: Track[] = [];
      
      tracksData.forEach(track => {
        if (track.upload_batch_id) {
          const existing = batchMap.get(track.upload_batch_id) || [];
          existing.push(track);
          batchMap.set(track.upload_batch_id, existing);
        } else {
          singleTracks.push(track);
        }
      });
      
      // Convert to batch objects
      const batchList: TrackBatch[] = [];
      
      batchMap.forEach((batchTracks, batchId) => {
        batchList.push({
          batchId,
          coverUrl: batchTracks[0]?.cover_url || null,
          tracks: batchTracks.sort((a, b) => a.title.localeCompare(b.title)),
          createdAt: batchTracks[0]?.created_at || ''
        });
      });
      
      // Add single tracks as individual batches
      singleTracks.forEach(track => {
        batchList.push({
          batchId: null,
          coverUrl: track.cover_url,
          tracks: [track],
          createdAt: track.created_at
        });
      });
      
      // Sort by created date (newest first)
      batchList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setBatches(batchList);
    }
    setLoading(false);
  };

  const toggleBatch = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
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

          {/* Track List - Grouped by Batch */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
            {batches.length === 0 ? (
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
              <div className="space-y-4">
                {batches.map((batch, index) => {
                  const isAlbum = batch.batchId && batch.tracks.length > 1;
                  const batchKey = batch.batchId || `single-${index}`;
                  const isExpanded = expandedBatches.has(batchKey);
                  
                  if (isAlbum) {
                    // Album/Batch with multiple tracks
                    return (
                      <Collapsible key={batchKey} open={isExpanded} onOpenChange={() => toggleBatch(batchKey)}>
                        <div className="flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                          {/* Album Cover - Clickable separately */}
                          <div 
                            className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative group cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditAlbumBatch(batch);
                            }}
                          >
                            {batch.coverUrl ? (
                              <img src={batch.coverUrl} alt="Album cover" className="w-full h-full object-cover" />
                            ) : (
                              <Disc className="h-8 w-8 text-primary" />
                            )}
                            {/* Camera overlay on hover */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Rest of row - Expand/Collapse trigger */}
                          <CollapsibleTrigger asChild>
                            <div className="flex-1 min-w-0 flex items-center cursor-pointer hover:bg-primary/10 -m-2 p-2 rounded-lg transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Disc className="h-4 w-4 text-primary" />
                                  <p className="font-semibold">Album Upload</p>
                                  <span className="text-sm text-muted-foreground">({batch.tracks.length} tracks)</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(batch.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 pl-4 border-l-2 border-primary/20 space-y-2">
                            {batch.tracks.map((track) => (
                              <TrackRow 
                                key={track.id} 
                                track={track}
                                onEditCover={() => setEditCoverTrack(track)}
                                onAddCollaborator={() => {
                                  setSelectedTrackId(track.id);
                                  setShowCollaboratorSelector(true);
                                }}
                                onDelete={() => handleDeleteTrack(track.id)}
                              />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  } else {
                    // Single track
                    const track = batch.tracks[0];
                    return (
                      <TrackRow 
                        key={track.id} 
                        track={track}
                        onEditCover={() => setEditCoverTrack(track)}
                        onAddCollaborator={() => {
                          setSelectedTrackId(track.id);
                          setShowCollaboratorSelector(true);
                        }}
                        onDelete={() => handleDeleteTrack(track.id)}
                      />
                    );
                  }
                })}
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

      {/* Edit Cover Dialog */}
      {editCoverTrack && (
        <EditTrackCoverDialog
          open={!!editCoverTrack}
          onOpenChange={(open) => !open && setEditCoverTrack(null)}
          trackId={editCoverTrack.id}
          currentCoverUrl={editCoverTrack.cover_url}
          onSuccess={fetchData}
        />
      )}

      {/* Edit Album Cover Dialog */}
      {editAlbumBatch && editAlbumBatch.batchId && (
        <EditAlbumCoverDialog
          open={!!editAlbumBatch}
          onOpenChange={(open) => !open && setEditAlbumBatch(null)}
          batchId={editAlbumBatch.batchId}
          trackIds={editAlbumBatch.tracks.map(t => t.id)}
          currentCoverUrl={editAlbumBatch.coverUrl}
          onSuccess={fetchData}
        />
      )}
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}

// Extracted TrackRow component for reuse
function TrackRow({ 
  track, 
  onEditCover, 
  onAddCollaborator, 
  onDelete 
}: { 
  track: Track; 
  onEditCover: () => void;
  onAddCollaborator: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      {/* Cover with edit button */}
      <div 
        className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative group cursor-pointer"
        onClick={onEditCover}
      >
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <Music className="h-6 w-6 text-muted-foreground" />
        )}
        {/* Edit overlay */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-4 w-4 text-white" />
        </div>
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
          onClick={onAddCollaborator}
          className="flex-shrink-0 gap-2"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Collaborator</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="flex-shrink-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
