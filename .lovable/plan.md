

# Fix: Return to "Discover & Support Artists" Page After Browsing

## Problem

When a fan arrives at the **Discover & Support Artists** page (`/early-access`), they can immediately unlock access with their invite code. But if they want to browse around first (check out Explore, Discover, etc.), there is no easy way to get back to that specific page. The "Back to home" button goes to `/`, and the home page has no link back to `/early-access`.

## Solution

Two changes to make the return path frictionless:

### 1. Store the invite entry URL in sessionStorage

When the EarlyAccess page loads, save the full URL (including `?role=fan&code=...` params) to `sessionStorage`. This way, other parts of the app can check if the user has a pending invite flow and offer a return link.

**File:** `src/pages/EarlyAccess.tsx`
- On mount, store `window.location.pathname + window.location.search` into `sessionStorage` under key `flymusic_invite_return_url`
- When the user successfully unlocks access (navigates to `/join/fan` or `/join/artist`), clear this key

### 2. Show a "Return to Invite" floating banner

Create a small, non-intrusive floating banner that appears at the bottom of public pages (Home, Explore, Discover, etc.) when a pending invite return URL exists in `sessionStorage`. This gives the fan a one-tap way to get back.

**New file:** `src/components/InviteReturnBanner.tsx`

Visual design:
- Fixed at the bottom of the screen (above any bottom nav if present)
- Small pill/banner: dark background with blur, subtle border
- Text: "You have a pending invite" + "Return" button
- Dismiss (X) button to hide it for the session
- Only shown on public pages (not on `/early-access` itself, not on `/join/*` pages)

Behavior:
- Reads `flymusic_invite_return_url` from `sessionStorage`
- If present and current route is NOT the invite page itself, show the banner
- "Return" button navigates to the stored URL
- Dismiss button removes the key from `sessionStorage` (gone for the session)
- Auto-clears when the user reaches `/join/*` (invite completed)

### 3. Add the banner to the app layout

**File:** `src/App.tsx`
- Render `InviteReturnBanner` inside the main layout (after `NavigationWrapper`), so it appears on all public pages

### 4. Update EarlyAccess "Back to home" behavior

**File:** `src/pages/EarlyAccess.tsx`
- Keep the "Back to home" button as-is (navigate to `/`)
- The invite return URL is already stored in `sessionStorage`, so the banner will appear on the home page letting the user come back

## Files Summary

| File | Action | Change |
|------|--------|--------|
| `src/pages/EarlyAccess.tsx` | Modify | Store invite return URL in sessionStorage on mount; clear on successful unlock |
| `src/components/InviteReturnBanner.tsx` | Create | Floating banner component that shows when a pending invite URL exists in sessionStorage |
| `src/App.tsx` | Modify | Add InviteReturnBanner to the layout |

## Technical Details

### sessionStorage key

```
Key: "flymusic_invite_return_url"
Value: "/early-access?role=fan&code=FLYMUSIC-XXXX"  (full path + query)
```

Using `sessionStorage` (not `localStorage`) so it automatically clears when the browser tab is closed -- no stale banners on future visits.

### InviteReturnBanner component

```text
Position: fixed bottom-20 (above mobile bottom nav) or bottom-4 (if no bottom nav)
Z-index: 40 (below nav but above content)
Layout: flex row with icon + text + "Return" button + dismiss X
Animation: slide up on mount (framer-motion)
```

Hidden on these routes:
- `/early-access` (already on the page)
- `/join/*` (invite flow completed)
- `/fan/onboarding` (already past the gate)
- `/fan/dashboard` (already activated)

### EarlyAccess.tsx sessionStorage logic

```text
On mount:
  const returnUrl = location.pathname + location.search
  sessionStorage.setItem("flymusic_invite_return_url", returnUrl)

On successful code validation (before navigate):
  sessionStorage.removeItem("flymusic_invite_return_url")
```

## What's NOT Changing

- The invite code validation flow (same edge function, same redirect)
- The EarlyAccess page design or layout
- Navigation menus or header
- Any protected route behavior
