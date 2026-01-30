import { useArtistSpotlight } from "@/hooks/useArtistSpotlight";
import { SpotlightCarousel } from "./SpotlightCarousel";

interface SpotlightSectionProps {
  artistId: string;
  artistName: string;
}

export function SpotlightSection({ artistId, artistName }: SpotlightSectionProps) {
  const { data: spotlightMedia, isLoading } = useArtistSpotlight(artistId);

  // Don't render anything if no media or loading
  if (isLoading || !spotlightMedia || spotlightMedia.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <SpotlightCarousel 
        media={spotlightMedia} 
        artistId={artistId}
        artistName={artistName}
      />
    </div>
  );
}
