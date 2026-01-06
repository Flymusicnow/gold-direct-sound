/**
 * About section content resolution for community pages.
 * 
 * KEY PRINCIPLE: Empty states are explicit, never silent.
 */

export interface AboutLink {
  label: string;
  url: string;
  isInternal: boolean;
}

export interface AboutContent {
  content: string | null;
  mission: string | null;
  links: AboutLink[];
  isEmpty: boolean;
  isInherited: boolean;
  emptyMessage: string;
}

interface Community {
  about_content?: string | null;
  about_mission?: string | null;
  about_links?: AboutLink[] | null;
}

interface ArtistProfile {
  bio?: string | null;
  artist_name?: string;
}

/**
 * Resolves the about section content for a community.
 * 
 * Priority:
 * 1. Community's about_content (if set)
 * 2. Artist's bio (inherited, marked as such)
 * 3. Explicit empty state with message
 * 
 * @param community - The community data
 * @param artistProfile - The artist profile data
 * @returns The resolved about content
 */
export function getAboutContent(
  community: Community | null | undefined,
  artistProfile: ArtistProfile | null | undefined
): AboutContent {
  // Check community about content first
  if (community?.about_content?.trim()) {
    // Parse links if they're stored as JSON
    let links: AboutLink[] = [];
    if (community.about_links) {
      if (Array.isArray(community.about_links)) {
        links = community.about_links.map((link) => ({
          ...link,
          isInternal: isInternalUrl(link.url),
        }));
      }
    }

    return {
      content: community.about_content.trim(),
      mission: community.about_mission?.trim() || null,
      links,
      isEmpty: false,
      isInherited: false,
      emptyMessage: '',
    };
  }

  // Fall back to artist bio
  if (artistProfile?.bio?.trim()) {
    return {
      content: artistProfile.bio.trim(),
      mission: null,
      links: [],
      isEmpty: false,
      isInherited: true,
      emptyMessage: '',
    };
  }

  // Explicit empty state
  const artistName = artistProfile?.artist_name || 'This artist';
  return {
    content: null,
    mission: null,
    links: [],
    isEmpty: true,
    isInherited: false,
    emptyMessage: `${artistName} hasn't added an About section yet.`,
  };
}

/**
 * Check if a URL is internal to FlyMusic
 */
function isInternalUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url, window.location.origin);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check for FlyMusic domains
    return (
      hostname === 'flymusic.app' ||
      hostname === 'www.flymusic.app' ||
      hostname.endsWith('.flymusic.app') ||
      hostname === window.location.hostname ||
      url.startsWith('/')
    );
  } catch {
    // Relative URL
    return url.startsWith('/');
  }
}

/**
 * Format about links for display, prioritizing internal links
 */
export function sortAboutLinks(links: AboutLink[]): AboutLink[] {
  return [...links].sort((a, b) => {
    // Internal links first
    if (a.isInternal && !b.isInternal) return -1;
    if (!a.isInternal && b.isInternal) return 1;
    return 0;
  });
}
