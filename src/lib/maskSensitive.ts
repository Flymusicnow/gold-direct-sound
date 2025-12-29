/**
 * Sensitive Data Masking - Prevents PII/secrets from being logged
 * Part of the FlyMusic Flight Recorder system
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'apiKey',
  'authorization',
  'auth',
  'bearer',
  'credential',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'ssn',
  'social_security',
  'pin',
  'otp',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'private_key',
  'privateKey',
];

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /\bkey\b/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /pin/i,
];

// Patterns for values that look sensitive
const SENSITIVE_VALUE_PATTERNS = [
  /^sk_[a-zA-Z0-9]+$/, // Stripe secret key
  /^pk_[a-zA-Z0-9]+$/, // Stripe publishable key
  /^[a-f0-9]{64}$/i, // 64-char hex (looks like a key)
  /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/, // JWT token
];

const MASKED_VALUE = '[MASKED]';

/**
 * Check if a key name is sensitive
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  
  // Direct match
  if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()))) {
    return true;
  }
  
  // Pattern match
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Check if a value looks sensitive (even without knowing the key)
 */
function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Mask email addresses (show first char + domain)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return MASKED_VALUE;
  return `${local[0]}***@${domain}`;
}

/**
 * Deep clone and mask sensitive data in an object
 */
export function maskMeta(data: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return MASKED_VALUE;
  
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle primitives
  if (typeof data !== 'object') {
    // Check if value itself looks sensitive
    if (isSensitiveValue(data)) {
      return MASKED_VALUE;
    }
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => maskMeta(item, depth + 1));
  }
  
  // Handle objects
  const masked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Check if key is sensitive
    if (isSensitiveKey(key)) {
      masked[key] = MASKED_VALUE;
      continue;
    }
    
    // Handle email specially
    if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
      masked[key] = maskEmail(value);
      continue;
    }
    
    // Recurse for nested objects
    masked[key] = maskMeta(value, depth + 1);
  }
  
  return masked;
}

/**
 * Create a safe copy of headers for logging
 */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveKey(key)) {
      masked[key] = MASKED_VALUE;
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}
