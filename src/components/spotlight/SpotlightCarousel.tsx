import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ExternalLink, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";
import { useSpotlightAnalytics } from "@/hooks/useSpotlightAnalytics";
import { SpotlightMediaItem } from "./SpotlightMediaItem";
import { ExternalLinkConfirmDialog } from "./ExternalLinkConfirmDialog";

interface SpotlightCarouselProps {
  media: SpotlightMedia[];
  artistId: string;
  artistName: string;
}

export function SpotlightCarousel({ media, artistId, artistName }: SpotlightCarouselProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { trackView, trackViewDuration, trackLinkClick } = useSpotlightAnalytics();
  const [showExternalConfirm, setShowExternalConfirm] = useState(false);
  const [pendingExternalUrl, setPendingExternalUrl] = useState<string | null>(null);
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMedia = media[currentIndex];

  // Auto-advance for images (videos control their own duration)
  useEffect(() => {
    if (!currentMedia || currentMedia.media_type === 'video') return;

    const duration = (currentMedia.display_duration_seconds || 5) * 1000;
    
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, media.length, currentMedia]);

  // Track view when slide changes
  useEffect(() => {
    if (currentMedia) {
      trackView(currentMedia.id, artistId);
    }
    
    return () => {
      if (currentMedia) {
        trackViewDuration(currentMedia.id);
      }
    };
  }, [currentIndex, currentMedia?.id, artistId, trackView, trackViewDuration]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const handleLinkClick = () => {
    if (!currentMedia || currentMedia.link_type === 'none') return;

    if (currentMedia.link_type === 'external') {
      setPendingExternalUrl(currentMedia.link_url);
      setPendingPlatform(currentMedia.link_platform);
      setShowExternalConfirm(true);
    } else if (currentMedia.link_type === 'internal' && currentMedia.link_url) {
      trackLinkClick(currentMedia.id, 'internal');
      navigate(currentMedia.link_url);
    }
  };

  const handleExternalConfirm = () => {
    if (pendingExternalUrl && currentMedia) {
      trackLinkClick(currentMedia.id, 'external');
      window.open(pendingExternalUrl, '_blank', 'noopener,noreferrer');
    }
    setShowExternalConfirm(false);
    setPendingExternalUrl(null);
    setPendingPlatform(null);
  };

  if (!media.length) return null;

  return (
    <div className="w-full max-w-[280px] mx-auto">
      {/* Label */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wide">Spotlight</span>
      </div>

      {/* Carousel Container - 9:16 aspect ratio */}
      <div 
        ref={containerRef}
        className="relative aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-primary/20 bg-card group"
      >
        {/* Media Item */}
        <SpotlightMediaItem
          item={currentMedia}
          onVideoEnd={handleVideoEnd}
        />

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Link Indicator */}
        {currentMedia.link_type !== 'none' && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <Badge 
              variant="secondary" 
              className={cn(
                "gap-1 cursor-pointer transition-transform hover:scale-105",
                currentMedia.link_type === 'external' && "bg-muted/80 text-muted-foreground"
              )}
              onClick={handleLinkClick}
            >
              {currentMedia.link_type === 'external' ? (
                <>
                  <ExternalLink className="h-3 w-3" />
                  {currentMedia.link_label || currentMedia.link_platform || 'View'}
                </>
              ) : (
                <>
                  <Music className="h-3 w-3" />
                  {currentMedia.link_label || 'View on FlyMusic'}
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Dot Indicators */}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentIndex ? "bg-primary" : "bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* External Link Confirmation Dialog */}
      <ExternalLinkConfirmDialog
        open={showExternalConfirm}
        onOpenChange={setShowExternalConfirm}
        url={pendingExternalUrl}
        platform={pendingPlatform}
        onConfirm={handleExternalConfirm}
      />
    </div>
  );
}
