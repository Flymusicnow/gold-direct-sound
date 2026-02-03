
# FlyMusic V2 Canon Alignment — Full Implementation Plan

## Overview

This plan implements all required changes to align FlyMusic with V2 Canon. All violations identified in the audit will be fixed. The system will match the locked state exactly.

---

## Phase 1: Database Schema (4 Migrations)

### 1.1 Create `platform_config` Table

Creates the centralized configuration table with canonical MVP defaults.

```sql
CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed canonical defaults
INSERT INTO public.platform_config (key, value, description) VALUES
  ('mvp_mode', jsonb_build_object('enabled', true, 'grants', jsonb_build_array('artist_trial', 'fan_supporter')), 'MVP mode flag with restricted preview grants'),
  ('payments_enabled', 'false'::jsonb, 'Payment processing enabled (must be explicitly turned on)'),
  ('trial_policy', jsonb_build_object('enabled', true, 'allowed_lengths_days', jsonb_build_array(7, 14, 30), 'default_length_days', 14), 'Trial configuration')
ON CONFLICT (key) DO NOTHING;
```

### 1.2 Create `access_levels` Table (Numeric Canon)

Establishes the numeric level system: 0, 10, 20, 30.

```sql
CREATE TABLE IF NOT EXISTS public.access_levels (
  code TEXT PRIMARY KEY,
  user_type TEXT NOT NULL,
  level INTEGER NOT NULL
);

INSERT INTO public.access_levels (code, user_type, level) VALUES
  ('artist_free', 'artist', 0),
  ('artist_trial', 'artist', 10),
  ('artist_pro', 'artist', 20),
  ('artist_elite', 'artist', 30),
  ('fan_free', 'fan', 0),
  ('fan_trial', 'fan', 10),
  ('fan_supporter', 'fan', 20),
  ('fan_superfan', 'fan', 30)
ON CONFLICT (code) DO NOTHING;
```

### 1.3 Create `feature_permissions` Table (Numeric Required Level)

Feature access rules with numeric levels, not strings.

```sql
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  user_type TEXT NOT NULL,
  required_level INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  mvp_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed canonical permissions
INSERT INTO public.feature_permissions 
  (feature_key, feature_name, user_type, required_level, sort_order, mvp_available)
VALUES
  ('basic_profile', 'Basic Profile', 'artist', 0, 10, true),
  ('limited_uploads', 'Limited Uploads', 'artist', 0, 20, true),
  ('full_analytics', 'Full Analytics', 'artist', 10, 30, true),
  ('community_tools', 'Community Tools', 'artist', 10, 40, true),
  ('advanced_analytics', 'Advanced Analytics', 'artist', 20, 50, true),
  ('fan_segmentation', 'Fan Segmentation', 'artist', 20, 60, true),
  ('campaign_builder', 'Campaign Builder', 'artist', 20, 70, true),
  ('follow_artists', 'Follow Artists', 'fan', 0, 10, true),
  ('basic_vote', 'Basic Voting', 'fan', 0, 20, true),
  ('highlight_votes', 'Highlight Votes', 'fan', 20, 30, true),
  ('vip_vote', 'VIP Votes', 'fan', 30, 40, true)
ON CONFLICT (feature_key) DO NOTHING;
```

### 1.4 Create `user_trials` Table (Scope-Aware)

Trial system with type and level_scope fields.

```sql
CREATE TABLE IF NOT EXISTS public.user_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trial_type TEXT NOT NULL DEFAULT 'platform',
  level_scope INTEGER NOT NULL DEFAULT 10,
  trial_length_days INTEGER NOT NULL DEFAULT 14,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  converted_to_plan TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, trial_type)
);

-- Auto-calculate ends_at trigger
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ends_at := NEW.started_at + (NEW.trial_length_days || ' days')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_trials_set_end_date ON public.user_trials;
CREATE TRIGGER user_trials_set_end_date
BEFORE INSERT ON public.user_trials
FOR EACH ROW EXECUTE FUNCTION public.set_trial_end_date();
```

### 1.5 Migrate `premium_plans` to öre + Fix Fan Supporter Price

```sql
ALTER TABLE public.premium_plans
  ADD COLUMN IF NOT EXISTS price_monthly_ore INTEGER,
  ADD COLUMN IF NOT EXISTS price_yearly_ore INTEGER;

UPDATE public.premium_plans
SET
  price_monthly_ore = COALESCE(price_monthly_ore, COALESCE(price_monthly, 0) * 100),
  price_yearly_ore = COALESCE(price_yearly_ore, COALESCE(price_yearly, 0) * 100);

-- Canon pricing: fan_supporter = 39 SEK = 3900 öre
UPDATE public.premium_plans
SET price_monthly_ore = 3900
WHERE plan_key = 'fan_supporter';
```

