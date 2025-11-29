import { useEffect, useRef } from "react";

interface LiveStreamPlayerProps {
  streamUrl: string;
  streamType?: string;
}

export function LiveStreamPlayer({ streamUrl, streamType = "external" }: LiveStreamPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert various stream URLs to embeddable format
  const getEmbedUrl = (url: string): string => {
    // YouTube Live
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    // Twitch
    if (url.includes("twitch.tv/")) {
      const channel = url.split("twitch.tv/")[1].split("?")[0];
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true`;
    }

    // Default: assume it's already an embed URL or HLS stream
    return url;
  };

  const embedUrl = getEmbedUrl(streamUrl);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
