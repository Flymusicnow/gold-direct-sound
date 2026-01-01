import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProgressProps {
  currentUrl?: string | null;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  uploading: boolean;
  progress: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  dragActive?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
};

const fallbackSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

const buttonSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
  xl: 'h-9 w-9',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-4 w-4',
};

/**
 * Reusable avatar upload component with progress indicator.
 * Supports drag-and-drop and shows upload progress.
 */
export function AvatarUploadProgress({
  currentUrl,
  fallback,
  size = 'lg',
  uploading,
  progress,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  dragActive,
  disabled,
  className,
}: AvatarUploadProgressProps) {
  return (
    <div 
      className={cn("relative inline-block", className)}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <Avatar 
        className={cn(
          sizeClasses[size],
          "border-2 border-primary transition-all",
          dragActive && "ring-2 ring-primary ring-offset-2",
          uploading && "opacity-75"
        )}
      >
        <AvatarImage src={currentUrl || undefined} alt="Profile" />
        <AvatarFallback className={cn(fallbackSizeClasses[size], "bg-primary/20 text-primary")}>
          {fallback}
        </AvatarFallback>
        
        {/* Progress overlay */}
        {uploading && progress > 0 && (
          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
            <div className="relative">
              {/* Circular progress */}
              <svg className={cn(sizeClasses[size])} viewBox="0 0 36 36">
                <path
                  className="stroke-muted"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-primary transition-all duration-300"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </Avatar>

      {/* Upload button */}
      <label 
        className={cn(
          "absolute -bottom-1 -right-1 cursor-pointer",
          (disabled || uploading) && "cursor-not-allowed opacity-50"
        )}
      >
        <div 
          className={cn(
            buttonSizeClasses[size],
            "bg-primary text-primary-foreground rounded-full flex items-center justify-center",
            "hover:bg-primary/90 transition-colors shadow-md",
            (disabled || uploading) && "pointer-events-none"
          )}
        >
          {uploading ? (
            <Loader2 className={cn(iconSizeClasses[size], "animate-spin")} />
          ) : (
            <Camera className={iconSizeClasses[size]} />
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileSelect}
          disabled={disabled || uploading}
        />
      </label>
    </div>
  );
}
