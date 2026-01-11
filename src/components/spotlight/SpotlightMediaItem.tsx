import { useRef, useEffect, useState } from "react";
import { SpotlightMedia } from "@/hooks/useArtistSpotlight";
import { SpotlightTemplateOverlay } from "./SpotlightTemplateOverlay";

interface SpotlightMediaItemProps {
  item: SpotlightMedia;
  onVideoEnd?: () => void;
}

export function SpotlightMediaItem({ item, onVideoEnd }: SpotlightMediaItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Reset error states when item changes
    setImageError(false);
    setVideoError(false);
  }, [item.id]);

  const hasTemplateOverlay = item.template_id && item.template_data;

  if (item.media_type === 'video') {
    if (videoError) {
      return (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Video unavailable</p>
        </div>
      );
    }

    return (
      <>
        <video
          ref={videoRef}
          src={item.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={onVideoEnd}
          onError={() => setVideoError(true)}
        />
        {hasTemplateOverlay && (
          <SpotlightTemplateOverlay templateData={item.template_data} />
        )}
      </>
    );
  }

  if (imageError) {
    return (
      <div className="absolute inset-0 bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Image unavailable</p>
      </div>
    );
  }

  return (
    <>
      <img
        src={item.media_url}
        alt="Spotlight"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setImageError(true)}
        loading="eager"
      />
      {hasTemplateOverlay && (
        <SpotlightTemplateOverlay templateData={item.template_data} />
      )}
    </>
  );
}