---

## Phase 2: Database Functions (RPCs)

### 2.1 Create `get_trial_status` RPC

Returns scope-aware trial object with `type` and `level_scope`.

```sql
CREATE OR REPLACE FUNCTION public.get_trial_status(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trial RECORD;
  _trial_policy JSONB;
  _days_left INT;
BEGIN
  SELECT value INTO _trial_policy FROM public.platform_config WHERE key = 'trial_policy';

  SELECT * INTO _trial
  FROM public.user_trials
  WHERE user_id = _user_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF _trial IS NULL THEN
    RETURN jsonb_build_object(
      'trial_enabled', COALESCE((_trial_policy->>'enabled')::BOOLEAN, true),
      'trial', jsonb_build_object(
        'active', false, 'type', NULL, 'level_scope', NULL,
        'started_at', NULL, 'ends_at', NULL, 'days_left', NULL, 'state', 'none'
      )
    );
  END IF;

  _days_left := GREATEST(0, EXTRACT(DAY FROM (_trial.ends_at - now()))::INT);

  RETURN jsonb_build_object(
    'trial_enabled', true,
    'trial', jsonb_build_object(
      'active', (_trial.ends_at > now() AND _trial.status = 'active'),
      'type', _trial.trial_type,
      'level_scope', _trial.level_scope,
      'started_at', _trial.started_at,
      'ends_at', _trial.ends_at,
      'days_left', _days_left,
      'state', CASE
        WHEN _trial.status = 'active' AND _trial.ends_at > now() THEN 'active'
        WHEN _trial.status = 'converted' THEN 'converted'
        ELSE 'expired'
      END
    )
  );
END;
$$;
```

### 2.2 Create `resolve_user_permissions` RPC

Numeric permission resolution with restricted MVP grants.

```sql
CREATE OR REPLACE FUNCTION public.resolve_user_permissions(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mvp JSONB;
  _mvp_enabled BOOLEAN := true;
  _mvp_grants JSONB := '[]'::JSONB;
  _role TEXT := 'fan';
  _user_level INT := 0;
  _trial JSONB;
  _trial_active BOOLEAN := false;
  _trial_level INT := 0;
  _permissions JSONB := '{}'::JSONB;
  _perm RECORD;
BEGIN
  -- MVP mode config
  SELECT value INTO _mvp FROM public.platform_config WHERE key = 'mvp_mode';
  _mvp_enabled := COALESCE((_mvp->>'enabled')::BOOLEAN, true);
  _mvp_grants := COALESCE((_mvp->'grants'), '[]'::JSONB);

  -- Get user role
  SELECT COALESCE(p.role, 'fan') INTO _role FROM public.profiles p WHERE p.id = _user_id;

  -- Get trial status
  SELECT public.get_trial_status(_user_id) INTO _trial;
  _trial_active := COALESCE((_trial#>>'{trial,active}')::BOOLEAN, false);
  _trial_level := COALESCE((_trial#>>'{trial,level_scope}')::INT, 0);

  -- Baseline = free (0)
  _user_level := 0;

  -- Apply RESTRICTED MVP grants
  IF _mvp_enabled THEN
    IF _role = 'artist' AND (_mvp_grants ? 'artist_trial') THEN
      _user_level := GREATEST(_user_level, 10);
    END IF;
    IF _role = 'fan' AND (_mvp_grants ? 'fan_supporter') THEN
      _user_level := GREATEST(_user_level, 20);
    END IF;
  END IF;

  -- Apply trial scope
  IF _trial_active THEN
    _user_level := GREATEST(_user_level, _trial_level);
  END IF;

  -- Compute permissions numerically
  FOR _perm IN
    SELECT feature_key, required_level
    FROM public.feature_permissions
    WHERE is_active = true AND (user_type = _role OR user_type = 'all')
    ORDER BY sort_order
  LOOP
    _permissions := _permissions || jsonb_build_object(
      _perm.feature_key,
      (_user_level >= _perm.required_level)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'role', _role,
    'effective_level', _user_level,
    'trial', _trial->'trial',
    'mvp_mode', jsonb_build_object('enabled', _mvp_enabled, 'grants', _mvp_grants),
    'permissions', _permissions
  );
END;
$$;
```

---

## Phase 3: Edge Functions (Wire to DB)

### 3.1 Update `get-config/index.ts`

Replace static JSON with DB queries. Return `required_level` as INTEGER.

**Key changes:**
- Query `platform_config` for mvp_mode, payments_enabled, trial_policy
- Query `premium_plans` for subscription products with `price_monthly_ore`
- Query `feature_permissions` for feature unlocks with numeric `required_level`

### 3.2 Update `get-me/index.ts`

