import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyStateCard } from "@/components/artist/EmptyStateCard";
import { toast } from "sonner";
import { VideoShareModal } from "@/components/video/VideoShareModal";
import { LockedFeatureModal } from "@/components/artist/LockedFeatureModal";
import { useAchievements } from "@/hooks/useAchievements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Upload, Trash2, CheckCircle, Share2, FolderPlus, AlertCircle } from "lucide-react";

interface VideoPost {
  id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
}

const MAX_VIDEO_SIZE = 40 * 1024 * 1024; // 40MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export default function StudioVideos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareVideo, setShareVideo] = useState<VideoPost | null>(null);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedVideoForCollection, setSelectedVideoForCollection] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean;
    error: string | null;
    fileInfo: {
      name: string;
      sizeMB: string;
      type: string;
    } | null;
  } | null>(null);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const { checkAndUnlockAchievements } = useAchievements();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch artist profile
      const { data: profile, error: profileError } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile.status !== "approved") {
        navigate("/studio/profile");
        return;
      }

      setArtistProfile(profile);

      // Fetch video posts
      const { data: videos, error: videosError } = await supabase
        .from("artist_video_posts")
        .select("*")
        .eq("artist_id", profile.id)
        .order("created_at", { ascending: false });

      if (videosError) throw videosError;
      setVideoPosts(videos || []);

      // Fetch collections
      const { data: collectionsData } = await supabase
        .from("video_collections")
        .select("id, name")
        .eq("artist_id", profile.id)
        .order("position", { ascending: true });

      setCollections(collectionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnail = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of duration
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve(null);
          }
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };
    });
  };

  const processFile = async (file: File) => {
    // Calculate file info
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    const fileInfo = {
      name: file.name,
      sizeMB,
      type: fileType.toUpperCase()
    };

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setVideoFile(file);
      setFileValidation({
        isValid: false,
        error: "Unsupported format. Please upload an MP4 or WebM video.",
        fileInfo
      });
      setPreviewUrl(null);
      setThumbnailUrl(null);
      setShowSuccess(false);
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      setVideoFile(file);
      setFileValidation({
        isValid: false,
        error: `This file is ${sizeMB} MB. Maximum allowed is 40 MB.`,
        fileInfo
      });
      setPreviewUrl(null);
      setThumbnailUrl(null);
      setShowSuccess(false);
      return;
    }

    // Valid file - generate preview and thumbnail
    setVideoFile(file);
    const videoUrl = URL.createObjectURL(file);
    setPreviewUrl(videoUrl);
    setFileValidation({
      isValid: true,
      error: null,
      fileInfo
    });
    setShowSuccess(false);

    // Generate thumbnail
    const thumb = await generateThumbnail(file);
    setThumbnailUrl(thumb);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileValidation(null);
      return;
    }
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !artistProfile) return;

    // Check upload limit (3 videos for free tier)
    if (videoPosts.length >= 3) {
      setShowLockedModal(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${videoFile.name}`;
      const filePath = `${artistProfile.id}/${fileName}`;

      // Upload video to storage
      const { error: uploadError } = await supabase.storage
        .from("artist_videos")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("artist_videos")
        .getPublicUrl(filePath);

      setUploadProgress(75);

      // Insert record into database
      const { error: insertError } = await supabase
        .from("artist_video_posts")
        .insert({
          artist_id: artistProfile.id,
          video_url: urlData.publicUrl,
          caption: caption.trim() || null,
        });

      if (insertError) throw insertError;

      setUploadProgress(100);
      setShowSuccess(true);
      toast.success("Video uploaded successfully!");

      // Update onboarding progress
      await supabase
        .from("artist_onboarding_progress")
        .update({ has_uploaded_video: true })
        .eq("user_id", user?.id);

      // Check achievements
      await checkAndUnlockAchievements();

      // Reset form
      setTimeout(() => {
        setVideoFile(null);
        setCaption("");
        setPreviewUrl(null);
        setThumbnailUrl(null);
        setShowSuccess(false);
        fetchData();
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Something went wrong during upload. Please try again or choose a smaller file.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (videoId: string, videoUrl: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split("/artist_videos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("artist_videos").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("artist_video_posts")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast.success("Video deleted");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedVideoForCollection || !selectedCollection) return;

    try {
      const { error } = await supabase
        .from("video_collection_items")
        .insert({
          collection_id: selectedCollection,
          video_id: selectedVideoForCollection,
          position: 0,
        });

      if (error) throw error;

      toast.success("Video added to collection");
      setShowCollectionDialog(false);
      setSelectedVideoForCollection(null);
      setSelectedCollection("");
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("Video is already in this collection");
      } else {
        console.error("Error adding to collection:", error);
        toast.error("Failed to add video to collection");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <StudioSidebar />
      <MobileStudioNav />

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Video Posts</h1>
              <p className="text-muted-foreground">Share video updates with your fans</p>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="p-6 border-primary/20">
            <h2 className="text-xl font-semibold mb-4">Upload New Video</h2>
            
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video File (MP4 or WebM, max 40MB)
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                    isDragging && "border-primary bg-primary/10",
                    !isDragging && !videoFile && "border-muted hover:border-primary/50",
                    videoFile && fileValidation?.isValid && "border-green-500/50 bg-green-500/5",
                    videoFile && !fileValidation?.isValid && "border-destructive/50 bg-destructive/5",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {!videoFile ? (
                    <div className="space-y-2">
                      <Upload className={cn(
                        "h-12 w-12 mx-auto",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div>
                        <p className="text-sm font-medium">
                          {isDragging ? "Drop your video here" : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4 or WebM, max 40MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Video className="h-12 w-12 mx-auto text-primary" />
                      <p className="text-sm font-medium">Video selected</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoFile(null);
                          setPreviewUrl(null);
                          setThumbnailUrl(null);
                          setFileValidation(null);
                        }}
                      >
                        Clear & Choose Another
                      </Button>
                    </div>
                  )}
                </div>

                {/* File Info & Validation Feedback */}
                {fileValidation && (
                  <div className="mt-3 space-y-2">
                    {/* File Info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{fileValidation.fileInfo?.name}</span>
                      <span>•</span>
                      <span>{fileValidation.fileInfo?.sizeMB} MB</span>
                      <span>•</span>
                      <span>{fileValidation.fileInfo?.type}</span>
                    </div>
                    
                    {/* Validation Status */}
                    {fileValidation.isValid ? (
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>File looks good ({fileValidation.fileInfo?.type}, {fileValidation.fileInfo?.sizeMB} MB)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{fileValidation.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Caption (optional)
                </label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption for your video..."
                  disabled={uploading}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {caption.length}/500 characters
                </p>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thumbnail Preview */}
                    {thumbnailUrl && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Thumbnail Preview</p>
                        <div className="border border-primary/20 rounded-lg overflow-hidden">
                          <img
                            src={thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-full aspect-video object-cover bg-black"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Video Preview */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Video Preview</p>
                      <div className="border border-primary/20 rounded-lg overflow-hidden">
                        <video
                          src={previewUrl}
                          controls
                          className="w-full aspect-video bg-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Success State */}
              {showSuccess && (
                <div className="flex items-center justify-center gap-2 text-primary animate-in fade-in">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Video uploaded successfully!</span>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!videoFile || !fileValidation?.isValid || uploading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
            </div>
          </Card>

          {/* Existing Videos */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Videos</h2>
            {videoPosts.length === 0 ? (
              <EmptyStateCard
                icon={Video}
                title="No videos yet"
                description="Share your first video update and connect with your fans visually."
                ctaText="Upload your first video above"
                onCtaClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                variant="gold"
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {videoPosts.map((video) => (
                  <Card key={video.id} className="overflow-hidden border-primary/20">
                    <video
                      src={video.video_url}
                      controls
                      className="w-full aspect-video bg-black"
                    />
                    <div className="p-4 space-y-3">
                      {video.caption && (
                        <p className="text-sm text-foreground/80">{video.caption}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShareVideo(video)}
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {collections.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVideoForCollection(video.id);
                                setShowCollectionDialog(true);
                              }}
                              title="Add to Collection"
                            >
                              <FolderPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(video.id, video.video_url)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {shareVideo && artistProfile && (
        <VideoShareModal
          isOpen={!!shareVideo}
          onClose={() => setShareVideo(null)}
          video={shareVideo}
          artist={{
            id: artistProfile.id,
            artist_name: artistProfile.artist_name,
          }}
        />
      )}

      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCollectionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToCollection}
                disabled={!selectedCollection}
              >
                Add to Collection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Locked Feature Modal */}
      <LockedFeatureModal
        open={showLockedModal}
        onOpenChange={setShowLockedModal}
        featureName="Unlimited Videos"
        featureDescription="You've reached the 3 video limit for Early Access. Upgrade to FlyMusic Gold for unlimited video uploads."
        tierRequired="gold"
        onSuccess={fetchData}
      />
    </div>
  );
}
