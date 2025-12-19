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
    genre: string | null;
    city: string | null;
    country: string | null;
  };
  followerCount: number;
  isFollowing: boolean;
  hasBetaAccess: boolean;
  isVerified?: boolean;
  onFollow: () => void;
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
  return (
    <div className="relative bg-gradient-to-b from-primary/10 via-background to-background border-b border-border">
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar with gold ring and ambient glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 -z-10" />
            
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-primary shadow-lg shadow-primary/30 overflow-hidden">
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url}
                  alt={artist.artist_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-6xl md:text-7xl text-primary font-bold">
                    {artist.artist_name[0]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {artist.artist_name}
              </h1>
              {isVerified && <VerifiedBadge size="lg" />}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center md:justify-start">
              {artist.genre && (
                <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                  {artist.genre}
                </Badge>
              )}
              {hasBetaAccess && <EarlyAccessBadge />}
            </div>

            {/* Location */}
            {(artist.city || artist.country) && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4 justify-center md:justify-start">
                <MapPin className="h-4 w-4" />
                <span>{[artist.city, artist.country].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Follower Count */}
            <div className="flex items-center gap-2 text-muted-foreground mb-6 justify-center md:justify-start">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Button
                  onClick={onFollow}
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
                className="rounded-full"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
