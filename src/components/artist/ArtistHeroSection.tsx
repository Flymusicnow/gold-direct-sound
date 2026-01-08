import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Users, Share2 } from "lucide-react";
import { EarlyAccessBadge } from "./EarlyAccessBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ArtistHeroSectionProps {
  artist: {
    user_id?: string;
    artist_name: string;
    avatar_url: string | null;
    banner_url?: string | null;
    genre: string | null;
    city: string | null;
    country: string | null;
  };
  followerCount: number;
  isFollowing: boolean;
  hasBetaAccess: boolean;
  isVerified?: boolean;
  onFollow?: () => void;
  onShare: () => void;
}

export function ArtistHeroSection({
  artist,
  followerCount,
  isFollowing,
  hasBetaAccess,
  isVerified,
  onFollow,
  onShare,
}: ArtistHeroSectionProps) {
  const hasBanner = !!artist.banner_url;

  return (
    <div className="relative border-b border-border">
      {/* Banner Image or Gradient Fallback */}
      {hasBanner ? (
        <div className="w-full aspect-[3/1] md:aspect-[4/1] overflow-hidden">
          <img
            src={artist.banner_url!}
            alt={`${artist.artist_name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

      {/* Artist info - positioned over banner */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end">
            {/* Avatar with gold ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150 -z-10" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-primary shadow-lg shadow-primary/30 overflow-hidden">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl text-primary font-bold">
                      {artist.artist_name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-md">
                  {artist.artist_name}
                </h1>
                {isVerified && <VerifiedBadge size="lg" />}
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
                {artist.genre && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 backdrop-blur-sm">
                    {artist.genre}
                  </Badge>
                )}
                {hasBetaAccess && <EarlyAccessBadge />}
              </div>

              {/* Location & Followers - inline on mobile */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3 justify-center md:justify-start">
                {(artist.city || artist.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{[artist.city, artist.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onFollow}
                    disabled={!onFollow}
                    className={`rounded-full px-6 ${!isFollowing ? "btn-gold-premium" : ""}`}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <InfoTooltip
                    title="Why Follow?"
                    description="Stay updated on new releases, support the artist (+8 XP), and see their content in your feed."
                    forRole="fan"
                    learnLink="/learn?tab=fan#support-artists"
                  />
                </div>

                <Button
                  onClick={onShare}
                  variant="outline"
                  size="icon"
                  className="rounded-full backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
