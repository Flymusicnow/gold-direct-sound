import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Upload, Music, Video, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import type { UploadProgress } from "@/hooks/useMultiUpload";

interface UploadSummaryProps {
  progress: UploadProgress;
  fileType: 'songs' | 'videos' | 'mixed';
  failedFiles: Array<{ title: string; error?: string }>;
  onUploadMore: () => void;
  onRetryFailed: () => void;
  onClose?: () => void;
}

export function UploadSummary({
  progress,
  fileType,
  failedFiles,
  onUploadMore,
  onRetryFailed,
  onClose
}: UploadSummaryProps) {
  const navigate = useNavigate();
  const isFullSuccess = progress.failed === 0 && progress.completed === progress.total;
  const isPartialSuccess = progress.completed > 0 && progress.failed > 0;
  const isFullFailure = progress.completed === 0 && progress.failed > 0;

  // Trigger confetti on full success
  useEffect(() => {
    if (isFullSuccess) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E8BF1A', '#FFD700', '#FFA500']
      });
    }
  }, [isFullSuccess]);

  const getIcon = () => {
    if (isFullSuccess) return <CheckCircle className="h-16 w-16 text-green-500" />;
    if (isPartialSuccess) return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
    return <XCircle className="h-16 w-16 text-destructive" />;
  };

  const getTitle = () => {
    if (isFullSuccess) {
      const typeLabel = fileType === 'songs' ? 'songs' : fileType === 'videos' ? 'videos' : 'files';
      return `${progress.completed} ${typeLabel} uploaded successfully!`;
    }
    if (isPartialSuccess) {
      return `${progress.completed} of ${progress.total} uploaded, ${progress.failed} failed`;
    }
    return "Upload failed";
  };

  const getDescription = () => {
    if (isFullSuccess) {
      return "Your content is now available in your studio. You can edit metadata or share with your fans.";
    }
    if (isPartialSuccess) {
      return "Some files failed to upload. You can retry the failed uploads or continue with the successful ones.";
    }
    return "Something went wrong during upload. Please check your connection and try again.";
  };

  const navigateToContent = () => {
    // Close dialog first, then navigate
    onClose?.();
    setTimeout(() => {
      if (fileType === 'videos') {
        navigate('/studio/videos');
      } else {
        navigate('/studio/tracks');
      }
    }, 100);
  };

  return (
    <div className="text-center py-8 space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        {getIcon()}
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{getTitle()}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">{getDescription()}</p>
      </div>

      {/* Failed Files List */}
      {failedFiles.length > 0 && (
        <div className="max-w-md mx-auto text-left space-y-2">
          <p className="text-sm font-medium text-destructive">Failed uploads:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {failedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 bg-destructive/10 rounded">
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="truncate flex-1">{file.title}</span>
                {file.error && (
                  <span className="text-xs text-muted-foreground shrink-0">{file.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {isFullSuccess && (
          <>
            <Button onClick={navigateToContent} className="gap-2">
              {fileType === 'videos' ? <Video className="h-4 w-4" /> : <Music className="h-4 w-4" />}
              View My {fileType === 'videos' ? 'Videos' : 'Tracks'}
            </Button>
            <Button variant="outline" onClick={onUploadMore} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload More
            </Button>
          </>
        )}

        {isPartialSuccess && (
          <>
            <Button onClick={onRetryFailed} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Failed ({progress.failed})
            </Button>
            <Button variant="outline" onClick={navigateToContent}>
              Continue with Successful
            </Button>
          </>
        )}

        {isFullFailure && (
          <>
            <Button onClick={onRetryFailed} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry All
            </Button>
            <Button variant="outline" onClick={onUploadMore}>
              Start Over
            </Button>
          </>
        )}
      </div>
    </div>
  );
}