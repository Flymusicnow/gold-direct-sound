import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/hooks/useAppMode";
import { useBetaAccess } from "@/hooks/useBetaAccess";

/**
 * Hook to determine if the current user is in "preview mode"
 * 
 * Preview mode applies when:
 * - User is not authenticated AND app is in PRIVATE_BETA mode
 * - OR user is authenticated but doesn't have beta access in PRIVATE_BETA mode
 * 
 * In preview mode, users can SEE content but cannot interact (no playback, follow, like, etc.)
 */
export function usePreviewMode() {
  const { user } = useAuth();
  const { mode, loading: modeLoading } = useAppMode();
  const { hasBetaAccess, loading: accessLoading } = useBetaAccess();

  const loading = modeLoading || accessLoading;

  // Preview mode = PRIVATE_BETA mode AND (no user OR user without beta access)
  const isPreviewMode = mode === 'PRIVATE_BETA' && (!user || !hasBetaAccess);

  return { 
    isPreviewMode, 
    loading,
    isPrivateBeta: mode === 'PRIVATE_BETA'
  };
}
