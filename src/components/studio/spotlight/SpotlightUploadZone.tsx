import { useState, useCallback } from "react";
import { Upload, Image, Video, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SpotlightUploadZoneProps {
  onUpload: (file: File, duration: number) => Promise<void>;
  uploading: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

export function SpotlightUploadZone({ onUpload, uploading }: SpotlightUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [displayDuration, setDisplayDuration] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Use JPG, PNG, WebP, or MP4.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 50MB.';
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    await onUpload(file, displayDuration);
  }, [onUpload, displayDuration]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  }, [handleFile]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => document.getElementById('spotlight-upload')?.click()}
        >
          <input
            id="spotlight-upload"
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : (
            <>
              <p className="font-medium mb-1">Drop media here or click to browse</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  JPG, PNG, WebP
                </span>
                <span className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  MP4
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 9:16 aspect ratio • Max 50MB
              </p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Duration Slider */}
        <div className="space-y-2">
          <Label>Display Duration (images only)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[displayDuration]}
              onValueChange={(v) => setDisplayDuration(v[0])}
              min={3}
              max={7}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">
              {displayDuration}s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            How long each image displays before auto-advancing (3-7 seconds)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
