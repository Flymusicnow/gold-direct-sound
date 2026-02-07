import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Users, Share2 } from "lucide-react";
import { EarlyAccessBadge } from "./EarlyAccessBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { getThemeConfig, type ProfileTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface BannerCropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom?: number;
}

interface ArtistHeroSectionProps {
  artist: {
    user_id?: string;
    artist_name: string;
    avatar_url: string | null;
    banner_url?: string | null;
    banner_url_mobile?: string | null;
    banner_media_type?: 'image' | 'video' | string | null;
    banner_media_type_mobile?: 'image' | 'video' | string | null;
    banner_crop_data?: BannerCropData | null;
    banner_crop_data_mobile?: BannerCropData | null;
    banner_position_y?: number | null;
    show_name_on_banner?: boolean | null;
    profile_theme?: ProfileTheme | string | null;
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
  const isMobile = useIsMobile();

  // Get theme configuration
  const theme = useMemo(() => getThemeConfig(artist.profile_theme), [artist.profile_theme]);

  // Determine which banner to show based on device
  const activeBanner = useMemo(() => {
    const useMobileBanner = isMobile && artist.banner_url_mobile;
    return {
      url: useMobileBanner ? artist.banner_url_mobile : artist.banner_url,
      mediaType: useMobileBanner ? artist.banner_media_type_mobile : artist.banner_media_type,
      cropData: useMobileBanner ? artist.banner_crop_data_mobile : artist.banner_crop_data,
    };
  }, [isMobile, artist]);

  // Calculate crop styles for images - using Y position from settings or crop data
  const cropStyle = useMemo(() => {
    if (activeBanner.mediaType === 'video') return {};
    
    // Use banner_position_y if set, otherwise fall back to crop data
    const yPosition = artist.banner_position_y ?? activeBanner.cropData?.y ?? 50;
    const xPosition = activeBanner.cropData?.x ?? 50;
    
    return {
      objectPosition: `${xPosition}% ${yPosition}%`,
    };
  }, [activeBanner, artist.banner_position_y]);

  const hasBanner = !!activeBanner.url;
  const isVideo = activeBanner.mediaType === 'video';
  
  // SUPER CARD: Show name unless explicitly disabled AND banner exists
  const showArtistName = !hasBanner || artist.show_name_on_banner !== false;

  return (
    <div className="relative border-b border-border min-h-[280px] md:min-h-0">
      {/* Banner Image/Video or Gradient Fallback */}
      {hasBanner ? (
        <div className="w-full min-h-[280px] md:min-h-0 aspect-[5/2] md:aspect-[4/1] overflow-hidden">
          {isVideo ? (
            <video
              src={activeBanner.url!}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={activeBanner.url!}
              alt={`${artist.artist_name} banner`}
              className="w-full h-full object-cover"
              style={cropStyle}
            />
          )}
        </div>
      ) : (
        <div className="w-full min-h-[280px] md:min-h-0 aspect-[5/2] md:aspect-[4/1] bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
      )}

      {/* Gradient overlay for text readability - lighter to show banner */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      {/* Extra gradient at bottom for text area */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background via-background/50 to-transparent" />

      {/* Artist info - positioned over banner */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end">
            {/* Avatar with themed ring - ALWAYS VISIBLE per SUPER CARD */}
            <div className="relative flex-shrink-0">
              <div 
                className="absolute inset-0 blur-2xl rounded-full scale-150 -z-10"
                style={{ backgroundColor: `hsl(${theme.colorValue} / 0.3)` }}
              />
              <div className={cn(
                "relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 shadow-lg overflow-hidden",
                theme.ringClass,
                theme.shadowClass
              )}>
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.artist_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `hsl(${theme.colorValue} / 0.2)` }}
                  >
                    <span 
                      className="text-4xl md:text-5xl font-bold"
                      style={{ color: `hsl(${theme.colorValue})` }}
                    >
                      {artist.artist_name[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="flex-1 text-center md:text-left text-white">
              {/* Artist Name - conditionally shown based on toggle */}
              {showArtistName && (
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {artist.artist_name}
                  </h1>
                  {isVerified && <VerifiedBadge size="lg" />}
                </div>
              )}
              
              {/* Verified badge shown separately when name is hidden */}
              {!showArtistName && isVerified && (
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <VerifiedBadge size="lg" />
                </div>
              )}

              {/* Badges Row - with themed colors */}
              <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
                {artist.genre && (
                  <Badge className={cn(
                    "backdrop-blur-sm hover:opacity-80",
                    theme.badgeBg,
                    theme.badgeText,
                    theme.badgeBorder
                  )}>
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
