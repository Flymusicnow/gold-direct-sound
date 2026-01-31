/**
 * LRC (Lyric) format parser and formatter
 * Standard format: [mm:ss.ms]Lyric text
 * Example: [00:15.50]First verse line here
 */

export interface LrcLine {
  time: number; // Time in seconds
  text: string;
}

/**
 * Strip all timestamp patterns from text
 */
export function stripTimestamps(text: string): string {
  return text.replace(/\[\d{1,2}:\d{2}[.:]\d{2,3}\]/g, '').trim();
}

/**
 * Parse LRC format string into array of timed lines
 * Handles variations: [00:00.00], [0:00.00], [00:00:00], [00:00.000]
 * Also handles multiple timestamps per line
 */
export function parseLrc(lrcText: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const rawLines = lrcText.split('\n');
  
  for (const rawLine of rawLines) {
    // Match all timestamps at start of line - handles [mm:ss.ms] and [mm:ss:ms]
    const timestampRegex = /\[(\d{1,2}):(\d{2})[.:](\d{2,3})\]/g;
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;
    let firstTime: number | null = null;
    
    // Find all timestamps and use the first one for timing
    while ((match = timestampRegex.exec(rawLine)) !== null) {
      if (firstTime === null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        firstTime = mins * 60 + secs + ms / 1000;
      }
      lastMatch = match;
    }
    
    if (firstTime !== null && lastMatch) {
      // Text is everything after the last timestamp, with any remaining timestamps stripped
      const textStart = lastMatch.index + lastMatch[0].length;
      const rawText = rawLine.slice(textStart);
      const text = stripTimestamps(rawText).trim();
      
      if (text) {
        lines.push({ time: firstTime, text });
      }
    }
  }
  
  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Format time in seconds to LRC timestamp [mm:ss.ms]
 */
export function formatLrcTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`;
}

/**
 * Format display time (m:ss)
 */
export function formatDisplayTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert array of timed lines back to LRC string
 */
export function toLrcString(lines: LrcLine[]): string {
  return lines
    .filter(line => line.text.trim())
    .map(line => `${formatLrcTime(line.time)}${line.text}`)
    .join('\n');
}

/**
 * Check if text is in LRC format (has timestamps)
 * Handles variations: [00:00.00], [0:00.00], [00:00:00], [00:00.000]
 */
export function isLrcFormat(text: string): boolean {
  return /\[\d{1,2}:\d{2}[.:]\d{2,3}\]/.test(text.trim());
}

/**
 * Convert plain text lyrics to array of lines (without timestamps)
 */
export function plainTextToLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Find the current line index based on playback time
 */
export function findCurrentLineIndex(lines: LrcLine[], currentTime: number): number {
  if (lines.length === 0) return -1;
  
  // Find the last line that should be shown at current time
  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTime >= lines[i].time) {
      return i;
    }
  }
  
  return -1;
}
