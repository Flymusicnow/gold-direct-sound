

# Global i18n Reset: No-Dot Policy

## Root Cause

One line causes all key leaks:

```
// LanguageContext.tsx line 83
return value || key;  // <-- returns "studio.creatorControlRoom" when missing
```

With 938+ `t()` calls across 31+ files, fixing each call site is impractical and fragile. The fix must happen at the translation function itself.

## Solution: Fail-Closed `t()` Function

### File 1: `src/contexts/LanguageContext.tsx`

Replace the `t()` function (lines 77-84) with a fail-closed version:

```typescript
const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  for (const k of keys) {
    value = value?.[k];
  }

  // FAIL-CLOSED: never expose internal keys
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  // Key is missing -- log it, return last segment as human-readable fallback
  if (import.meta.env.DEV) {
    console.warn(`[i18n] Missing key: "${key}" (lang: ${language})`);
  }

  // Extract last segment and convert camelCase to words
  // e.g. "studio.creatorControlRoom" -> "Creator Control Room"
  const lastSegment = keys[keys.length - 1];
  return lastSegment
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};
```

This single change:
- Prevents ALL 938+ `t()` calls from ever leaking dotted keys
- Converts `creatorControlRoom` to `Creator Control Room` as a readable fallback
- Logs missing keys in dev mode for easy debugging
- Requires zero changes to any component files

### File 2: `src/contexts/LanguageContext.tsx` (DEV fallback)

The `useLanguage` DEV fallback (line 103) also returns raw keys:
```typescript
t: (key: string) => key,  // <-- also leaks
```

Replace with the same fail-closed logic:
```typescript
t: (key: string) => {
  const segments = key.split('.');
  const last = segments[segments.length - 1];
  return last.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
},
```

### File 3 + 4: `src/i18n/en.ts` and `src/i18n/sv.ts`

Add missing keys that are actively used but not defined. Based on the codebase scan, these keys need to be added (the fail-closed `t()` makes this non-urgent, but they should exist for proper translations):

**studio section** (both files):
- `studio.profileSettings` (EN: "Profile Settings", SV: "Profilinställningar")
- Any other `studio.*` keys found during the audit pass

Run a quick audit: search for all `t('...')` calls, extract the keys, diff against the en/sv objects, and add any missing ones. The fail-closed `t()` protects the UI while this audit is ongoing.

## What This Does NOT Require

- No render-gate / Suspense wrapper needed: translations are bundled statically via `import { en }` and `import { sv }`, not loaded async. They are available at module evaluation time, before any React render. There is no network fetch to wait for.
- No namespace system changes: the app uses a flat object approach, not i18next namespaces.
- No CI pipeline changes (this is a runtime-only fix that covers all cases).
- No changes to 31+ component files: the fix is centralized in one function.

## Summary

| File | Change |
|------|--------|
| `src/contexts/LanguageContext.tsx` | Make `t()` fail-closed: never return dotted keys, log missing, return humanized fallback |
| `src/i18n/en.ts` | Add confirmed missing keys |
| `src/i18n/sv.ts` | Add confirmed missing keys (Swedish translations) |

Total: 3 files. One architectural fix that protects all 938+ translation call sites permanently.

