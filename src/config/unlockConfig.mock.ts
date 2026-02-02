/**
 * ============================================================
 * TEMP MOCK — remove once /config provides feature metadata.
 * Not business logic. For UI scaffolding only.
 * ============================================================
 * 
 * This file will be DELETED when backend provides:
 * - GET /config with feature_unlocks array
 * - Per-feature unlock level metadata
 */

import { FeatureUnlock } from '@/types/unlockLevels';

// TEMP MOCK: Artist feature unlocks
export const MOCK_ARTIST_FEATURE_UNLOCKS: Record<string, FeatureUnlock> = {
  // Artist Free (always)
  'basic_profile': { feature_key: 'basic_profile', required_level: 'artist_free', mvp_available: true },
  'limited_uploads': { feature_key: 'limited_uploads', required_level: 'artist_free', mvp_available: true },
  'basic_campaigns': { feature_key: 'basic_campaigns', required_level: 'artist_free', mvp_available: true },
  'discovery': { feature_key: 'discovery', required_level: 'artist_free', mvp_available: true },
  'basic_stats': { feature_key: 'basic_stats', required_level: 'artist_free', mvp_available: true },
  
  // Artist Trial (MVP: available)
  'full_analytics': { feature_key: 'full_analytics', required_level: 'artist_trial', mvp_available: true },
  'community_tools': { feature_key: 'community_tools', required_level: 'artist_trial', mvp_available: true },
  'campaign_insights': { feature_key: 'campaign_insights', required_level: 'artist_trial', mvp_available: true },
  'extended_uploads': { feature_key: 'extended_uploads', required_level: 'artist_trial', mvp_available: true },
  
  // Artist Pro (post-MVP)
  'advanced_analytics': { feature_key: 'advanced_analytics', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'fan_segmentation': { feature_key: 'fan_segmentation', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'campaign_builder': { feature_key: 'campaign_builder', required_level: 'artist_pro', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
};

// TEMP MOCK: Fan feature unlocks
export const MOCK_FAN_FEATURE_UNLOCKS: Record<string, FeatureUnlock> = {
  // Fan Free/Trial (always/trial)
  'follow_artists': { feature_key: 'follow_artists', required_level: 'fan_free', mvp_available: true },
  'basic_vote': { feature_key: 'basic_vote', required_level: 'fan_free', mvp_available: true },
  'leaderboard': { feature_key: 'leaderboard', required_level: 'fan_free', mvp_available: true },
  'fan_discovery': { feature_key: 'fan_discovery', required_level: 'fan_free', mvp_available: true },
  
  // Fan Supporter (post-MVP)
  'highlight_votes': { feature_key: 'highlight_votes', required_level: 'fan_supporter', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'extra_votes': { feature_key: 'extra_votes', required_level: 'fan_supporter', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  
  // Fan Superfan (post-MVP)
  'vip_vote': { feature_key: 'vip_vote', required_level: 'fan_superfan', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
  'collectibles': { feature_key: 'collectibles', required_level: 'fan_superfan', mvp_available: true, post_mvp_label: 'Pricing finalized post-MVP' },
};
