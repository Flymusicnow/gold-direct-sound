import { useFeatureFlags, FeatureFlagKey } from '@/contexts/FeatureFlagContext';

export const useFeatureFlag = (key: FeatureFlagKey): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
};
