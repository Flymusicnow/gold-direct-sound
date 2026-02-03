
# Fix: Legal Acceptance RLS Error

## Problem

The error "Failed to record acceptance. Please try again." occurs because `auth.uid()` is NULL when the insert is attempted. This is a race condition where:

1. User signs up in `JoinArtist.tsx`
2. Code immediately navigates to `/studio/onboarding`
3. Legal modal opens and user accepts terms
4. Insert fails because Supabase session isn't fully synchronized yet

The RLS policy `with_check: (auth.uid() = user_id)` correctly rejects the insert when `auth.uid()` is NULL.

---

## Solution

Add session verification in `LegalAcceptanceModal.tsx` before attempting the insert. If the session is invalid, refresh it and retry.

---

## Changes

### File: `src/components/legal/LegalAcceptanceModal.tsx`

**Modify `handleAccept` function (lines 79-106):**

```typescript
const handleAccept = async () => {
  if (!user || !accepted) return;
  
  setSubmitting(true);
  try {
    // Verify session is valid before attempting RLS-protected insert
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("Session not available:", refreshError);
        toast.error(t('errors.sessionExpired') || "Session expired. Please sign in again.");
        return;
      }
    }

    // Get client IP for audit trail
    const ipAddress = await getClientIp();

    const { error } = await supabase.from("legal_acceptances").insert({
      user_id: user.id,
      document_type: documentType,
      document_version: currentVersion,
      user_agent: navigator.userAgent,
      ip_address: ipAddress,
      accepted_language: language
    });

    if (error) throw error;
    
    toast.success(t('legal.accepted') || `${title} accepted`);
    onAccept();
  } catch (err) {
    console.error("Failed to record acceptance:", err);
    toast.error(t('legal.acceptFailed') || "Failed to record acceptance. Please try again.");
  } finally {
    setSubmitting(false);
  }
};
```

---

## Why This Works

1. **Session Check**: Before any RLS-protected operation, we verify the session exists
2. **Auto-Refresh**: If session is missing/expired, we attempt a refresh
3. **Clear Feedback**: If session can't be restored, user gets a clear error message
4. **No Race Condition**: The insert only proceeds when we have a valid session

---

## Alternative Consideration

We could also add a small delay in `JoinArtist.tsx` after signup before navigating:

```typescript
// After signup success
await new Promise(resolve => setTimeout(resolve, 500));
navigate('/studio/onboarding');
```

However, the session verification approach is more robust and handles all edge cases (expired tokens, network issues, etc.).

---

## Files to Change

| File | Action |
|------|--------|
| `src/components/legal/LegalAcceptanceModal.tsx` | Add session verification before insert |

---

## Acceptance Criteria

- Legal acceptance succeeds after signup flow
- No "Failed to record acceptance" errors when session is valid
- Clear error message if session truly cannot be restored
- Existing logged-in users unaffected
