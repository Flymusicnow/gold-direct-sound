/**
 * Banner source types for community banners
 */
export type BannerSource = 'custom' | 'profile' | 'none';

interface Community {
  banner_source?: BannerSource | null;
  banner_media_url?: string | null;
  banner_media_type?: 'image' | 'video' | string | null;
}

interface ArtistProfile {
  banner_url?: string | null;
}

interface ResolvedBanner {
  url: string | null;
  type: 'image' | 'video' | null;
  source: BannerSource;
}

/**
 * Resolves the correct banner URL based on the community's banner_source setting.
 * 
 * - 'custom': Use the community's own banner_media_url
 * - 'profile': Inherit from artist_profiles.banner_url
 * - 'none': No banner
 * 
 * @param community - The community data
 * @param artistProfile - The artist profile data
 * @returns The resolved banner information
 */
export function resolveCommunityBanner(
  community: Community | null | undefined,
  artistProfile: ArtistProfile | null | undefined
): ResolvedBanner {
  if (!community) {
    return { url: null, type: null, source: 'none' };
  }

  const source = community.banner_source || 'custom';

  switch (source) {
    case 'profile':
      return {
        url: artistProfile?.banner_url || null,
        type: artistProfile?.banner_url ? 'image' : null,
        source: 'profile',
      };

    case 'none':
      return { url: null, type: null, source: 'none' };

    case 'custom':
    default:
      return {
        url: community.banner_media_url || null,
        type: (community.banner_media_type as 'image' | 'video') || 'image',
        source: 'custom',
      };
  }
}

/**
 * Get display label for banner source
 */
export function getBannerSourceLabel(source: BannerSource): string {
  switch (source) {
    case 'profile':
      return 'Using Profile Banner';
    case 'none':
      return 'No Banner';
    case 'custom':
    default:
      return 'Custom Banner';
  }
}