Replace static permissions with RPC call.

**Key changes:**
- Call `resolve_user_permissions(_user_id)` RPC
- Return `effective_level`, `trial` object, `mvp_mode`, `permissions`
- Remove hardcoded permission stub

### 3.3 Update `get-trial-status/index.ts`

Replace static trial with RPC call.

**Key changes:**
- Call `get_trial_status(_user_id)` RPC
- Return scope-aware trial object with `type` and `level_scope`
- Remove fake date calculations

---

## Phase 4: Frontend Cleanup

### 4.1 DELETE File

```
src/config/unlockConfig.mock.ts
```

### 4.2 Strip `src/types/unlockLevels.ts`

**REMOVE (lines 44-78):**
- `ARTIST_LEVEL_HIERARCHY`
- `FAN_LEVEL_HIERARCHY`
- `checkArtistLevel`
- `checkFanLevel`

**KEEP (lines 21-42):**
- Type definitions: `ArtistLevel`, `FanLevel`, `UnlockLevel`, `FeatureUnlock`
- Helper functions: `isArtistLevel`, `isFanLevel`

### 4.3 Update `src/contexts/FeatureFlagContext.tsx`

**REMOVE:**
- Import of `checkArtistLevel`, `checkFanLevel` (line 6-7)
- `checkArtistUnlock` method (lines 151-153)
- `checkFanUnlock` method (lines 155-157)
- Context type properties for these methods (lines 52-53)
- Provider value properties (lines 168-169)

### 4.4 Update `src/types/trial.ts`

Update `FeatureUnlockConfig` to use numeric `required_level`:

```typescript
export interface FeatureUnlockConfig {
  feature_key: string;
  required_level: number; // CHANGED from string to number
  user_type: string;
}
```

### 4.5 Update `src/types/user.ts`

Add new fields from canonical `/me` response:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'artist' | 'fan' | 'brand' | 'super_admin';
  roles: string[];
  permissions: Record<string, boolean>;
  effective_level: number;
  trial: {
    active: boolean;
    type: string | null;
    level_scope: number | null;
    started_at: string | null;
    ends_at: string | null;
    days_left: number | null;
    state: 'active' | 'expired' | 'converted' | 'none';
  };
  mvp_mode: {
    enabled: boolean;
    grants: string[];
  };
}
```

---

## Phase 5: Verification Checklist

After implementation, these MUST be true:

| Check | Expected |
|-------|----------|
| `vip_vote` permission for fan | `false` (requires level 30, MVP grants max 20) |
| Artist effective_level in MVP | `10` (artist_trial) |
| Fan effective_level in MVP | `20` (fan_supporter) |
| `/config.feature_unlocks[].required_level` | `number` (0, 10, 20, 30) |
| `/trial/status.trial.type` | Present (not null for active trials) |
| `/trial/status.trial.level_scope` | Present (numeric) |
| `fan_supporter.price_ore` in DB | `3900` |
| `unlockConfig.mock.ts` | DELETED |
| Client-side hierarchy logic | REMOVED |

---

## File Changes Summary

| Action | File |
|--------|------|
| **DB Migration** | Create `platform_config`, `access_levels`, `feature_permissions`, `user_trials` |
| **DB Migration** | Add öre columns to `premium_plans`, fix `fan_supporter` price |
| **DB Function** | Create `get_trial_status` RPC |
| **DB Function** | Create `resolve_user_permissions` RPC |
| **Update** | `supabase/functions/get-config/index.ts` |
| **Update** | `supabase/functions/get-me/index.ts` |
| **Update** | `supabase/functions/get-trial-status/index.ts` |
| **DELETE** | `src/config/unlockConfig.mock.ts` |
| **Strip** | `src/types/unlockLevels.ts` (remove scaffolds, keep types) |
| **Update** | `src/contexts/FeatureFlagContext.tsx` (remove unlock methods) |
| **Update** | `src/types/trial.ts` (numeric required_level) |
| **Update** | `src/types/user.ts` (add effective_level, trial object, mvp_mode) |

---

## Technical Notes

1. **MVP Mode Restriction**: MVP grants ONLY `artist_trial` (10) and `fan_supporter` (20). Elite/Superfan (30) remain locked.

2. **Numeric Comparison**: All permission checks use `user_level >= required_level`. No string matching.

3. **Trial Scope**: Trials have `level_scope` that caps what they unlock. A `fan_trial` with `level_scope: 10` cannot unlock `highlight_votes` (requires 20).

4. **Pricing Unit**: All internal pricing uses öre (1 SEK = 100 öre). `fan_supporter` = 3900 öre = 39 SEK.

5. **No Client Logic**: Frontend uses ONLY `hasPermission(feature_key)`. Zero tier comparisons.
