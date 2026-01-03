import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  /** Unique key for sessionStorage */
  key: string;
  /** Data to auto-save */
  data: T;
  /** Debounce delay in ms (default: 500) */
  delay?: number;
  /** Only save if data has meaningful values */
  shouldSave?: (data: T) => boolean;
}

/**
 * Global auto-save hook for form inputs.
 * Persists data to sessionStorage with debouncing.
 * 
 * @example
 * const { clearSaved } = useAutoSave({
 *   key: 'studio-onboarding-draft',
 *   data: formData,
 *   shouldSave: (d) => Boolean(d.artistName || d.bio)
 * });
 */
export function useAutoSave<T>({ 
  key, 
  data, 
  delay = 500,
  shouldSave = () => true 
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const initialLoadDone = useRef(false);
  
  // Debounced save to sessionStorage
  useEffect(() => {
    // Skip initial render to avoid overwriting with empty data
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (shouldSave(data)) {
        sessionStorage.setItem(key, JSON.stringify(data));
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, delay, shouldSave]);
  
  // Load saved data on mount
  const loadSaved = useCallback((): T | null => {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        return null;
      }
    }
    return null;
  }, [key]);
  
  // Clear saved data
  const clearSaved = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);
  
  return { loadSaved, clearSaved };
}
