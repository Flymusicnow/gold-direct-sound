/**
 * User Profile - returned by GET /me endpoint
 * 
 * V2 Canon: Backend resolves all permissions.
 * Frontend uses ONLY permissions[feature_key] for access checks.
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'artist' | 'fan' | 'brand' | 'super_admin';
  roles: string[];
  /**
   * Backend-resolved permissions map.
   * Use: permissions['feature_key'] === true for access checks.
   * NO client-side tier comparisons allowed.
   */
  permissions: Record<string, boolean>;
  /**
   * Numeric effective level (0, 10, 20, 30) for display purposes only.
   * DO NOT use for access logic - use permissions instead.
   */
  effective_level: number;
  /**
   * Scope-aware trial object from backend.
   */
  trial: {
    active: boolean;
    type: string | null;
    level_scope: number | null;
    started_at: string | null;
    ends_at: string | null;
    days_left: number | null;
    state: 'active' | 'expired' | 'converted' | 'none';
  };
  /**
   * MVP mode configuration showing what grants are active.
   */
  mvp_mode: {
    enabled: boolean;
    grants: string[];
  };
  /**
   * Optional labels for UI display (e.g., "Included in trial (MVP)")
   */
  labels?: Record<string, string>;
}
