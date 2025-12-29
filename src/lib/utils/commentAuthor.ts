/**
 * Comment Author Utility
 * Determines author type, navigation behavior, and display name for comments.
 * 
 * RULES:
 * - Anonymous: No profile name AND not an artist → "Anonymous", not clickable
 * - Artist: Has commenterArtistId → Link to /artist/{id}
 * - Fan (beta): Has profile name but NOT artist → show name, NOT navigable
 * - Bad data: Artist flag but no ID → treat as anonymous
 */

export type CommentAuthorType = 'artist' | 'fan' | 'anonymous';

export interface CommentAuthorInfo {
  authorType: CommentAuthorType;
  authorArtistId: string | null;
  displayName: string;
  isNavigable: boolean;
  targetPath: string | null;
}

interface CommentProfile {
  full_name?: string | null;
  avatar_url?: string | null;
}

/**
 * Get author info for a comment.
 * 
 * @param profile - The profile data for the comment author
 * @param isCommenterArtist - Whether the commenter has an approved artist profile
 * @param commenterArtistId - The artist profile ID (NOT user_id) for navigation
 * @returns CommentAuthorInfo with type, display name, and navigation info
 */
export function getCommentAuthorInfo(
  profile: CommentProfile | null | undefined,
  isCommenterArtist: boolean,
  commenterArtistId: string | null | undefined
): CommentAuthorInfo {
  const hasName = !!profile?.full_name?.trim();
  const safeArtistId = commenterArtistId || null;

  // Artist author: MUST have both flag AND valid ID
  if (isCommenterArtist && safeArtistId) {
    return {
      authorType: 'artist',
      authorArtistId: safeArtistId,
      displayName: profile?.full_name?.trim() || 'Artist',
      isNavigable: true,
      targetPath: `/artist/${safeArtistId}`,
    };
  }

  // Fan author: has a name but is NOT an artist
  // Beta rule (Option A): Fans are NOT navigable
  if (hasName) {
    return {
      authorType: 'fan',
      authorArtistId: null,
      displayName: profile!.full_name!.trim(),
      isNavigable: false,
      targetPath: null,
    };
  }

  // Anonymous: no name and not an artist (or bad data: artist flag but no ID)
  return {
    authorType: 'anonymous',
    authorArtistId: null,
    displayName: 'Anonymous',
    isNavigable: false,
    targetPath: null,
  };
}
