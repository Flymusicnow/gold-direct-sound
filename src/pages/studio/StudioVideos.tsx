import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, Upload, Trash2, CheckCircle } from "lucide-react";

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
  const [showSuccess, setShowSuccess] = useState(false);

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
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Only MP4 and WebM videos are allowed");
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Video must be under 40MB");
      return;
    }

    setVideoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowSuccess(false);
  };

  const handleUpload = async () => {
    if (!videoFile || !artistProfile) return;

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

      // Reset form
      setTimeout(() => {
        setVideoFile(null);
        setCaption("");
        setPreviewUrl(null);
        setShowSuccess(false);
        fetchData();
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
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
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video File (MP4 or WebM, max 40MB)
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {videoFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVideoFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
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
                <div className="border border-primary/20 rounded-lg overflow-hidden">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-96 bg-black"
                  />
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
                disabled={!videoFile || uploading}
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
              <Card className="p-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No videos yet. Upload your first one!</p>
              </Card>
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
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
