// Sentry initialization and error capture utilities
// Note: We use a lightweight approach without the full Sentry SDK
// to capture errors to both Sentry (if configured) and our runtime_errors table

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

interface SentryEventPayload {
  exception: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno: number;
          colno: number;
        }>;
      };
    }>;
  };
  level: string;
  platform: string;
  timestamp: number;
  environment: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: {
    url: string;
    headers: Record<string, string>;
  };
}

export const isSentryConfigured = (): boolean => {
  return !!SENTRY_DSN && SENTRY_DSN.length > 0;
};

export const captureException = async (
  error: Error,
  context?: {
    route?: string;
    component?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  }
): Promise<string | null> => {
  // Always log to console
  console.error('[Error Captured]', error, context);

  if (!isSentryConfigured()) {
    console.warn('[Sentry] DSN not configured - error not sent to Sentry');
    return null;
  }

  try {
    // Parse DSN to extract project ID and key
    const dsnMatch = SENTRY_DSN.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
    if (!dsnMatch) {
      console.error('[Sentry] Invalid DSN format');
      return null;
    }

    const [, publicKey, host, projectId] = dsnMatch;
    const sentryUrl = `https://${host}/api/${projectId}/store/`;

    // Build event payload
    const payload: SentryEventPayload = {
      exception: {
        values: [
          {
            type: error.name || 'Error',
            value: error.message,
            stacktrace: error.stack
              ? {
                  frames: parseStackTrace(error.stack),
                }
              : undefined,
          },
        ],
      },
      level: 'error',
      platform: 'javascript',
      timestamp: Date.now() / 1000,
      environment: import.meta.env.MODE || 'production',
      tags: {
        route: context?.route || window.location.pathname,
        component: context?.component || 'unknown',
      },
      extra: context?.extra,
      request: {
        url: window.location.href,
        headers: {
          'User-Agent': navigator.userAgent,
        },
      },
    };

    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=flymusic-web/1.0.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const eventId = response.headers.get('X-Sentry-ID') || crypto.randomUUID();
      console.log('[Sentry] Error captured:', eventId);
      return eventId;
    } else {
      console.error('[Sentry] Failed to send error:', response.status);
      return null;
    }
  } catch (err) {
    console.error('[Sentry] Error sending to Sentry:', err);
    return null;
  }
};

function parseStackTrace(stack: string): Array<{
  filename: string;
  function: string;
  lineno: number;
  colno: number;
}> {
  const lines = stack.split('\n').slice(1);
  return lines
    .map((line) => {
      const match = line.match(/at\s+(\S+)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
    filename: string;
    function: string;
    lineno: number;
    colno: number;
  }>;
}

export const captureMessage = async (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): Promise<void> => {
  console.log(`[${level.toUpperCase()}]`, message);
  
  if (!isSentryConfigured()) {
    return;
  }

  // For messages, we could extend this to send to Sentry as well
  // For now, just log locally
};
