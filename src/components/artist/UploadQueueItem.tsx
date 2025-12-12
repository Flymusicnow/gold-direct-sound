import { Music, Video, X, RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UploadFile } from "@/hooks/useMultiUpload";

interface UploadQueueItemProps {
  file: UploadFile;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  disabled?: boolean;
}

export function UploadQueueItem({ file, onRemove, onRetry, disabled }: UploadQueueItemProps) {
  const sizeMB = (file.file.size / (1024 * 1024)).toFixed(1);
  
  const statusConfig = {
    pending: { icon: null, label: 'Pending', color: 'text-muted-foreground' },
    uploading: { icon: Loader2, label: 'Uploading...', color: 'text-primary' },
    completed: { icon: Check, label: 'Completed', color: 'text-green-500' },
    failed: { icon: AlertCircle, label: 'Failed', color: 'text-destructive' },
  };

  const status = statusConfig[file.status];
  const StatusIcon = status.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      file.status === 'failed' && "border-destructive/50 bg-destructive/5",
      file.status === 'completed' && "border-green-500/50 bg-green-500/5",
      file.status === 'uploading' && "border-primary/50 bg-primary/5",
      file.status === 'pending' && "border-border"
    )}>
      {/* File Type Icon */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        file.type === 'song' ? "bg-primary/10" : "bg-blue-500/10"
      )}>
        {file.type === 'song' ? (
          <Music className="h-5 w-5 text-primary" />
        ) : (
          <Video className="h-5 w-5 text-blue-500" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate text-sm">{file.title}</p>
          <Badge variant="outline" className="shrink-0 text-xs">
            {file.type === 'song' ? 'Song' : 'Video'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{sizeMB} MB</span>
          <span>•</span>
          <span className={cn("flex items-center gap-1", status.color)}>
            {StatusIcon && (
              <StatusIcon className={cn("h-3 w-3", file.status === 'uploading' && "animate-spin")} />
            )}
            {status.label}
          </span>
          {file.error && (
            <>
              <span>•</span>
              <span className="text-destructive truncate">{file.error}</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="mt-2 h-1.5" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {file.status === 'failed' && onRetry && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRetry(file.id)}
            disabled={disabled}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {(file.status === 'pending' || file.status === 'failed') && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemove(file.id)}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {file.status === 'completed' && (
          <Check className="h-5 w-5 text-green-500" />
        )}
      </div>
    </div>
  );
}