/**
 * User Profile - returned by GET /me endpoint
 * 
 * Contains resolved per-feature permissions.
 * Frontend should use permissions[feature_key] === true for access checks.
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
