import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuthorRole = 'artist' | 'fan' | 'moderator';

export interface AuthorIdentity {
  displayName: string;
  roleBadge: AuthorRole | null;
  avatarUrl: string | null;
  isVerified: boolean;
  artistProfileId: string | null;
  isNavigable: boolean;
  isLoading: boolean;
}

const DEFAULT_IDENTITY: AuthorIdentity = {
  displayName: 'Unknown User',
  roleBadge: null,
  avatarUrl: null,
  isVerified: false,
  artistProfileId: null,
  isNavigable: false,
  isLoading: true,
};

/**
 * Resolves author identity for display in posts and comments.
 * 
 * KEY PRINCIPLE: Never return "Artist" or "Anonymous" as displayName.
 * Always resolve to an actual name.
 * 
 * @param authorId - The user ID of the author
 * @param authorType - Optional explicit role type
 * @param communityArtistUserId - Optional community artist's user ID to detect owner
 */
export function useAuthorIdentity(
  authorId: string | null | undefined,
  authorType?: AuthorRole,
  communityArtistUserId?: string
): AuthorIdentity {
  const [identity, setIdentity] = useState<AuthorIdentity>(DEFAULT_IDENTITY);

  useEffect(() => {
    if (!authorId) {
      setIdentity({
        ...DEFAULT_IDENTITY,
        displayName: 'Unknown User',
        isLoading: false,
      });
      return;
    }

    let cancelled = false;

    async function fetchIdentity() {
      try {
        // Check if author is the community artist (overrides to 'artist' badge)
        const isOwner = communityArtistUserId === authorId;
        const effectiveType = isOwner ? 'artist' : authorType;

        // Try to get artist profile first if type suggests artist
        if (effectiveType === 'artist' || !effectiveType) {
          const { data: artistProfile } = await supabase
            .from('artist_profiles')
            .select('id, artist_name, avatar_url, user_id')
            .eq('user_id', authorId)
            .maybeSingle();

          if (artistProfile && !cancelled) {
            // Check verification status
            const { data: verification } = await supabase
              .from('artist_verifications')
              .select('verification_status')
              .eq('user_id', authorId)
              .eq('verification_status', 'verified')
              .maybeSingle();

            setIdentity({
              displayName: artistProfile.artist_name || 'Artist',
              roleBadge: 'artist',
              avatarUrl: artistProfile.avatar_url,
              isVerified: !!verification,
              artistProfileId: artistProfile.id,
              isNavigable: true,
              isLoading: false,
            });
            return;
          }
        }

        // Fall back to profile lookup - use public_profiles view for privacy
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('full_name, avatar_url')
          .eq('id', authorId)
          .maybeSingle();

        if (!cancelled) {
          // Resolve display name - NEVER use generic labels
          const displayName = profile?.full_name?.trim() || 'Fan';

          // Determine role badge
          let roleBadge: AuthorRole = effectiveType || 'fan';

          // Check if user is a moderator for this community
          if (!effectiveType || effectiveType === 'moderator') {
            const { data: modData } = await supabase
              .from('community_moderators')
              .select('id')
              .eq('user_id', authorId)
              .eq('is_active', true)
              .limit(1);

            if (modData && modData.length > 0) {
              roleBadge = 'moderator';
            }
          }

          setIdentity({
            displayName,
            roleBadge,
            avatarUrl: profile?.avatar_url || null,
            isVerified: false,
            artistProfileId: null,
            isNavigable: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error fetching author identity:', error);
        if (!cancelled) {
          setIdentity({
            ...DEFAULT_IDENTITY,
            displayName: 'Unknown User',
            isLoading: false,
          });
        }
      }
    }

    fetchIdentity();

    return () => {
      cancelled = true;
    };
  }, [authorId, authorType, communityArtistUserId]);

  return identity;
}

/**
 * Batch fetch author identities for multiple users.
 * More efficient for lists of comments/posts.
 */
export async function fetchAuthorIdentities(
  authorIds: string[],
  communityArtistUserId?: string
): Promise<Map<string, AuthorIdentity>> {
  const identityMap = new Map<string, AuthorIdentity>();
  const uniqueIds = [...new Set(authorIds)];

  if (uniqueIds.length === 0) return identityMap;

  try {
    // Batch fetch artist profiles
    const { data: artistProfiles } = await supabase
      .from('artist_profiles')
      .select('id, artist_name, avatar_url, user_id')
      .in('user_id', uniqueIds);

    const artistByUserId = new Map(
      (artistProfiles || []).map((a) => [a.user_id, a])
    );

    // Batch fetch regular profiles - use public_profiles view for privacy
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', uniqueIds);

    const profileById = new Map((profiles || []).map((p) => [p.id, p]));

    // Batch fetch moderator status
    const { data: moderators } = await supabase
      .from('community_moderators')
      .select('user_id')
      .in('user_id', uniqueIds)
      .eq('is_active', true);

    const moderatorSet = new Set((moderators || []).map((m) => m.user_id));

    // Build identity map
    for (const userId of uniqueIds) {
      const isOwner = communityArtistUserId === userId;
      const artistProfile = artistByUserId.get(userId);
      const profile = profileById.get(userId);
      const isModerator = moderatorSet.has(userId);

      if (artistProfile || isOwner) {
        identityMap.set(userId, {
          displayName: artistProfile?.artist_name || profile?.full_name || 'Artist',
          roleBadge: 'artist',
          avatarUrl: artistProfile?.avatar_url || profile?.avatar_url || null,
          isVerified: false, // Would need separate query
          artistProfileId: artistProfile?.id || null,
          isNavigable: !!artistProfile,
          isLoading: false,
        });
      } else {
        const displayName = profile?.full_name?.trim() || 'Fan';

        identityMap.set(userId, {
          displayName,
          roleBadge: isModerator ? 'moderator' : 'fan',
          avatarUrl: profile?.avatar_url || null,
          isVerified: false,
          artistProfileId: null,
          isNavigable: false,
          isLoading: false,
        });
      }
    }
  } catch (error) {
    console.error('Error batch fetching identities:', error);
  }

  return identityMap;
}
