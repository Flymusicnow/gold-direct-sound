import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/lib/utils";
import { UploadQueue } from "./UploadQueue";
import { BulkMetadataEditor } from "./BulkMetadataEditor";
import { UploadSummary } from "./UploadSummary";
import { 
  useMultiUpload,
  SONG_FORMATS,
  VIDEO_FORMATS,
  MAX_SONG_SIZE,
  MAX_VIDEO_SIZE,
  MAX_SONGS_PER_SESSION,
  MAX_VIDEOS_PER_SESSION
} from "@/hooks/useMultiUpload";

interface MultiUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'songs' | 'videos' | 'mixed';
  artistId: string;
  onSuccess?: () => void;
}

type Step = 'select' | 'queue' | 'metadata' | 'summary';

export function MultiUploadDialog({
  open,
  onOpenChange,
  type,
  artistId,
  onSuccess
}: MultiUploadDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [albumCover, setAlbumCover] = useState<File | null>(null);
  const [albumTitle, setAlbumTitle] = useState<string>("");
  const [albumDescription, setAlbumDescription] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    files,
    addFiles,
    removeFile,
    updateFileMetadata,
    updateAllMetadata,
    updateSelectedMetadata,
    startUpload,
    retryFailed,
    pauseUpload,
    resumeUpload,
    resetUpload,
    isPaused,
    isUploading,
    isComplete,
    progress
  } = useMultiUpload();

  // Warn before closing if uploading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = 'Upload in progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  const acceptedFormats = type === 'songs' 
    ? SONG_FORMATS.join(',')
    : type === 'videos'
    ? VIDEO_FORMATS.join(',')
    : [...SONG_FORMATS, ...VIDEO_FORMATS].join(',');

  const maxSize = type === 'songs' ? MAX_SONG_SIZE : MAX_VIDEO_SIZE;
  const maxFiles = type === 'songs' ? MAX_SONGS_PER_SESSION : MAX_VIDEOS_PER_SESSION;

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    const results = addFiles(filesArray);

    // Check for errors
    const errors = results.filter(r => !r.valid);
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e.error));
    }

    const successCount = results.filter(r => r.valid).length;
    if (successCount > 0) {
      toast.success(`${successCount} file(s) added`);
      if (step === 'select') {
        setStep('queue');
      }
    }
  }, [addFiles, step]);

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
    handleFileSelect(e.dataTransfer.files);
  };

  const handleStartUpload = async () => {
    if (!user) return;
    setStep('queue');
    
    // Upload album cover first if provided
    let albumCoverUrl: string | null = null;
    if (albumCover) {
      try {
        const coverPath = `${user.id}/${Date.now()}_${sanitizeFileName(albumCover.name)}`;
        const { error: coverError } = await supabase.storage
          .from('covers')
          .upload(coverPath, albumCover);
        
        if (!coverError) {
          const { data: { publicUrl } } = supabase.storage
            .from('covers')
            .getPublicUrl(coverPath);
          albumCoverUrl = publicUrl;
        }
      } catch (e) {
        console.error('Failed to upload album cover:', e);
      }
    }
    
    // Create album record if multiple files and has title
    let albumId: string | null = null;
    if (files.length > 1 && albumTitle.trim()) {
      try {
        const { data: album, error: albumError } = await supabase
          .from('albums')
          .insert({
            artist_id: artistId,
            title: albumTitle.trim(),
            description: albumDescription.trim() || null,
            cover_url: albumCoverUrl
          })
          .select('id')
          .single();
        
        if (!albumError && album) {
          albumId = album.id;
        }
      } catch (e) {
        console.error('Failed to create album:', e);
      }
    }
    
    await startUpload(artistId, user.id, albumCoverUrl, albumId);
    setStep('summary');
    onSuccess?.();
  };

  const handleRetryFailed = async () => {
    if (!user) return;
    setStep('queue');
    await retryFailed(artistId, user.id);
    setStep('summary');
  };

  const handleUploadMore = () => {
    resetUpload();
    setAlbumCover(null);
    setStep('select');
  };

  const handleClose = () => {
    if (isUploading) {
      if (!confirm('Upload in progress. Are you sure you want to cancel?')) {
        return;
      }
    }
    resetUpload();
    setAlbumCover(null);
    setStep('select');
    onOpenChange(false);
  };

  const fileType = files.every(f => f.type === 'song') ? 'songs' 
    : files.every(f => f.type === 'video') ? 'videos' 
    : 'mixed';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Multiple {type === 'songs' ? 'Songs' : type === 'videos' ? 'Videos' : 'Files'}
          </DialogTitle>
        </DialogHeader>

        {/* Step: File Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              
              <FileUp className={cn(
                "h-12 w-12 mx-auto mb-4",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
              
              <p className="text-lg font-medium mb-2">
                {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                {type !== 'videos' && (
                  <Badge variant="outline">Songs: {SONG_FORMATS.join(', ')}</Badge>
                )}
                {type !== 'songs' && (
                  <Badge variant="outline">Videos: {VIDEO_FORMATS.join(', ')}</Badge>
                )}
              </div>
            </div>

            {/* Limits Info */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-muted-foreground">
                <p><strong>Limits:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {type !== 'videos' && (
                    <li>Songs: max {MAX_SONG_SIZE / (1024 * 1024)} MB each, up to {MAX_SONGS_PER_SESSION} per session</li>
                  )}
                  {type !== 'songs' && (
                    <li>Videos: max {MAX_VIDEO_SIZE / (1024 * 1024)} MB each, up to {MAX_VIDEOS_PER_SESSION} per session</li>
                  )}
                  <li>Total session: max 2 GB</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step: Queue / Uploading */}
        {step === 'queue' && (
          <div className="space-y-4">
            <UploadQueue
              files={files}
              progress={progress}
              isUploading={isUploading}
              isPaused={isPaused}
              onRemove={removeFile}
              onRetry={(id) => {
                updateFileMetadata(id, { status: 'pending', progress: 0, error: undefined });
              }}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onCancelAll={handleUploadMore}
              onRetryAll={handleRetryFailed}
            />

            {!isUploading && files.length > 0 && files.some(f => f.status === 'pending') && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep('metadata')}>
                  Edit Metadata First
                </Button>
                <Button onClick={handleStartUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Upload ({files.filter(f => f.status === 'pending').length} files)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Metadata Editor */}
        {step === 'metadata' && (
          <div className="space-y-4">
            <BulkMetadataEditor
              files={files}
              onUpdateFile={updateFileMetadata}
              onUpdateAll={updateAllMetadata}
              onUpdateSelected={updateSelectedMetadata}
              albumCover={albumCover}
              onAlbumCoverChange={setAlbumCover}
              albumTitle={albumTitle}
              onAlbumTitleChange={setAlbumTitle}
              albumDescription={albumDescription}
              onAlbumDescriptionChange={setAlbumDescription}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('queue')}>
                Back to Queue
              </Button>
              <Button onClick={handleStartUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Start Upload
              </Button>
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {step === 'summary' && (
          <UploadSummary
            progress={progress}
            fileType={fileType}
            failedFiles={files
              .filter(f => f.status === 'failed')
              .map(f => ({ title: f.title, error: f.error }))}
            onUploadMore={handleUploadMore}
            onRetryFailed={handleRetryFailed}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}