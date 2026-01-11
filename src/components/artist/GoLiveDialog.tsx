import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Radio, VideoOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoLiveDialogProps {
  artistId: string;
  onSuccess?: () => void;
}

export function GoLiveDialog({ artistId, onSuccess }: GoLiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [goLiveImmediately, setGoLiveImmediately] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Camera preview state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stream_url: "",
    thumbnail_url: "",
    scheduled_start: "",
  });

  // Attach stream to video element when available
  useEffect(() => {
    if (videoPreviewRef.current && cameraStream) {
      videoPreviewRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Cleanup camera when dialog closes
  useEffect(() => {
    if (!open && cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setCameraError(null);
    }
  }, [open, cameraStream]);

  // Auto-request camera when "Go Live Now" is toggled on
  useEffect(() => {
    if (goLiveImmediately && !cameraStream && !cameraError && !isRequestingCamera) {
      requestCameraAccess();
    }
  }, [goLiveImmediately]);

  const requestCameraAccess = async () => {
    setIsRequestingCamera(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });
      setCameraStream(stream);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera access denied. Please enable camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found. Please connect a camera and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError("Unable to access camera. Please check your device settings.");
      }
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("artist_live_streams").insert({
        artist_id: artistId,
        title: formData.title,
        description: formData.description || null,
        stream_url: formData.stream_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        scheduled_start: goLiveImmediately ? null : formData.scheduled_start || null,
        status: goLiveImmediately ? "live" : "scheduled",
        actual_start: goLiveImmediately ? new Date().toISOString() : null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: goLiveImmediately ? "You are now live!" : "Live stream scheduled successfully",
      });

      // Cleanup camera before navigating (will be re-initialized on LivePage)
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        stream_url: "",
        thumbnail_url: "",
        scheduled_start: "",
      });
      setGoLiveImmediately(false);
      onSuccess?.();

      // Auto-navigate to Live Page if going live immediately
      if (goLiveImmediately) {
        navigate(`/live/${artistId}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-[44px] bg-red-500 hover:bg-red-600 text-white">
          <Radio className="h-4 w-4 mr-2" />
          Go Live / Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goLiveImmediately ? "Go Live Now" : "Schedule Live Stream"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Go Live Now Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="space-y-0.5">
              <Label htmlFor="go-live-now" className="text-base font-medium">Go Live Now</Label>
              <p className="text-sm text-muted-foreground">Start streaming immediately after creation</p>
            </div>
            <Switch
              id="go-live-now"
              checked={goLiveImmediately}
              onCheckedChange={setGoLiveImmediately}
            />
          </div>

          {/* Camera Preview Section - Only shown when "Go Live Now" is enabled */}
          {goLiveImmediately && (
            <div className="space-y-3">
              <Label>Camera Preview</Label>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {cameraStream ? (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : cameraError ? (
                  <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                    <VideoOff className="h-8 w-8 mb-2" />
                    <p className="text-sm text-center">{cameraError}</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={requestCameraAccess}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : isRequestingCamera ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">Requesting camera access...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={requestCameraAccess}
                      className="gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Enable Camera
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure you can see yourself before going live
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Live Performance, Q&A Session, etc."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will you be streaming?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="stream_url">Stream URL (Optional)</Label>
            <Input
              id="stream_url"
              type="url"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              placeholder="External stream URL (leave empty for browser-based streaming)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to stream directly from your browser camera
            </p>
          </div>

          <div>
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {!goLiveImmediately && (
            <div>
              <Label htmlFor="scheduled_start">Scheduled Start Time</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={formData.scheduled_start}
                onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (goLiveImmediately && !cameraStream)} 
              className={`flex-1 min-h-[44px] ${goLiveImmediately ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isLoading ? "Creating..." : goLiveImmediately ? "🔴 Go Live Now" : "Schedule Stream"}
            </Button>
          </div>

          {/* Warning if camera not enabled for Go Live Now */}
          {goLiveImmediately && !cameraStream && !cameraError && (
            <p className="text-xs text-amber-500 text-center">
              Enable your camera to go live
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
