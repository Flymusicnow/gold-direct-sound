import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { QualitySelector, QualityLevel } from "./QualitySelector";
import { Loader2 } from "lucide-react";

interface HLSPlayerProps {
  hlsUrl: string;
  availableQualities?: string[];
  onQualityChange?: (quality: string) => void;
  className?: string;
}

/**
 * HLSPlayer - Native HLS player with ABR support
 * Per SUPER CARD: Default to Auto (ABR), manual override allowed
 * Quality selector only for HLS streams (not WebRTC)
 */
export function HLSPlayer({ 
  hlsUrl, 
  availableQualities = ['auto', '360p', '480p', '720p', '1080p'],
  onQualityChange,
  className 
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Check for native HLS support (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => setIsLoading(false));
      video.addEventListener('error', () => setError('Failed to load stream'));
      return;
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        
        // Build quality levels from manifest
        const levels: QualityLevel[] = data.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));
        
        // Add auto option
        levels.unshift({
          index: -1,
          height: 0,
          bitrate: 0,
          label: 'Auto',
        });
        
        setQualityLevels(levels);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        // Track current quality for display
        if (currentQuality === -1) {
          // Auto mode - show what ABR selected
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error - trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error - trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              setError('Failed to load stream');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      setError('HLS is not supported in this browser');
    }
  }, [hlsUrl]);

  const handleQualityChange = (levelIndex: number) => {
    if (!hlsRef.current) return;
    
    setCurrentQuality(levelIndex);
    
    if (levelIndex === -1) {
      // Auto mode
      hlsRef.current.currentLevel = -1;
      onQualityChange?.('auto');
    } else {
      hlsRef.current.currentLevel = levelIndex;
      const level = qualityLevels.find(l => l.index === levelIndex);
      onQualityChange?.(level?.label || 'unknown');
    }
  };

  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted={false}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      
      {/* Quality Selector - Only when levels available */}
      {qualityLevels.length > 1 && (
        <div className="absolute bottom-4 right-4">
          <QualitySelector
            levels={qualityLevels}
            currentLevel={currentQuality}
            onLevelChange={handleQualityChange}
          />
        </div>
      )}
    </div>
  );
}
