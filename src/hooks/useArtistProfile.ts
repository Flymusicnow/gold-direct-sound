import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistNameAvailability } from "./useArtistNameAvailability";
import { useProfileAvatar } from "./useProfileAvatar";
import { toast } from "sonner";

export interface ArtistProfileData {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
  avatar_url: string | null;
  banner_url: string | null;
  banner_url_mobile: string | null;
  banner_media_type: string | null;
  banner_media_type_mobile: string | null;
  banner_crop_data: Record<string, any> | null;
  banner_crop_data_mobile: Record<string, any> | null;
  banner_position_y: number | null;
  show_name_on_banner: boolean | null;
  profile_theme: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
}

export interface CreateProfileInput {
  artistName: string;
  bio?: string;
  genre?: string;
  city?: string;
  country?: string;
}

export interface UpdateProfileInput {
  artistName?: string;
  bio?: string;
  genre?: string;
  city?: string;
  country?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  bannerPositionY?: number;
  showNameOnBanner?: boolean;
  profileTheme?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface UseArtistProfileReturn {
  profile: ArtistProfileData | null;
  loading: boolean;
  saving: boolean;
  avatarUploader: ReturnType<typeof useProfileAvatar>;
  nameAvailability: ReturnType<typeof useArtistNameAvailability>;
  createProfile: (data: CreateProfileInput) => Promise<ActionResult>;
  updateProfile: (data: UpdateProfileInput) => Promise<ActionResult>;
  refetch: () => Promise<void>;
  isApproved: boolean;
  hasProfile: boolean;
}

/**
 * Unified artist profile hook.
 * Consolidates profile fetching, creation, updating, avatar upload, and name validation.
 * 
 * Key behaviors:
 * - Always sets status: 'approved' on profile creation (invite = approval in beta)
 * - Validates artist name uniqueness before create/update
 * - Updates artist_onboarding_progress on profile creation
 * - Provides avatar upload via useProfileAvatar
 * - Provides real-time name availability via useArtistNameAvailability
 */
export function useArtistProfile(): UseArtistProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ArtistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Integrate sub-hooks
  const nameAvailability = useArtistNameAvailability(user?.id);

  const avatarUploader = useProfileAvatar({
    profileType: 'artist',
    profileId: profile?.id,
    userId: user?.id || '',
    onSuccess: () => refetch(),
  });

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching artist profile:', error);
      }

      setProfile(data as ArtistProfileData | null);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const createProfile = useCallback(async (data: CreateProfileInput): Promise<ActionResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate artist name uniqueness
    if (nameAvailability.isAvailable === false) {
      return { success: false, error: 'This artist name is already taken' };
    }

    setSaving(true);

    try {
      // Check if profile already exists (update instead of create)
      const { data: existing } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing profile
        const { error } = await supabase
          .from('artist_profiles')
          .update({
            artist_name: data.artistName.trim(),
            bio: data.bio || null,
            genre: data.genre || null,
            city: data.city || null,
            country: data.country || null,
            status: 'approved', // Always approved for invited artists
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile - ALWAYS set status: 'approved'
        const { error } = await supabase
          .from('artist_profiles')
          .insert({
            user_id: user.id,
            artist_name: data.artistName.trim(),
            bio: data.bio || null,
            genre: data.genre || null,
            city: data.city || null,
            country: data.country || null,
            status: 'approved', // Invite = approval in beta
          });

        if (error) throw error;
      }

      // Mark onboarding as complete
      await supabase
        .from('artist_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      await refetch();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating/updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, nameAvailability.isAvailable, refetch]);

  const updateProfile = useCallback(async (data: UpdateProfileInput): Promise<ActionResult> => {
    if (!user || !profile) {
      return { success: false, error: 'No profile to update' };
    }

    // If artist name is being changed, validate uniqueness
    if (data.artistName && data.artistName !== profile.artist_name) {
      if (nameAvailability.isAvailable === false) {
        return { success: false, error: 'This artist name is already taken' };
      }
    }

    setSaving(true);

    try {
      const updateData: Record<string, any> = {};
      
      if (data.artistName !== undefined) updateData.artist_name = data.artistName.trim() || null;
      if (data.bio !== undefined) updateData.bio = data.bio || null;
      if (data.genre !== undefined) updateData.genre = data.genre || null;
      if (data.city !== undefined) updateData.city = data.city || null;
      if (data.country !== undefined) updateData.country = data.country || null;
      if (data.instagramUrl !== undefined) updateData.instagram_url = data.instagramUrl || null;
      if (data.tiktokUrl !== undefined) updateData.tiktok_url = data.tiktokUrl || null;
      if (data.youtubeUrl !== undefined) updateData.youtube_url = data.youtubeUrl || null;
      if (data.twitterUrl !== undefined) updateData.twitter_url = data.twitterUrl || null;
      if (data.websiteUrl !== undefined) updateData.website_url = data.websiteUrl || null;
      if (data.bannerPositionY !== undefined) updateData.banner_position_y = data.bannerPositionY;
      if (data.showNameOnBanner !== undefined) updateData.show_name_on_banner = data.showNameOnBanner;
      if (data.profileTheme !== undefined) updateData.profile_theme = data.profileTheme;

      const { error } = await supabase
        .from('artist_profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, profile, nameAvailability.isAvailable, refetch]);

  return {
    profile,
    loading,
    saving,
    avatarUploader,
    nameAvailability,
    createProfile,
    updateProfile,
    refetch,
    isApproved: profile?.status === 'approved',
    hasProfile: !!profile,
  };
}
