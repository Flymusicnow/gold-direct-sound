/**
 * Centralized display name utility for consistent user identity across the platform.
 * Fallback order: full_name → artist_name → email prefix → "Anonymous"
 */

interface ProfileData {
  full_name?: string | null;
  artist_name?: string | null;
  email?: string | null;
}

export function getDisplayName(profile: ProfileData | null | undefined): string {
  if (!profile) return "Anonymous";
  
  // 1. Check full_name
  if (profile.full_name?.trim()) {
    return profile.full_name.trim();
  }
  
  // 2. Check artist_name (if available)
  if (profile.artist_name?.trim()) {
    return profile.artist_name.trim();
  }
  
  // 3. Use email prefix
  if (profile.email) {
    const emailPrefix = profile.email.split('@')[0];
    if (emailPrefix) return emailPrefix;
  }
  
  // 4. Fallback
  return "Anonymous";
}

export function getAvatarFallback(profile: ProfileData | null | undefined): string {
  const name = getDisplayName(profile);
  if (name === "Anonymous") return "?";
  return name[0]?.toUpperCase() || "?";
}
