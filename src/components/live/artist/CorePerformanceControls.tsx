import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Pause, Play, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface CorePerformanceControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isPaused: boolean;
  isEnding: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndStream: () => Promise<boolean>;
  className?: string;
}

export const CorePerformanceControls = ({
  isMuted,
  isCameraOff,
  isPaused,
  isEnding,
  onToggleMute,
  onToggleCamera,
  onPause,
  onResume,
  onEndStream,
  className,
}: CorePerformanceControlsProps) => {
  const [showEndDialog, setShowEndDialog] = useState(false);

  const handleEndStream = async () => {
    const success = await onEndStream();
    if (success) {
      setShowEndDialog(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Primary Control Row */}
      <div className="flex items-center gap-2">
        {/* Mute Toggle */}
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="lg"
          onClick={onToggleMute}
          className="min-h-[44px] min-w-[44px] flex-1"
        >
          {isMuted ? (
            <>
              <MicOff className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Unmute</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Mute</span>
            </>
          )}
        </Button>

        {/* Camera Toggle */}
        <Button
          variant={isCameraOff ? "destructive" : "outline"}
          size="lg"
          onClick={onToggleCamera}
          className="min-h-[44px] min-w-[44px] flex-1"
        >
          {isCameraOff ? (
            <>
              <VideoOff className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Camera On</span>
            </>
          ) : (
            <>
              <Video className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Camera Off</span>
            </>
          )}
        </Button>

        {/* Pause/Resume Toggle */}
        <Button
          variant={isPaused ? "default" : "outline"}
          size="lg"
          onClick={isPaused ? onResume : onPause}
          className="min-h-[44px] min-w-[44px] flex-1"
        >
          {isPaused ? (
            <>
              <Play className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Resume</span>
            </>
          ) : (
            <>
              <Pause className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Pause</span>
            </>
          )}
        </Button>
      </div>

      {/* End Stream Button (Destructive with confirmation) */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="lg"
            disabled={isEnding}
            className="w-full min-h-[44px] font-semibold"
          >
            {isEnding ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Ending Stream...
              </>
            ) : (
              <>
                <Power className="h-5 w-5 mr-2" />
                End Stream
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End your live stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the stream for all viewers. You can start a new stream later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndStream}
              disabled={isEnding}
              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isEnding ? "Ending..." : "End Stream"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
