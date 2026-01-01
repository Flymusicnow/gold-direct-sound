/**
 * Get the client's public IP address for legal acceptance audit trail.
 * Uses ipify.org API which is free and reliable.
 */
export async function getClientIp(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      return 'unknown';
    }
    
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    // Fail silently - IP capture is for audit purposes only
    return 'unknown';
  }
}
