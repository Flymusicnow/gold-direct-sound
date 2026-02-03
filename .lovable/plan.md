# V2 Canon — COMPLETE ✓

All V2 canon blockers have been resolved. The system is now fully compliant.

## Summary of Changes

### Phase 1-2: Database & RPCs (Completed)
- Created `platform_config`, `access_levels`, `feature_permissions`, `user_trials` tables
- Implemented `resolve_user_permissions` and `get_trial_status` RPCs
- Added öre pricing columns; set `fan_supporter` = 3900 öre

### Phase 3: Edge Functions (Completed)
- Wired `get-config`, `get-me`, `get-trial-status` to database

### Phase 4: Frontend Cleanup (Completed)
- Deleted `unlockConfig.mock.ts`
- Stripped hierarchy logic from `unlockLevels.ts`
- Removed `UserTier` type and `checkTierAccess` from `FeatureFlagContext.tsx`
- Updated `TrialBanner.tsx` copy to reflect scoped access

## V2 Canon Compliance

| Requirement | Status |
|-------------|--------|
| Zero client-side tier logic | ✓ |
| Backend single source of truth | ✓ |
| Numeric permissions (0, 10, 20, 30) | ✓ |
| Scope-aware trials | ✓ |
| Pricing in öre | ✓ |
| Copy reflects actual behavior | ✓ |

**V2 Canon is now locked.**
