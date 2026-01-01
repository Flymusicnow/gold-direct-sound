import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseArtistNameAvailabilityReturn {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
  checkAvailability: (name: string) => void;
  reset: () => void;
}

/**
 * Real-time artist name availability checking with debounce.
 * Provides instant visual feedback as the user types.
 * 
 * @param excludeUserId - User ID to exclude from check (for updates)
 * @param debounceMs - Debounce delay in milliseconds (default: 400ms)
 */
export function useArtistNameAvailability(
  excludeUserId?: string,
  debounceMs: number = 400
): UseArtistNameAvailabilityReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameToCheck, setNameToCheck] = useState('');

  const checkAvailability = useCallback((name: string) => {
    // Reset state when input changes
    setIsAvailable(null);
    setError(null);

    // Don't check if name is too short
    if (name.trim().length < 2) {
      setIsAvailable(null);
      return;
    }

    setNameToCheck(name);
  }, []);

  // Debounced availability check
  useEffect(() => {
    if (!nameToCheck || nameToCheck.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      setError(null);

      try {
        let query = supabase
          .from('artist_profiles')
          .select('id')
          .ilike('artist_name', nameToCheck.trim());

        // Exclude current user when updating their own profile
        if (excludeUserId) {
          query = query.neq('user_id', excludeUserId);
        }

        const { data, error: queryError } = await query.limit(1);

        if (queryError) throw queryError;

        setIsAvailable(data.length === 0);
      } catch (err: any) {
        console.error('Error checking artist name availability:', err);
        setError('Unable to check availability');
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [nameToCheck, excludeUserId, debounceMs]);

  const reset = useCallback(() => {
    setIsAvailable(null);
    setError(null);
    setNameToCheck('');
    setIsChecking(false);
  }, []);

  return {
    isChecking,
    isAvailable,
    error,
    checkAvailability,
    reset,
  };
}
