export interface NetworkError {
  type: 'network';
  method: string;
  path: string;
  status: number;
  message: string;
  timestamp: string;
}

const MAX_ERRORS = 5;
let failedRequests: NetworkError[] = [];
let isIntercepting = false;

// Paths to ignore (auth, health checks, etc.)
const IGNORED_PATHS = [
  '/auth/',
  '/health',
  '/_analytics',
  '/realtime/',
];

function shouldIgnorePath(url: string): boolean {
  return IGNORED_PATHS.some(path => url.includes(path));
}

export function getRecentFailedRequests(): NetworkError[] {
  return [...failedRequests];
}

export function clearFailedRequests(): void {
  failedRequests = [];
}

export function addFailedRequest(error: NetworkError): void {
  failedRequests = [error, ...failedRequests].slice(0, MAX_ERRORS);
}

export function initNetworkErrorTracker(): void {
  if (isIntercepting || typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // Track failed responses (4xx and 5xx)
      if (!response.ok && !shouldIgnorePath(url)) {
        const path = new URL(url, window.location.origin).pathname + new URL(url, window.location.origin).search;
        addFailedRequest({
          type: 'network',
          method: method.toUpperCase(),
          path,
          status: response.status,
          message: response.statusText || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        });
      }
      
      return response;
    } catch (error) {
      // Track network errors (connection failures, etc.)
      if (!shouldIgnorePath(url)) {
        const path = new URL(url, window.location.origin).pathname;
        addFailedRequest({
          type: 'network',
          method: method.toUpperCase(),
          path,
          status: 0,
          message: error instanceof Error ? error.message : 'Network error',
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  };
  
  isIntercepting = true;
}
