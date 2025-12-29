/**
 * Error Decoder - Maps technical failures to human-readable causes
 * Part of the FlyMusic Flight Recorder system
 */

interface DecodedError {
  reason: string;
  category: 'auth' | 'network' | 'validation' | 'rate_limit' | 'server' | 'unknown';
  suggestion?: string;
}

const HTTP_STATUS_RULES: Record<number, DecodedError> = {
  400: {
    reason: 'Invalid request data',
    category: 'validation',
    suggestion: 'Check request parameters and try again',
  },
  401: {
    reason: 'Authentication missing or expired',
    category: 'auth',
    suggestion: 'Sign in again to continue',
  },
  403: {
    reason: 'Access denied - missing permission',
    category: 'auth',
    suggestion: 'You may not have permission for this action',
  },
  404: {
    reason: 'Resource not found in database',
    category: 'validation',
    suggestion: 'The requested item may have been deleted',
  },
  409: {
    reason: 'Conflict - duplicate or already exists',
    category: 'validation',
    suggestion: 'This action has already been performed',
  },
  422: {
    reason: 'Validation failed - invalid data format',
    category: 'validation',
    suggestion: 'Check your input and try again',
  },
  429: {
    reason: 'Rate limit exceeded',
    category: 'rate_limit',
    suggestion: 'Too many requests - wait a moment and retry',
  },
  500: {
    reason: 'Server error',
    category: 'server',
    suggestion: 'Something went wrong on our end',
  },
  502: {
    reason: 'Service temporarily unavailable',
    category: 'server',
    suggestion: 'The service is temporarily down',
  },
  503: {
    reason: 'Service overloaded',
    category: 'server',
    suggestion: 'High traffic - try again shortly',
  },
  504: {
    reason: 'Request timeout',
    category: 'network',
    suggestion: 'The request took too long - try again',
  },
};

const ERROR_PATTERN_RULES: Array<{
  pattern: RegExp;
  decode: DecodedError;
}> = [
  {
    pattern: /constraint|unique|duplicate/i,
    decode: {
      reason: 'Duplicate entry or constraint violation',
      category: 'validation',
      suggestion: 'This item already exists',
    },
  },
  {
    pattern: /timeout|timed out|ETIMEDOUT/i,
    decode: {
      reason: 'Request timed out',
      category: 'network',
      suggestion: 'The server took too long to respond',
    },
  },
  {
    pattern: /network|ECONNREFUSED|ENOTFOUND|fetch failed/i,
    decode: {
      reason: 'Network connection failed',
      category: 'network',
      suggestion: 'Check your internet connection',
    },
  },
  {
    pattern: /jwt|token|expired|invalid.*auth/i,
    decode: {
      reason: 'Session expired or invalid',
      category: 'auth',
      suggestion: 'Please sign in again',
    },
  },
  {
    pattern: /row.level.security|rls|policy/i,
    decode: {
      reason: 'Access denied by security policy',
      category: 'auth',
      suggestion: 'You may not have permission for this action',
    },
  },
  {
    pattern: /not.*found|does.*not.*exist|null|undefined/i,
    decode: {
      reason: 'Required data not found',
      category: 'validation',
      suggestion: 'The requested resource may have been deleted',
    },
  },
  {
    pattern: /required|missing|null.*constraint/i,
    decode: {
      reason: 'Required field missing',
      category: 'validation',
      suggestion: 'Please fill in all required fields',
    },
  },
  {
    pattern: /stripe|payment|card|billing/i,
    decode: {
      reason: 'Payment processing error',
      category: 'validation',
      suggestion: 'Check your payment details',
    },
  },
];

/**
 * Decode an error into a human-readable message
 */
export function decodeError(
  error: unknown,
  statusCode?: number
): DecodedError {
  // Check HTTP status first
  if (statusCode && HTTP_STATUS_RULES[statusCode]) {
    return HTTP_STATUS_RULES[statusCode];
  }

  // Get error message string
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error);
  }

  // Check pattern rules
  for (const rule of ERROR_PATTERN_RULES) {
    if (rule.pattern.test(errorMessage)) {
      return rule.decode;
    }
  }

  // Default unknown error
  return {
    reason: errorMessage || 'Unknown error occurred',
    category: 'unknown',
    suggestion: 'Please try again or contact support',
  };
}

/**
 * Get a short reason string for display
 */
export function getErrorReason(error: unknown, statusCode?: number): string {
  return decodeError(error, statusCode).reason;
}

/**
 * Get error category for grouping/filtering
 */
export function getErrorCategory(error: unknown, statusCode?: number): string {
  return decodeError(error, statusCode).category;
}
