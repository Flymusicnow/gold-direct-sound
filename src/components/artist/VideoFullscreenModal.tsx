import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumVideoPlayer } from "@/components/video/PremiumVideoPlayer";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideoUrl: string;
  videos: { video_url: string; caption?: string | null }[];
  currentIndex: number;
  onNavigate: (direction: "prev" | "next") => void;
}

export function VideoFullscreenModal({
  isOpen,
  onClose,
  currentVideoUrl,
  videos,
  currentIndex,
  onNavigate,
}: VideoFullscreenModalProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < videos.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-primary/20">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Navigation Buttons */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onNavigate("next")}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Video Player */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <PremiumVideoPlayer
              videoUrl={currentVideoUrl}
              autoPlay
              loop
              showFrame={false}
            />
            {videos[currentIndex].caption && (
              <p className="text-center text-white/80 mt-4 text-lg">
                {videos[currentIndex].caption}
              </p>
            )}
          </div>
        </div>

        {/* Video Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}
