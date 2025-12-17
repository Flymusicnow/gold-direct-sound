/**
 * Centralized date formatting utility for consistent date display across the platform.
 * Standard format: "17 Dec 2025"
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Formats a date to "d MMM yyyy" format (e.g., "17 Dec 2025")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(d)) return '';
  
  return format(d, 'd MMM yyyy');
}

/**
 * Formats a date to "d MMM yyyy 'at' HH:mm" format (e.g., "17 Dec 2025 at 14:30")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(d)) return '';
  
  return format(d, "d MMM yyyy 'at' HH:mm");
}

/**
 * Formats a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(d)) return '';
  
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Smart date formatter: shows relative time for recent dates, full date for older ones
 * @param date - The date to format
 * @param recentThresholdDays - Number of days to consider "recent" (default: 7)
 */
export function formatSmartDate(
  date: string | Date | null | undefined,
  recentThresholdDays: number = 7
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(d)) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < recentThresholdDays) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  
  return format(d, 'd MMM yyyy');
}
