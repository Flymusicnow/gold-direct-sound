

# Fix: Handle Email Confirmation Required in Signup Flow

## Root Cause

In `JoinArtist.tsx` line 71, the code checks `if (data.user)` after signup. However:

- When email confirmation is **enabled**: `signUp` returns `{ user: {...}, session: null }`
- When email confirmation is **disabled**: `signUp` returns `{ user: {...}, session: {...} }`

The code navigates to `/studio/onboarding` regardless, but without a session, all RLS-protected operations fail.

---

## Solution

Check for `data.session` instead of `data.user` to determine the correct flow:

1. **If session exists** → Navigate to onboarding (email auto-confirmed)
2. **If no session** → Show "check your email" message and stay on page

---

## Changes

### File: `src/pages/auth/JoinArtist.tsx`

**Modify handleSignUp (lines 71-104):**

```typescript
if (data.user) {
  // Check if we have a session (email auto-confirmed) or need confirmation
  if (data.session) {
    // Session exists - user is fully authenticated
    // Assign artist role
    await supabase.from('user_roles').insert({
      user_id: data.user.id,
      role: 'artist',
    });

    // Record permanent artist beta access in DB
    await supabase.from('artist_beta_access').insert({
      user_id: data.user.id,
      badge_name: localStorage.getItem('artist_invite_badge') || 'Early Creator',
    } as any);

    // Mark invite as redeemed
    const inviteId = localStorage.getItem('artist_invite_id');
    if (inviteId) {
      await supabase
        .from('beta_invites')
        .update({ 
          status: 'redeemed',
          redeemed_at: new Date().toISOString()
        })
        .eq('id', inviteId);
      
      // Clean up localStorage
      localStorage.removeItem('artist_invite_id');
      localStorage.removeItem('artist_invite_token');
      localStorage.removeItem('artist_invite_expires');
      localStorage.removeItem('artist_invite_badge');
    }

    toast.success(t('auth.signUpSuccess'));
    navigate('/studio/onboarding');
  } else {
    // No session - email confirmation required
    toast.success(t('auth.checkEmailForConfirmation') || 'Please check your email to confirm your account.');
    // Don't navigate - user needs to confirm email first
  }
}
```

### File: `src/i18n/sv.ts` and `src/i18n/en.ts`

Add missing translation key in `auth` namespace:

**Swedish:**
```typescript
checkEmailForConfirmation: 'Kontrollera din e-post för att bekräfta ditt konto innan du fortsätter.',
```

**English:**
```typescript
checkEmailForConfirmation: 'Please check your email to confirm your account before continuing.',
```

---

## Alternative: Enable Auto-Confirm

If the project intends for users to skip email confirmation, you could enable auto-confirm in auth settings. However, this is less secure and should only be done if intentional.

---

## Files to Change

| File | Action |
|------|--------|
| `src/pages/auth/JoinArtist.tsx` | Check `data.session` before navigating |
| `src/i18n/sv.ts` | Add `checkEmailForConfirmation` key |
| `src/i18n/en.ts` | Add `checkEmailForConfirmation` key |

---

## Acceptance Criteria

- Users without confirmed email see "check your email" message
- Users with confirmed email (or auto-confirm enabled) navigate to onboarding
- No more "session expired" errors during signup flow
- Legal acceptance works after email confirmation

