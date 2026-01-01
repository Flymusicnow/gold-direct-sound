import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileAvatar } from "./useProfileAvatar";

export interface FanProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface UpdateFanProfileInput {
  fullName?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface UseFanProfileReturn {
  profile: FanProfileData | null;
  loading: boolean;
  saving: boolean;
  avatarUploader: ReturnType<typeof useProfileAvatar>;
  updateProfile: (data: UpdateFanProfileInput) => Promise<ActionResult>;
  completeOnboarding: () => Promise<ActionResult>;
  skipOnboarding: () => Promise<ActionResult>;
  refetch: () => Promise<void>;
  hasProfile: boolean;
  isOnboarded: boolean;
}

/**
 * Unified fan profile hook.
 * Consolidates profile updating, avatar upload, and onboarding progress.
 * 
 * Key behaviors:
 * - Uses profiles table (shared with all users)
 * - Provides avatar upload via useProfileAvatar
 * - Manages fan_onboarding_progress table
 */
export function useFanProfile(): UseFanProfileReturn {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  const avatarUploader = useProfileAvatar({
    profileType: 'fan',
    profileId: user?.id,
    userId: user?.id || '',
    onSuccess: async () => {
      await refreshProfile();
    },
  });

  // Build profile data from auth context
  const profile: FanProfileData | null = user && authProfile ? {
    id: user.id,
    email: authProfile.email,
    full_name: authProfile.full_name,
    avatar_url: (authProfile as any)?.avatar_url || null,
  } : null;

  const refetch = useCallback(async () => {
    await refreshProfile();
    
    // Check onboarding status
    if (user) {
      const { data } = await supabase
        .from('fan_onboarding_progress')
        .select('onboarding_completed, onboarding_skipped')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsOnboarded(data?.onboarding_completed || data?.onboarding_skipped || false);
    }
    setLoading(false);
  }, [user, refreshProfile]);

  const updateProfile = useCallback(async (data: UpdateFanProfileInput): Promise<ActionResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setSaving(true);

    try {
      const updateData: Record<string, any> = {};
      
      if (data.fullName !== undefined) {
        updateData.full_name = data.fullName || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating fan profile:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, refreshProfile]);

  const completeOnboarding = useCallback(async (): Promise<ActionResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsOnboarded(true);
      return { success: true };
    } catch (error: any) {
      console.error('Error completing fan onboarding:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const skipOnboarding = useCallback(async (): Promise<ActionResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('fan_onboarding_progress')
        .upsert({
          user_id: user.id,
          onboarding_skipped: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsOnboarded(true);
      return { success: true };
    } catch (error: any) {
      console.error('Error skipping fan onboarding:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  return {
    profile,
    loading,
    saving,
    avatarUploader,
    updateProfile,
    completeOnboarding,
    skipOnboarding,
    refetch,
    hasProfile: !!profile,
    isOnboarded,
  };
}
