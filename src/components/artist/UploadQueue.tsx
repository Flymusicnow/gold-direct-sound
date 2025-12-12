import { Play, Pause, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadQueueItem } from "./UploadQueueItem";
import type { UploadFile, UploadProgress } from "@/hooks/useMultiUpload";

interface UploadQueueProps {
  files: UploadFile[];
  progress: UploadProgress;
  isUploading: boolean;
  isPaused: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancelAll: () => void;
  onRetryAll: () => void;
}

export function UploadQueue({
  files,
  progress,
  isUploading,
  isPaused,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onCancelAll,
  onRetryAll
}: UploadQueueProps) {
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const failedCount = progress.failed;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isUploading ? (
              <>
                Uploading {uploadingCount} of {progress.total} files ({progress.percentage}%)
              </>
            ) : progress.completed === progress.total ? (
              <>All {progress.total} files uploaded successfully!</>
            ) : failedCount > 0 ? (
              <>{progress.completed} of {progress.total} uploaded, {failedCount} failed</>
            ) : (
              <>{files.length} files ready to upload</>
            )}
          </p>
          {isUploading && (
            <Progress value={progress.percentage} className="h-2 w-48" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isUploading && (
            <Button
              size="sm"
              variant="outline"
              onClick={isPaused ? onResume : onPause}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
          )}
          
          {failedCount > 0 && !isUploading && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetryAll}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry Failed ({failedCount})
            </Button>
          )}

          {pendingCount > 0 && !isUploading && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelAll}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {files.map(file => (
          <UploadQueueItem
            key={file.id}
            file={file}
            onRemove={onRemove}
            onRetry={() => onRetry(file.id)}
            disabled={isUploading && file.status === 'uploading'}
          />
        ))}
      </div>
    </div>
  );
}