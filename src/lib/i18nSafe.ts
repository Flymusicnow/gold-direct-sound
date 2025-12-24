/**
 * Safe translation helper that returns a fallback if the key is not found
 * or if the translation function returns the key itself (i.e., missing translation).
 */
export const safeT = (
  t: (key: string) => string,
  key: string,
  fallback: string
): string => {
  try {
    const value = t(key);
    // If the value equals the key, translation is missing
    if (!value || value === key) {
      return fallback;
    }
    return value;
  } catch {
    return fallback;
  }
};

/**
 * Helper to conditionally render separator between two values
 * Returns the separator only if both values exist and are non-empty
 */
export const conditionalSeparator = (
  left: string | null | undefined,
  right: string | null | undefined,
  separator: string = ' · '
): string => {
  const hasLeft = left && left.trim().length > 0;
  const hasRight = right && right.trim().length > 0;
  
  if (hasLeft && hasRight) {
    return separator;
  }
  return '';
};
