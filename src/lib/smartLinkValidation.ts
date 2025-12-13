// Trusted domains whitelist for external music platforms
export const TRUSTED_DOMAINS: Record<string, string[]> = {
  spotify: ['open.spotify.com', 'spotify.com'],
  apple_music: ['music.apple.com'],
  youtube_music: ['music.youtube.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
  soundcloud: ['soundcloud.com'],
  tidal: ['tidal.com', 'listen.tidal.com'],
  amazon_music: ['music.amazon.com', 'amazon.com/music'],
  deezer: ['deezer.com', 'www.deezer.com'],
  boomplay: ['boomplay.com'],
  audiomack: ['audiomack.com'],
  bandcamp: ['bandcamp.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  twitter: ['twitter.com', 'x.com'],
  facebook: ['facebook.com', 'www.facebook.com'],
};

// Common typosquatting patterns to detect
export const SUSPICIOUS_PATTERNS: RegExp[] = [
  /spottify/i,
  /spotifi/i,
  /spotfy/i,
  /appple/i,
  /appel/i,
  /aple/i,
  /youtub(?!e)/i,
  /youtoob/i,
  /soundcloiud/i,
  /soundclod/i,
  /tidall/i,
  /dezer/i,
  /instgram/i,
  /instagam/i,
  /ticktok/i,
  /tiktoc/i,
];

// Phishing keyword patterns commonly found in malicious URLs
export const PHISHING_KEYWORDS: string[] = [
  'login',
  'verify',
  'account',
  'password',
  'signin',
  'sign-in',
  'secure',
  'confirm',
  'update',
  'suspended',
  'locked',
  'expire',
  'urgent',
];

export type FlagType = 
  | 'domain_mismatch' 
  | 'http_insecure' 
  | 'typosquatting' 
  | 'phishing' 
  | 'unknown_domain'
  | null;

export interface ValidationResult {
  isValid: boolean;
  shouldFlag: boolean;
  flagReason: string | null;
  flagType: FlagType;
}

/**
 * Validates an external link for a given platform
 * Returns validation status and any flagging information
 */
export function validateExternalLink(platform: string, url: string): ValidationResult {
  // Basic URL validation
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      shouldFlag: false,
      flagReason: 'Invalid URL format',
      flagType: null,
    };
  }

  // Trim and normalize URL
  const normalizedUrl = url.trim().toLowerCase();

  // Check for HTTPS
  if (normalizedUrl.startsWith('http://')) {
    return {
      isValid: false,
      shouldFlag: true,
      flagReason: 'URL uses insecure HTTP protocol instead of HTTPS',
      flagType: 'http_insecure',
    };
  }

  // Ensure URL has protocol
  const urlWithProtocol = normalizedUrl.startsWith('https://') 
    ? normalizedUrl 
    : `https://${normalizedUrl}`;

  // Try to parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlWithProtocol);
  } catch {
    return {
      isValid: false,
      shouldFlag: false,
      flagReason: 'Invalid URL format',
      flagType: null,
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Check for typosquatting patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        isValid: false,
        shouldFlag: true,
        flagReason: `Suspicious domain detected: possible typosquatting of ${hostname}`,
        flagType: 'typosquatting',
      };
    }
  }

  // Check for phishing keywords in URL path
  const fullUrl = parsedUrl.href.toLowerCase();
  for (const keyword of PHISHING_KEYWORDS) {
    if (fullUrl.includes(keyword)) {
      return {
        isValid: false,
        shouldFlag: true,
        flagReason: `Suspicious URL contains potential phishing keyword: "${keyword}"`,
        flagType: 'phishing',
      };
    }
  }

  // Check if platform is in trusted domains
  const platformKey = platform.toLowerCase().replace(/\s+/g, '_');
  const trustedDomainsForPlatform = TRUSTED_DOMAINS[platformKey];

  if (trustedDomainsForPlatform) {
    // Check if hostname matches any trusted domain for this platform
    const isDomainTrusted = trustedDomainsForPlatform.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isDomainTrusted) {
      return {
        isValid: false,
        shouldFlag: true,
        flagReason: `Domain "${hostname}" does not match expected domains for ${platform}`,
        flagType: 'domain_mismatch',
      };
    }

    // Valid and trusted
    return {
      isValid: true,
      shouldFlag: false,
      flagReason: null,
      flagType: null,
    };
  }

  // Platform not in whitelist - flag for review but allow
  return {
    isValid: true,
    shouldFlag: true,
    flagReason: `Unknown platform "${platform}" - requires manual review`,
    flagType: 'unknown_domain',
  };
}

/**
 * Get platform icon name based on platform key
 */
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    spotify: 'music',
    apple_music: 'music',
    youtube_music: 'youtube',
    youtube: 'youtube',
    soundcloud: 'cloud',
    tidal: 'waves',
    amazon_music: 'music',
    deezer: 'music',
    boomplay: 'music',
    audiomack: 'music',
    bandcamp: 'music',
    instagram: 'instagram',
    tiktok: 'video',
    twitter: 'twitter',
    facebook: 'facebook',
  };
  return icons[platform.toLowerCase().replace(/\s+/g, '_')] || 'link';
}

/**
 * Get available platforms for dropdown selection
 */
export function getAvailablePlatforms(): { value: string; label: string }[] {
  return [
    { value: 'spotify', label: 'Spotify' },
    { value: 'apple_music', label: 'Apple Music' },
    { value: 'youtube_music', label: 'YouTube Music' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'soundcloud', label: 'SoundCloud' },
    { value: 'tidal', label: 'Tidal' },
    { value: 'amazon_music', label: 'Amazon Music' },
    { value: 'deezer', label: 'Deezer' },
    { value: 'boomplay', label: 'Boomplay' },
    { value: 'audiomack', label: 'Audiomack' },
    { value: 'bandcamp', label: 'Bandcamp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'twitter', label: 'X (Twitter)' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'other', label: 'Other' },
  ];
}
