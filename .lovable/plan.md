
# Backend Endpoint Stubs Implementation
## Preparing for Real DB/RPC Integration

---

## Overview

Create three backend functions with static JSON responses that match the agreed contracts. Frontend hooks will be updated to call these endpoints (with fallback to current mocks during transition).

---

## Phase 1: Create Edge Functions

### 1.1 Create `supabase/functions/get-config/index.ts`

Returns app configuration - trial policy, payments, limits, feature unlocks.

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /config - App configuration endpoint
 * 
 * Returns platform-wide configuration.
 * Currently returns static JSON; will be wired to DB/RPC.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // STUB: Static config - will be replaced with DB queries
  const config = {
    mvp_mode: true,
    payments_enabled: false,
    trial: {
      trial_enabled: true,
      allowed_lengths_days: [7, 14, 30],
      default_length_days: 14,
    },
    limits: {
      // No hard numbers - null means unlimited or config-driven
      free_track_uploads: null,
      trial_track_uploads: null,
      pro_track_uploads: null,
    },
    subscription_products: [
      {
        key: "artist_pro",
        name: "Artist Pro",
        price_ore: 9900,
        billing_period: "month",
        features: ["Advanced analytics", "Fan segmentation", "Campaign builder"],
        active: false,
      },
      {
        key: "artist_elite",
        name: "Artist Elite",
        price_ore: 24900,
        billing_period: "month",
        features: ["Everything in Pro", "Priority support", "Custom branding"],
        active: false,
      },
      {
        key: "fan_supporter",
        name: "Fan Supporter",
        price_ore: 5900,
        billing_period: "month",
        features: ["Additional votes", "Highlight votes"],
        active: false,
      },
    ],
    feature_unlocks: [
      // Artist features
      { feature_key: "basic_profile", required_level: "artist_free", mvp_available: true },
      { feature_key: "limited_uploads", required_level: "artist_free", mvp_available: true },
      { feature_key: "full_analytics", required_level: "artist_trial", mvp_available: true },
      { feature_key: "community_tools", required_level: "artist_trial", mvp_available: true },
      { feature_key: "advanced_analytics", required_level: "artist_pro", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      { feature_key: "fan_segmentation", required_level: "artist_pro", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      // Fan features
      { feature_key: "follow_artists", required_level: "fan_free", mvp_available: true },
      { feature_key: "basic_vote", required_level: "fan_free", mvp_available: true },
      { feature_key: "highlight_votes", required_level: "fan_supporter", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
      { feature_key: "vip_vote", required_level: "fan_superfan", mvp_available: true, post_mvp_label: "Pricing finalized post-MVP" },
    ],
  };

  return new Response(JSON.stringify(config), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
```

### 1.2 Create `supabase/functions/get-trial-status/index.ts`

Returns server-calculated trial status for authenticated user.

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /trial/status - Trial status endpoint
 * 
 * Returns server-calculated trial state for current user.
 * Currently returns static JSON; will query user_trials table.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Unauthenticated: return default state
      return new Response(JSON.stringify({
        trial_enabled: true,
        trial_length_days: null,
        trial_started_at: null,
        trial_ends_at: null,
        trial_days_left: null,
        trial_state: "none",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({
        trial_enabled: true,
        trial_length_days: null,
        trial_started_at: null,
        trial_ends_at: null,
        trial_days_left: null,
        trial_state: "none",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // STUB: Static trial status for MVP
    // TODO: Query user_trials table and calculate server-side
    const now = new Date();
    const trialStarted = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const trialEnds = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);
    
    const trialStatus = {
      trial_enabled: true,
      trial_length_days: 14,
      trial_started_at: trialStarted.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      trial_days_left: 11, // Server-calculated
      trial_state: "active" as const,
    };

    return new Response(JSON.stringify(trialStatus), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### 1.3 Create `supabase/functions/get-me/index.ts`

Returns user profile with resolved per-feature permissions.

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GET /me - Current user endpoint
 * 
 * Returns user profile with resolved per-feature permissions.
 * Permissions are boolean - UI renders based on these, no level comparisons.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    // Fetch profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch roles
    const { data: rolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const roles = rolesData?.map(r => r.role) ?? [];

    // STUB: Resolved permissions - MVP gives trial access to all features
    // TODO: Calculate based on subscription status, trial state, role
    const permissions: Record<string, boolean> = {
      // Artist features
      basic_profile: true,
      limited_uploads: true,
      full_analytics: true,      // MVP: trial access
      community_tools: true,     // MVP: trial access
      campaign_insights: true,   // MVP: trial access
      extended_uploads: true,    // MVP: trial access
      advanced_analytics: true,  // MVP: trial access
      fan_segmentation: true,    // MVP: trial access
      campaign_builder: true,    // MVP: trial access
      // Fan features
      follow_artists: true,
      basic_vote: true,
      leaderboard: true,
      highlight_votes: true,     // MVP: trial access
      extra_votes: true,         // MVP: trial access
      vip_vote: true,            // MVP: trial access
      collectibles: true,        // MVP: trial access
    };

    // STUB: Labels for features (optional, for UI display)
    const labels: Record<string, string> = {
      advanced_analytics: "Included in trial (MVP)",
      fan_segmentation: "Included in trial (MVP)",
      campaign_builder: "Included in trial (MVP)",
      highlight_votes: "Included in trial (MVP)",
      vip_vote: "Included in trial (MVP)",
    };

    const response = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? 'fan',
      roles,
      permissions,
      labels,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

---

## Phase 2: Update Frontend Types

### 2.1 Update `src/types/trial.ts`

Expand AppConfig to match new /config contract:

```typescript
/**
 * App Configuration - returned by GET /config endpoint
 */
export interface AppConfig {
  mvp_mode: boolean;
  payments_enabled: boolean;
  trial: {
    trial_enabled: boolean;
    allowed_lengths_days: number[];
    default_length_days: number;
  };
  limits: Record<string, number | null>;
  subscription_products: SubscriptionProduct[];
  feature_unlocks: FeatureUnlockConfig[];
}

export interface SubscriptionProduct {
  key: string;
  name: string;
  price_ore: number;
  billing_period: 'month' | 'year';
  features: string[];
  active: boolean;
}

export interface FeatureUnlockConfig {
  feature_key: string;
  required_level: string;
  mvp_available: boolean;
  post_mvp_label?: string;
}
```

### 2.2 Create `src/types/user.ts`

New type for /me response:

```typescript
/**
 * User Profile - returned by GET /me endpoint
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'artist' | 'fan' | 'brand' | 'super_admin';
  roles: string[];
  permissions: Record<string, boolean>;
  labels?: Record<string, string>;
}
```

---

## Phase 3: Update Frontend Hooks

### 3.1 Update `src/hooks/useAppConfig.ts`

Wire to GET /config with fallback:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppConfig } from '@/types/trial';

const FALLBACK_CONFIG: AppConfig = {
  mvp_mode: true,
  payments_enabled: false,
  trial: { trial_enabled: true, allowed_lengths_days: [7, 14, 30], default_length_days: 14 },
  limits: {},
  subscription_products: [],
  feature_unlocks: [],
};

export const useAppConfig = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-config');
      if (error) throw error;
      setConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
      // Keep fallback config
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isPaymentsEnabled = config.payments_enabled;

  return { config, isLoading, isPaymentsEnabled, refetch: fetchConfig };
};
```

### 3.2 Update `src/hooks/useTrialStatus.ts`

Wire to GET /trial/status with fallback:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrialStatus, DEFAULT_TRIAL_STATUS } from '@/types/trial';

export const useTrialStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(DEFAULT_TRIAL_STATUS);

  const fetchTrialStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('get-trial-status', {
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` } 
          : undefined,
      });
      if (error) throw error;
      setTrialStatus(data);
    } catch (err) {
      console.error('Error fetching trial status:', err);
      // Keep default status
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrialStatus();
  }, [fetchTrialStatus]);

  const isTrialActive = trialStatus.trial_state === 'active';
  const isTrialExpired = trialStatus.trial_state === 'expired';
  const hasNoTrial = trialStatus.trial_state === 'none';
  const isCheckingTrial = trialStatus.trial_state === 'loading' || 
    (trialStatus.trial_state === 'active' && trialStatus.trial_days_left === null);

  return { trialStatus, isLoading, isTrialActive, isTrialExpired, hasNoTrial, isCheckingTrial, refetch: fetchTrialStatus };
};
```

### 3.3 Create `src/hooks/useCurrentUser.ts`

New hook for GET /me with permissions:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

export const useCurrentUser = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    if (!user) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('get-me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setCurrentUser(data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Permission check helper
  const hasPermission = useCallback((featureKey: string): boolean => {
    if (!currentUser?.permissions) return false;
    return currentUser.permissions[featureKey] === true;
  }, [currentUser?.permissions]);

  // Label helper
  const getFeatureLabel = useCallback((featureKey: string): string | null => {
    return currentUser?.labels?.[featureKey] ?? null;
  }, [currentUser?.labels]);

  return { currentUser, isLoading, hasPermission, getFeatureLabel, refetch: fetchCurrentUser };
};
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `supabase/functions/get-config/index.ts` | App config endpoint stub |
| **Create** | `supabase/functions/get-trial-status/index.ts` | Trial status endpoint stub |
| **Create** | `supabase/functions/get-me/index.ts` | User profile + permissions endpoint stub |
| **Modify** | `src/types/trial.ts` | Expand AppConfig for new contract |
| **Create** | `src/types/user.ts` | UserProfile type with permissions |
| **Modify** | `src/hooks/useAppConfig.ts` | Wire to edge function |
| **Modify** | `src/hooks/useTrialStatus.ts` | Wire to edge function |
| **Create** | `src/hooks/useCurrentUser.ts` | New hook for /me with permission helpers |

---

## Migration Path

Once these stubs are deployed:

1. **Test endpoints** via curl/browser
2. **Verify frontend hooks** receive data
3. **Wire to real DB/RPC** - replace static JSON with queries
4. **Remove scaffolds** once permissions flow from /me

---

## Next Steps After Implementation

1. Deploy edge functions
2. Test each endpoint
3. Connect to real database tables (user_trials, app_config, etc.)
4. Remove `unlockConfig.mock.ts` and hierarchy scaffolds
